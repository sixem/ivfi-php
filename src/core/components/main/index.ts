/** Vendors */
import { formatDate } from '../../vendors/date/date';
/** Config */
import { config, user } from '../../config/config';
import data from '../../config/data';
/** Modules */
import { eventHooks } from '../../modules/event-hooks';
/** Helpers */
import {
	DOM,
	generateWget,
	clipboardCopy,
	comparer
} from '../../helpers';

/** Types */
import {
	MComponentMain,
	TUserClient,
	TOptimizeRowItem
} from '../../types';

/* References */
const selector = data.instances.selector;

/* Create main object */
const main: MComponentMain.TCapsule = {
	menu: {},
	sort: {},
	overlay: {},
	dates: {}
};

/**
 * Create drop down menu
 */
main.menu.create = () =>
{
	let container: HTMLElement = DOM.new('div', {
		class : 'menu'
	});
	
	let items: Array<{
		text: string;
		id: string;
		class?: string;
	}> = [];

	(selector.use('BODY') as HTMLElement).append(container);

	items.push({
		text: data.text.menuLabels.filter.text,
		id: 'filter'
	});

	items.push({
		text: data.text.menuLabels.wget.text,
		id: 'copy'
	});

	/* Add menu item if gallery is enabled */
	if(config.get('gallery.enabled') === true
		&& (selector.use('TABLE') as HTMLElement).querySelectorAll(
			':scope > tbody > tr.file > td > a.preview'
		).length > 0)
	{
		items.unshift({
			text: data.text.menuLabels.gallery.text,
			id: 'gallery'
		});
	}

	/* Do a light check to see if any settings are available to be changed, if so, add menu item */
	if(data.components.settings.available())
	{
		items.unshift({
			text: data.text.menuLabels.settings.text,
			id: 'settings',
			class: 'settings'
		});
	}

	items.forEach((item) =>
	{
		let element = DOM.new('div', {
			text : item.text,
			class : `${Object.prototype.hasOwnProperty.call(item, 'class') ? `${item.class}` : ''}`
		});

		if(Object.prototype.hasOwnProperty.call(item, 'id'))
		{
			element.setAttribute('id', item.id);
		}

		container.append(element);
	});

	/* Event delegation */
	eventHooks.listen(container, 'click', 'menuItemClick', (event: Event) =>
	{
		let eventTarget: HTMLElement = (event.target as HTMLElement);

		if(eventTarget.tagName === 'DIV')
		{
			let toggle = (state: boolean, f: Function): void =>
			{
				if(!state)
				{
					main.menu.toggle();
				} else {
					main.menu.toggle(state);
				}

				f();
			};

			if(eventTarget.id == 'gallery'
				&& config.get('gallery.enabled') === true)
			{
				toggle(false, () => data.components.gallery.load(null));

			} else if(eventTarget.id == 'copy')
			{
				toggle(false, () => clipboardCopy(
					generateWget(selector.use('TABLE') as HTMLElement)
				));

			} else if(eventTarget.id == 'settings')
			{
				toggle(false, () => data.components.settings.show());

			} else if(eventTarget.id == 'filter')
			{
				toggle(null, () => data.components.filter.toggle());
			}
		}
	});

	return container;
};

/**
 * Toggle the state of the drop down menu
 */
main.menu.toggle = (state: null | boolean = null) =>
{
	let menu = document.querySelector('body > div.menu') as HTMLElement;

	let isHidden: boolean = (menu.style.display === 'none');

	let display: string = typeof state === 'boolean'
		? (state ? 'inline-block' : 'none')
		: (isHidden ? 'inline-block' : 'none');

	DOM.style.set(menu, {
		display
	});

	if(isHidden)
	{
		(selector.use('TOP_EXTEND') as HTMLElement).setAttribute('extended', 'true');
	} else {
		(selector.use('TOP_EXTEND') as HTMLElement).removeAttribute('extended');
	}

	return isHidden;
};

/**
 * Get UTC offset of client
 */
main.dates.offsetGet = () =>
{
	return new Date().getTimezoneOffset();
};

/**
 * Formats seconds to an 'ago' string
 */
main.dates.formatSince = (seconds: number) =>
{
	if(seconds === 0 || seconds < 0)
	{
		return seconds === 0 ? 'Now' : false;
	}

	let t: {
		[key: string]: number;
	} = {
		year: 31556926,
		month: 2629743,
		week: 604800,
		day: 86000,
		hour: 3600,
		minute: 60,
		second: 1
	};

	let keys: Array<string> = Object.keys(t);
	let count: number = (keys.length - 1);
	let value: string | boolean = false;

	for(let index: number = 0; index < keys.length; index++)
	{
		let key: string = keys[index];
		
		if(seconds <= t[key]) continue;

		let n: string | null = count >= (index + 1) ? keys[(index + 1)] : null;
		let f: number = Math.floor(seconds / t[key]);
		let s: number = n ? Math.floor((seconds - (f * t[key])) / t[n]) : 0;

		value = `${f} ${key}${
			f == 1 ? '' : 's'
		}` + (s > 0 ? (` and ${s} ${n}${s == 1
			? '' : 's'}`)
			: ''
		) + ' ago';

		break;
	}

	return value;
};

main.dates.apply = (offset: MComponentMain.TDateOffset, format: boolean = true) =>
{
	let onLoadTimestamp: number = config.get('timestamp');
	let dateFormat: Array<string> = config.get('format.date');
	let dateSelector: string = 'tr.directory > td:nth-child(2), tr.file > td[data-raw]:nth-child(2)';

	(selector.use('TABLE') as HTMLElement).querySelectorAll(
		dateSelector
	).forEach((item: HTMLTableCellElement) =>
	{
		let timestamp: number = parseInt(item.getAttribute('data-raw'));

		let since: string | boolean = main.dates.formatSince(onLoadTimestamp - timestamp);

		let span: HTMLSpanElement = (
			format === true
				? DOM.new('span')
				: item.querySelector(':scope > span')
		);

		/* Update the date formats if the offset has been changed or set for the first time */
		if(format === true)
		{
			(dateFormat).forEach((f: string, index: number) =>
			{
				if(index <= 1)
				{
					let element: HTMLElement = DOM.new('span', {
						text: formatDate(f, timestamp)
					});

					if(config.get('format.date').length > 1)
					{
						element.setAttribute(
							'data-view', index === 0 ? 'desktop' : 'mobile'
						);
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

	let infoSelector = `div.topBar > .directoryInfo div[data-count="files"], div.topBar > .directoryInfo div[data-count="directories"]`;

	document.body.querySelectorAll(infoSelector).forEach((item) =>
	{
		if(item.hasAttribute('data-raw'))
		{
			item.setAttribute('title', `Newest: ${formatDate(dateFormat[0], parseInt(item.getAttribute('data-raw')))}`);
		}
	});
};

/**
 * Gets client timezone offset and sets hover timestamps
 */
main.dates.load = () =>
{
	let offset: number = main.dates.offsetGet();
	let	client: TUserClient = user.get();
	let update: boolean = client.timezone_offset !== offset;

	/* Only update if offset is changed or unset */
	if(update)
	{
		/* Update client's offset */
		client.timezone_offset = offset;

		/* Save client */
		user.set(client);
	}

	let offsetData: MComponentMain.TDateOffset = {
		minutes : (offset > 0 ? -Math.abs(offset) : Math.abs(offset))
	};

	offsetData.hours = (offsetData.minutes / 60);
	offsetData.seconds = (offsetData.minutes * 60);

	main.dates.apply(offsetData, update);
};

/**
 * Load sorting
 */
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
					index = 0; break;
				case 'modified':
					index = 1; break;
				case 'size':
					index = 2; break;
				case 'type':
					index = 3; break;
				default:
					index = null;
			}

			if(index !== null)
			{
				let tableCell: MComponentMain.ISortRow = document.querySelectorAll(
					'table th span[sortable]'
				)[index].closest('th');

				if(tableCell)
				{
					tableCell.asc = asc;

					let indicator: HTMLElement = tableCell.querySelector(
						':scope > span.sortingIndicator'
					);

					if(indicator)
					{
						indicator.classList.add(asc ? 'down' : 'up', 'visible');
					}
				}
			}
		}
	}
};

/**
 * Hides the overlay
 */
main.overlay.hide = (callback: Function = () => {}) =>
{
	type collectionItem = {
		element: HTMLElement;
		f: Function;
	};

	let i: number = 0;
	let collection: Array<collectionItem> = [];

	collection.push({
		element: document.body.querySelector(':scope > div.filterContainer'),
		f: data.components.filter.toggle
	});

	collection.push({
		element: document.body.querySelector(':scope > div.menu'),
		f: main.menu.toggle
	});

	collection.forEach((obj: collectionItem) =>
	{
		if(obj.element && obj.element.style.display !== 'none')
		{
			obj.f();
			
			i++;
		}
	});

	callback(i > 0);
};

/**
 * Gets the current table items
 */
main.getTableItems = () =>
{
	let items: ReturnType<MComponentMain.TCapsule['getTableItems']> = [];

	if(data.instances.optimize.main.enabled)
	{
		let [activeRows]: [Array<TOptimizeRowItem>] = data.instances.optimize.main.getActiveData();

		for(let i: number = 0; i < activeRows.length; i++)
		{
			if(i === 0) continue;

			let row: TOptimizeRowItem = activeRows[i],
				anchor: HTMLElement = (row.children[0].children[0] as HTMLElement);

			if(anchor.classList.contains('preview'))
			{
				items.push({
					url: anchor.getAttribute('href'),
					name: row.children[0].getAttribute('data-raw'),
					size: row.children[2].textContent
				});
			}
		}
	} else {
		let previews: NodeListOf<HTMLAnchorElement> = (selector.use('TABLE') as HTMLElement).querySelectorAll(
			':scope > tbody > tr.file:not(.filtered) > td:first-child > a.preview'
		);

		(previews).forEach((element: HTMLAnchorElement) =>
		{
			let parent = (element.parentNode as HTMLElement),
				container = (parent.parentNode as HTMLElement),
				url = element.getAttribute('href');

			if(typeof url !== 'undefined')
			{
				items.push({
					url: url,
					name: parent.getAttribute('data-raw'),
					size: container.querySelector('td:nth-child(3)').innerHTML
				});
			}
		});
	}

	return items;
};

/**
 * Sorts a column
 */
main.sortTableColumn = (target: HTMLTableCellElement) =>
{
	let parent: HTMLTableCellElement = target.closest('th');
	let column: MComponentMain.ISortRow = !(target.tagName === 'TH') ? parent : target;
	let columnIndex: number = DOM.getIndex(column);

	let rows: {
		directories: Array<HTMLElement>;
		files: Array<HTMLElement>;
	} = {
		directories : Array.from((selector.use('TABLE') as HTMLElement).querySelectorAll(
			'tbody > tr.directory'
		)),
		files : Array.from((selector.use('TABLE') as HTMLElement).querySelectorAll(
			'tbody > tr.file'
		))
	};

	/**
	 * Set a skip directory var if we're only sorting sizes or types
	 * 
	 * They should be unaffected by these unless directory sizes are enabled
	 */
	let skipDirectories = !(Object.prototype.hasOwnProperty.call(config.get('sorting'), 'directorySizes')
		&& config.get('sorting.directorySizes'))
		&& (config.exists('sorting.sortBy')
		&& (columnIndex === 2 || columnIndex === 3));

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.sortRows(columnIndex, !column.asc ? 'asc' : 'desc');
	} else {
		let sortingTypes: number = config.get('sorting.types');

		if(sortingTypes === 0 || sortingTypes === 2)
		{
			if(!skipDirectories) rows.directories.sort(comparer(columnIndex));
		}

		if(sortingTypes === 0 || sortingTypes === 1)
		{
			rows.files.sort(comparer(columnIndex));
		}
	}

	column.asc = !column.asc;

	document.body.querySelectorAll(':scope > div.tableContainer > table > \
		thead > tr > th span.sortingIndicator').forEach((indicator) =>
	{
		indicator.classList.remove('up', 'down', 'visible');
	});

	parent.querySelector(':scope > span.sortingIndicator').classList.add(
		column.asc ? 'down' : 'up', 'visible'
	);

	let client: TUserClient = user.get();

	/* Set client sorting settings */
	client.sort.ascending = (column.asc ? 1 : 0);
	client.sort.row = columnIndex;

	/* Save client */
	user.set(client);

	if(!data.instances.optimize.main.enabled)
	{
		if(!column.asc)
		{
			let sortingTypes: number = config.get('sorting.types');

			if(sortingTypes === 0 || sortingTypes === 2)
			{
				if(!skipDirectories) rows.directories = rows.directories.reverse();
			}

			if(sortingTypes === 0 || sortingTypes === 1)
			{
				rows.files = rows.files.reverse();
			}
		}

		let tableBody = (selector.use('TABLE') as HTMLElement).querySelector('tbody');

		Object.keys(rows).forEach((key: string) =>
		{
			rows[key].forEach((item: HTMLElement) =>
			{
				tableBody.append(item);
			});
		});
	}

	data.sets.refresh = true;
	data.sets.selected = null;
};

const componentMain = main;

export {
	componentMain
};