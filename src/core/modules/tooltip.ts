import { onPageReplace } from './lifecycle';
import '../../css/tooltip.scss';

type Tooltip = {
	show: (target: HTMLElement, text: string, duration?: number) => void;
	hide: () => void;
	destroy: () => void;
};
let instance: Tooltip = null;

export function createTooltip(): Tooltip
{
	if(instance) return instance;
	const element = document.createElement('div');
	element.id = 'ivfi-tooltip';
	element.className = 'tooltip';
	element.setAttribute('role', 'tooltip');
	element.hidden = true;
	document.body.append(element);

	let owner: HTMLElement = null;
	let described: Element = null;
	let dismissed: HTMLElement = null;
	let timer = 0;
	let keyboard = false;
	let keyboardTrigger = false;
	let feedback = false;
	let feedbackAnimation: Animation = null;
	const cleanups: Array<() => void> = [];
	const listen = (target: EventTarget, type: string, handler: EventListener, options: AddEventListenerOptions = {}) =>
	{
		target.addEventListener(type, handler, options);
		cleanups.push(() => target.removeEventListener(type, handler, options));
	};
	const available = () => document.hasFocus() && !document.hidden
		&& !document.documentElement.hasAttribute('dialog-is-visible')
		&& !document.documentElement.hasAttribute('context-menu-is-visible');
	const trigger = (target: EventTarget) => target instanceof Element
		? target.closest<HTMLElement>('[data-tooltip]') : null;
	const clear = () =>
	{
		clearTimeout(timer);
		timer = 0;
		feedbackAnimation?.cancel();
		feedbackAnimation = null;
		element.hidden = true;
		element.textContent = '';
		if(described)
		{
			const ids = (described.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== element.id);
			if(ids.length) described.setAttribute('aria-describedby', ids.join(' '));
			else described.removeAttribute('aria-describedby');
		}
		described = null;
		owner = null;
		feedback = false;
	};
	const hide = () => { if(!feedback) clear(); };
	const dismiss = () =>
	{
		if(feedback) return;
		dismissed = owner;
		keyboard = false;
		hide();
	};
	const render = (text: string) =>
	{
		element.textContent = text;
		element.style.visibility = 'hidden';
		element.style.left = '0px';
		element.style.top = '0px';
		element.hidden = false;
		const bounds = owner.getBoundingClientRect();
		const tip = element.getBoundingClientRect();
		const margin = 8;
		const left = Math.max(margin, Math.min(window.innerWidth - tip.width - margin, bounds.left + (bounds.width - tip.width) / 2));
		const top = bounds.bottom + margin + tip.height <= window.innerHeight - margin
			? bounds.bottom + margin : bounds.top - tip.height - margin;
		element.style.left = `${left}px`;
		element.style.top = `${Math.max(margin, Math.min(window.innerHeight - tip.height - margin, top))}px`;
		element.style.visibility = '';
		described = keyboardTrigger ? document.activeElement : owner;
		const ids = new Set((described.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
		ids.add(element.id);
		described.setAttribute('aria-describedby', [...ids].join(' '));
	};
	const show = () =>
	{
		timer = 0;
		if(!owner || !available() || !owner.isConnected || !owner.getClientRects().length
			|| !(keyboardTrigger ? owner.contains(document.activeElement) : owner.matches(':hover')))
		{
			hide();
			return;
		}
		const text = owner.getAttribute('data-tooltip');
		if(!text || !text.trim()) { hide(); return; }
		render(text);
	};
	const request = (target: HTMLElement, fromKeyboard: boolean) =>
	{
		/* Timed feedback takes priority over hover tooltips */
		if(feedback) return;
		if(target !== dismissed) dismissed = null;
		if(!target || target === dismissed || !target.getAttribute('data-tooltip')?.trim()) { hide(); return; }
		if(owner === target && keyboardTrigger === fromKeyboard) return;
		hide();
		if(!available()) return;
		owner = target;
		keyboardTrigger = fromKeyboard;
		timer = window.setTimeout(show, 350);
	};

	listen(document, 'pointermove', (event: PointerEvent) =>
	{
		/* Ignore stationary pointer events on window refocus */
		if(event.pointerType === 'touch' || event.buttons || (!event.movementX && !event.movementY)) return;
		keyboard = false;
		request(trigger(event.target), false);
	}, { passive: true, capture: true });
	listen(document, 'pointerout', (event: PointerEvent) =>
	{
		const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
		if(owner && !feedback && !keyboardTrigger && !owner.contains(next)) hide();
		if(dismissed && !dismissed.contains(next)) dismissed = null;
	}, { capture: true });
	listen(document, 'focusin', (event: FocusEvent) =>
	{
		if(keyboard) request(trigger(event.target), true);
	});
	listen(document, 'focusout', (event: FocusEvent) =>
	{
		const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
		if(owner && !feedback && keyboardTrigger && !owner.contains(next)) hide();
	});
	listen(document, 'keydown', (event: KeyboardEvent) =>
	{
		if(feedback) return;
		if(event.key === 'Escape')
		{
			/* Dismiss tooltips before clearing selection */
			if(!element.hidden) event.preventDefault();
			dismiss();
			return;
		}
		hide();
		keyboard = ['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key);
		if(keyboard) dismissed = null;
	}, { capture: true });
	['pointerdown', 'pointercancel', 'contextmenu', 'dragstart'].forEach(type => listen(document, type, dismiss, { capture: true }));
	listen(document, 'scroll', hide, { capture: true, passive: true });
	listen(window, 'resize', hide);
	listen(window, 'blur', dismiss);
	listen(window, 'pagehide', clear);
	listen(document, 'visibilitychange', () => { if(document.hidden) dismiss(); });

	instance = {
		show: (target, text, duration = 3000) =>
		{
			clear();
			if(!document.hasFocus() || document.hidden || !target.isConnected || !target.getClientRects().length || !text.trim()) return;
			owner = target;
			dismissed = null;
			keyboardTrigger = false;
			feedback = true;
			render(text);
			const animation = element.animate([{ opacity: 1 }, { opacity: 0 }], {
				delay: duration,
				duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180,
				easing: 'ease',
				fill: 'forwards'
			});
			feedbackAnimation = animation;
			void animation.finished.then(() =>
			{
				if(feedbackAnimation !== animation) return;
				dismissed = owner;
				clear();
			}, () => {});
		},
		hide,
		destroy: () =>
		{
			clear();
			cleanups.forEach(cleanup => cleanup());
			element.remove();
			instance = null;
		}
	};
	instance.destroy = onPageReplace(instance.destroy);
	return instance;
}
