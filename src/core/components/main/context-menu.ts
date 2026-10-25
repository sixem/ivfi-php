import { createContextMenu } from '../../modules/context-menu';
import { showFileContextMenu } from '../../modules/file-actions';
import type { RowSelection } from '../../modules/row-selection';
import { archiveSelection, archiveState } from './archive';
import { getRowFile } from './download';

export function showSelectionContextMenu(rows: HTMLElement[], trigger: HTMLElement,
	position: { x: number; y: number } | null = null, keyboard = false): void
{
	if(!rows.length) return;
	const menu = createContextMenu();
	if(rows.length > 1)
	{
		menu.show([{
			label: 'Download as Archive',
			icon: 'archive',
			disabled: archiveState.busy,
			onSelect: () => { void archiveSelection(rows); }
		}], position, trigger, { keyboard });
		return;
	}
	const file = getRowFile(rows[0]);
	if(file) showFileContextMenu(file, trigger, position, keyboard);
}

export function bindTableContextMenu(table: HTMLElement, selection: RowSelection): void
{
	const rowAt = (target: EventTarget) =>
	{
		if(!(target instanceof Element) || document.documentElement.hasAttribute('gallery-is-visible')) return null;
		if(target.closest('td:first-child > a')) return null;
		const row = target.closest<HTMLElement>('tr.file:not(.filtered)');
		return row && row.closest('table') === table ? row : null;
	};
	const open = (row: HTMLElement, x: number, y: number, keyboard = false) =>
	{
		selection.selectRow(row);
		showSelectionContextMenu(selection.getSelectedRows(), row, { x, y }, keyboard);
	};
	table.addEventListener('contextmenu', (event) =>
	{
		const row = rowAt(event.target);
		if(!row) return;
		event.preventDefault();
		const bounds = row.getBoundingClientRect();
		const keyboard = event.clientX === 0 && event.clientY === 0;
		open(row, keyboard ? bounds.left + 12 : event.clientX, keyboard ? bounds.bottom : event.clientY, keyboard);
	});
	table.addEventListener('keydown', (event) =>
	{
		if(event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
		const row = rowAt(event.target);
		if(!row) return;
		event.preventDefault();
		event.stopPropagation();
		const bounds = row.getBoundingClientRect();
		open(row, bounds.left + 12, bounds.bottom, true);
	});
}
