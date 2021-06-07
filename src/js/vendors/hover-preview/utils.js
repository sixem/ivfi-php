'use strict';

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
	if(window.requestAnimationFrame)
	{
		return function(left, element, data)
		{
			window.requestAnimationFrame(function()
			{
				move(left, element, data);
			});
		};
	}

	return function(left, element, data)
	{
		move(left, element, data);
	};
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
	} else if(['webm', 'mp4', 'ogg', 'ogv'].includes(this.data.extension))
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
	return this.options.encodeAll ? encodeURI(input).replace('#', '%23').replace('?', '%3F') : encodeURI(input);
}

export function loadImage(src, callback)
{
	var img = document.createElement('img'), _this = this;

	img.style['max-width'] = 'inherit';
	img.style['max-height'] = 'inherit';

	img.src = encodeUrl.call(_this, src);

	_this.timers.load = setInterval(function()
	{
		var w = img.naturalWidth, h = img.naturalHeight;
				
		if(w && h)
		{
			clearInterval(_this.timers.load);
			callback(img, [w, h]);
		}
	}, 30);
}

export function loadVideo(src, callback)
{
	var video = document.createElement('video'), source = video.appendChild(document.createElement('source'));

	['muted', 'loop', 'autoplay'].forEach((key) =>
	{
		video[key] = true;
	});

	source.type = ('video/' + (this.data.extension === 'ogv' ? 'ogg' : this.data.extension));
	source.src = encodeUrl.call(this, src);

	video.style['max-width'] = 'inherit';
	video.style['max-height'] = 'inherit';

	video.onloadedmetadata = function()
	{
		callback(video, [this.videoWidth, this.videoHeight]);
	}; 
}