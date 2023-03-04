/** Vendors */
import './vendors/swiped-events';
import hoverPreview from './vendors/hover-preview/hover-preview';
/** Config */
import { config, user } from './config/config';
import data from './config/data';
/** Modules */
import { log } from './modules/logger';
import { eventHooks } from './modules/event-hooks';
/** Classes */
import optimizeClass from './classes/optimize';
/** Components */
import {
	componentGallery,
	componentSettings,
	componentFilter,
	componentBind,
	componentMain
} from './components';

/** Helpers */
import {
	DOM,
	debounce,
	setVideoVolume,
	identifyExtension,
	stripUrl
} from './helpers';

/** Types */
import {
	ITableRowMI,
	IPreviewAnchor,
	TOnPreviewLoad,
	TPreviewOptions,
	TExtensionArray,
	IWindowGlobals,
	IDocumentGlobals
} from './types';

/** Stylesheets */
import '../css/root.scss';
import '../css/fonts.scss';
import '../css/main.scss';

/* References */
const selector = data.instances.selector;

/* Disable media play */
try
{
	navigator.mediaSession.setActionHandler('play', null);
} catch(error)
{
	log('error', error);
}

/* Set main component in data */
data.components.main = componentMain;

/* Set page dom object */
data.layer.main = {
	windowHeight : window.innerHeight,
	windowWidth : window.innerWidth,
	scrolledY : window.scrollY,
	/**
 	* Updates page data (dimensions etc) — called on resize etc.
 	*/
	update : () =>
	{
		const table = (selector.use('TABLE_CONTAINER') as HTMLElement);

		data.layer.main.windowHeight = window.innerHeight;
		data.layer.main.windowWidth = window.innerWidth;
		data.layer.main.scrolledY = window.scrollY;
		data.layer.main.tableWidth = table.offsetWidth;

		return true;
	}
};

/* Update page values */
data.layer.main.update();

/* Enable performance mode */
if(config.get('performance'))
{
	/* Called on row change, updates index properties (for media indexing) */
	const onRowChange = (rows: Array<ITableRowMI>): void | boolean =>
	{
		let mediaIndex = 0;

		for(let index = 0; index < rows.length; index++)
		{
			if(rows[index].children[0].children[0].classList.contains('preview'))
			{
				rows[index]._mediaIndex = mediaIndex;
				mediaIndex++;
			}
		}
	};

	setTimeout(() =>
	{
		requestAnimationFrame((): void =>
		{
			/* Create optimize instance */
			data.instances.optimize.main = new optimizeClass({
				page: data.layer.main,
				table: selector.use('TABLE') as HTMLElement,
				scope: [window, 'scrollY'],
				padding: 0, /* Top padding offset */
				on: {
					rowChange: onRowChange
				}
			});
		});
	}, 1);
}

/**
 * Menu click event
 */
eventHooks.listen(selector.use('TOP_EXTEND') as HTMLElement, 'click', 'sortClick', (e) =>
{
	data.components.main.menu.toggle(e.currentTarget);
});

/**
 * Filter change event
 */
eventHooks.listen(selector.use('FILTER_INPUT') as HTMLElement, 'input', 'filterInput', (e) =>
{
	data.components.filter.apply(e.currentTarget.value);
});

/**
 * Readme toggle event
 */
if(selector.use('README_CONTAINER'))
{
	eventHooks.listen(selector.use('README_CONTAINER') as HTMLElement, 'toggle', 'toggledReadme', (e) =>
	{
		const client = user.get();

		if(!client.readme)
		{
			client.readme = {};
		}
	
		client.readme.toggled = e.target.hasAttribute('open');
	
		user.set(client);
	
		/**
		 * Refresh performance rows
		 * 
		 * This is done because long readme content can lead to a deep set of
		 * rows previously being out of view, becoming "visible" without the
		 * optimizer rendering them as visible.
		 */
		if(data.instances.optimize.main.enabled)
		{
			data.instances.optimize.main.attemptRefresh();
		}
	});
}

/**
 * Item click event (show gallery if enabled and table sort)
 */
eventHooks.listen(selector.use('TABLE') as HTMLElement, 'click', 'sortClick', (event: MouseEvent) =>
{
	const eventTarget: HTMLElement = event.target as HTMLElement;

	if(eventTarget.tagName === 'SPAN'
		&& eventTarget.hasAttribute('sortable'))
	{
		data.components.main.sortTableColumn(eventTarget);

	} else if(config.get('gallery.enabled') === true
		&& eventTarget.tagName === 'A'
		&& eventTarget.className == 'preview')
	{
		event.preventDefault();

		let index = 0;

		if(data.instances.optimize.main.enabled)
		{
			/* Get `tr` parent */
			const parent: ITableRowMI = (eventTarget.closest('tr') as HTMLElement);

			/* Check for a index property, use as index if found */
			if(parent._mediaIndex) index = parent._mediaIndex;
		} else {
			(selector.use('TABLE') as HTMLElement).querySelectorAll(
				'tr.file:not(.filtered) a.preview'
			).forEach((element: HTMLAnchorElement, i: number) =>
			{
				if(eventTarget === element) index = i;
			});
		}

		data.components.gallery.load(index);
	}
});

/**
 * Re-check mobile sizing on resize
 */
eventHooks.listen(window, 'resize', 'windowResize', debounce((): void =>
{
	log('event', 'windowResize (main)', 'Resized');

	/** Get mobile status */
	const isMobile = Modernizr.mq('(max-width: 768px)');

	if(config.get('mobile') !== isMobile)
	{
		/** Update mobile status */
		config.set('mobile', Modernizr.mq('(max-width: 768px)'));

		log('view', `Switched to ${isMobile ? 'mobile' : 'desktop'} view`);
	}

	if(data.instances.gallery)
	{
		data.instances.gallery.options.mobile = isMobile;
		data.instances.gallery.update.listWidth();
	}

	/* Update page values */
	data.layer.main.update();

	/* Refresh performance rows */
	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
}));

/**
 * Create preview events if enabled (and not on mobile)
 */
if(config.get('mobile') === false
	&& config.get('preview.enabled') === true)
{
	const previews = {};

	let resume = null;
	let timerReadyState = null;

	const onLoaded = (event: TOnPreviewLoad) =>
	{
		log('preview', 'Preview loaded =>', event);

		if(data.preview.data
			&& data.preview.data.element)
		{
			data.preview.data.element.remove();
		}

		if(!data.preview.isLoadable) return null;

		const [element, type, src] = [
			event.element,
			event.type,
			event.src
		];

		data.preview.data = event;

		/* Clear timer */
		clearInterval(timerReadyState);

		if(element && type === 'VIDEO')
		{
			/* If a resume is set, then set currentTime */
			if(resume && resume.src === src)
			{
				(element as HTMLVideoElement).currentTime = resume.timestamp;
			} else {
				resume = null;
			}

			/* Set stored preview volume */
			setVideoVolume((element as HTMLVideoElement), data.preview.volume / 100, false);

			/* Check for valid readystate (4, 3, 2) before we show the video */
			timerReadyState = setInterval(() =>
			{
				if((element as HTMLVideoElement).readyState > 1)
				{
					/* Show video */
					DOM.style.set(element, {
						visibility : 'visible'
					});

					/* Clear timer */
					clearInterval(timerReadyState);
				}
			}, 25);
		} else {
			/* Not a video, clear resume */
			resume = null;
		}

		/* Store timestamp if exists */
		if(Object.prototype.hasOwnProperty.call(event, 'timestamp'))
		{
			const timestamp = event.timestamp;

			resume = {
				src,
				timestamp
			};
		}

		/* If video is audible, enable scrollLock */
		if(event.loaded && event.audible)
		{
			data.scrollLock = true;
		} else {
			data.scrollLock = false;
		}
	};

	const createPreview = (element: IPreviewAnchor) =>
	{
		const src: string = element.getAttribute('href');
		const extensions: TExtensionArray = config.get('extensions');

		const identified = identifyExtension(stripUrl(src), {
			image: extensions.image,
			video: extensions.video
		});

		if(identified)
		{
			const [extension, type] = identified;

			const options: TPreviewOptions = {};

			/* Delay prior to showing preview */
			options.delay = config.get('preview.hoverDelay');

			/* Loading cursor */
			options.cursor = config.get('preview.cursorIndicator');

			/* Encoding */
			options.encodeAll = config.get('encodeAll');

			/* Events */
			options.on = {
				onLoaded: onLoaded
			};

			/* Force set extension data */
			options.force = {
				extension,
				type
			};

			/* Create preview */
			previews[element.itemIndex] = hoverPreview(element, options);
		}
	};

	/* Get previewable elements */
	const previewable = document.querySelectorAll('body > div.tableContainer > table > tbody > tr.file > td > a.preview');

	/* Set preview indexes */
	previewable.forEach((preview: IPreviewAnchor, index) =>
	{
		preview.itemIndex = index;

		if(index === 0) createPreview(preview);
	});

	/* Add preview hover listener */
	eventHooks.listen(selector.use('TABLE') as HTMLElement, 'mouseover', 'previewMouseEnter', (e) =>
	{
		/* Check if element is `a` element with a preview class */
		if(e.target.tagName === 'A' && e.target.className == 'preview')
		{
			const index = (e.target.itemIndex);

			if(!Object.prototype.hasOwnProperty.call(previews, index))
			{
				createPreview(e.target);
			}
		}
	});
}

if(config.get('singlePage'))
{
	let isNavigating = false;

	const pageNavigate = (location: string, pushState = true) =>
	{
		if(isNavigating)
		{
			return;
		} else {
			isNavigating = true;
		}
		
		/* Get location data */
		const windowProtocol = window.location.protocol,
			windowPort = window.location.port,
			windowHostName = window.location.hostname + (
				(windowPort && windowPort !== '80'
					|| windowPort !== '443') ? ':' + windowPort : ''
			),
			windowSubPath = location.replace(/([^:]\/)\/+/g, '$1').replace(/^\/|\/$/g, '');

		/* Construct upcoming title and URL */
		const nextLocation = `${windowProtocol}//${windowHostName}/${windowSubPath ? windowSubPath + '/' : ''}`,
			nextTitle = config.get('format').title.replace('%s', `/${windowSubPath}/`);

		/* Create POST body */
		const postData = Object.entries({
			navigateType: 'dynamic'
		}).map((([key, value], index) => `${index > 0 ? '&' : ''}${key}=${value}`)).join('');

		/* Avoid any new previews */
		data.preview.isLoadable = false;

		/* Create spinner */
		const indicator: HTMLElement = document.createElement('div');
		indicator.classList.add('navigateLoad');
		document.body.prepend(indicator);

		setTimeout(() => indicator.style.opacity = '1', 10);

		/**
		 * [Resets the loading state]
		 * 
		 * Even though every attempt at navigating will
		 * result in either a successful "redirect" or a forced
		 * redirect through `window.location` replacing, browsers
		 * will still save the state of the previous page in the cache.
		 * 
		 * This can result in a stalled loading state when navigating
		 * backwards in the browser after a failed navigation attempt.
		 * 
		 * This resets that state specifically for these scenarios.
		 */
		const resetNavigate = () =>
		{
			isNavigating = false;
			indicator.remove();
			data.preview.isLoadable = true;
		};

		/* Fetch new document */
		fetch(`/${windowSubPath}/`, {
			method: 'POST',
			redirect: 'follow',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: postData
		}).then((response) =>
		{
			/* Check if the correct response headers are set
			 * This removes any accidental navigates to unknown sources */
			if(response.headers.get('navigate-type') === 'dynamic')
			{
				log('main', 'Valid header. Navigating pages ..');
				
				response.text().then((content) =>
				{
					/**
					 * Clear any low-level DOM `eventHooks`, as these properties
					 * will not be reset on `document.write()` call
					 */
					(document as IDocumentGlobals).eventHooks = null;
					(window as IWindowGlobals).eventHooks = null;

					/* Update URL */
					if(pushState)
					{
						window.history.pushState({
							path: '/' + windowSubPath
						}, nextTitle, nextLocation);
					}
	
					/* Write changes to document */
					document.open();
					document.write(content);
					document.close();

					/* Scroll to top */
					window.scrollTo({
						top: 0,
						behavior: 'auto'
					});
				});
			} else {
				resetNavigate();

				/* Incorrect document type - fallback to normal redirection */
				window.location.replace(nextLocation);
			}
		}).catch(() =>
		{
			resetNavigate();

			/* Fallback to a normal redirection */
			window.location.replace(nextLocation);
		});
	};

	eventHooks.listen(window, 'popstate', 'mainPopState', () =>
	{
		pageNavigate(window.location.pathname, false);
	});

	eventHooks.listen(selector.use('TABLE') as HTMLElement, 'click', 'tableClick', (e) =>
	{
		if(e.target.tagName === 'A')
		{
			const parent = e.target.closest('tr');
	
			if(parent
				&& (parent.classList.contains('directory')
				|| parent.classList.contains('parent')))
			{
				e.preventDefault();

				pageNavigate(e.target.getAttribute('href'));
			}
		}
	});

	const quickPath = document.body.querySelector(':scope > div.topBar > div.directoryInfo'),
		topBar = document.body.querySelector(':scope > div.path');

	eventHooks.listen(quickPath as HTMLElement, 'click', 'quickPathClick', (event: MouseEvent) =>
	{
		if((event.target as HTMLElement).tagName === 'A')
		{
			const parent = ((event.target as HTMLElement).parentNode as HTMLElement);

			if(parent && parent.classList.contains('quickPath'))
			{
				event.preventDefault();

				pageNavigate((event.target as HTMLElement).getAttribute('href'));
			}
		}
	});

	eventHooks.listen(topBar as HTMLElement, 'click', 'pathClick', (event: MouseEvent) =>
	{
		if((event.target as HTMLElement).tagName === 'A')
		{
			event.preventDefault();

			pageNavigate((event.target as HTMLElement).getAttribute('href'));
		}
	});
}

/* Assign components */
data.components.settings = new componentSettings();
data.components.gallery = new componentGallery();
data.components.bind = new componentBind();
data.components.filter = componentFilter;

/* Create references for bind functions */
data.components.main.bind = data.components.bind.load;
data.components.main.unbind = data.components.bind.unbind;

/* Initiate listeners */
data.components.main.bind();

/* Load modification dates */
data.components.main.dates.load();

/* Reset filter input */
(document.body.querySelector(
	':scope > .filterContainer > input[type="text"]'
) as HTMLInputElement).value = '';

/* Create menu */
const menu = data.components.main.menu.create();

/* Get top bar height */
const height = (document.querySelector(
	'body > div.topBar'
) as HTMLDivElement).offsetHeight;

/* Set menu styling to match top bar */
if(menu && height)
{
	DOM.style.set(menu, {
		top : `${height}px`,
		visibility : 'unset',
		display : 'none'
	});
}

/* Load sorting indicators */
componentMain.sort.load();

/* Remove loading state */
document.body.removeAttribute('is-loading');

/* Listen to gallery `bound` event */
eventHooks.subscribe('galleryBound', 'mainUnbind', () =>
{
	/* Gallery is bound, unbind main event handlers */
	data.components.main.unbind();
});

/* Listen to gallery `unbound` event */
eventHooks.subscribe('galleryUnbound', 'mainBind', () =>
{
	/* Gallery is unbound, rebind main event handlers */
	data.components.main.bind();
});

log('main', 'Config loaded =>', config.data);