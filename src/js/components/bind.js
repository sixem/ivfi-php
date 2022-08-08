/** Import `eventHandler` */
import eventHandler from '../modules/event-handler';

/** Import `config` */
import {
	config
} from '../config/config';

/** Import `data` */
import data from '../config/data';

/** Import `DOM`, `getScrollTop`, `setVideoVolume` */
import {
	DOM,
	getScrollTop,
	setVideoVolume
} from '../modules/helpers';

const events = {},
	scrollData = {},
	selector = data.instances.selector,
	pipe = data.instances.pipe;

let debounceTimer = null;

/**
 * Called `onScroll` — Shows or hides the current path in the top bar
 */
events.handleTopBarVisibility = () =>
{
	let path = selector.use('PATH'),
		top = document.body.querySelector(':scope > div.top-bar > div.directory-info > div.quick-path'),
		visible = getScrollTop() < (path.offsetTop + path.offsetHeight);

	if(!visible)
	{
		if(!top)
		{
			top = DOM.new('div', {
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

scrollData.break = false;
scrollData.save = null;

events.handlePreviewScroll = (e) =>
{
	if(data.scrollLock && !scrollData.break)
	{
		if(e.deltaY && Math.abs(e.deltaY) !== 0)
		{
			/* Increase (-/+) by 2 if >5, else increase (-/+) by 1 */
			let step = data.preview.volume > 5 ? 2 : 1;
			
			if(e.deltaY < 0)
			{
				/* Scroll up */
				data.preview.volume += step;

				if(data.preview.volume > 100)
				{
					data.preview.volume = 100;
				}
			} else if(e.deltaY > 0)
			{
				/* Scroll down */
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

		setTimeout(() => scrollData.break = false, 25);
	}

	if(data.scrollLock)
	{
		e.preventDefault();
	}
};

let onDebounce = () =>
{
	events.handleTopBarVisibility();

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
};

/**
 * Handles scroll events
 */
events.handleBaseScroll = () =>
{
	clearTimeout(debounceTimer);

	debounceTimer = setTimeout(() => onDebounce(), 100);

	if(data.instances.optimize.main.enabled)
	{
		/* Get scrolled position */
		let scrolled = window.scrollY;

		/* Trigger optimization refresh if `175px` has been scrolled */
		if(Math.abs(scrolled - data.layer.main.scrolledY) > 175)
		{
			data.instances.optimize.main.attemptRefresh();
		}
	}
};

export default class componentBind
{
	constructor()
	{
		return this;
	}

	/**
	 * Unbind events — Recalled on gallery show
	 */
	unbind = () =>
	{
		eventHandler.removeListener(document, 'keydown', 'mainKeyDown');
		eventHandler.removeListener(window, 'scroll', 'windowScroll');
	}

	/**
     * Bind events — Recalled on gallery close
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

		/* Scroll events to listen to */
		let scrollEvents = ['DOMMouseScroll', 'mousewheel', 'wheel'];

		/* Remove any existing scrolling events */
		(scrollEvents).forEach((event) =>
		{
			window.removeEventListener(event, events.handlePreviewScroll, {
				passive: false
			});
		});

		/* Create non-passive scrolling listeners directly */
		(scrollEvents).forEach((event) =>
		{
			window.addEventListener(event, events.handlePreviewScroll, {
				passive: false
			});
		});

		/* Remove any existing `scroll` event */
		window.removeEventListener('scroll', events.handleBaseScroll, {
			passive: false
		});

		/* Create non-passive `scroll` listener directly */
		window.addEventListener('scroll', events.handleBaseScroll, {
			passive: false
		});

		events.handleTopBarVisibility();
	}
};