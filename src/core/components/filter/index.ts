/** Config */
import selectorClass from '../../classes/selector';
import { config } from '../../config/config';
import data from '../../config/data';

/** Helpers */
import { getReadableSize } from '../../helpers';

/** Types */
import {
	TComponentFilter,
	TOptimizeRowItem
} from '../../types';

const componentFilter: TComponentFilter = {},
	selector: selectorClass = data.instances.selector;

/**
 * Filter types
 */
type TFilterData = {
	reset?: boolean;
	size?: number;
	shown?: {
		directories: number;
		files: number;
	};
};

componentFilter.apply = (query = ''): void =>
{
	const filterData: TFilterData = {};
	let pattern: RegExp;
	const input = selector.use('FILTER_INPUT') as HTMLInputElement;
	try
	{
		/* Leading-star filename patterns are wildcards; other queries retain regex syntax. */
		const wildcard = query?.startsWith('*') && !/[\\^$+?()[\]{}|]/.test(query);
		const source = wildcard
			? '^' + query.split('*').map((part) => part.replace(/\./g, '\\.')).join('.*') + '$'
			: query || '';
		pattern = new RegExp(source, 'i');
		input.removeAttribute('aria-invalid');
	} catch
	{
		input.setAttribute('aria-invalid', 'true');
		return;
	}

	data.sets.refresh = true;

	filterData.reset = query === '' || !query;

	filterData.shown = {
		directories: 0,
		files: 0
	};

	filterData.size = 0;

	/* Reset stored gallery index if active */
	if(data.instances.gallery)
	{
		data.instances.gallery.data.selected.index = 0;
	}

	/* Check if directory sizes are enabled */
	const directorySizes = (
		Object.prototype.hasOwnProperty.call(
			config.get('sorting'),
			'directorySizes'
		) && config.get('sorting.directorySizes')
	);

	/* Check if optimizer is being used */
	const useOptimizer = Object.prototype.hasOwnProperty.call(data.instances.optimize, 'main')
		&& data.instances.optimize.main.enabled;

	/* Fetch rows from optimizer class if set */
	let rows: NodeListOf<TOptimizeRowItem> = useOptimizer ? data.instances.optimize.main.rows : null;

	/* If no stored rows were found, fetch them directly instead */
	if(rows === null)
	{
		rows = (selector.use('TABLE') as HTMLElement).querySelectorAll(
			'tbody > tr'
		) as NodeListOf<HTMLElement>;
	}

	/* Iterate over rows and search for query */
	for(let i = 1; i < rows.length; i++)
	{
		const item = rows[i];

		if(filterData.reset === true)
		{
			item.classList.remove('filtered');
			if(useOptimizer) data.instances.optimize.main.setVisibleFlag(item, true);

			continue;
		}

		const is = { file : false, directory : false };

		if(item.classList.contains('file'))
		{
			is.file = true;
		} else if(item.classList.contains('directory'))
		{
			is.directory = true;
		}

		const matches = pattern.test(item.children[0].getAttribute('data-raw') || '');

		if(matches)
		{
			item.classList.remove('filtered');

			/* Set visible flag in optimizer */
			if(useOptimizer)
			{
				data.instances.optimize.main.setVisibleFlag(item, true);					
			}

			/** Append++ to file or directory count */
			if(is.file) filterData.shown.files++;
			else if(is.directory) filterData.shown.directories++;

		} else {
			item.classList.add('filtered');

			/* Set visible flag in optimizer */
			if(useOptimizer)
			{
				data.instances.optimize.main.setVisibleFlag(item, false);
			}
		}

		/* Add size to total */
		if((matches && is.file) ||
			(directorySizes && matches && is.directory))
		{
			const size = item.children[2].getAttribute('data-raw');

			filterData.size = !isNaN(parseInt(size))
				? (filterData.size + parseInt(size))
				: filterData.size;
		}
	}

	/* Set parent class so that we can hide all - .filtered -> .filtered */
	if(filterData.reset)
	{
		(selector.use('TABLE_CONTAINER') as HTMLElement).removeAttribute(
			'is-active-filter'
		);
	} else {
		(selector.use('TABLE_CONTAINER') as HTMLElement).setAttribute(
			'is-active-filter', ''
		);

		/* Scroll to top on search */
		window.scrollTo(0, 0);
	}

	if(useOptimizer)
	{
		/* Call optimization refactoring as we've made changes */
		data.instances.optimize.main.refactor();
	}

	interface ITop {
		container: HTMLElement;
		size?: HTMLElement;
		files?: HTMLElement;
		directories?: HTMLElement;
	}

	const top: ITop = {
		container: document.body.querySelector(':scope > div.topBar')
	};

	/* Retrieve values */
	(['size', 'files', 'directories']).forEach((key: string) =>
	{
		top[key] = top.container.querySelector(`[data-count="${key}"]`);
	});

	/* Defaulting */
	if(!Object.prototype.hasOwnProperty.call(data.sets.defaults, 'topValues'))
	{
		data.sets.defaults.topValues = {
			size: top.size.textContent,
			files: top.files.textContent,
			directories: top.directories.textContent
		};
	}

	/* Set size text content */
	top.size.textContent =
		(filterData.reset) ? data.sets.defaults.topValues.size : 
			getReadableSize(config.get('format.sizes'), filterData.size);

	/* Set files text content */
	top.files.textContent =
		(filterData.reset) ? data.sets.defaults.topValues.files : 
			`${filterData.shown.files} file${filterData.shown.files === 1 ? '' : 's'}`;

	/* Set directories text content */
	top.directories.textContent =
		(filterData.reset) ? data.sets.defaults.topValues.directories : 
			`${filterData.shown.directories} ${filterData.shown.directories === 1 ? 'directory' : 'directories'}`;

	top.files.hidden = parseInt(top.files.textContent, 10) === 0;
	top.directories.hidden = parseInt(top.directories.textContent, 10) === 0;
	(top.container.querySelector('.itemCounts') as HTMLElement).hidden = top.files.hidden && top.directories.hidden;
	(top.container.querySelector('.countSeparator') as HTMLElement).hidden = top.files.hidden || top.directories.hidden;

	const option = document.querySelector('.topActions > button[data-action="gallery"]') as HTMLButtonElement;

	const previews = (selector.use('TABLE_CONTAINER') as HTMLElement).querySelectorAll(
		'table tr.file:not(.filtered) a.preview'
	).length;

	if(option) option.disabled = previews === 0;
	data.components.main.selection.refresh();

};

componentFilter.toggle = (): void =>
{
	const container: HTMLElement = document.body.querySelector(
		':scope > div.filterContainer'
	);

	const input: HTMLInputElement = container.querySelector(
		'input[type="text"]'
	);

	const visible = container.style.display === 'none' || container.classList.contains('closing');
	container.onanimationend = null;
	container.classList.remove('closing');
	container.inert = !visible;
	if(visible) container.style.display = 'block';
	else if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
	{
		container.style.display = 'none';
	} else
	{
		container.classList.add('closing');
		container.onanimationend = (event) =>
		{
			if(event.target !== container) return;
			container.style.display = 'none';
			container.classList.remove('closing');
			container.onanimationend = null;
		};
	}
	const button = document.querySelector<HTMLButtonElement>('.topActions > button[data-action="filter"]');
	if(button) button.setAttribute('aria-expanded', String(visible));
	if(visible) input.focus();
	else button?.focus({ preventScroll: true });
};

export {
	componentFilter
};
