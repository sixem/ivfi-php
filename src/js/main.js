/* import vendors */
import cookies from 'js-cookie';
import hoverPreview from './vendors/hover-preview';
import { formatDate } from './vendors/date';
import './vendors/modernizr-mq';

/* import config */
import { config, user } from './config/config';
import { code } from './config/constants';
import { data } from './config/data';

/* import models */
import { eventHandler } from './modules/event-handler';

/* import classes */
import { optimizeClass } from './classes/optimize';

/* import components */
import { componentGallery } from './components/gallery/handler';
import { componentSettings } from './components/settings/handler';
import { componentBind } from './components/bind/main';

/* import helpers */
import * as h from './helpers/helpers';

/* import stylesheets */
import '../css/style.css';

/* shorten used frequently */
const dom = h.dom;
const selector = data.instances.selector;
const pipe = data.instances.pipe;

/* declare optimize variable */
let optimize = {
	enabled : false
};

/* page dom data */
const page = {
	windowHeight : window.innerHeight,
	windowWidth : window.innerWidth,
	scrolledY : window.scrollY,
	/**
 	* updates page data (dimensions etc.) - called on resize etc.
 	*/
	update : () =>
	{
		let table = selector.use('TABLE_CONTAINER');

		page.windowHeight = window.innerHeight;
		page.windowWidth = window.innerWidth;
		page.scrolledY = window.scrollY;
		page.tableWidth = table.offsetWidth;

		if(config.get('mobile'))
		{
			document.documentElement.style.setProperty('--table-width', `${page.tableWidth}px`);
		} else {
			let root = document.documentElement;
			let isVerticalScrollbar = root.scrollHeight > root.clientHeight;

			document.documentElement.style.setProperty(
				'--table-width', !isVerticalScrollbar ? `${page.tableWidth}px` : `calc(${page.tableWidth}px + var(--scrollbar-width))`
			);
		}

		return true;
	}
};

data.layer.main = page;

/* update page values */
page.update();

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

	/* create optimize instance */
	optimize = new optimizeClass({
		page : page,
		table : selector.use('TABLE'),
		scope : [window, 'scrollY'],
		padding : 10,
		on : {
			rowChange : onRowChange
		}
	});
}

/**
 * filter functions
 */
const filter = {
	/**
 	* applies a filter
 	*/
	apply : (query = new String()) =>
	{
		let _ = new Object();
		let error = false;

		data.sets.refresh = true;

		_.reset = query === new String() || !query;
		_.shown = { directories : 0, files : 0 };
		_.size = 0;

		if(data.instances.gallery)
		{
			data.instances.gallery.data.selected.index = 0;
		}

		/* check if directory sizes are enabled */
		let directorySizes = (
			Object.prototype.hasOwnProperty.call(
				config.get('sorting'),
				'directorySizes'
			) &&
			config.get('sorting.directorySizes')
		);

		let rows = optimize.enabled ? 
			optimize.rows :
			selector.use('TABLE').querySelectorAll('tbody > tr');

		/* iterate over rows, search for query */
		for(let i = 1; i < rows.length; i++)
		{
			let item = rows[i];

			if(_.reset === true)
			{
				item.classList.remove('filtered');

				if(optimize.enabled)
				{
					optimize.setVisibleFlag(item, true);
				}

				break;
			}

			let is = {
				file : item.classList.contains('file'),
				directory : item.classList.contains('directory')
			};

			let match = filter.getMatch(item.children[0].getAttribute('data-raw'), query);

			if(match.valid && match.data)
			{
				item.classList.remove('filtered');

				if(optimize.enabled)
				{
					optimize.setVisibleFlag(item, true);					
				}

				if(is.file)
				{
					_.shown.files++;

				} else if(is.directory)
				{
					_.shown.directories++;
				}

			} else if(match && match.valid === false)
			{
				error = match.reason;

			} else {
				item.classList.add('filtered');

				if(optimize.enabled)
				{
					optimize.setVisibleFlag(item, false);
				}
			}

			/* add size to total */
			if((match.valid && match.data && is.file) ||
				(directorySizes && match.valid && match.data && is.directory))
			{
				let size = item.children[2].getAttribute('data-raw');
				_.size = !isNaN(size) ? (_.size + parseInt(size)) : _.size;
			}
		}

		/* set parent class so that we can hide all - .filtered -> .filtered */
		if(_.reset)
		{
			selector.use('TABLE_CONTAINER').removeAttribute('is-active-filter', '');
		} else {
			selector.use('TABLE_CONTAINER').setAttribute('is-active-filter', '');

			/* scroll to top on search */
			window.scrollTo(0, 0);
		}

		if(optimize.enabled)
		{
			/* call optimization refactoring */
			optimize.refactor();
		}

		let top = {
			container : document.body.querySelector(':scope > div.top-bar')
		};

		(['size', 'files', 'directories']).forEach((key) =>
		{
			top[key] = top.container.querySelector(`[data-count="${key}"]`);
		});

		if(!Object.prototype.hasOwnProperty.call(data.sets.defaults, 'topValues'))
		{
			data.sets.defaults.topValues = {
				size : top.size.textContent,
				files : top.files.textContent,
				directories : top.directories.textContent
			};
		}

		top.size.textContent =
			(_.reset) ? data.sets.defaults.topValues.size : 
			h.getReadableSize(config.get('format.sizes'), _.size);

		top.files.textContent =
			(_.reset) ? data.sets.defaults.topValues.files : 
			`${_.shown.files} file${_.shown.files === 1 ? '' : 's'}`;

		top.directories.textContent =
			(_.reset) ? data.sets.defaults.topValues.directories : 
			`${_.shown.directories} ${_.shown.directories === 1 ? 'directory' : 'directories'}`;

		let option = document.body.querySelector(':scope > div.menu > #gallery');

		let previews = selector.use('TABLE_CONTAINER')
			.querySelectorAll('table tr.file:not(.filtered) a.preview').length;

		if(error !== false)
		{
			console.error(`Filter regex error: ${error}`);
		}

		/* hide or show the gallery menu option */
		if(!_.reset && previews === 0 && option)
		{
			if(option.style.display !== 'none')
			{
				option.style.display = 'none';
			}
		} else if((previews > 0 || _.reset) && option)
		{
			if(option.style.display === 'none')
			{
				option.style.display = 'block';
			}
		}
	},
	getMatch : (input, query) =>
	{
		let match = new Object();

		try
		{
			match.valid = true;

			match.data = (input).match(new RegExp(query, 'i'));

		} catch(error) {

			match.valid = false;

			match.reason = error;
		}

		return match;
	},
	toggle : () =>
	{
		let container = document.body.querySelector(':scope > div.filter-container');

		let input = container.querySelector('input[type="text"]');

		if(container.style.display !== 'none')
		{
			container.style.display = 'none';
		} else {
			input.value = new String();

			filter.apply(null);

			container.style.display = 'block';
		}

		input.focus();
	}
};

const main = {
	/**
 	* menu functions
 	*/
	menu : {
		/**
 		* creates the menu
 		*/
		create : () =>
		{
			let container = dom.new('div', {
				class : 'menu'
			});

			selector.use('BODY').append(container);

			let items = new Array();

			items.push({
				text : data.text.menuLabels.filter.text,
				id : 'filter'
			});

			items.push({
				text : data.text.menuLabels.wget.text,
				id : 'copy'
			});

			/* add menu item if gallery is enabled */
			if(config.get('gallery.enabled') === true &&
				selector.use('TABLE').querySelectorAll(':scope > tbody > tr.file > td > a.preview').length > 0)
			{
				items.unshift({
					text : data.text.menuLabels.gallery.text,
					id : 'gallery'
				});
			}

			/* do a light check to see if any settings are available to be changed, if so, add menu item */
			if(components.settings.available())
			{
				items.unshift({
					text : data.text.menuLabels.settings.text,
					id : 'settings',
					class : 'settings'
				});
			}

			items.forEach((item) =>
			{
				let element = dom.new('div', {
					text : item.text,
					class : `ns${item.hasOwnProperty('class') ? ` ${item.class}` : ''}`
				});

				if(item.hasOwnProperty('id'))
				{
					element.setAttribute('id', item.id);
				}

				container.append(element);
			});

			/* event delegation */
			eventHandler.addListener(container, 'click', 'menuItemClick', (e) =>
			{
				if(e.target.tagName == 'DIV')
				{
					let toggle = (state, f) =>
					{
						if(!state)
						{
							main.menu.toggle();
						} else {
							main.menu.toggle(state);
						}

						f();
					};

					if(e.target.id == 'gallery' && config.get('gallery.enabled') === true)
					{
						toggle(false, () => components.gallery.load(null));

					} else if(e.target.id == 'copy')
					{
						toggle(false, () => h.clipboard.copy(
							h.generateWget(selector.use('TABLE'))
						));

					} else if(e.target.id == 'settings')
					{
						toggle(false, () => components.settings.show());

					} else if(e.target.id == 'filter')
					{
						toggle(null, () => main.menu.toggle());

					}
				}
			});

			return container;
		},
		/**
 		* toggle menu visibility
 		*/
		toggle : (state = null) =>
		{
			let menu = document.querySelector('body > div.menu');

			let isHidden = (menu.style.display === 'none');

			let display = typeof state === 'boolean' ?
				(state ? 'inline-block' : 'none') :
				(isHidden ? 'inline-block' : 'none');

			dom.css.set(menu, {
				display
			});

			selector.use('TOP_EXTEND').innerHTML = (isHidden ? '&#x25B4;' : '&#x25BE;');

			return isHidden;
		}
	},
	dates : {
		/**
 		* gets client timezone offset and sets hover timestamps
 		*/
		load : () =>
		{
			/* get utc offset of client */
			let offsetGet = () => (new Date()).getTimezoneOffset();

			let formatSince = (seconds) =>
			{
				/**
 				* formats seconds to an 'ago' string
 				* example: formatSince(3720); returns 1 hour and 2 minutes ago
 				*/

				if(seconds === 0)
				{
					return 'Now';

				} else if(seconds < 0)
				{
					return false;
				}

				let t = {
					'year' : 31556926,
					'month' : 2629743,
					'week' : 604800,
					'day' : 86000,
					'hour' : 3600,
					'minute' : 60,
					'second' : 1
				};

				let keys = Object.keys(t);
				let count = (keys.length - 1), value = false;

				for(let index = 0; index < keys.length; index++)
				{
					let key = keys[index]; if(seconds <= t[key]) continue;

					let n = count >= (index+1) ? keys[(index+1)] : null;
					let	f = Math.floor(seconds / t[key]);
					let	s = n ? Math.floor((seconds - (f * t[key])) / t[n]) : 0;

					value = `${f} ${key}${f == 1 ? '' : 's'}` + (s > 0 ? (` and ${s} ${n}${s == 1 ? '' : 's'}`) : '') + ' ago';

					break;
				}

				return value;
			};

			let onLoadTimestamp = config.get('timestamp');
			let dateFormat = config.get('format.date');

			let apply = (offset, format = true) =>
			{
				selector.use('TABLE')
				.querySelectorAll('tr.directory > td:nth-child(2), \
					tr.file > td[data-raw]:nth-child(2)')
				.forEach((item, index) =>
				{
					let timestamp = parseInt(item.getAttribute('data-raw'));

					let	since = formatSince(onLoadTimestamp - timestamp);

					let	span = (format === true ? dom.new('span') : item.querySelector(':scope > span'));

					/* update the date formats if the offset has been changed or set for the first time */
					if(format === true)
					{
						(dateFormat).forEach((f, index) =>
						{
							if(index <= 1)
							{
								let element = dom.new('span', {
									text : formatDate(f, timestamp)
								});

								if(config.get('format.date').length > 1)
								{
									element.setAttribute('data-view', index === 0 ? 'desktop' : 'mobile')
								}

								span.appendChild(element);
							}
						});

						item.innerHTML = span;
					}

					if(since)
					{
						span.setAttribute('title', `${since} (UTC${(offset.hours > 0 ? '+' : '') + offset.hours})`);
					}
				});

				document.body.querySelectorAll('div.top-bar > .directory-info div[data-count="files"], \
					div.top-bar > .directory-info div[data-count="directories"]')
				.forEach((item, index) =>
				{
					if(item.hasAttribute('data-raw'))
					{
						item.setAttribute('title', 'Newest: ' + formatDate(dateFormat[0], parseInt(item.getAttribute('data-raw'))))
					}
				});
			};

			let offset = offsetGet();
			let	client = user.get();
			let	update = client.timezone_offset != offset;

			/* only update if offset is changed or unset */
			if(update)
			{
				client.timezone_offset = offset;
				user.set(client);
			}

			offset = {
				minutes : (offset > 0 ? -Math.abs(offset) : Math.abs(offset))
			};

			offset.hours = (offset.minutes / 60);
			offset.seconds = (offset.minutes * 60);

			apply(offset, update);
		}
	},
	sort : {
		load : () =>
		{
			if(config.exists('sorting') && config.get('sorting.enabled'))
			{
				let sortingTypes = config.get('sorting.types');

				if(sortingTypes === 0 || sortingTypes === 1)
				{
					let asc = (config.get('sorting.order') === 'asc' ? true : false);

					let index = null;

					switch(config.get('sorting.sortBy'))
					{
						case 'name':
							index = 0;
							break;

						case 'modified':
							index = 1;
							break;

						case 'size':
							index = 2;
							break;

						case 'type':
							index = 3;
							break;

						default:
							index = null;
					}

					if(index !== null)
					{
						let th = (document.querySelectorAll('table th span[sortable]'))[index].closest('th');

						if(th)
						{
							th.asc = asc;

							let indicator = th.querySelector(':scope > span.sort-indicator');

							if(indicator)
							{
								indicator.classList.add(asc ? 'down' : 'up', 'visible');
							}
						}
					}
				}
			}
		}
	},
	overlay : {
		/**
 		* hides any overlays visible overlays (menu, filter)
 		*/
		hide : (callback = () => new Object()) =>
		{
			let i = 0;

			let data = new Array();

			data.push({
				element : document.body.querySelector(':scope > div.filter-container'),
				f : filter.toggle
			});

			data.push({
				element : document.body.querySelector(':scope > div.menu'),
				f : main.menu.toggle
			});

			data.forEach((obj) =>
			{
				if(obj.element && obj.element.style.display !== 'none')
				{
					obj.f();

					i++;
				}
			});

			callback(i > 0);
		}
	},
	/**
 	* retrieves the items contained in the table and parses the data
 	*/
	getTableItems : () =>
	{
		let items = new Array();

		if(optimize.enabled)
		{
			let [activeRows, activeIndexes] = optimize.getActiveData();

			for(let i = 0; i < activeRows.length; i++)
			{
				if(i === 0)
				{
					continue;
				}

				let row = activeRows[i];

				let a = row.children[0].children[0];

				if(a.classList.contains('preview'))
				{
					items.push({
						url : a.getAttribute('href'),
						name : row.children[0].getAttribute('data-raw'),
						size : row.children[2].textContent
					});
				}
			}
		} else {
			let previews = selector.use('TABLE')
				.querySelectorAll(':scope > tbody > tr.file:not(.filtered) > td:first-child > a.preview');

			(previews).forEach((element) =>
			{
				let parent = element.parentNode;
				let container = (parent).parentNode;

				let url = element.getAttribute('href');

				if(typeof url !== 'undefined')
				{
					items.push({
						url : url,
						name : parent.getAttribute('data-raw'),
						size : container.querySelector('td:nth-child(3)').innerHTML
					});
				}
			});
		}

		return items;
	},
	events : {
	 	/**
 	 	* sorts a table column (toggle asc/desc)
 	 	*/
		sortTableColumn : (target) =>
		{
			let parent = target.closest('th');

			let	column = !(target.tagName === 'TH') ? parent : target;

			let columnIndex = dom.getIndex(column);

			let rows = {
				directories : Array.from(selector.use('TABLE').querySelectorAll('tbody > tr.directory')),
				files : Array.from(selector.use('TABLE').querySelectorAll('tbody > tr.file'))
			};

			/* set a skip directory var if we're only sorting sizes or types
			 * they should be unaffected by these unless directory sizes are enabled. */
			let skipDirectories = !(Object.prototype.hasOwnProperty.call(config.get('sorting'), 'directorySizes')
				&& config.get('sorting.directorySizes')) &&
			(config.exists('sorting.sortBy')
				&& (columnIndex === 2 || columnIndex === 3));

			if(optimize.enabled)
			{
				optimize.sortRows(columnIndex, !column.asc ? 'asc' : 'desc');
			} else {
				let sortingTypes = config.get('sorting.types');

				if(sortingTypes === 0 || sortingTypes === 2)
				{
					if(!skipDirectories)
					{
						rows.directories.sort(h.comparer(columnIndex));
					}
				}

				if(sortingTypes === 0 || sortingTypes === 1)
				{
					rows.files.sort(h.comparer(columnIndex));
				}
			}

			column.asc = !column.asc;

			document.body.querySelectorAll(':scope > div.table-container > table > \
				thead > tr > th span.sort-indicator').forEach((indicator) =>
			{
				indicator.classList.remove('up', 'down', 'visible');
			});

			parent.querySelector(':scope > span.sort-indicator').classList.add(column.asc ? 'down' : 'up', 'visible');

			let client = user.get();

			client.sort.ascending = (column.asc ? 1 : 0);
			client.sort.row = columnIndex;

			user.set(client);

			if(!optimize.enabled)
			{
				if(!column.asc)
				{
					let sortingTypes = config.get('sorting.types');

					if(sortingTypes === 0 || sortingTypes === 2)
					{
						if(!skipDirectories)
						{
							rows.directories = rows.directories.reverse();
						}
					}

					if(sortingTypes === 0 || sortingTypes === 1)
					{
						rows.files = rows.files.reverse();
					}
				}

				let tableBody = selector.use('TABLE').querySelector('tbody');

				Object.keys(rows).forEach((key) =>
				{
					rows[key].forEach((item) =>
					{
						tableBody.append(item);
					})
				});
			}

			data.sets.refresh = true;

			data.sets.selected = null;
		}
	},
};

/* menu click event */
eventHandler.addListener(selector.use('TOP_EXTEND'), 'click', 'sortClick', (e) =>
{
	main.menu.toggle(e.currentTarget);
});

/* filter change event */
eventHandler.addListener(selector.use('FILTER_INPUT'), 'input', 'filterInput', (e) =>
{
	filter.apply(e.currentTarget.value);
});

/* item click event (show gallery if enabled and table sort) */
eventHandler.addListener(selector.use('TABLE'), 'click', 'sortClick', (e) =>
{
	if(e.target.tagName == 'SPAN' && e.target.hasAttribute('sortable'))
	{
		main.events.sortTableColumn(e.target);

	} else if(config.get('gallery.enabled') === true && e.target.tagName == 'A' && e.target.className == 'preview')
	{
		e.preventDefault();

		let index = 0;

		if(optimize.enabled)
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

		components.gallery.load(index);
	}
});

/* recheck mobile sizing on resize */
eventHandler.addListener(window, 'resize', 'windowResize', h.debounce(() =>
{
	pipe('Resized.');

	config.set('mobile', Modernizr.mq('(max-width: 640px)'));

	if(data.instances.gallery)
	{
		(data.instances.gallery).options.mobile = config.get('mobile');
		(data.instances.gallery).update.listWidth();
	}

	/* update page values */
	page.update();

	/* refresh performance rows */
	if(optimize.enabled)
	{
		optimize.attemptRefresh();
	}
}));

/* create preview events if enabled (and not mobile) */
if(config.get('mobile') === false && config.get('preview.enabled') === true)
{
	let previews = new Object();

	let createPreview = (element) =>
	{
		let src = element.getAttribute('href');

		let identified = h.identifyExtension(h.stripUrl(src), {
			image : config.get('extensions.image'),
			video : config.get('extensions.video')
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

/* initiate components */
const components = new Object();

/* create gallery component instance */
components.gallery = new componentGallery({
	main : main
});

/* create bind component instance */
components.bind = new componentBind({
	filter, optimize,
	overlay : main.overlay,
	menu : main.menu,
	components : {
		gallery : components.gallery,
		page : page
	}
});

/* create gallery component instance */
components.settings = new componentSettings();

/* store bind functions to main */
main.bind = components.bind.load;
main.unbind = components.bind.unbind;

data.components = components;

/* initiate listeners */
main.bind();

/* load modification dates */
main.dates.load();

/* reset filter input */
document.body.querySelector(':scope > .filter-container > input[type="text"]').value = '';

/* create menu */
let menu = main.menu.create();

/* get top bar height */
let height = document.querySelector('body > div.top-bar').offsetHeight;

/* set menu styling to match top bar */
if(menu && height)
{
	dom.css.set(menu, {
		top : `${height}px`,
		visibility : 'unset',
		display : 'none'
	});
}

/* load sorting indicators */
main.sort.load();

/* remove loading state */
document.body.removeAttribute('is-loading');

pipe('Config', config.data);