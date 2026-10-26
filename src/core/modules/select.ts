import { createContextMenu } from './context-menu';
import { createIcon } from '../icons';

export function enhanceSelect(select: HTMLSelectElement): () => void
{
	/* Native select fallback without Popover API support */
	if(!('showPopover' in HTMLElement.prototype)) return () => {};
	const menu = createContextMenu();
	const label = select.closest('.option')?.querySelector<HTMLElement>('.option-text');
	const button = document.createElement('button');
	button.type = 'button';
	button.id = `${select.id}-control`;
	button.className = 'selectControl';
	button.setAttribute('aria-haspopup', 'menu');
	button.setAttribute('aria-expanded', 'false');
	const description = select.getAttribute('aria-describedby');
	if(description) button.setAttribute('aria-describedby', description);
	const value = document.createElement('span');
	value.id = `${select.id}-value`;
	button.append(value, createIcon('chevron'));
	if(label)
	{
		button.setAttribute('aria-labelledby', `${label.id} ${value.id}`);
	}
	const wasHidden = select.hidden;
	select.hidden = true;
	select.before(button);
	const sync = () =>
	{
		value.textContent = select.selectedOptions[0]?.text || '';
		button.disabled = select.disabled;
	};
	sync();
	const open = (keyboard = false) => menu.show(Array.from(select.options).map((option, index) => ({
		label: option.text,
		checked: index === select.selectedIndex,
		disabled: option.disabled,
		onSelect: () =>
		{
			if(select.selectedIndex === index) return;
			select.selectedIndex = index;
			select.dispatchEvent(new Event('change', { bubbles: true }));
		}
	})), null, button, { label: label?.textContent || select.name, minWidth: button.offsetWidth, keyboard });
	button.addEventListener('click', (event) =>
	{
		if(button.getAttribute('aria-expanded') === 'true') menu.hide(true);
		else open(event.detail === 0);
	});
	button.addEventListener('keydown', (event) =>
	{
		if(event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		event.stopPropagation();
		open(true);
	});
	select.addEventListener('change', sync);
	return () =>
	{
		if(button.getAttribute('aria-expanded') === 'true') menu.hide();
		select.removeEventListener('change', sync);
		select.hidden = wasHidden;
		button.remove();
	};
}
