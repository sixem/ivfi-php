import { loadImage as loadDecodedImage, releaseMedia } from '../../helpers/media';

function getLeft(left, eWidth, offsetX)
{
	if(left)
	{
		if((window.innerWidth - (offsetX) - 20) > (eWidth))
		{
			return offsetX + 20;
		} else if(window.innerWidth > eWidth)
		{
			return (window.innerWidth - eWidth);
		}
	} else {
		if(eWidth < (offsetX - 20))
		{
			return (offsetX - eWidth - 20);
		} else {
			return 0;
		}
	}

	return 0;
}

function getTop(offset, dimensions)
{
	var wHeight = window.innerHeight;

	if(dimensions.y >= wHeight)
	{
		return 0;
	}

	var percentage = (offset.y / wHeight * 100);

	percentage = percentage > 100 ? 100 : percentage;

	return (wHeight / 100 * percentage - (dimensions.y) / 100 * percentage);
}

function move(left, element, data)
{
	var offset = data.offset, dimensions = data.dimensions;

	element.style['left'] = getLeft(left, element.clientWidth, offset.x) + 'px';
	element.style['top'] = getTop(offset, dimensions) + 'px';

	return false;
}

export function getMove()
{
	let frame: number = null;
	let latest = null;
	const update = (left, element, data) =>
	{
		latest = { left, element, data };
		if(frame !== null) return;
		frame = requestAnimationFrame(() =>
		{
			frame = null;
			const { left, element, data } = latest;
			latest = null;
			if(element.isConnected) move(left, element, data);
		});
	};
	update.cancel = () =>
	{
		if(frame !== null) cancelAnimationFrame(frame);
		frame = null;
		latest = null;
	};
	return update;
}

export function getType()
{
	if(this.data.force)
	{
		this.data.extension = this.data.force.extension;
		return this.data.force.type;
	}

	this.data.extension = this.data.src.split('.').pop().toLowerCase();

	if(['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'].includes(this.data.extension))
	{
		return 0;
	} else if(['webm', 'mp4', 'ogg', 'ogv', 'mov'].includes(this.data.extension))
	{
		return 1;
	}

	return null;
}

export function createContainer()
{
	var container = document.createElement('div');

	container.className = 'preview-container';

	var styles = {
		'pointer-events' : 'none',
		'position' : 'fixed',
		'visibility' : 'hidden',
		'z-index' : '9999',
		'top' : '-9999px',
		'left' : '-9999px',
		'max-width' : '100vw',
		'max-height' : '100vh'
	};

	Object.keys(styles).forEach((key) =>
	{
		container.style[key] = styles[key];
	});

	return container;
}

function encodeUrl(input)
{
	return this.options.encodeAll ? input.replace('#', '%23').replace('?', '%3F') : encodeURI(input);
}

function isAudible(video)
{
    if(typeof video.webkitAudioDecodedByteCount !== 'undefined')
    {
        if(video.webkitAudioDecodedByteCount > 0)
        {
        	return true;
        } else {
        	return false;
        }
    } else if(typeof video.mozHasAudio !== 'undefined')
    {
        if(video.mozHasAudio)
        {
            return true;
        } else {
            return false;
        }
    } else if(typeof video.audioTracks !== 'undefined')
    {
        if(video.audioTracks && video.audioTracks.length)
        {
            return true;
        } else {
            return false;
        }
    } else {
    	return false;
    }

    return false;
}

export function loadImage(src, callback)
{
	const id = this.id;
	const controller = new AbortController();
	this.loadController = controller;
	loadDecodedImage(encodeUrl.call(this, src), controller.signal).then(image =>
	{
		if(!this.active || id !== this.id)
		{
			releaseMedia(image);
			return;
		}
		if(this.options.available && !this.options.available())
		{
			releaseMedia(image);
			callback(false);
			return;
		}
		this.currentElement = image;
		image.style.maxWidth = 'inherit';
		image.style.maxHeight = 'inherit';
		this.data.on.onLoaded?.({ loaded: true, type: 'IMAGE', audible: false, element: image, src });
		callback(image, [image.naturalWidth, image.naturalHeight]);
	}).catch(error =>
	{
		if(error.name !== 'AbortError' && this.active && id === this.id) callback(false);
	}).finally(() =>
	{
		if(this.loadController === controller) this.loadController = null;
	});
}

export function loadVideo(src, callback)
{
	const id = this.id;
	const video = document.createElement('video');
	const source = video.appendChild(document.createElement('source'));
	this.currentElement = video;
	video.muted = true;
	video.loop = true;
	video.autoplay = true;
	video.style.maxWidth = 'inherit';
	video.style.maxHeight = 'inherit';
	let loaded = false;
	const current = () => this.active && id === this.id;
	const metadata = () =>
	{
		if(current()) callback(video, [video.videoWidth, video.videoHeight]);
	};
	const ready = () =>
	{
		if(!current() || loaded || video.readyState < 2) return;
		if(this.options.available && !this.options.available())
		{
			callback(false);
			return;
		}
		loaded = true;
		this.data.on.onLoaded?.({ loaded: true, type: 'VIDEO', audible: isAudible(video), element: video, src });
	};
	const error = () => { if(current()) callback(false); };
	video.addEventListener('loadedmetadata', metadata);
	video.addEventListener('loadeddata', ready);
	video.addEventListener('canplay', ready);
	video.addEventListener('error', error);
	source.addEventListener('error', error);
	this.cleanupMedia = () =>
	{
		video.removeEventListener('loadedmetadata', metadata);
		video.removeEventListener('loadeddata', ready);
		video.removeEventListener('canplay', ready);
		video.removeEventListener('error', error);
		source.removeEventListener('error', error);
	};
	source.type = 'video/' + (this.data.extension === 'mov' ? 'mp4' : (this.data.extension === 'ogv' ? 'ogg' : this.data.extension));
	source.src = encodeUrl.call(this, src);
	video.load();
}
