import { createContextMenu } from './context-menu';
import { createToast } from './toast';
import { clipboardCopy } from '../helpers/clipboard';

export type FileDownload = { name: string; url: string };

export function startDownload(url: string, filename: string): void
{
	const download = document.createElement('a');
	download.href = url;
	download.download = filename;
	download.hidden = true;
	document.body.append(download);
	download.click();
	download.remove();
}

export function notifyDownloadStarted(filename: string): void
{
	/* Native downloads have no completion event */
	createToast().show('Download started', { detail: filename, filename: 'detail', icon: 'check', complete: true });
}

export function downloadFile(url: string, filename: string): void
{
	startDownload(url, filename);
	notifyDownloadStarted(filename);
}

export function showFileContextMenu(file: FileDownload, trigger: HTMLElement,
	position: { x: number; y: number } | null = null, keyboard = false): void
{
	const url = new URL(file.url, document.baseURI).href;
	createContextMenu().show([{
		label: 'Download',
		icon: 'download',
		onSelect: () => downloadFile(url, file.name)
	}, {
		label: 'Copy URL',
		icon: 'copy',
		onSelect: async () =>
		{
			const copied = await clipboardCopy(url);
			if(!trigger.isConnected) return;
			createToast().show(copied ? 'URL copied' : 'Could not copy URL', {
				detail: file.name, filename: 'detail',
				icon: copied ? 'check' : 'copy'
			});
		}
	}], position, trigger, { keyboard });
}
