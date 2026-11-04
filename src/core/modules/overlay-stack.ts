import { onPageReplace } from './lifecycle';
import '../../css/overlay-stack.scss';

let stack: HTMLDivElement = null;

/** Shared placement and collapsing rows for the page's transient indicators. */
export function addOverlayItem(element: HTMLElement): (visible: boolean) => void
{
	if(!stack)
	{
		stack = document.createElement('div');
		stack.className = 'overlayStack';
		document.body.append(stack);
		onPageReplace(() => { stack?.remove(); stack = null; });
	}
	const row = document.createElement('div');
	row.className = 'overlayItem';
	const clip = document.createElement('div');
	clip.className = 'overlayClip';
	const content = document.createElement('div');
	content.className = 'overlayContent';
	content.append(element);
	clip.append(content);
	row.append(clip);
	row.setAttribute('inert', '');
	row.setAttribute('aria-hidden', 'true');
	stack.append(row);
	let shown = false;
	return visible =>
	{
		if(visible === shown) return;
		shown = visible;
		// Keep existing notices in place; a newly shown item joins the bottom.
		if(visible)
		{
			stack.append(row);
			// Establish the collapsed state so newly created notices also transition in.
			row.getBoundingClientRect();
		}
		row.toggleAttribute('inert', !visible);
		row.setAttribute('aria-hidden', String(!visible));
		row.classList.toggle('is-visible', visible);
	};
}
