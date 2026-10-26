import {
	loadImage,
	loadVideo,
	createContainer,
	getType
} from './utils';
import { releaseMedia } from '../../helpers/media';

function setOffset(event)
{
	this.data.offset = { x: event.clientX, y: event.clientY };
}

function onEnter()
{
	if(this.options.available && !this.options.available())
	{
		mouseleave.call(this);
		return;
	}

	const target = this.handle;
	this.data.src = this.options.source || target.getAttribute('data-src')
		|| target.getAttribute('src') || target.getAttribute('href');
	if(!this.data.src) return;

	this.data.type = getType.call(this);
	if(this.data.type === null) return;

	const id = this.id;
	const container = createContainer();
	this.data.left = this.data.offset.x <= window.innerWidth / 2;
	this.data.container = container;
	document.body.prepend(container);

	if(this.options.cursor)
	{
		this.data.cursor = target.style.cursor;
		target.style.cursor = 'progress';
	}

	(this.data.type === 0 ? loadImage : loadVideo).call(this, this.data.src, (element, dimensions) =>
	{
		if(!this.active || id !== this.id) return;
		if(!element)
		{
			mouseleave.call(this);
			this.failed = true;
			return;
		}

		container.appendChild(element);
		this.data.dimensions = { x: dimensions[0], y: dimensions[1] };
		this.loaded = true;
		update.call(this);
		container.style.visibility = 'visible';
		if(this.options.cursor) target.style.cursor = this.data.cursor;
	});
}

function update()
{
	this.updater(this.data.left, this.data.container, {
		dimensions: this.data.dimensions,
		offset: this.data.offset
	});
}

export function mousemove(event)
{
	if(this.suspended)
	{
		if((!event.movementX && !event.movementY) || !document.hasFocus() || document.hidden) return;
		this.suspended = false;
	}
	if(event.buttons || this.failed) return;
	if(!this.active) mouseenter.call(this, event);
	setOffset.call(this, event);
	if(this.loaded) update.call(this);
}

export function mouseenter(event)
{
	if(this.suspended || this.active || (this.options.available && !this.options.available())) return;
	this.failed = false;
	this.active = true;
	const id = this.id;
	setOffset.call(this, event);
	if(this.options.delay > 0)
	{
		this.timers.delay = window.setTimeout(() =>
		{
			if(this.active && id === this.id) onEnter.call(this);
		}, this.options.delay);
	} else onEnter.call(this);
}

export function mouseleave(timestamp: number = null)
{
	if(!this.active && !this.currentElement && !this.data.container) return;
	this.active = false;
	this.id++;
	clearTimeout(this.timers.delay);
	this.loadController?.abort();
	this.loadController = null;
	this.cleanupMedia?.();
	this.cleanupMedia = null;
	this.updater.cancel();

	if(this.currentElement)
	{
		if(this.currentElement instanceof HTMLVideoElement) timestamp = this.currentElement.currentTime;
		releaseMedia(this.currentElement);
		this.currentElement = null;
	}
	if(this.options.cursor && this.data.cursor !== null) this.handle.style.cursor = this.data.cursor;
	this.data.cursor = null;
	this.data.container?.remove();
	this.data.container = null;
	this.loaded = false;

	this.data.on.onLoaded?.({
		loaded: false,
		type: null,
		audible: false,
		element: null,
		timestamp,
		src: this.data.src
	});
}
