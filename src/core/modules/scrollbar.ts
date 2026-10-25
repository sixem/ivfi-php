import { onPageReplace } from './lifecycle';
import '../../css/scrollbar.scss';

let nextId = 0;

export function createOverlayScrollbar(target: Window | HTMLElement, options: {
	label: string;
	header?: HTMLElement;
	parent?: HTMLElement;
	/** Absolute positioning requires a positioned parent */
	position?: 'fixed' | 'absolute';
	/** Hide until hover, focus, or drag; default false */
	hoverOnly?: boolean;
	shadows?: boolean;
}): () => void
{
	const isPage = target === window;
	const scroller = isPage ? document.documentElement : target as HTMLElement;
	const parent = options.parent || (isPage ? document.body : scroller.parentElement);
	const track = document.createElement('div');
	const thumb = document.createElement('span');
	const previousId = scroller.id;
	if(!previousId) scroller.id = `ivfi-scroll-area-${++nextId}`;
	track.className = 'overlayScrollbar';
	if(options.position) track.style.position = options.position;
	if(options.hoverOnly) track.setAttribute('data-hover-only', 'true');
	track.setAttribute('role', 'scrollbar');
	track.setAttribute('aria-label', options.label);
	track.setAttribute('aria-controls', scroller.id);
	track.setAttribute('aria-orientation', 'vertical');
	track.setAttribute('aria-valuemin', '0');
	thumb.className = 'overlayScrollbarThumb';
	track.append(thumb);
	parent.append(track);
	const shadows = options.shadows ? document.createElement('div') : null;
	if(shadows)
	{
		shadows.className = 'scrollShadows';
		if(options.position) shadows.style.position = options.position;
		shadows.setAttribute('aria-hidden', 'true');
		parent.append(shadows);
	}
	scroller.classList.add('overlayScrollArea');

	let frame = 0;
	let max = 0;
	let page = 0;
	let travel = 0;
	let drag: { id: number; y: number; offset: number; scale: number } = null;
	const position = () => isPage ? window.scrollY : scroller.scrollTop;
	const stopDrag = () =>
	{
		const active = drag;
		drag = null;
		track.removeAttribute('data-dragging');
		if(active && track.hasPointerCapture(active.id)) track.releasePointerCapture(active.id);
	};
	const measure = () =>
	{
		frame = 0;
		const bounds = scroller.getBoundingClientRect();
		const parentBounds = options.position === 'absolute' ? parent.getBoundingClientRect() : null;
		const originTop = parentBounds ? parentBounds.top + parent.clientTop - parent.scrollTop : 0;
		const originLeft = parentBounds ? parentBounds.left + parent.clientLeft - parent.scrollLeft : 0;
		const top = isPage ? (options.header ? options.header.getBoundingClientRect().bottom : 0) : bounds.top + scroller.clientTop;
		const bottom = isPage ? window.innerHeight : Math.min(window.innerHeight, top + scroller.clientHeight);
		const height = Math.max(0, bottom - Math.max(0, top) - 16);
		page = isPage ? Math.max(0, scroller.clientHeight - top) : scroller.clientHeight;
		max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
		const size = Math.min(height, Math.max(24, height * page / (page + max || 1)));
		travel = height - size;
		const offset = position();
		const progress = max ? Math.max(0, Math.min(1, offset / max)) : 0;
		/* Reserve space for an adjacent resize handle */
		const insetRight = parseFloat(getComputedStyle(scroller).getPropertyValue('--scrollbar-inset-right')) || 0;
		const locked = isPage && [document.body, scroller].some(element => ['hidden', 'clip'].includes(getComputedStyle(element).overflowY));
		const visible = !locked && max > 1 && travel > 0 && scroller.getClientRects().length > 0;
		track.style.top = `${Math.max(0, top) + 8 - originTop}px`;
		track.style.left = `${(isPage ? scroller.clientWidth : bounds.left + scroller.clientLeft + scroller.clientWidth) - 12 - insetRight - originLeft}px`;
		track.style.height = `${height}px`;
		track.setAttribute('data-scrollable', String(visible));
		track.setAttribute('aria-hidden', String(!visible));
		track.setAttribute('aria-valuemax', String(Math.round(max)));
		track.setAttribute('aria-valuenow', String(Math.round(progress * max)));
		track.tabIndex = visible ? 0 : -1;
		thumb.style.height = `${size}px`;
		thumb.style.transform = `translateY(${progress * travel}px)`;
		if(options.hoverOnly)
			track.toggleAttribute('data-hovered', visible && (scroller.matches(':hover') || track.matches(':hover')));
		if(shadows)
		{
			shadows.hidden = !visible;
			shadows.style.top = `${Math.max(0, top) - originTop}px`;
			shadows.style.left = `${(isPage ? 0 : bounds.left + scroller.clientLeft) - originLeft}px`;
			shadows.style.width = `${scroller.clientWidth}px`;
			shadows.style.height = `${Math.max(0, bottom - Math.max(0, top))}px`;
			shadows.toggleAttribute('data-above', offset > 1);
			shadows.toggleAttribute('data-below', offset < max - 1);
		}
		if(!visible) stopDrag();
	};
	const schedule = () =>
	{
		if(!frame) frame = requestAnimationFrame(measure);
	};
	const scrollTo = (top: number) =>
	{
		top = Math.max(0, Math.min(max, top));
		if(isPage) window.scrollTo(0, top);
		else scroller.scrollTop = top;
		schedule();
	};
	const enter = () => track.setAttribute('data-hovered', '');
	const leave = (event: PointerEvent) =>
	{
		const next = event.relatedTarget;
		if(next instanceof Node && (scroller.contains(next) || track.contains(next))) return;
		track.removeAttribute('data-hovered');
	};
	if(options.hoverOnly)
	{
		[scroller, track].forEach(element =>
		{
			element.addEventListener('pointerenter', enter);
			element.addEventListener('pointerleave', leave);
		});
	}
	track.addEventListener('pointerdown', (event) =>
	{
		if(!event.isPrimary || event.button !== 0 || track.getAttribute('data-scrollable') !== 'true') return;
		event.preventDefault();
		if(event.target === track)
		{
			const y = event.clientY - track.getBoundingClientRect().top;
			scrollTo((y - thumb.offsetHeight / 2) / travel * max);
		}
		drag = { id: event.pointerId, y: event.clientY, offset: position(), scale: max / travel };
		track.setPointerCapture(event.pointerId);
		track.setAttribute('data-dragging', 'true');
		track.focus({ preventScroll: true });
	});
	track.addEventListener('pointermove', (event) =>
	{
		if(drag && drag.id === event.pointerId) scrollTo(drag.offset + (event.clientY - drag.y) * drag.scale);
	});
	['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => track.addEventListener(type, stopDrag));
	track.addEventListener('keydown', (event) =>
	{
		let top = position();
		switch(event.key)
		{
			case 'ArrowDown': top += 40; break;
			case 'ArrowUp': top -= 40; break;
			case 'PageDown': top += page; break;
			case 'PageUp': top -= page; break;
			case ' ': top += page * (event.shiftKey ? -1 : 1); break;
			case 'Home': top = 0; break;
			case 'End': top = max; break;
			default: return;
		}
		event.preventDefault();
		event.stopPropagation();
		scrollTo(top);
	});
	/* Isolate scrollbar keys from gallery navigation */
	track.addEventListener('keyup', (event) =>
	{
		if(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(event.key)) event.stopPropagation();
	});
	track.addEventListener('wheel', (event) =>
	{
		if(event.ctrlKey) return;
		event.preventDefault();
		event.stopPropagation();
		const scale = event.deltaMode === 1 ? 16 : (event.deltaMode === 2 ? page : 1);
		scrollTo(position() + event.deltaY * scale);
	}, { passive: false });

	const resize = new ResizeObserver(schedule);
	resize.observe(scroller);
	const content = isPage ? document.body : scroller;
	if(content !== scroller) resize.observe(content);
	Array.from(content.children).forEach(child => resize.observe(child));
	if(options.header) resize.observe(options.header);
	const changes = new MutationObserver(schedule);
	changes.observe(content, { childList: true, subtree: true, characterData: true });
	const attributes = new MutationObserver(schedule);
	for(let element = scroller; element; element = element.parentElement)
	{
		attributes.observe(element, { attributes: true, attributeFilter: ['style', 'class', 'hidden', 'open', 'dialog-is-visible'] });
	}
	if(isPage) attributes.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
	if(!isPage) target.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('scroll', schedule, { passive: true });
	window.addEventListener('resize', schedule);
	window.addEventListener('pageshow', schedule);
	window.addEventListener('blur', stopDrag);
	measure();

	return onPageReplace(() =>
	{
		stopDrag();
		cancelAnimationFrame(frame);
		resize.disconnect();
		changes.disconnect();
		attributes.disconnect();
		if(!isPage) target.removeEventListener('scroll', schedule);
		window.removeEventListener('scroll', schedule);
		window.removeEventListener('resize', schedule);
		window.removeEventListener('pageshow', schedule);
		window.removeEventListener('blur', stopDrag);
		if(options.hoverOnly)
		{
			[scroller, track].forEach(element =>
			{
				element.removeEventListener('pointerenter', enter);
				element.removeEventListener('pointerleave', leave);
			});
		}
		shadows?.remove();
		track.remove();
		scroller.classList.remove('overlayScrollArea');
		if(!previousId) scroller.removeAttribute('id');
	});
}
