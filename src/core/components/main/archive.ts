/*!
 * client-zip, MIT license. Copyright 2020 David Junger
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { config } from '../../config/config';
import { makeZip } from 'client-zip';
import { confirmArchive } from './archive-dialog';
import { createToast } from '../../modules/toast';
import { startDownload } from '../../modules/file-actions';
import { onPageReplace } from '../../modules/lifecycle';
import { getRowFile } from './download';
import { hasControlCharacters } from '../../helpers/stringUtils';
import type { ArchiveFile } from '../../types/archive';

/* Larger archives stream directly to disk */
const BUFFER_LIMIT = 256 * 1024 * 1024;
const LARGE_ARCHIVE_MESSAGE = 'Archives over 256 MiB need direct file saving over HTTPS or localhost in a supported browser. Try selecting fewer files.';
let archiving = false;
const listeners = new Set<() => void>();
export const archiveState = {
	get busy(): boolean { return archiving; },
	subscribe(listener: () => void): () => void
	{
		listeners.add(listener);
		return () => { listeners.delete(listener); };
	}
};
const setBusy = (busy: boolean) =>
{
	archiving = busy;
	listeners.forEach(listener => listener());
};

export async function archiveSelection(rows: HTMLElement[]): Promise<void>
{
	if(config.get('selection.enabled') === false || archiving) return;
	setBusy(true);
	const toast = createToast();
	const controller = new AbortController();
	const abort = () => controller.abort();
	window.addEventListener('pagehide', abort, { once: true });
	const cancelOnReplace = onPageReplace(abort);
	let inputReader: ReadableStreamDefaultReader<Uint8Array> = null;
	let output: ReadableStream<Uint8Array> = null;
	let destination: WritableStream<Uint8Array> = null;
	const closeInput = async () =>
	{
		const reader = inputReader;
		inputReader = null;
		if(reader)
		{
			await reader.cancel().catch(() => {});
			reader.releaseLock();
		}
	};
	try
	{
		if(!rows.length) return;
		if(rows.length > 50000) throw new Error('Select at most 50,000 files for one archive.');
		const encoder = new TextEncoder();
		let files: ArchiveFile[] = rows.map(row =>
		{
			const file = getRowFile(row);
			if(!file) throw new Error('Only files can be archived.');
			const { name } = file;
			if(!name || name === '.' || name === '..' || hasControlCharacters(name) || /[/\\]/.test(name) || encoder.encode(name).length > 65535)
				throw new Error('A selected filename cannot be used in a ZIP archive.');
			const url = new URL(file.url);
			if(url.origin !== window.location.origin) throw new Error('Only files from this site can be archived.');
			url.hash = '';
			const rawSize = row.children[2]?.getAttribute('data-raw');
			const size = Number(rawSize);
			if(rawSize == null || !Number.isSafeInteger(size) || size < 0)
				throw new Error('A selected file size is unavailable. Refresh the listing and try again.');
			const lastModified = new Date(Number(row.children[1].getAttribute('data-raw')) * 1000);
			return { name, url, size, lastModified };
		});
		const initialTotal = files.reduce((sum, file) => sum + file.size, 0);
		if(!Number.isSafeInteger(initialTotal)) throw new Error('This selection is too large to archive in the browser.');
		const confirmed = await confirmArchive(files, BUFFER_LIMIT);
		if(!confirmed || controller.signal.aborted) return;
		files = confirmed.files;
		const { filename, needsDisk, picker } = confirmed;
		const total = files.reduce((sum, file) => sum + file.size, 0);
		if(picker)
		{
			const handle = await picker;
			if(controller.signal.aborted) return;
			destination = await handle.createWritable();
		}
		if(controller.signal.aborted) return;
		toast.show('Preparing archive', {
			detail: `${files.length} ${files.length === 1 ? 'file' : 'files'} selected`, loading: true, duration: 0, progress: 0
		});
		let loaded = 0;
		let completed = 0;
		let reportedAt = 0;
		const report = (name: string, force = false) =>
		{
			const now = performance.now();
			if(!force && now - reportedAt < 150) return;
			reportedAt = now;
			const progress = Math.min(0.99, total ? loaded / total : completed / files.length);
			toast.update(`Creating archive (${Math.floor(progress * 100)}%)`, {
				detail: name, filename: 'detail', loading: true, duration: 0, progress
			});
		};
		const inputs = async function* ()
		{
			for(const file of files)
			{
				report(file.name, true);
				const response = await fetch(file.url.href, {
					credentials: 'same-origin', redirect: 'error', signal: controller.signal
				});
				if(!response.ok || response.status === 206 || !response.body)
					throw new Error(`Could not download "${file.name}" (${response.status}).`);
				const reader = response.body.getReader();
				inputReader = reader;
				const chunks = async function* ()
				{
					let size = 0;
					try
					{
						while(true)
						{
							const { done, value } = await reader.read();
							if(done) break;
							size += value.byteLength;
							if(size > file.size) throw new Error(`"${file.name}" changed. Refresh the listing and try again.`);
							loaded += value.byteLength;
							report(file.name);
							yield value;
						}
						if(size !== file.size) throw new Error(`"${file.name}" changed. Refresh the listing and try again.`);
					} finally {
						await closeInput();
					}
				};
				yield { name: file.name, lastModified: file.lastModified, input: chunks() };
				completed++;
			}
			toast.update('Finishing archive', { loading: true, duration: 0, progress: 1 });
		};
		let outputSize = 0;
		output = makeZip(inputs()).pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
			transform(chunk, stream)
			{
				outputSize += chunk.byteLength;
				if(!needsDisk && outputSize > BUFFER_LIMIT) throw new Error(LARGE_ARCHIVE_MESSAGE);
				stream.enqueue(chunk);
			}
		}));
		if(destination)
		{
			await output.pipeTo(destination, { signal: controller.signal });
			destination = null;
		} else {
			const blob = await new Response(output, { headers: { 'Content-Type': 'application/zip' } }).blob();
			if(controller.signal.aborted) return;
			const url = URL.createObjectURL(blob);
			startDownload(url, filename);
			window.setTimeout(() => URL.revokeObjectURL(url), 60000);
		}
		if(!controller.signal.aborted) toast.show(filename, {
			detail: needsDisk ? 'Saved to your device.' : 'Your download has started.',
			filename: 'title', icon: 'check', duration: 6000, progress: 1, complete: true
		});
	} catch(error) {
		if(controller.signal.aborted) return;
		if(error instanceof DOMException && error.name === 'AbortError') toast.hide();
		else toast.show('Archive failed', {
			detail: error instanceof Error ? error.message : 'Could not create the archive.',
			icon: 'archive', duration: 8000
		});
	} finally {
		window.removeEventListener('pagehide', abort);
		cancelOnReplace();
		try
		{
			await closeInput();
			if(output && !output.locked) await output.cancel().catch(() => {});
			if(destination && !destination.locked) await destination.abort().catch(() => {});
		} finally {
			setBusy(false);
		}
	}
}
