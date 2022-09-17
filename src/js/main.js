/** Import `hoverPreview` */
import hoverPreview from './vendors/hover-preview/hover-preview';

/** Import `config` */
import { config } from './config/config';

/** Import `data` */
import data from './config/data';

/** Import `eventHandler` */
import eventHandler from './modules/event-handler';

/** Import `eventHooks` */
import eventHooks from './modules/event-hooks';

/** Import `optimizeClass` */
import optimizeClass from './classes/optimize';

/** Import `optimizeClass` */
import componentGallery from './components/gallery';

/** Import `componentSettings` */
import componentSettings from './components/settings';

/** Import `componentFilter` */
import componentFilter from './components/filter';

/** Import `componentBind` */
import componentBind from './components/bind';

/** Import `componentMain` */
import componentMain from './components/';

/** Import `helpers.*` */
import * as helpers from './modules/helpers';

/** Import stylesheets */
import '../css/root.scss';
import '../css/fonts.scss';
import '../css/main.scss';

/* References */
const selector = data.instances.selector,
	pipe = data.instances.pipe;

/* Disable media play */
try
{
	navigator.mediaSession.setActionHandler('play', () => {});
} catch(error)
{
	pipe(error);
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
		let table = selector.use('TABLE_CONTAINER');

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
	let onRowChange = (rows) =>
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
		requestAnimationFrame(() =>
		{
			/* Create optimize instance */
			data.instances.optimize.main = new optimizeClass({
				page : data.layer.main,
				table : selector.use('TABLE'),
				scope : [window, 'scrollY'],
				padding : 10,
				on : {
					rowChange: onRowChange
				}
			});
		});
	}, 1);
}

/* Menu click event */
eventHandler.addListener(selector.use('TOP_EXTEND'), 'click', 'sortClick', (e) =>
{
	data.components.main.menu.toggle(e.currentTarget);
});

/* Filter change event */
eventHandler.addListener(selector.use('FILTER_INPUT'), 'input', 'filterInput', (e) =>
{
	data.components.filter.apply(e.currentTarget.value);
});

/* Item click event (show gallery if enabled and table sort) */
eventHandler.addListener(selector.use('TABLE'), 'click', 'sortClick', (e) =>
{
	if(e.target.tagName == 'SPAN' && e.target.hasAttribute('sortable'))
	{
		data.components.main.sortTableColumn(e.target);

	} else if(config.get('gallery.enabled') === true && e.target.tagName == 'A' && e.target.className == 'preview')
	{
		e.preventDefault();

		let index = 0;

		if(data.instances.optimize.main.enabled)
		{
			/* Get `tr` parent */
			let parent = e.target.closest('tr');

			/* Check for a index property, use as index if found */
			if(parent._mediaIndex)
			{
				index = parent._mediaIndex;
			}

		} else {
			selector.use('TABLE').querySelectorAll('tr.file:not(.filtered) a.preview').forEach((element, i) =>
			{
				if(e.target === element)
				{
					index = i;
				}
			});
		}

		data.components.gallery.load(index);
	}
});

/* Recheck mobile sizing on resize */
eventHandler.addListener(window, 'resize', 'windowResize', helpers.debounce(() =>
{
	pipe('windowResize (main)', 'Resized.');

	config.set('mobile', Modernizr.mq('(max-width: 640px)'));

	if(data.instances.gallery)
	{
		(data.instances.gallery).options.mobile = config.get('mobile');
		(data.instances.gallery).update.listWidth();
	}

	/* Update page values */
	data.layer.main.update();

	/* Refresh performance rows */
	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
}));

/* Create preview events if enabled (and not on mobile) */
if(config.get('mobile') === false && config.get('preview.enabled') === true)
{
	let previews = {},
		resume = null,
		timerReadyState = null;

	let onLoaded = (e) =>
	{
		pipe('previewLoad', e);

		if(data.preview.data && data.preview.data.element)
		{
			data.preview.data.element.remove();
		}

		if(!data.preview.isLoadable)
		{
			return null;
		}

		let [element, type, src] = [e.element, e.type, e.src];

		data.preview.data = e;

		/* Clear timer */
		clearInterval(timerReadyState);

		if(element && type === 'VIDEO')
		{
			/* If a resume is set, then set currentTime */
			if(resume && resume.src === src)
			{
				element.currentTime = resume.timestamp;
			} else {
				resume = null;
			}

			/* Set stored preview volume */
			helpers.setVideoVolume(element, data.preview.volume / 100, false);

			/* Check for valid readystate (4, 3, 2) before we show the video */
			timerReadyState = setInterval(() =>
			{
				if(element.readyState > 1)
				{
					/* Show video */
					helpers.DOM.css.set(element, {
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
		if(Object.prototype.hasOwnProperty.call(e, 'timestamp'))
		{
			let timestamp = e.timestamp;

			resume = {
				src,
				timestamp
			};
		}

		/* If video is audible, enable scrollLock */
		if(e.loaded && e.audible)
		{
			data.scrollLock = true;
		} else {
			data.scrollLock = false;
		}
	};

	let createPreview = (element) =>
	{
		let src = element.getAttribute('href'),
			extensions = config.get('extensions'),
			identified = helpers.identifyExtension(helpers.stripUrl(src), {
				image : extensions.image,
				video : extensions.video
			});

		if(identified)
		{
			let [extension, type] = identified,
				options = {};

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
	let previewable = document.querySelectorAll('body > div.tableContainer > table > tbody > tr.file > td > a.preview');

	/* Set preview indexes */
	previewable.forEach((preview, index) =>
	{
		preview.itemIndex = index;

		if(index === 0)
		{
			createPreview(preview);
		}
	});

	/* Add preview hover listener */
	eventHandler.addListener(selector.use('TABLE'), 'mouseover', 'previewMouseEnter', (e) =>
	{
		/* Check if element is `a` element with a preview class */
		if(e.target.tagName == 'A' && e.target.className == 'preview')
		{
			let index = (e.target.itemIndex);

			if(!Object.prototype.hasOwnProperty.call(previews, index))
			{
				createPreview(e.target);
			}
		}
	});
}

if(config.get('singlePage'))
{
	const pageNavigate = (location) =>
	{
		/* Get location data */
		let windowProtocol = window.location.protocol,
			windowHostName = window.location.hostname,
			windowSubPath = location.replace(/([^:]\/)\/+/g, '$1').replace(/^\/|\/$/g, '');

		/* Construct upcoming title and URL */
		let nextLocation = `${windowProtocol}//${windowHostName}/${windowSubPath ? windowSubPath + '/' : ''}`,
			nextTitle = config.get('format').title.replace('%s', `/${windowSubPath}/`);

		/* Create POST body */
		let postData = Object.entries({
			navigateType: 'dynamic'
		}).map((([key, value], index) => `${index > 0 ? '&' : ''}${key}=${value}`)).join('');

		/* Avoid any new previews */
		data.preview.isLoadable = false;

		/* Create spinner */
		let indicator = document.createElement('div');
		indicator.classList.add('navigateLoad');
		document.body.prepend(indicator);
		setTimeout(() => indicator.style.opacity = 1 , 10);

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
			if(response.headers.get('navigateType') === 'dynamic')
			{
				pipe('Valid header. Navigating pages ..');
				
				response.text().then((content) =>
				{
					/* Update URL */
					window.history.pushState({
						path: '/' + windowSubPath
					}, nextTitle, nextLocation);
	
					/* Write changes to document */
					document.open();
					document.write(content);
					document.close();

					window.scrollTo({
						top: 0,
						behavior: 'smooth'
					});
				});
			} else {
				/* Incorrect document type - fallback to normal redirection */
				window.location.replace(nextLocation);
			}
		}).catch(() =>
		{
			/* Fallback to a normal redirection */
			window.location.replace(nextLocation);
		});
	};

	eventHooks.subscribe(selector.use('TABLE'), 'click', 'tableClick', (e) =>
	{
		if(e.target.tagName == 'A')
		{
			let parent = e.target.closest('tr');
	
			if(parent &&
				(parent.classList.contains('directory') || parent.classList.contains('parent')))
			{
				e.preventDefault();

				pageNavigate(e.target.getAttribute('href'));
			}
		}
	});

	let quickPath = document.body.querySelector(':scope > div.topBar > div.directoryInfo'),
		topBar = document.body.querySelector(':scope > div.path');

	eventHooks.subscribe(quickPath, 'click', 'quickPathClick', (e) =>
	{
		if(e.target.tagName == 'A')
		{
			let parent = e.target.parentNode;

			if(parent && parent.classList.contains('quickPath'))
			{
				e.preventDefault();

				pageNavigate(e.target.getAttribute('href'));
			}
		}
	});

	eventHooks.subscribe(topBar, 'click', 'pathClick', (e) =>
	{
		if(e.target.tagName == 'A')
		{
			e.preventDefault();

			pageNavigate(e.target.getAttribute('href'));
		}
	});
}

/* Assign components */
data.components.settings = new componentSettings();
data.components.gallery = new componentGallery();
data.components.bind = new componentBind();
data.components.filter = componentFilter;

/* Create references for bind functions*/
data.components.main.bind = data.components.bind.load;
data.components.main.unbind = data.components.bind.unbind;

/* Initiate listeners */
data.components.main.bind();

/* Load modification dates */
data.components.main.dates.load();

/* Reset filter input */
document.body.querySelector(':scope > .filterContainer > input[type="text"]').value = '';

/* Create menu */
let menu = data.components.main.menu.create();

/* Get top bar height */
let height = document.querySelector('body > div.topBar').offsetHeight;

/* Set menu styling to match top bar */
if(menu && height)
{
	helpers.DOM.css.set(menu, {
		top : `${height}px`,
		visibility : 'unset',
		display : 'none'
	});
}

/* Load sorting indicators */
componentMain.sort.load();

/* Remove loading state */
document.body.removeAttribute('is-loading');

pipe('Config', config.data);