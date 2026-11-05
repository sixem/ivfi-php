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
	let updateVolumeHint: (() => void) = null;
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
		metadata();
		const audible = isAudible(video);
		this.data.on.onLoaded?.({ loaded: true, type: 'VIDEO', audible, element: video, src });
		{
			const indicator = document.createElement('span');
			indicator.className = 'previewVolumeHint';
			indicator.setAttribute('aria-hidden', 'true');
			indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>${video.volume > 0 ? '<path d="M16 9a5 5 0 0 1 0 6"/>' : ''}${video.volume >= 0.1 ? '<path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>' : ''}</svg>`;
			if(!audible) indicator.querySelector('svg').innerHTML = '<path d="M16 9a5 5 0 0 1 .95 2.293"/><path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"/><path d="m2 2 20 20"/><path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"/><path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"/>';
			this.data.container?.appendChild(indicator);
			if(audible)
			{
				const volumeState = () => video.volume === 0 ? 0 : video.volume < 0.1 ? 1 : 2;
				let state = volumeState();
				updateVolumeHint = () =>
				{
					const nextState = volumeState();
					if(nextState === state || !current()) return;
					state = nextState;
					const svg = indicator.querySelector('svg');
					svg.querySelectorAll('path:not(:first-child)').forEach(path => path.remove());
					const waves = ['M16 9a5 5 0 0 1 0 6', 'M19.364 18.364a9 9 0 0 0 0-12.728'];
					for(const path of waves.slice(0, state))
					{
						const wave = document.createElementNS('http://www.w3.org/2000/svg', 'path');
						wave.setAttribute('d', path);
						svg.appendChild(wave);
					}
					const opacity = Number(getComputedStyle(indicator).opacity);
					indicator.getAnimations().forEach(animation => animation.cancel());
					indicator.style.animation = 'none';
					indicator.animate([
						{ opacity, offset: 0 },
						{ opacity: 1, offset: 0.1 },
						{ opacity: 1, offset: 0.75 },
						{ opacity: 0, offset: 1 }
					], { duration: 1600, easing: 'ease', fill: 'forwards' });
				};
				video.addEventListener('volumechange', updateVolumeHint);
			}
		}
	};
	const error = () => { if(current()) callback(false); };
	video.addEventListener('loadeddata', ready);
	video.addEventListener('canplay', ready);
	video.addEventListener('error', error);
	source.addEventListener('error', error);
	this.cleanupMedia = () =>
	{
		if(updateVolumeHint) video.removeEventListener('volumechange', updateVolumeHint);
		video.removeEventListener('loadeddata', ready);
		video.removeEventListener('canplay', ready);
		video.removeEventListener('error', error);
		source.removeEventListener('error', error);
	};
	source.type = 'video/' + (this.data.extension === 'mov' ? 'mp4' : (this.data.extension === 'ogv' ? 'ogg' : this.data.extension));
	source.src = encodeUrl.call(this, src);
	video.load();
}
