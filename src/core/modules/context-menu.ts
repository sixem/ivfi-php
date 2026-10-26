import { onPageReplace } from './lifecycle';
import { createIcon, IconName } from '../icons';
import { createTooltip } from './tooltip';
import '../../css/context-menu.scss';

export type ContextMenuItem = {
	label: string;
	icon?: IconName;
	disabled?: boolean;
	checked?: boolean;
	onSelect: () => void;
};
type ContextMenu = {
	show: (items: ContextMenuItem[], position: { x: number; y: number } | null, trigger: HTMLElement,
		options?: { label?: string; minWidth?: number; keyboard?: boolean }) => void;
	hide: (restoreFocus?: boolean) => void;
	destroy: () => void;
};
let instance: ContextMenu = null;
type PopoverMenu = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };

export function createContextMenu(): ContextMenu
{
	if(instance) return instance;
	const menu = document.createElement('div') as PopoverMenu;
	menu.id = 'ivfi-context-menu';
	menu.className = 'contextMenu';
	menu.setAttribute('role', 'menu');
	menu.setAttribute('aria-label', 'Item actions');
	menu.tabIndex = -1;
	menu.hidden = true;
	if(menu.showPopover) menu.setAttribute('popover', 'manual');
	document.body.append(menu);
	let owner: HTMLElement = null;
	const pressedKeys = new Set<string>();
	const cleanups: Array<() => void> = [];
	const listen = (target: EventTarget, type: string, handler: EventListener, capture = false) =>
	{
		target.addEventListener(type, handler, capture);
		cleanups.push(() => target.removeEventListener(type, handler, capture));
	};
	const hide = (restoreFocus = false) =>
	{
		if(menu.hidden) return;
		menu.hidden = true;
		document.documentElement.removeAttribute('context-menu-is-visible');
		const previous = owner;
		previous?.removeAttribute('data-context-menu-open');
		owner = null;
		if(previous?.getAttribute('aria-haspopup') === 'menu') previous.setAttribute('aria-expanded', 'false');
		if(menu.hidePopover && menu.matches(':popover-open')) menu.hidePopover();
		if(restoreFocus && previous?.isConnected) previous.focus({ preventScroll: true });
	};
	const show: ContextMenu['show'] = (items, position, trigger, options = {}) =>
	{
		hide();
		if(!items.length) return;
		/* Modal menus must belong to the dialog's subtree */
		const parent = trigger.closest('dialog[open]') || document.body;
		if(menu.parentElement !== parent) parent.append(menu);
		owner = trigger;
		owner.setAttribute('data-context-menu-open', '');
		menu.toggleAttribute('data-keyboard', options.keyboard === true);
		menu.setAttribute('aria-label', options.label || 'Item actions');
		menu.style.minWidth = options.minWidth ? `${Math.min(options.minWidth, window.innerWidth - 16)}px` : '';
		menu.replaceChildren();
		items.forEach(item =>
		{
			const button = document.createElement('button');
			button.type = 'button';
			button.setAttribute('role', item.checked === undefined ? 'menuitem' : 'menuitemradio');
			if(item.checked !== undefined) button.setAttribute('aria-checked', String(item.checked));
			button.tabIndex = -1;
			button.disabled = Boolean(item.disabled);
			if(item.icon) button.append(createIcon(item.icon));
			const label = document.createElement('span');
			label.textContent = item.label;
			button.append(label);
			button.addEventListener('click', () =>
			{
				if(button.disabled) return;
				hide(true);
				item.onSelect();
			});
			menu.append(button);
		});
		createTooltip().hide();
		document.documentElement.setAttribute('context-menu-is-visible', '');
		if(trigger.getAttribute('aria-haspopup') === 'menu')
		{
			trigger.setAttribute('aria-expanded', 'true');
			trigger.setAttribute('aria-controls', menu.id);
		}
		menu.style.visibility = 'hidden';
		menu.style.left = '0px';
		menu.style.top = '0px';
		menu.hidden = false;
		menu.showPopover?.();
		const bounds = menu.getBoundingClientRect();
		/* Null position anchors the menu to its trigger */
		const anchor = trigger.getBoundingClientRect();
		const gap = options.keyboard ? 0 : 12;
		const x = position ? (position.x + gap + bounds.width <= window.innerWidth - 8
			? position.x + gap : position.x - bounds.width - gap) : anchor.left;
		let y = position ? (position.y + gap + bounds.height <= window.innerHeight - 8
			? position.y + gap : position.y - bounds.height - gap) : anchor.bottom + 4;
		if(!position && y + bounds.height > window.innerHeight - 8) y = anchor.top - bounds.height - 4;
		menu.style.left = `${Math.max(8, Math.min(x, window.innerWidth - bounds.width - 8))}px`;
		menu.style.top = `${Math.max(8, Math.min(y, window.innerHeight - bounds.height - 8))}px`;
		menu.style.visibility = '';
		(menu.querySelector<HTMLButtonElement>('button[aria-checked="true"]:not(:disabled)')
			|| menu.querySelector<HTMLButtonElement>('button:not(:disabled)') || menu).focus({ preventScroll: true });
	};

	listen(menu, 'keydown', (event: KeyboardEvent) =>
	{
		pressedKeys.add(event.code);
		if(event.key === 'Escape')
		{
			event.preventDefault();
			hide(true);
		} else if(event.key === 'Tab')
		{
			hide(true);
		} else if(['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
		{
			event.preventDefault();
			menu.setAttribute('data-keyboard', '');
			const buttons = Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
			if(buttons.length)
			{
				const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
				const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
					: (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
				buttons[index].focus();
			}
		}
		event.stopPropagation();
	});
	/* Consume matching keyup events after dismissal */
	listen(window, 'keyup', (event: KeyboardEvent) =>
	{
		if(pressedKeys.delete(event.code)) event.stopImmediatePropagation();
	}, true);
	listen(menu, 'pointermove', () => menu.removeAttribute('data-keyboard'));
	listen(menu, 'pointerdown', () => menu.removeAttribute('data-keyboard'));
	const inTrigger = (target: Node) => owner?.getAttribute('aria-haspopup') === 'menu' && owner.contains(target);
	listen(document, 'pointerdown', (event) =>
	{
		if(!menu.contains(event.target as Node) && !inTrigger(event.target as Node)) hide();
	}, true);
	listen(document, 'contextmenu', (event) =>
	{
		if(menu.contains(event.target as Node)) event.preventDefault();
		else hide();
	}, true);
	listen(document, 'focusin', (event) =>
	{
		if(!menu.contains(event.target as Node) && !inTrigger(event.target as Node)) hide();
	});
	listen(document, 'scroll', (event) =>
	{
		if(!menu.contains(event.target as Node)) hide();
	}, true);
	listen(window, 'resize', () => hide());
	listen(window, 'blur', () => { pressedKeys.clear(); hide(); });
	listen(window, 'pagehide', () => { pressedKeys.clear(); hide(); });
	listen(document, 'visibilitychange', () => { if(document.hidden) { pressedKeys.clear(); hide(); } });
	instance = {
		show,
		hide,
		destroy: () =>
		{
			hide();
			cleanups.forEach(cleanup => cleanup());
			menu.remove();
			instance = null;
		}
	};
	instance.destroy = onPageReplace(instance.destroy);
	return instance;
}
