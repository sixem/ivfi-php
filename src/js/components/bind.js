/* import models */
import {
	eventHandler
} from '../modules/event-handler';

/* import config */
import {
	config
} from '../config/config';

import {
	data
} from '../config/data';

/* import helpers */
import {
	dom,
	getScrollTop,
	setVideoVolume
} from '../modules/helpers';

const events = new Object();

const selector = data.instances.selector;

const pipe = data.instances.pipe;

/**
 * called onscroll - shows/hides current path in the top bar
 */
events.handleTopBarVisibility = () =>
{
	let path = selector.use('PATH');

	let	top = document.body.querySelector(':scope > div.top-bar > div.directory-info > div.quick-path');

	let	visible = getScrollTop() < (path.offsetTop + path.offsetHeight);

	if(!visible)
	{
		if(!top)
		{
			top = dom.new('div', {
				'class' : 'quick-path',
				'data-view' : 'desktop'
			});

			top.innerHTML = path.innerHTML;

			document.body.querySelector(':scope > div.top-bar > div.directory-info').append(top);
		}

		if(!top._isVisible)
		{
			if(top._isVisible !== false)
			{
				requestAnimationFrame(() =>
				{
					top.classList.add('visible');
				});
			} else {
				top.classList.add('visible');
			}

			top._isVisible = true;
		}
	} else {
		if(top && top._isVisible)
		{
			top.classList.remove('visible');

			top._isVisible = false;
		}
	}
};

const scrollData = new Object();

scrollData.break = false;
scrollData.save = null;

events.handlePreviewScroll = (e) =>
{
	if(data.scrollLock && !scrollData.break)
	{
		if(e.deltaY && Math.abs(e.deltaY) !== 0)
		{
			let step = data.preview.volume > 5 ? 2 : 1;
			
			if(e.deltaY < 0)
			{
				/* scroll up */
				data.preview.volume += step;

				if(data.preview.volume > 100)
				{
					data.preview.volume = 100;
				}
			} else if(e.deltaY > 0)
			{
				/* scroll down */
				data.preview.volume -= step;

				if(data.preview.volume < 0)
				{
					data.preview.volume = 0;
				}
			}

			clearTimeout(scrollData.save);

			scrollData.save = setTimeout(() =>
			{
				localStorage.setItem(`${data.storageKey}.previewVolume`, data.preview.volume);
			}, 100);

			pipe('data.previewVolume', data.preview.volume, data.preview.data);

			if(data.preview.data &&
				data.preview.data.element &&
				data.preview.data.audible &&
				data.preview.data.type === 'VIDEO')
			{
				setVideoVolume(data.preview.data.element, data.preview.volume / 100);
			}
		}

		scrollData.break = true;

		setTimeout(() =>
		{
			scrollData.break = false;
		}, 25);
	}

	if(data.scrollLock)
	{
		e.preventDefault();
	}
};

let debounceTimer = null;

let onDebounce = () =>
{
	events.handleTopBarVisibility();

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
};

events.handleBaseScroll = () =>
{
	clearTimeout(debounceTimer);

	debounceTimer = setTimeout(() => onDebounce(), 100);

	if(data.instances.optimize.main.enabled)
	{
		/* get scrolled position */
		let scrolled = window.scrollY;

		/* trigger optimization refresh if 175 px has been scrolled */
		if(Math.abs(scrolled - data.layer.main.scrolledY) > 175)
		{
			data.instances.optimize.main.attemptRefresh();
		}
	}
};

export class componentBind
{
	constructor()
	{
		return this;
	}

	/**
	 * unbind events - recalled on gallery show
	 */
	unbind = () =>
	{
		eventHandler.removeListener(document, 'keydown', 'mainKeyDown');
		eventHandler.removeListener(window, 'scroll', 'windowScroll');
	}

	/**
     * bind events - recalled on gallery close
     */
	load = () =>
	{
		eventHandler.addListener(document, 'keydown', 'mainKeyDown', (e) =>
		{
			if(e.shiftKey && e.keyCode === data.keys.f)
			{
				e.preventDefault();

				data.components.filter.toggle();

			} else if(e.keyCode === data.keys.escape)
			{
				data.components.main.overlay.hide((state) =>
				{
					if(state === true)
					{
						e.preventDefault();
					}
				});
			} else if(e.keyCode === data.keys.g)
			{
				if(config.get('gallery.enabled') === true)
				{
					let container = document.body.querySelector(':scope > div.filter-container');

					if(container.style.display === 'none' ||
						!(document.activeElement === container.querySelector('input')))
					{
						data.components.gallery.load(null);

						data.components.main.menu.toggle(false);
					}
				}
			}
		});

		let scrollEvents = ['DOMMouseScroll', 'mousewheel', 'wheel'];

		/* remove any existing scrolling events */
		(scrollEvents).forEach((event) =>
		{
			window.removeEventListener(event, events.handlePreviewScroll, {
				passive: false
			});
		});

		/* create non-passive scrolling listeners directly */
		(scrollEvents).forEach((event) =>
		{
			window.addEventListener(event, events.handlePreviewScroll, {
				passive: false
			});
		});

		/* remove any existing `scroll` event */
		window.removeEventListener('scroll', events.handleBaseScroll, {
			passive: false
		});

		/* create non-passive `scroll` listener directly */
		window.addEventListener('scroll', events.handleBaseScroll, {
			passive: false
		});

		events.handleTopBarVisibility();
	}
}