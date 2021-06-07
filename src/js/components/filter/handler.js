/* import config */
import { config } from '../../config/config';
import { data } from '../../config/data';

/* import helpers */
import { getReadableSize } from '../../modules/helpers';

const componentFilter = new Object();

const selector = data.instances.selector;

componentFilter.apply = (query = new String()) =>
{
	let filterData = new Object();
	
	let errorData = false;

	data.sets.refresh = true;

	filterData.reset = query === new String() || !query;
	filterData.shown = { directories : 0, files : 0 };
	filterData.size = 0;

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

	let useOptimizer = data.instances.optimize.hasOwnProperty('main');

	let rows = useOptimizer ? 
		data.instances.optimize.main.rows :
		selector.use('TABLE').querySelectorAll('tbody > tr');

	/* iterate over rows, search for query */
	for(let i = 1; i < rows.length; i++)
	{
		let item = rows[i];

		if(filterData.reset === true)
		{
			item.classList.remove('filtered');

			if(useOptimizer)
			{
				data.instances.optimize.main.setVisibleFlag(item, true);
			}

			break;
		}

		let is = {
			file : false,
			directory : false
		};

		if(item.classList.contains('file'))
		{
			is.file = true;
		} else if(item.classList.contains('directory'))
		{
			is.directory = true;
		}

		let match = componentFilter.getMatch(item.children[0].getAttribute('data-raw'), query);

		if(match.valid && match.data)
		{
			item.classList.remove('filtered');

			if(useOptimizer)
			{
				data.instances.optimize.main.setVisibleFlag(item, true);					
			}

			if(is.file)
			{
				filterData.shown.files++;

			} else if(is.directory)
			{
				filterData.shown.directories++;
			}

		} else if(match && match.valid === false)
		{
			errorData = match.reason;

		} else {
			item.classList.add('filtered');

			if(useOptimizer)
			{
				data.instances.optimize.main.setVisibleFlag(item, false);
			}
		}

		/* add size to total */
		if((match.valid && match.data && is.file) ||
			(directorySizes && match.valid && match.data && is.directory))
		{
			let size = item.children[2].getAttribute('data-raw');
			filterData.size = !isNaN(size) ? (filterData.size + parseInt(size)) : filterData.size;
		}
	}

	/* set parent class so that we can hide all - .filtered -> .filtered */
	if(filterData.reset)
	{
		selector.use('TABLE_CONTAINER').removeAttribute('is-active-filter', '');
	} else {
		selector.use('TABLE_CONTAINER').setAttribute('is-active-filter', '');

		/* scroll to top on search */
		window.scrollTo(0, 0);
	}

	if(useOptimizer)
	{
		/* call optimization refactoring */
		data.instances.optimize.main.refactor();
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
		(filterData.reset) ? data.sets.defaults.topValues.size : 
		getReadableSize(config.get('format.sizes'), filterData.size);

	top.files.textContent =
		(filterData.reset) ? data.sets.defaults.topValues.files : 
		`${filterData.shown.files} file${filterData.shown.files === 1 ? '' : 's'}`;

	top.directories.textContent =
		(filterData.reset) ? data.sets.defaults.topValues.directories : 
		`${filterData.shown.directories} ${filterData.shown.directories === 1 ? 'directory' : 'directories'}`;

	let option = document.body.querySelector(':scope > div.menu > #gallery');

	let previews = selector.use('TABLE_CONTAINER')
		.querySelectorAll('table tr.file:not(.filtered) a.preview').length;

	if(errorData !== false)
	{
		console.error(`Filter regex error: ${errorData}`);
	}

	/* hide or show the gallery menu option */
	if(!filterData.reset && previews === 0 && option)
	{
		if(option.style.display !== 'none')
		{
			option.style.display = 'none';
		}
	} else if((previews > 0 || filterData.reset) && option)
	{
		if(option.style.display === 'none')
		{
			option.style.display = 'block';
		}
	}
};

componentFilter.getMatch = (input, query) =>
{
	let match = new Object();

	try
	{
		match.valid = true;
		match.data = (input).match(new RegExp(query, 'i'));
	} catch(e) {

		match.valid = false;
		match.reason = e;
	}

	return match;
};

componentFilter.toggle = () =>
{
	let container = document.body.querySelector(':scope > div.filter-container');

	let input = container.querySelector('input[type="text"]');

	if(container.style.display !== 'none')
	{
		container.style.display = 'none';
	} else {
		input.value = new String();

		componentFilter.apply(null);

		container.style.display = 'block';
	}

	input.focus();
};

export {
	componentFilter
};