import { shortenString } from '../helpers/stringUtils';
import { onPageReplace } from './lifecycle';
import { createIcon, IconName } from '../icons';
import '../../css/toast.scss';

type ToastOptions = {
	detail?: string;
	filename?: 'title' | 'detail';
	icon?: IconName;
	loading?: boolean;
	/** Auto-hide delay in milliseconds; zero disables auto-hide */
	duration?: number;
	/** Progress from 0 to 1; null is indeterminate */
	progress?: number | null;
	complete?: boolean;
};
type Toast = {
	show: (title: string, options?: ToastOptions) => void;
	update: (title: string, options?: ToastOptions) => void;
	hide: () => void;
	destroy: () => void;
};
let instance: Toast = null;

function setMessage(element: HTMLElement, text: string, filename: boolean): void
{
	const display = filename ? shortenString(text, 35, '...') : text;
	if(element.textContent !== display) element.textContent = display;
	element.classList.toggle('toastFilename', filename);
}

export function createToast(): Toast
{
	if(instance) return instance;
	const element = document.createElement('div');
	element.className = 'toast';
	element.setAttribute('aria-hidden', 'true');
	const icon = document.createElement('span');
	icon.className = 'toastIcon';
	icon.setAttribute('aria-hidden', 'true');
	const spinner = document.createElement('span');
	spinner.className = 'toastSpinner';
	const symbol = document.createElement('span');
	symbol.className = 'toastSymbol';
	icon.append(spinner, symbol);
	const message = document.createElement('div');
	message.className = 'toastMessage';
	message.setAttribute('role', 'status');
	message.setAttribute('aria-live', 'polite');
	message.setAttribute('aria-atomic', 'true');
	const title = document.createElement('span');
	title.className = 'toastTitle';
	const detail = document.createElement('span');
	detail.className = 'toastDetail';
	const progress = document.createElement('div');
	progress.className = 'toastProgress';
	progress.setAttribute('role', 'progressbar');
	progress.setAttribute('aria-label', 'Archive progress');
	progress.setAttribute('aria-valuemin', '0');
	progress.setAttribute('aria-valuemax', '100');
	const fill = document.createElement('span');
	progress.append(fill);
	message.append(title, progress, detail);
	const close = document.createElement('button');
	close.type = 'button';
	close.className = 'toastClose';
	close.append(createIcon('close'));
	close.setAttribute('aria-label', 'Dismiss notification');
	close.tabIndex = -1;
	element.append(icon, message, close);
	document.body.append(element);

	let timer = 0;
	let visible = false;
	let hovered = false;
	let focused = false;
	let duration = 4500;
	let currentIcon: IconName = null;
	const hide = () =>
	{
		clearTimeout(timer);
		visible = false;
		element.classList.remove('is-visible');
		element.setAttribute('aria-hidden', 'true');
		close.tabIndex = -1;
	};
	const startTimer = () =>
	{
		clearTimeout(timer);
		timer = 0;
		if(visible && duration > 0 && !hovered && !focused) timer = window.setTimeout(() =>
		{
			timer = 0;
			if(element.matches(':hover') || element.contains(document.activeElement)) return;
			hide();
		}, duration);
	};
	const update: Toast['update'] = (text, options = {}) =>
	{
		duration = options.duration ?? 4500;
		if(currentIcon !== options.icon)
		{
			symbol.replaceChildren();
			if(options.icon) symbol.append(createIcon(options.icon));
			currentIcon = options.icon;
		}
		icon.hidden = !options.icon && !options.loading;
		icon.classList.toggle('is-loading', options.loading === true);
		icon.classList.toggle('is-complete', options.complete === true);
		setMessage(title, text, options.filename === 'title');
		setMessage(detail, options.detail || '', options.filename === 'detail');
		detail.hidden = !options.detail;
		progress.hidden = options.progress === undefined;
		progress.classList.toggle('is-indeterminate', options.progress === null);
		progress.classList.toggle('is-complete', options.complete === true && options.progress === 1);
		if(typeof options.progress === 'number')
		{
			const value = Math.max(0, Math.min(1, options.progress));
			fill.style.transform = `scaleX(${value})`;
			progress.setAttribute('aria-valuenow', String(Math.round(value * 100)));
		} else {
			fill.style.transform = '';
			progress.removeAttribute('aria-valuenow');
		}
		startTimer();
	};
	close.addEventListener('click', hide);
	element.addEventListener('pointerenter', () => { hovered = true; startTimer(); });
	element.addEventListener('pointerleave', () => { hovered = false; startTimer(); });
	element.addEventListener('focusin', () => { focused = true; startTimer(); });
	element.addEventListener('focusout', (event) =>
	{
		focused = element.contains(event.relatedTarget as Node);
		startTimer();
	});
	window.addEventListener('pagehide', hide);

	instance = {
		show: (text, options = {}) =>
		{
			update(text, options);
			visible = true;
			element.setAttribute('aria-hidden', 'false');
			element.classList.add('is-visible');
			close.tabIndex = 0;
			hovered = element.matches(':hover');
			focused = element.contains(document.activeElement);
			startTimer();
		},
		update,
		hide,
		destroy: () =>
		{
			hide();
			window.removeEventListener('pagehide', hide);
			element.remove();
			instance = null;
		}
	};
	instance.destroy = onPageReplace(instance.destroy);
	return instance;
}
