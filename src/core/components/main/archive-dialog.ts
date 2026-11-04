import { createDialog } from '../../modules/dialog';
import { createOverlayScrollbar } from '../../modules/scrollbar';
import { getReadableSize } from '../../helpers/getReadableSize';
import { hasControlCharacters } from '../../helpers/stringUtils';
import { ArchiveSelectionTotals } from './archive-selection-totals';
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
	deselectOnStart: boolean;
};
const ROW_HEIGHT = 36;
const ROW_BUFFER = 8;
const units = [' B', ' KiB', ' MiB', ' GiB', ' TiB', ' PiB'];
const formatSize = (bytes: number) => getReadableSize(units, bytes);

export async function confirmArchive(files: ArchiveFile[], bufferLimit: number): Promise<ArchiveOptions | null>
{
	const dialog = createDialog();
	const browser = window as ArchiveWindow;
	const canSaveDirectly = window.isSecureContext && typeof browser.showSaveFilePicker === 'function';
	const excluded = new Set<ArchiveFile>();
	const totals = new ArchiveSelectionTotals(files);
	let filename = `${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}Z.zip`;
	let needsDisk = false;
	let blocked = false;
	let picker: Promise<ArchiveHandle> = null;
	let confirmed: ArchiveOptions = null;
	let anchor: number = null;
	const content = document.createElement('div');
	content.className = 'archiveOptions';
	const deselectLabel = document.createElement('label');
	deselectLabel.className = 'archiveDeselect';
	const deselectCheckbox = document.createElement('input');
	deselectCheckbox.type = 'checkbox';
	deselectCheckbox.name = 'archive-deselect';
	deselectCheckbox.checked = true;
	deselectLabel.append(deselectCheckbox, document.createTextNode('Deselect on start'));
	const field = document.createElement('div');
	field.className = 'dialogField';
	const label = document.createElement('span');
	label.id = 'ivfi-archive-filename-label';
	label.className = 'dialogLabel';
	label.textContent = 'Archive filename';
	const input = document.createElement('input');
	input.id = 'ivfi-archive-filename';
	input.setAttribute('aria-labelledby', label.id);
	input.name = 'filename';
	input.type = 'text';
	input.value = filename;
	input.maxLength = 240;
	input.autocomplete = 'off';
	input.spellcheck = false;
	const selectName = () => input.setSelectionRange(0, input.value.replace(/\.zip$/i, '').length);
	let selectOnClick = false;
	input.addEventListener('pointerdown', () => { selectOnClick = document.activeElement !== input; });
	input.addEventListener('focus', selectName);
	input.addEventListener('click', () =>
	{
		// A first pointer click can place the caret after focus has selected the name.
		if(selectOnClick) selectName();
		selectOnClick = false;
	});
	input.addEventListener('blur', () => { selectOnClick = false; });
	input.addEventListener('pointercancel', () => { selectOnClick = false; });
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
	let rowHeight = ROW_HEIGHT;
	const listContent = document.createElement('div');
	listContent.className = 'archiveFileRows';
	listContent.style.height = `${files.length * ROW_HEIGHT}px`;
	listContent.style.setProperty('--archive-row-height', `${ROW_HEIGHT}px`);
	listContent.setAttribute('role', 'list');
	listContent.setAttribute('aria-label', 'Files to include');
	list.append(listContent);
	listContainer.append(list);
	const status = document.createElement('p');
	status.className = 'archiveStatus';
	status.setAttribute('role', 'status');
	selection.append(summary, listContainer);
	content.append(field, selection, status);
	const update = () =>
	{
		selectAllCheckbox.checked = totals.count === files.length;
		selectAllCheckbox.indeterminate = totals.count > 0 && totals.count < files.length;
		selectAllCheckbox.setAttribute('aria-label', selectAllCheckbox.checked ? 'Deselect all files' : 'Select all files');
		const totalBytes = totals.totalBytes;
		const zipBytes = Number(totals.zipBytes);
		needsDisk = zipBytes > bufferLimit;
		blocked = !totals.count || (needsDisk && !canSaveDirectly);
		countNumber.textContent = totals.count.toLocaleString();
		countLabel.textContent = ` ${totals.count === 1 ? 'file' : 'files'} included`;
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
		status.textContent = !totals.count ? 'Select at least one file.'
			: blocked ? `The ZIP is ${formatSize(zipBytes - bufferLimit)} over the ${formatSize(bufferLimit)} limit. Remove files or ${window.isSecureContext
				? 'use a browser that supports direct file saving.'
				: 'use HTTPS or localhost in a browser that supports direct file saving.'}`
				: needsDisk ? 'Your browser will ask where to save this archive.'
					: !canSaveDirectly ? `Maximum ZIP size here: ${formatSize(bufferLimit)}.` : '';
		status.hidden = !status.textContent;
		if(content.isConnected) dialog.setConfirmDisabled(blocked);
	};
	const rendered = new Map<number, HTMLLabelElement>();
	let renderFrame = 0;
	const fileCheckbox = (target: EventTarget) => target instanceof HTMLInputElement && target.name === 'archive-file' ? target : null;
	const makeRow = (i: number): HTMLLabelElement =>
	{
		const file = files[i];
		const row = document.createElement('label');
		row.className = 'archiveFile';
		row.dataset.index = String(i);
		row.style.top = `${i * rowHeight}px`;
		row.setAttribute('role', 'listitem');
		row.setAttribute('aria-posinset', String(i + 1));
		row.setAttribute('aria-setsize', String(files.length));
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
		return row;
	};
	const renderRows = () =>
	{
		renderFrame = 0;
		const start = Math.max(0, Math.floor(list.scrollTop / rowHeight) - ROW_BUFFER);
		const end = Math.min(files.length, Math.ceil((list.scrollTop + list.clientHeight) / rowHeight) + ROW_BUFFER);
		const desired = new Set<number>();
		for(let i = start; i < end; i++) desired.add(i);
		/* Retain the focused checkbox even if the user scrolls it out of view. */
		const focused = fileCheckbox(document.activeElement);
		if(focused && list.contains(focused)) desired.add(Number(focused.value));
		for(const [index, row] of rendered)
		{
			if(desired.has(index)) continue;
			row.remove();
			rendered.delete(index);
		}
		const order = [...desired].sort((a, b) => a - b);
		for(let i = 0; i < order.length; i++)
		{
			const index = order[i];
			if(rendered.has(index)) continue;
			const row = makeRow(index);
			const next = order.slice(i + 1).map(nextIndex => rendered.get(nextIndex)).find(Boolean);
			listContent.insertBefore(row, next || null);
			rendered.set(index, row);
		}
	};
	const scheduleRows = () =>
	{
		if(!renderFrame) renderFrame = requestAnimationFrame(renderRows);
	};
	const resizeRows = () =>
	{
		if(!list.isConnected) return;
		const lineHeight = parseFloat(getComputedStyle(list).lineHeight);
		const height = Math.max(ROW_HEIGHT, Math.ceil((Number.isFinite(lineHeight) ? lineHeight : 0) + 16));
		if(height !== rowHeight)
		{
			const scrollPosition = list.scrollTop / rowHeight;
			rowHeight = height;
			listContent.style.height = `${files.length * rowHeight}px`;
			listContent.style.setProperty('--archive-row-height', `${rowHeight}px`);
			for(const [index, row] of rendered) row.style.top = `${index * rowHeight}px`;
			list.scrollTop = scrollPosition * rowHeight;
		}
		scheduleRows();
	};
	const focusRow = (index: number) =>
	{
		const top = index * rowHeight;
		if(top < list.scrollTop) list.scrollTop = top;
		else if(top + rowHeight > list.scrollTop + list.clientHeight)
			list.scrollTop = top + rowHeight - list.clientHeight;
		if(renderFrame) cancelAnimationFrame(renderFrame);
		renderRows();
		rendered.get(index)?.querySelector<HTMLInputElement>('input').focus({ preventScroll: true });
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
			totals.setIncluded(i, checked);
		}
		if(!shift || anchor === null) anchor = index;
		syncCheckboxes();
		update();
	};
	const selectAll = (checked: boolean) =>
	{
		excluded.clear();
		if(!checked) files.forEach(file => excluded.add(file));
		totals.setAll(checked);
		anchor = null;
		syncCheckboxes();
		update();
	};
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
		if(checkbox)
		{
			const index = Number(checkbox.value);
			let nextIndex: number = null;
			switch(event.key)
			{
				case 'Tab': nextIndex = index + (event.shiftKey ? -1 : 1); break;
				case 'ArrowDown': nextIndex = index + 1; break;
				case 'ArrowUp': nextIndex = index - 1; break;
				case 'Home': nextIndex = 0; break;
				case 'End': nextIndex = files.length - 1; break;
				case 'PageDown': nextIndex = Math.min(files.length - 1, index + Math.max(1, Math.floor(list.clientHeight / rowHeight))); break;
				case 'PageUp': nextIndex = Math.max(0, index - Math.max(1, Math.floor(list.clientHeight / rowHeight))); break;
			}
			if(nextIndex !== null && nextIndex >= 0 && nextIndex < files.length)
			{
				event.preventDefault();
				event.stopPropagation();
				focusRow(nextIndex);
				return;
			}
		}
		if(event.key !== ' ' || !event.shiftKey || !checkbox) return;
		event.preventDefault();
		event.stopPropagation();
		if(!event.repeat) toggle(Number(checkbox.value), !checkbox.checked, true);
	});
	list.addEventListener('scroll', scheduleRows, { passive: true });
	list.addEventListener('focusout', scheduleRows);
	const listResize = new ResizeObserver(resizeRows);
	listResize.observe(list);
	renderRows();
	update();
	const confirmation = dialog.show({
		title: 'Download Archive',
		content,
		footerContent: deselectLabel,
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
			confirmed = { files: files.filter(file => !excluded.has(file)), filename, needsDisk, picker,
				deselectOnStart: deselectCheckbox.checked };
		}
	});
	const removeScrollbar = createOverlayScrollbar(list, {
		label: 'Archive files',
		parent: listContainer,
		position: 'absolute'
	});
	try
	{
		return await confirmation ? confirmed : null;
	} finally {
		cancelAnimationFrame(renderFrame);
		listResize.disconnect();
		list.removeEventListener('scroll', scheduleRows);
		list.removeEventListener('focusout', scheduleRows);
		removeScrollbar();
	}
}
