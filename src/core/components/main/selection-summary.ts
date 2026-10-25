import { config } from '../../config/config';
import { createContextMenu } from '../../modules/context-menu';
import { getReadableSize } from '../../helpers/getReadableSize';
import type { RowSelection } from '../../modules/row-selection';
import { showSelectionContextMenu } from './context-menu';
import '../../../css/selection-summary.scss';

export function bindSelectionSummary(selection: RowSelection): void
{
	const element = document.createElement('button');
	element.type = 'button';
	element.className = 'selectionSummary';
	element.setAttribute('aria-haspopup', 'menu');
	element.setAttribute('aria-expanded', 'false');
	element.setAttribute('aria-live', 'polite');
	element.setAttribute('aria-atomic', 'true');
	const count = document.createElement('span');
	const total = document.createElement('span');
	total.className = 'selectionSize';
	element.append(count, document.createTextNode(' / '), total);
	document.body.append(element);
	element.addEventListener('click', (event) =>
	{
		if(element.getAttribute('aria-expanded') === 'true') createContextMenu().hide(true);
		else showSelectionContextMenu(selection.getSelectedRows(), element, null, event.detail === 0);
	});
	element.addEventListener('contextmenu', (event) =>
	{
		event.preventDefault();
		const keyboard = event.clientX === 0 && event.clientY === 0;
		showSelectionContextMenu(selection.getSelectedRows(), element,
			keyboard ? null : { x: event.clientX, y: event.clientY }, keyboard);
	});
	element.addEventListener('keydown', (event) =>
	{
		if(!['ArrowDown', 'ArrowUp', 'ContextMenu'].includes(event.key)
			&& !(event.key === 'F10' && event.shiftKey)) return;
		event.preventDefault();
		event.stopPropagation();
		showSelectionContextMenu(selection.getSelectedRows(), element, null, true);
	});
	selection.subscribe(rows =>
	{
		if(element.getAttribute('aria-expanded') === 'true') createContextMenu().hide();
		element.disabled = rows.length === 0;
		element.classList.toggle('is-visible', rows.length > 0);
		element.setAttribute('aria-hidden', String(rows.length === 0));
		if(!rows.length) return;
		const units: string[] = config.get('format.sizes');
		const size = rows.reduce((sum, row) => sum + (Number(row.children[2]?.getAttribute('data-raw')) || 0), 0);
		count.textContent = `${rows.length.toLocaleString()} ${rows.length === 1 ? 'file' : 'files'} selected`;
		total.textContent = getReadableSize(units, size, 1);
	});
}
