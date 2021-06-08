/* import vendors */
import { formatDate } from '../../vendors/date/date';

/* import config */
import { config, user } from '../../config/config';
import { data } from '../../config/data';

/* import models */
import { eventHandler } from '../../modules/event-handler';

/* import helpers */
import * as h from '../../modules/helpers';

/* references */
const selector = data.instances.selector;
const dom = h.dom;

/* create main object */
const main = new Object();

/* create menu object */
main.menu = new Object();

main.menu.create = () =>
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
		selector.use('TABLE').querySelectorAll(':scope > tbody > \
			tr.file > td > a.preview').length > 0)
	{
		items.unshift({
			text : data.text.menuLabels.gallery.text,
			id : 'gallery'
		});
	}

	/* do a light check to see if any settings are available to be changed, if so, add menu item */
	if(data.components.settings.available())
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
				toggle(false, () => data.components.gallery.load(null));

			} else if(e.target.id == 'copy')
			{
				toggle(false, () => h.clipboard.copy(
					h.generateWget(selector.use('TABLE'))
				));

			} else if(e.target.id == 'settings')
			{
				toggle(false, () => data.components.settings.show());

			} else if(e.target.id == 'filter')
			{
				toggle(null, () => main.menu.toggle());

			}
		}
	});

	return container;
};

main.menu.toggle = (state = null) =>
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
};

/* create dates object */
main.dates = new Object();

/* get UTC offset of client */
main.dates.offsetGet = () =>
{
	return new Date().getTimezoneOffset();
}

main.dates.formatSince = (seconds) =>
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

main.dates.apply = (offset, format = true) =>
{
	let onLoadTimestamp = config.get('timestamp');
	let dateFormat = config.get('format.date');

	selector.use('TABLE')
	.querySelectorAll('tr.directory > td:nth-child(2), \
		tr.file > td[data-raw]:nth-child(2)')
	.forEach((item, index) =>
	{
		let timestamp = parseInt(item.getAttribute('data-raw'));
		let	since = main.dates.formatSince(onLoadTimestamp - timestamp);
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

			item.innerHTML = span.innerHTML;
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

/**
 * gets client timezone offset and sets hover timestamps
 */
main.dates.load = () =>
{
	let offset = main.dates.offsetGet();
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

	main.dates.apply(offset, update);
};

/* create sort object */
main.sort = new Object();

main.sort.load = () =>
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
};

/* create sort object */
main.overlay = new Object();

main.overlay.hide = (callback = () => new Object()) =>
{
	let i = 0;

	let data = new Array();

	data.push({
		element : document.body.querySelector(':scope > div.filter-container'),
		f : data.components.filter.toggle
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
};

main.getTableItems = () =>
{
	let items = new Array();

	if(data.instances.optimize.main.enabled)
	{
		let [activeRows, activeIndexes] = data.instances.optimize.main.getActiveData();

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
			let container = parent.parentNode;

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
};

main.sortTableColumn = (target) =>
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

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.sortRows(columnIndex, !column.asc ? 'asc' : 'desc');
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

	if(!data.instances.optimize.main.enabled)
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
};

export const componentMain = main;