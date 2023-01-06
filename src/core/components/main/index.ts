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
	const container: HTMLElement = DOM.new('div', {
		class : 'menu'
	});
	
	const items: Array<{
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
		const element = DOM.new('div', {
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
		const eventTarget: HTMLElement = (event.target as HTMLElement);

		if(eventTarget.tagName === 'DIV')
		{
			const toggle = (state: boolean, f: () => void): void =>
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
	const menu = document.querySelector('body > div.menu') as HTMLElement;

	const isHidden: boolean = (menu.style.display === 'none');

	const display: string = typeof state === 'boolean'
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

	const t: {
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

	const keys: Array<string> = Object.keys(t);
	const count: number = (keys.length - 1);
	let value: string | boolean = false;

	for(let index = 0; index < keys.length; index++)
	{
		const key: string = keys[index];
		
		if(seconds <= t[key]) continue;

		const n: string | null = count >= (index + 1) ? keys[(index + 1)] : null;
		const f: number = Math.floor(seconds / t[key]);
		const s: number = n ? Math.floor((seconds - (f * t[key])) / t[n]) : 0;

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

main.dates.apply = (offset: MComponentMain.TDateOffset, format = true) =>
{
	const onLoadTimestamp: number = config.get('timestamp');
	const dateFormat: Array<string> = config.get('format.date');
	const dateSelector = 'tr.directory > td:nth-child(2), tr.file > td[data-raw]:nth-child(2)';

	(selector.use('TABLE') as HTMLElement).querySelectorAll(
		dateSelector
	).forEach((item: HTMLTableCellElement) =>
	{
		const timestamp: number = parseInt(item.getAttribute('data-raw'));

		const since: string | boolean = main.dates.formatSince(onLoadTimestamp - timestamp);

		const span: HTMLSpanElement = (
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
					const element: HTMLElement = DOM.new('span', {
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

	const infoSelector = 'div.topBar > .directoryInfo div[data-count="files"], div.topBar > .directoryInfo div[data-count="directories"]';

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
	const offset: number = main.dates.offsetGet();
	const client: TUserClient = user.get();
	const update: boolean = client.timezoneOffset !== offset;

	/* Only update if offset is changed or unset */
	if(update)
	{
		/* Update client's offset */
		client.timezoneOffset = offset;

		/* Save client */
		user.set(client);
	}

	const offsetData: MComponentMain.TDateOffset = {
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
		const sortingTypes = config.get('sorting.types');

		if(sortingTypes === 0 || sortingTypes === 1)
		{
			const asc = (config.get('sorting.order') === 'asc' ? true : false);
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
				const tableCell: MComponentMain.ISortRow = document.querySelectorAll(
					'table th span[sortable]'
				)[index].closest('th');

				if(tableCell)
				{
					tableCell.asc = asc;

					const indicator: HTMLElement = tableCell.querySelector(
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
main.overlay.hide = (callback = null): void =>
{
	type collectionItem = {
		element: HTMLElement;
		f: () => void;
	};

	let i = 0;

	const collection: Array<collectionItem> = [];

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

	if(callback)
	{
		callback(i > 0);
	}
};

/**
 * Gets the current table items
 */
main.getTableItems = () =>
{
	const items: ReturnType<MComponentMain.TCapsule['getTableItems']> = [];

	if(data.instances.optimize.main.enabled)
	{
		const [activeRows]: [Array<TOptimizeRowItem>] = data.instances.optimize.main.getActiveData();

		for(let i = 0; i < activeRows.length; i++)
		{
			if(i === 0) continue;

			const row: TOptimizeRowItem = activeRows[i],
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
		const previews: NodeListOf<HTMLAnchorElement> = (selector.use('TABLE') as HTMLElement).querySelectorAll(
			':scope > tbody > tr.file:not(.filtered) > td:first-child > a.preview'
		);

		(previews).forEach((element: HTMLAnchorElement) =>
		{
			const parent = (element.parentNode as HTMLElement),
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
	const parent: HTMLTableCellElement = target.closest('th');
	const column: MComponentMain.ISortRow = !(target.tagName === 'TH') ? parent : target;
	const columnIndex: number = DOM.getIndex(column);

	const rows: {
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
	const skipDirectories = !(Object.prototype.hasOwnProperty.call(config.get('sorting'), 'directorySizes')
		&& config.get('sorting.directorySizes'))
		&& (config.exists('sorting.sortBy')
		&& (columnIndex === 2 || columnIndex === 3));

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.sortRows(columnIndex, !column.asc ? 'asc' : 'desc');
	} else {
		const sortingTypes: number = config.get('sorting.types');

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

	const client: TUserClient = user.get();

	/* Set client sorting settings */
	client.sort.ascending = (column.asc ? 1 : 0);
	client.sort.row = columnIndex;

	/* Save client */
	user.set(client);

	if(!data.instances.optimize.main.enabled)
	{
		if(!column.asc)
		{
			const sortingTypes: number = config.get('sorting.types');

			if(sortingTypes === 0 || sortingTypes === 2)
			{
				if(!skipDirectories) rows.directories = rows.directories.reverse();
			}

			if(sortingTypes === 0 || sortingTypes === 1)
			{
				rows.files = rows.files.reverse();
			}
		}

		const tableBody = (selector.use('TABLE') as HTMLElement).querySelector('tbody');

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