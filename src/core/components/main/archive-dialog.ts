import { predictLength } from 'client-zip';
import { createDialog } from '../../modules/dialog';
import { createOverlayScrollbar } from '../../modules/scrollbar';
import { createIcon } from '../../icons';
import { getReadableSize } from '../../helpers/getReadableSize';
import { hasControlCharacters } from '../../helpers/stringUtils';
import type { ArchiveFile, ArchiveHandle } from '../../types/archive';
import '../../../css/archive.scss';

type ArchiveWindow = Window & {
	showSaveFilePicker?: (options: {
		suggestedName: string;
		types: Array<{ description: string; accept: Record<string, string[]> }>;
	}) => Promise<ArchiveHandle>;
};
type ArchiveOptions = {
	files: ArchiveFile[];
	filename: string;
	needsDisk: boolean;
	picker: Promise<ArchiveHandle>;
};
const PAGE_SIZE = 100;
const units = [' B', ' KiB', ' MiB', ' GiB', ' TiB', ' PiB'];
const formatSize = (bytes: number) => getReadableSize(units, bytes);

export async function confirmArchive(files: ArchiveFile[], bufferLimit: number): Promise<ArchiveOptions | null>
{
	const dialog = createDialog();
	const browser = window as ArchiveWindow;
	const canSaveDirectly = window.isSecureContext && typeof browser.showSaveFilePicker === 'function';
	const excluded = new Set<ArchiveFile>();
	let included = files.slice();
	let filename = `${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}Z.zip`;
	let needsDisk = false;
	let blocked = false;
	let picker: Promise<ArchiveHandle> = null;
	let confirmed: ArchiveOptions = null;
	let page = 0;
	let anchor: number = null;
	const content = document.createElement('div');
	content.className = 'archiveOptions';
	const field = document.createElement('div');
	field.className = 'dialogField';
	const label = document.createElement('label');
	label.htmlFor = 'ivfi-archive-filename';
	label.textContent = 'Archive filename';
	const input = document.createElement('input');
	input.id = label.htmlFor;
	input.name = 'filename';
	input.type = 'text';
	input.value = filename;
	input.maxLength = 240;
	input.autocomplete = 'off';
	input.spellcheck = false;
	const error = document.createElement('p');
	error.id = 'ivfi-archive-filename-error';
	error.className = 'dialogError';
	error.setAttribute('role', 'alert');
	error.hidden = true;
	input.setAttribute('aria-describedby', error.id);
	input.addEventListener('input', () =>
	{
		error.hidden = true;
		input.removeAttribute('aria-invalid');
	});
	field.append(label, input, error);
	const selection = document.createElement('section');
	selection.className = 'archiveSelection';
	selection.setAttribute('aria-label', 'Files to include');
	const summary = document.createElement('div');
	summary.className = 'archiveSummary';
	summary.setAttribute('role', 'status');
	summary.setAttribute('aria-atomic', 'true');
	const selectAllLabel = document.createElement('label');
	selectAllLabel.className = 'archiveSelectAll';
	const selectAllCheckbox = document.createElement('input');
	selectAllCheckbox.type = 'checkbox';
	selectAllCheckbox.name = 'archive-all';
	selectAllCheckbox.setAttribute('aria-label', 'Select all files');
	const count = document.createElement('span');
	count.className = 'archiveCount';
	const countNumber = document.createElement('span');
	countNumber.className = 'archiveCountNumber';
	countNumber.style.minWidth = `${files.length.toLocaleString().length}ch`;
	const countLabel = document.createElement('span');
	count.append(countNumber, countLabel);
	const total = document.createElement('span');
	total.className = 'archiveTotal';
	const totalNumber = document.createElement('span');
	const totalUnit = document.createElement('span');
	total.append(totalNumber, totalUnit);
	selectAllLabel.append(selectAllCheckbox, count);
	summary.append(selectAllLabel, total);
	const listContainer = document.createElement('div');
	listContainer.className = 'archiveFileList';
	const list = document.createElement('div');
	list.className = 'archiveFiles';
	listContainer.append(list);
	const pager = document.createElement('div');
	pager.className = 'archivePager';
	pager.hidden = files.length <= PAGE_SIZE;
	const range = document.createElement('span');
	const previous = document.createElement('button');
	previous.type = 'button';
	previous.setAttribute('aria-label', 'Previous files');
	previous.append(createIcon('arrow-left'));
	const next = document.createElement('button');
	next.type = 'button';
	next.className = 'archiveNext';
	next.setAttribute('aria-label', 'Next files');
	next.append(createIcon('arrow-left'));
	pager.append(range, previous, next);
	const status = document.createElement('p');
	status.className = 'archiveStatus';
	status.setAttribute('role', 'status');
	selection.append(summary, listContainer, pager);
	content.append(field, selection, status);
	const update = () =>
	{
		included = files.filter(file => !excluded.has(file));
		selectAllCheckbox.checked = included.length === files.length;
		selectAllCheckbox.indeterminate = included.length > 0 && included.length < files.length;
		selectAllCheckbox.setAttribute('aria-label', selectAllCheckbox.checked ? 'Deselect all files' : 'Select all files');
		const totalBytes = included.reduce((sum, file) => sum + file.size, 0);
		const zipBytes = Number(predictLength(included));
		needsDisk = zipBytes > bufferLimit;
		blocked = !included.length || (needsDisk && !canSaveDirectly);
		countNumber.textContent = included.length.toLocaleString();
		countLabel.textContent = ` ${included.length === 1 ? 'file' : 'files'} included`;
		let unit = 0;
		let amount = totalBytes;
		while(amount >= 1024 && unit < units.length - 1)
		{
			amount /= 1024;
			unit++;
		}
		totalNumber.textContent = amount.toLocaleString(undefined, { minimumFractionDigits: unit ? 2 : 0, maximumFractionDigits: 2 });
		totalUnit.textContent = units[unit];
		status.toggleAttribute('data-blocked', blocked);
		status.textContent = !included.length ? 'Select at least one file.'
			: blocked ? `The ZIP is ${formatSize(zipBytes - bufferLimit)} over the ${formatSize(bufferLimit)} limit. Remove files or ${window.isSecureContext
				? 'use a browser that supports direct file saving.'
				: 'use HTTPS or localhost in a browser that supports direct file saving.'}`
				: needsDisk ? 'Your browser will ask where to save this archive.'
					: !canSaveDirectly ? `Maximum ZIP size here: ${formatSize(bufferLimit)}.` : '';
		status.hidden = !status.textContent;
		if(content.isConnected) dialog.setConfirmDisabled(blocked);
	};
	const renderPage = () =>
	{
		const start = page * PAGE_SIZE;
		const end = Math.min(files.length, start + PAGE_SIZE);
		const fragment = document.createDocumentFragment();
		for(let i = start; i < end; i++)
		{
			const file = files[i];
			const row = document.createElement('label');
			row.className = 'archiveFile';
			row.toggleAttribute('data-range-anchor', anchor === i);
			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.name = 'archive-file';
			checkbox.value = String(i);
			checkbox.checked = !excluded.has(file);
			const name = document.createElement('span');
			name.className = 'archiveFileName';
			name.textContent = file.name;
			const size = document.createElement('span');
			size.className = 'archiveFileSize';
			size.textContent = formatSize(file.size);
			row.append(checkbox, name, size);
			fragment.append(row);
		}
		list.replaceChildren(fragment);
		list.scrollTop = 0;
		range.textContent = `${(start + 1).toLocaleString()}–${end.toLocaleString()} of ${files.length.toLocaleString()}`;
		previous.disabled = page === 0;
		next.disabled = end === files.length;
	};
	const syncCheckboxes = () =>
	{
		list.querySelectorAll<HTMLInputElement>('input').forEach(checkbox =>
		{
			const index = Number(checkbox.value);
			checkbox.checked = !excluded.has(files[index]);
			checkbox.parentElement.toggleAttribute('data-range-anchor', anchor === index);
		});
	};
	const toggle = (index: number, checked: boolean, shift: boolean) =>
	{
		const start = shift && anchor !== null ? anchor : index;
		for(let i = Math.min(start, index); i <= Math.max(start, index); i++)
		{
			if(checked) excluded.delete(files[i]);
			else excluded.add(files[i]);
		}
		if(!shift || anchor === null) anchor = index;
		syncCheckboxes();
		update();
	};
	const selectAll = (checked: boolean) =>
	{
		excluded.clear();
		if(!checked) files.forEach(file => excluded.add(file));
		anchor = null;
		syncCheckboxes();
		update();
	};
	const fileCheckbox = (target: EventTarget) => target instanceof HTMLInputElement && target.name === 'archive-file' ? target : null;
	list.addEventListener('click', (event) =>
	{
		const checkbox = fileCheckbox(event.target);
		if(checkbox) toggle(Number(checkbox.value), checkbox.checked, event.shiftKey);
	});
	selectAllCheckbox.addEventListener('change', () => selectAll(selectAllCheckbox.checked));
	selection.addEventListener('keydown', (event) =>
	{
		if(event.altKey) return;
		if((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a')
		{
			event.preventDefault();
			event.stopPropagation();
			if(!event.repeat) selectAll(!event.shiftKey);
			return;
		}
		const checkbox = fileCheckbox(event.target);
		if(event.key !== ' ' || !event.shiftKey || !checkbox) return;
		event.preventDefault();
		event.stopPropagation();
		if(!event.repeat) toggle(Number(checkbox.value), !checkbox.checked, true);
	});
	previous.addEventListener('click', () => { page--; renderPage(); });
	next.addEventListener('click', () => { page++; renderPage(); });
	renderPage();
	update();
	const confirmation = dialog.show({
		title: 'Download archive',
		content,
		confirmLabel: 'Download',
		confirmDisabled: blocked,
		initialFocus: input,
		onConfirm: () =>
		{
			if(blocked) return false;
			const name = input.value.trim().replace(/\.zip$/i, '');
			const message = !name || /^[. ]+$/.test(name) ? 'Enter an archive filename.'
				: hasControlCharacters(name) || /[<>:"/\\|?*]/.test(name) || /[. ]$/.test(name)
					? 'Use a filename without special characters or a trailing dot.' : '';
			if(message)
			{
				error.textContent = message;
				error.hidden = false;
				input.setAttribute('aria-invalid', 'true');
				input.focus({ preventScroll: true });
				return false;
			}
			filename = `${name}.zip`;
			input.value = filename;
			if(needsDisk)
			{
				/* The file picker requires an active user gesture */
				picker = browser.showSaveFilePicker({
					suggestedName: filename,
					types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }]
				});
				/* Prevent unhandled rejection during dialog exit */
				void picker.catch(() => {});
			}
			confirmed = { files: included.slice(), filename, needsDisk, picker };
		}
	});
	const removeScrollbar = createOverlayScrollbar(list, {
		label: 'Archive files',
		parent: listContainer,
		position: 'absolute'
	});
	try
	{
		input.setSelectionRange(0, filename.length - 4);
		return await confirmation ? confirmed : null;
	} finally {
		removeScrollbar();
	}
}
