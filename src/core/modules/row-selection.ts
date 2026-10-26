import type { TOptimizeRowItem } from '../types/class-optimize';
import { onPageReplace } from './lifecycle';

export type RowSelection = {
	clear: () => void;
	selectAll: () => void;
	refresh: () => void;
	getSelectedRows: () => HTMLElement[];
	selectRow: (row: HTMLElement) => void;
	subscribe: (listener: (rows: HTMLElement[]) => void) => () => void;
};

/** Selection by row element */
export function createRowSelection(table: HTMLElement, getRows: () => HTMLElement[], enabled = true): RowSelection
{
	if(!enabled)
	{
		return {
			clear: () => {},
			selectAll: () => {},
			refresh: () => {},
			getSelectedRows: () => [],
			selectRow: () => {},
			subscribe: (listener) => { listener([]); return () => {}; }
		};
	}

	let selected = new Set<HTMLElement>();
	let anchor: HTMLElement = null;
	let focused: HTMLElement = null;
	const listeners = new Set<(rows: HTMLElement[]) => void>();
	const interactive = 'a, button, input, select, textarea, [contenteditable]';
	const rows = () => getRows().filter(row => row.matches('tr.file:not(.filtered)'));
	const getSelectedRows = () => rows().filter(row => selected.has(row));
	const update = (next: Set<HTMLElement>) =>
	{
		let changed = false;
		for(const row of new Set([...selected, ...next]))
		{
			if(selected.has(row) === next.has(row)) continue;
			changed = true;
			row.classList.toggle('is-selected', next.has(row));
			row.setAttribute('aria-selected', String(next.has(row)));
		}
		selected = next;
		if(changed && listeners.size)
		{
			const current = getSelectedRows();
			listeners.forEach(listener => listener(current));
		}
	};
	const focus = (row: HTMLElement) =>
	{
		/* Reveal virtualized rows before focusing */
		if(row.classList.contains('hid-row'))
		{
			row.classList.remove('hid-row');
			(row as TOptimizeRowItem)._isHidden = false;
		}
		if(focused) focused.tabIndex = -1;
		focused = row;
		row.tabIndex = 0;
		row.focus({ preventScroll: true });
	};
	const select = (row: HTMLElement, shift: boolean, additive: boolean) =>
	{
		const available = rows();
		const next = additive ? new Set(selected) : new Set<HTMLElement>();
		if(shift && anchor && available.includes(anchor))
		{
			const start = available.indexOf(anchor);
			const end = available.indexOf(row);
			available.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(item => next.add(item));
		} else {
			if(additive && selected.has(row)) next.delete(row);
			else next.add(row);
			anchor = row;
		}
		update(next);
		focus(row);
	};
	const clear = () =>
	{
		update(new Set());
		anchor = null;
	};
	const refresh = () =>
	{
		const available = rows();
		const visible = new Set(available);
		update(new Set([...selected].filter(row => visible.has(row))));
		if(!visible.has(anchor)) anchor = null;
		if(!visible.has(focused))
		{
			if(focused) focused.tabIndex = -1;
			focused = available[0] || null;
			if(focused) focused.tabIndex = 0;
		}
	};
	const clickedRow = (target: EventTarget) =>
	{
		if(document.documentElement.hasAttribute('gallery-is-visible')) return null;
		if(!(target instanceof Element) || target.closest(interactive)) return null;
		const row = target.closest<HTMLElement>('tr.file');
		return row && row.closest('table') === table && !row.classList.contains('filtered') ? row : null;
	};

	table.setAttribute('role', 'grid');
	table.setAttribute('aria-label', 'Files and directories');
	table.setAttribute('aria-multiselectable', 'true');
	rows().forEach(row =>
	{
		row.tabIndex = -1;
		row.setAttribute('aria-selected', 'false');
		Array.from(row.children).forEach(cell => cell.setAttribute('role', 'gridcell'));
	});
	refresh();

	/* Prevent native text selection outside row controls */
	table.addEventListener('mousedown', (event) =>
	{
		if(event.button === 0 && clickedRow(event.target)) event.preventDefault();
	});
	table.addEventListener('click', (event) =>
	{
		if(event.button !== 0) return;
		const row = clickedRow(event.target);
		if(!row) return;
		if(!event.shiftKey && selected.has(row))
		{
			const next = new Set(selected);
			next.delete(row);
			update(next);
			anchor = row;
			focus(row);
			return;
		}
		select(row, event.shiftKey, event.ctrlKey || event.metaKey);
	});
	table.addEventListener('keydown', (event) =>
	{
		const row = clickedRow(event.target);
		if(!row || event.altKey) return;
		const additive = event.ctrlKey || event.metaKey;
		const available = rows();
		if(event.key === ' ')
		{
			select(row, event.shiftKey, additive);
		} else if(['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
		{
			const current = available.indexOf(row);
			const index = event.key === 'Home' ? 0 : event.key === 'End' ? available.length - 1
				: Math.max(0, Math.min(available.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)));
			const next = available[index];
			if(event.shiftKey && !anchor) anchor = row;
			if(additive && !event.shiftKey) focus(next);
			else select(next, event.shiftKey, additive);
			const bounds = next.getBoundingClientRect();
			const top = document.body.querySelector(':scope > .topBar').getBoundingClientRect().bottom;
			if(bounds.top < top) window.scrollBy(0, bounds.top - top);
			else if(bounds.bottom > window.innerHeight) window.scrollBy(0, bounds.bottom - window.innerHeight);
		} else return;
		event.preventDefault();
		event.stopPropagation();
	});

	/* Let overlays consume Escape before clearing selection */
	const onEscape = (event: KeyboardEvent) =>
	{
		if(event.key !== 'Escape' || event.defaultPrevented || event.repeat || event.isComposing) return;
		if(['dialog-is-visible', 'context-menu-is-visible', 'gallery-is-visible']
			.some(attribute => document.documentElement.hasAttribute(attribute))) return;
		if(!getSelectedRows().length) return;
		clear();
		event.preventDefault();
	};
	window.addEventListener('keydown', onEscape);
	onPageReplace(() => window.removeEventListener('keydown', onEscape));

	return {
		clear,
		selectAll: () =>
		{
			const available = rows();
			anchor = available.includes(focused) ? focused : available[0] || null;
			update(new Set(available));
		},
		refresh,
		getSelectedRows,
		subscribe: (listener) =>
		{
			listeners.add(listener);
			listener(getSelectedRows());
			return () => { listeners.delete(listener); };
		},
		selectRow: (row) =>
		{
			if(!rows().includes(row)) return;
			if(selected.has(row)) focus(row);
			else select(row, false, false);
		}
	};
}

