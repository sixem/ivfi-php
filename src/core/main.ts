/** Vendors */
import './vendors/swiped-events';
import hoverPreview from './vendors/hover-preview/hover-preview';
/** Config */
import { config, user } from './config/config';
import data from './config/data';
/** Modules */
import { log } from './modules/logger';
import { eventHooks } from './modules/event-hooks';
import { disposePage, onPageReplace } from './modules/lifecycle';
import { playVideo } from './helpers/media';
import { createOverlayScrollbar } from './modules/scrollbar';
import { createRowSelection } from './modules/row-selection';
import { createTooltip } from './modules/tooltip';
import { createToast } from './modules/toast';
import { bindTableContextMenu } from './components/main/context-menu';
import { bindSelectionSummary } from './components/main/selection-summary';
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
	debounce,
	setVideoVolume,
	identifyExtension,
	stripUrl
} from './helpers';

/** Types */
import {
	ITableRowMI,
	TOnPreviewLoad,
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

componentMain.selection = createRowSelection(selector.use('TABLE') as HTMLElement, () =>
{
	const optimizer = data.instances.optimize.main;
	return optimizer.enabled ? optimizer.rows : Array.from((selector.use('TABLE') as HTMLElement).querySelectorAll<HTMLElement>('tbody > tr'));
}, config.get('selection.enabled') !== false);

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
		const topBar = document.body.querySelector(':scope > div.topBar') as HTMLElement;
		document.documentElement.style.setProperty('--topbar-height', `${topBar.offsetHeight}px`);

		data.layer.main.windowHeight = window.innerHeight;
		data.layer.main.windowWidth = window.innerWidth;
		data.layer.main.scrolledY = window.scrollY;
		data.layer.main.tableWidth = table.offsetWidth;

		return true;
	}
};

createOverlayScrollbar(window, {
	label: 'Page scroll position',
	header: document.body.querySelector(':scope > div.topBar')
});

/* Account for the scrollbar width change */
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

	const table = selector.use('TABLE') as HTMLElement;
	setTimeout(() =>
	{
		requestAnimationFrame((): void =>
		{
			if(!table.isConnected) return;
			const optimizer = new optimizeClass({
				page: data.layer.main,
				table,
				scope: [window, 'scrollY'],
				padding: 0, /* Top padding offset */
				on: {
					rowChange: onRowChange
				}
			});
			data.instances.optimize.main = optimizer;
			onPageReplace(() => optimizer.destroy());
		});
	}, 1);
}

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
	let resume = null;
	let cancelReveal: (() => void) = null;

	const onLoaded = (event: TOnPreviewLoad) =>
	{
		log('preview', 'Preview loaded =>', event);

		cancelReveal?.();

		const [element, type, src] = [
			event.element,
			event.type,
			event.src
		];

		data.preview.data = event;

		if(element && type === 'VIDEO')
		{
			/* If a resume is set, then set currentTime */
			if(resume && resume.src === src)
			{
				(element as HTMLVideoElement).currentTime = resume.timestamp;
			} else {
				resume = null;
			}

			const video = element as HTMLVideoElement;
			const reveal = () =>
			{
				if(video.readyState < 2 || video.seeking || data.preview.data?.element !== video) return;
				video.style.visibility = 'visible';
				cancelReveal?.();
			};
			cancelReveal = () =>
			{
				video.removeEventListener('loadeddata', reveal);
				video.removeEventListener('seeked', reveal);
				cancelReveal = null;
			};
			video.addEventListener('loadeddata', reveal);
			video.addEventListener('seeked', reveal);
			setVideoVolume(video, data.preview.volume / 100, false);
			void playVideo(video, true, () => data.preview.data?.element === video);
			reveal();
		} else {
			/* Not a video, clear resume */
			resume = null;
		}

		/* Store timestamp if exists */
		if(typeof event.timestamp === 'number')
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

	const extensions: TExtensionArray = config.get('extensions');
	const preview = hoverPreview(selector.use('TABLE') as HTMLElement, {
		available: () => data.preview.isLoadable && document.hasFocus() && !document.hidden
			&& !document.documentElement.hasAttribute('gallery-is-visible'),
		delay: config.get('preview.hoverDelay'),
		cursor: config.get('preview.cursorIndicator'),
		encodeAll: config.get('encodeAll'),
		resolve: element =>
		{
			const identified = identifyExtension(stripUrl(element.getAttribute('href')), extensions);
			return identified ? { extension: identified[0], type: identified[1] } : null;
		},
		on: { onLoaded }
	});
	data.preview.takeVideo = (src, parent) => preview.takeVideo(src, parent);

	const hidePreview = () => preview.hide(true);
	const onVisibility = () => { if(document.hidden) hidePreview(); };
	window.addEventListener('blur', hidePreview);
	window.addEventListener('pagehide', hidePreview);
	document.addEventListener('visibilitychange', onVisibility);
	eventHooks.subscribe('galleryOpen', 'hidePreview', hidePreview);
	onPageReplace(() =>
	{
		preview.destroy();
		data.preview.takeVideo = null;
		cancelReveal?.();
		window.removeEventListener('blur', hidePreview);
		window.removeEventListener('pagehide', hidePreview);
		document.removeEventListener('visibilitychange', onVisibility);
		eventHooks.unsubscribe('galleryOpen', 'hidePreview');
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
					disposePage();
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

/* Create toolbar actions */
data.components.main.toolbar.create();

createTooltip();
createToast();
bindTableContextMenu(selector.use('TABLE') as HTMLElement, componentMain.selection);
bindSelectionSummary(componentMain.selection);

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
