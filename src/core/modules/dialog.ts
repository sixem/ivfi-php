import { onPageReplace } from './lifecycle';
import { createContextMenu } from './context-menu';
import { createTooltip } from './tooltip';
import { createIcon } from '../icons';
import '../../css/dialog.scss';

type DialogOptions = {
	title: string;
	description?: string;
	content: HTMLElement;
	confirmLabel?: string;
	confirmDisabled?: boolean;
	cancelLabel?: string;
	initialFocus?: HTMLElement;
	/** Synchronous submit handler; false prevents closing */
	onConfirm?: () => boolean | void;
};
type Dialog = {
	show: (options: DialogOptions) => Promise<boolean>;
	setConfirmDisabled: (disabled: boolean) => void;
	hide: () => void;
	destroy: () => void;
};
let instance: Dialog = null;

export function createDialog(): Dialog
{
	if(instance) return instance;
	const menu = createContextMenu();
	const element = document.createElement('dialog');
	element.className = 'dialog';
	element.setAttribute('aria-labelledby', 'ivfi-dialog-title');
	const form = document.createElement('form');
	const header = document.createElement('header');
	const title = document.createElement('h2');
	title.id = 'ivfi-dialog-title';
	const close = document.createElement('button');
	close.type = 'button';
	close.className = 'dialogClose';
	close.append(createIcon('close'));
	close.setAttribute('aria-label', 'Close dialog');
	header.append(title, close);
	const body = document.createElement('div');
	body.className = 'dialogBody';
	const description = document.createElement('p');
	description.id = 'ivfi-dialog-description';
	description.className = 'dialogDescription';
	const content = document.createElement('div');
	content.className = 'dialogContent';
	body.append(description, content);
	const footer = document.createElement('footer');
	const cancel = document.createElement('button');
	cancel.type = 'button';
	const confirm = document.createElement('button');
	confirm.type = 'submit';
	confirm.className = 'dialogConfirm';
	footer.append(cancel, confirm);
	form.append(header, body, footer);
	element.append(form);
	document.body.append(element);
	let options: DialogOptions = null;
	let resolve: (confirmed: boolean) => void = null;
	let closing = false;
	let animation: Animation = null;
	const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const animate = (entering: boolean) =>
	{
		const style = getComputedStyle(element);
		const current = { opacity: style.opacity, transform: style.transform };
		const hidden = { opacity: '0', transform: 'translateY(-0.375rem)' };
		animation?.cancel();
		animation = element.animate(entering ? [hidden, { opacity: '1', transform: 'translateY(0)' }]
			: [current, hidden], {
			duration: entering ? 220 : 140,
			easing: entering ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-in',
			fill: 'both'
		});
		return animation.finished;
	};
	const finish = (confirmed: boolean, immediately = false) =>
	{
		if(!options || (closing && !immediately)) return;
		menu.hide();
		const current = options;
		closing = true;
		element.classList.add('is-closing');
		const complete = () =>
		{
			if(options !== current) return;
			const done = resolve;
			options = null;
			resolve = null;
			if(element.open) element.close();
			element.classList.remove('is-closing');
			animation?.cancel();
			animation = null;
			content.replaceChildren();
			document.documentElement.removeAttribute('dialog-is-visible');
			closing = false;
			done(confirmed);
		};
		if(immediately || reducedMotion()) complete();
		else void animate(false).then(complete, complete);
	};
	form.addEventListener('submit', (event) =>
	{
		event.preventDefault();
		if(!options || closing || confirm.disabled || options.onConfirm?.() === false) return;
		finish(true);
	});
	close.addEventListener('click', () => finish(false));
	cancel.addEventListener('click', () => finish(false));
	element.addEventListener('cancel', (event) =>
	{
		event.preventDefault();
		if(document.documentElement.hasAttribute('context-menu-is-visible'))
		{
			menu.hide(true);
			return;
		}
		finish(false);
	});
	/* Isolate modal shortcuts from page and gallery handlers */
	['keydown', 'keyup'].forEach(type => element.addEventListener(type, event => event.stopPropagation()));
	const pagehide = () => finish(false, true);
	window.addEventListener('pagehide', pagehide);

	instance = {
		show: (next) =>
		{
			if(options) return Promise.resolve(false);
			menu.hide();
			createTooltip().hide();
			options = next;
			title.textContent = next.title;
			description.textContent = next.description || '';
			description.hidden = !next.description;
			if(next.description) element.setAttribute('aria-describedby', description.id);
			else element.removeAttribute('aria-describedby');
			content.replaceChildren(next.content);
			confirm.textContent = next.confirmLabel || 'Confirm';
			confirm.disabled = Boolean(next.confirmDisabled);
			cancel.textContent = next.cancelLabel || 'Cancel';
			const result = new Promise<boolean>(done => { resolve = done; });
			document.documentElement.setAttribute('dialog-is-visible', '');
			try
			{
				element.showModal();
				(next.initialFocus || confirm).focus({ preventScroll: true });
				if(!reducedMotion()) void animate(true).catch(() => {});
			} catch(error) {
				finish(false, true);
				throw error;
			}
			return result;
		},
		setConfirmDisabled: (disabled) => { if(options && !closing) confirm.disabled = disabled; },
		hide: () => finish(false),
		destroy: () =>
		{
			finish(false, true);
			window.removeEventListener('pagehide', pagehide);
			element.remove();
			instance = null;
		}
	};
	instance.destroy = onPageReplace(instance.destroy);
	return instance;
}
