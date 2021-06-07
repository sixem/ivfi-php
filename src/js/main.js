/* import vendors */
import hoverPreview from './vendors/hover-preview/hover-preview';
import './vendors/modernizr/modernizr-mq';

/* import config */
import { config } from './config/config';
import { data } from './config/data';

/* import models */
import { eventHandler } from './modules/event-handler';

/* import classes */
import { optimizeClass } from './classes/optimize';

/* import components */
import { componentGallery } from './components/gallery/handler';
import { componentSettings } from './components/settings/handler';
import { componentFilter } from './components/filter/handler';
import { componentBind } from './components/bind/main';
import { componentMain } from './components/main/handler';

/* import helpers */
import * as h from './modules/helpers';

/* import stylesheets */
import '../css/style.css';

/* references */
const selector = data.instances.selector;
const pipe = data.instances.pipe;

/* set main component in data */
data.components.main = componentMain;

/* set page dom object */
data.layer.main = {
	windowHeight : window.innerHeight,
	windowWidth : window.innerWidth,
	scrolledY : window.scrollY,
	/**
 	* updates page data (dimensions etc.) - called on resize etc.
 	*/
	update : () =>
	{
		let table = selector.use('TABLE_CONTAINER');

		data.layer.main.windowHeight = window.innerHeight;
		data.layer.main.windowWidth = window.innerWidth;
		data.layer.main.scrolledY = window.scrollY;
		data.layer.main.tableWidth = table.offsetWidth;

		if(config.get('mobile'))
		{
			document.documentElement.style.setProperty('--table-width', `${data.layer.main.tableWidth}px`);
		} else {
			let root = document.documentElement;
			let isVerticalScrollbar = root.scrollHeight > root.clientHeight;

			document.documentElement.style.setProperty(
				'--table-width', !isVerticalScrollbar ? `${data.layer.main.tableWidth}px` : `calc(${data.layer.main.tableWidth}px + var(--scrollbar-width))`
			);
		}

		return true;
	}
};

/* update page values */
data.layer.main.update();

/* enable performance mode */
if(config.get('performance'))
{
	/* called on row change, updates index properties (for media indexing) */
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
	}

	setTimeout(() =>
	{
		requestAnimationFrame(() =>
		{
			/* create optimize instance */
			data.instances.optimize.main = new optimizeClass({
				page : data.layer.main,
				table : selector.use('TABLE'),
				scope : [window, 'scrollY'],
				padding : 10,
				on : {
					rowChange : onRowChange
				}
			});
		});
	}, 1);
}

/* menu click event */
eventHandler.addListener(selector.use('TOP_EXTEND'), 'click', 'sortClick', (e) =>
{
	data.components.main.menu.toggle(e.currentTarget);
});

/* filter change event */
eventHandler.addListener(selector.use('FILTER_INPUT'), 'input', 'filterInput', (e) =>
{
	data.components.filter.apply(e.currentTarget.value);
});

/* item click event (show gallery if enabled and table sort) */
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
			/* get `tr` parent */
			let parent = e.target.closest('tr');

			/* check for a index property, use as index if found */
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

/* recheck mobile sizing on resize */
eventHandler.addListener(window, 'resize', 'windowResize', h.debounce(() =>
{
	pipe('windowResize (main)', 'Resized.');

	config.set('mobile', Modernizr.mq('(max-width: 640px)'));

	if(data.instances.gallery)
	{
		(data.instances.gallery).options.mobile = config.get('mobile');
		(data.instances.gallery).update.listWidth();
	}

	/* update page values */
	data.layer.main.update();

	/* refresh performance rows */
	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
}));

/* create preview events if enabled (and not mobile) */
if(config.get('mobile') === false && config.get('preview.enabled') === true)
{
	let previews = new Object();

	let createPreview = (element) =>
	{
		let src = element.getAttribute('href');

		let extensions = config.get('extensions');

		let identified = h.identifyExtension(h.stripUrl(src), {
			image : extensions.image,
			video : extensions.video
		});

		if(identified)
		{
			let [extension, type] = identified;

			let options = new Object();

			/* delay prior to showing preview */
			options.delay = config.get('preview.hoverDelay');

			/* loading cursor */
			options.cursor = config.get('preview.cursorIndicator');

			/* encoding */
			options.encodeAll = config.get('encodeAll');

			/* force set extension data */
			options.force = {
				extension,
				type
			};

			/* create preview */
			previews[element.itemIndex] = hoverPreview(element, options);
		}
	};

	/* get previewable elements */
	let previewable = document.querySelectorAll('body > div.table-container > table tr.file > td > a.preview');

	/* set preview indexes */
	previewable.forEach((preview, index) =>
	{
		preview.itemIndex = index;

		if(index === 0)
		{
			createPreview(preview);
		}
	});

	/* add preview hover listener */
	eventHandler.addListener(selector.use('TABLE'), 'mouseover', 'previewMouseEnter', (e) =>
	{
		/* check if element is `a` element with a preview class */
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

/* create gallery component instance */
data.components.settings = new componentSettings();

/* set filter component */
data.components.filter = componentFilter;

/* create gallery component instance */
data.components.gallery = new componentGallery();

/* create bind component instance */
data.components.bind = new componentBind();

/* store bind functions to main */
data.components.main.bind = data.components.bind.load;
data.components.main.unbind = data.components.bind.unbind;

/* initiate listeners */
data.components.main.bind();

/* load modification dates */
data.components.main.dates.load();

/* reset filter input */
document.body.querySelector(':scope > .filter-container > input[type="text"]').value = '';

/* create menu */
let menu = data.components.main.menu.create();

/* get top bar height */
let height = document.querySelector('body > div.top-bar').offsetHeight;

/* set menu styling to match top bar */
if(menu && height)
{
	h.dom.css.set(menu, {
		top : `${height}px`,
		visibility : 'unset',
		display : 'none'
	});
}

/* load sorting indicators */
componentMain.sort.load();

/* remove loading state */
document.body.removeAttribute('is-loading');

pipe('Config', config.data);