import { getMove } from './utils';
import { mouseenter, mouseleave, mousemove } from './events';
import type { TPreviewOptions } from '../../types/common';

class hoverPreview
{
	public options: TPreviewOptions;

	public suspended = false;

	private handle: HTMLElement = null;

	private data = {
		cursor: null,
		left: null,
		src: null,
		type: null,
		offset: null,
		dimensions: null,
		force: null,
		on: null,
		container: null
	};

	private timers = { delay: null };

	private updater = getMove();

	private loadController: AbortController = null;

	private cleanupMedia: (() => void) = null;

	private currentElement: HTMLImageElement | HTMLVideoElement = null;

	private failed = false;

	private active = false;

	private loaded = false;

	private id = 0;

	private events: Record<string, (event: MouseEvent) => void>;

	constructor(private element: HTMLElement, options: TPreviewOptions = {})
	{
		this.options = { delay: 75, encodeAll: false, cursor: true, selector: 'a.preview', ...options };
		this.data.on = this.options.on || {};
		const target = (node: EventTarget): HTMLElement =>
		{
			const anchor = node instanceof Element ? node.closest<HTMLElement>(this.options.selector) : null;
			return anchor && this.element.contains(anchor) ? anchor : null;
		};
		this.events = {
			mouseover: event => this.setHandle(target(event.target), event),
			mouseout: event => this.setHandle(target(event.relatedTarget), event),
			mousemove: event =>
			{
				this.setHandle(target(event.target), event);
				if(this.handle) mousemove.call(this, event);
			}
		};
		Object.entries(this.events).forEach(([type, listener]) => this.element.addEventListener(type, listener));
	}

	private setHandle(target: HTMLElement, event: MouseEvent): void
	{
		if(target === this.handle) return;
		mouseleave.call(this);
		this.handle = null;
		this.failed = false;
		this.data.force = null;
		if(!target) return;

		const force = this.options.resolve ? this.options.resolve(target) : this.options.force;
		if(this.options.resolve && !force) return;
		this.handle = target;
		this.data.force = force;
		mouseenter.call(this, event);
	}

	public takeVideo(src: string, parent: HTMLElement): HTMLVideoElement
	{
		const video = this.currentElement;
		if(!(video instanceof HTMLVideoElement) || !this.active || this.data.src !== src
			|| video.readyState < 2 || video.error || !video.isConnected) return null;

		parent.append(video);
		/* Preview cleanup must leave the transferred media intact. */
		this.currentElement = null;
		mouseleave.call(this, video.currentTime);
		this.suspended = true;
		return video;
	}

	public hide(suspend = false): void
	{
		mouseleave.call(this);
		this.suspended = suspend;
	}

	public destroy(): void
	{
		this.hide();
		Object.entries(this.events).forEach(([type, listener]) => this.element.removeEventListener(type, listener));
		this.handle = null;
	}
}

export default (element: HTMLElement, options: TPreviewOptions = {}) => new hoverPreview(element, options);
