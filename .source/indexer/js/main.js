/**
 * <eyy-indexer-main> [https://github.com/sixem/eyy-indexer]
 * 
 * Licensed under GPL-3.0
 * @author   emy [admin@eyy.co]
 * @version  1.1.4
 */

'use strict';

const lister = {
	selection : {},
	selected : null,
	gallery : null,
	refresh : false,
	defaults : {}
};

$(document).on('click', 'body > .top-bar > div.extend', (e) =>
{
	toggleMenu();
});

$(document).on('click', '.filter-container > div.close > span', (e) =>
{
	toggleFilter();
});

$(document).on('input', '.filter-container > div input[type="text"]', (e) =>
{
	applyFilter($(e.currentTarget).val());
});

$(document).on('click', 'body > div.menu #filter', (e) =>
{
	toggleFilter();
	toggleMenu();
});

const fallbackCopyTextToClipboard = (text) =>
{
	/* https://stackoverflow.com/a/30810322 */

	var area = document.createElement("textarea");

	area.value = text; area.style.position = 'fixed';

	document.body.appendChild(area);

	area.focus();
	area.select();

	try
	{
		var successful = document.execCommand('copy');

		if(config.debug) console.log('fallback', 'copying text command was ' + (successful ? 'successful' : 'unsuccessful'));
	} catch (err) {
		if(config.debug) console.error('fallback', 'unable to copy', err);
	}

	document.body.removeChild(area);
};

const copyTextToClipboard = (text) =>
{
	/* https://stackoverflow.com/a/30810322 */

	if(!navigator.clipboard)
	{
		fallbackCopyTextToClipboard(text);
		return;
	}

	navigator.clipboard.writeText(text).then(() =>
	{
		if(config.debug) console.log('async', 'copying to clipboard was successful.');
	}, (err) =>
	{
		if(config.debug) console.error('async', 'could not copy text: ', err);
	});
};

const getReadableSize = (bytes) =>
{
	/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

	if(bytes === 0) return '0.00 B';

	var i = -1, byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

	do{
		bytes = bytes / 1024; i++;
	} while (bytes > 1024);

	return Math.max(bytes, 0.1).toFixed(1) + byteUnits[i];
};

const getCellValue = (row, index) =>
{
	var attribute = $(row).children('td').eq(index).data('raw');
	return attribute !== undefined ? attribute : $(row).children('td').eq(index).text();
};

const comparer = (index) =>
{
	return (a, b) =>
	{
		var valA = getCellValue(a, index), valB = getCellValue(b, index);
		return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
	}
};

const getTableItems = () =>
{
	var items = [];

	$('tr.file td:first-child a.preview').each((index, item) =>
	{
		item = $(item);

		var parent = item.closest('tr');

		if(parent.is(':hidden')) return true;

		var url = item.attr('href'),
		name = item.closest('td').data('raw'),
		size = parent.find('td').eq(2).text();

		if(typeof url !== 'undefined' && typeof name !== 'undefined')
		{
			items.push({ name, url, size });
		}
	});

	return items;
};

const toggleMenu = (state = null) =>
{
	var menu = $('body > div.menu');
	menu.css('display', (state === true || state === false) ? (state ? 'inline-block' : 'none') : (menu.is(':hidden') ? 'inline-block' : 'none'));
	$('body > .top-bar > div.extend').html(menu.is(':hidden') ? '+' : '-');

	return menu.is(':hidden');
};

if(config.gallery.enabled === true)
{
	$(document).on('click', 'body > div.menu #gallery', (e) =>
	{
		loadGallery(null);
		toggleMenu(false);
	});

	$(document).on('click', 'tbody tr.file a.preview', (e) =>
	{
		e.preventDefault();

		if($(e.target).is('a'))
		{
			var parents = $(e.target).closest('table').find('tr.file:visible')
			.filter((index, element) => $(element).find('a.preview').length > 0);

			let index = parents.index($(e.target).closest('tr.file'));

			loadGallery(index !== -1 ? index : 0);
		}
	});
}

$(document).on('click', 'body > div.menu #copy', (e) =>
{
	var wget = () =>
	{
		var url = window.location.href, extensions = [];

		$('tr.file td:first-child a:visible').each((index, item) =>
		{
			var extension = $(item).text().split('.').pop().toLowerCase().trim();
			if(!extensions.includes(extension)) extensions.push(extension);
		});

		return `wget -r -np -nH -nd -e robots=off --accept "${extensions.join(',')}" "${url}"`;
	};

	copyTextToClipboard(wget());
	toggleMenu(false);
});

$(document).on('click', 'table th span[sortable]', (e) =>
{
	var parent = $(e.currentTarget).parents('th'), index = parent.index();
	var column = !$(e.currentTarget).is('th') ? parent[0] : e.currentTarget;
	var table = $(column).parents('table').eq(0);

	var rows = {
		directories : table.find('tbody tr.directory').toArray(),
		files : table.find('tbody tr.file').toArray()
	};

	// set a skip directory var if we're only sorting sizes or types (as they should be unaffected by these).
	var skip_directories = (config.sorting.hasOwnProperty('sort_by') && (index === 2 || index === 3))

	if(config.sorting.types === 0 || config.sorting.types === 2)
	{
		if(!skip_directories) rows.directories.sort(comparer($(column).index()))
	}

	if(config.sorting.types === 0 || config.sorting.types === 1)
	{
		rows.files.sort(comparer($(column).index()))
	}

	column.asc = !column.asc;

	$('body > table span.sort-indicator').removeClass('up down');
	parent.find('> span.sort-indicator').addClass(column.asc ? 'down' : 'up').show();

	Cookies.set('ei-sort_ascending', column.asc ? 1 : 0, {
		sameSite : 'lax'
	});

	Cookies.set('ei-sort_row', index, {
		sameSite : 'lax'
	});

	if(!column.asc)
	{
		if(config.sorting.types === 0 || config.sorting.types === 2)
		{
			if(!skip_directories) rows.directories = rows.directories.reverse();
		}

		if(config.sorting.types === 0 || config.sorting.types === 1)
		{
			rows.files = rows.files.reverse();
		}
	}

	Object.keys(rows).forEach((key) => rows[key].forEach((item) => table.append(item)));

	lister.refresh = true;
	lister.selected = null;

	$('tbody tr.last').removeClass('last');
});

const applyFilter = (query) =>
{
	lister.refresh = true;

	let data = {
		reset : (query === ''),
		shown : {
			directories : 0,
			files : 0
		},
		hidden : {
			directories : 0,
			files : 0
		},
		size : 0
	};

	$('body > table tr.file, body > table tr.directory').each((index, item) =>
	{
		item = $(item); 

		if(data.reset)
		{
			item.css('display', '');
			return true;
		}

		var is_file = item.hasClass('file'),
		match = (item.find('td:eq(0)').attr('data-raw')).match(new RegExp(query, 'i'));

		item.css('display', match ? '' : 'none');

		if(match && is_file)
		{
			var size = item.find('td:eq(2)').attr('data-raw');

			if(!isNaN(size)) data.size = (data.size + parseInt(size));
		}

		(match) ? ((is_file) ? data.shown.files++ : data.shown.directories++) : ((is_file) ? data.hidden.files++ : data.hidden.directories++);
	});

	let top = {
		container : $('body > div.top-bar')
	};

	['size', 'files', 'directories'].forEach((s) => top[s] = top.container.find(`[data-count="${s}"]`));

	if(!lister.defaults.hasOwnProperty('top_values'))
	{
		lister.defaults.top_values = {
			size : top.size.text(),
			files : top.files.text(),
			directories : top.directories.text()
		};
	}

	top.size.text(
		(data.reset) ? 
		lister.defaults.top_values.size : 
		getReadableSize(data.size)
	);

	top.files.text(
		(data.reset) ? 
		lister.defaults.top_values.files : 
		`${data.shown.files} file${data.shown.files === 1 ? '' : 's'}`
	);

	top.directories.text(
		(data.reset) ? 
		lister.defaults.top_values.directories : 
		`${data.shown.directories} ${data.shown.directories === 1 ? 'directory' : 'directories'}`
	);

	let option = $('body > div.menu > #gallery');
	let previews = $('body > table tr.file:visible a.preview').length;

	if(!data.reset && previews === 0 && option.length > 0)
	{
		if(option.css('display') !== 'none') option.css('display', 'none');
	} else if((previews > 0 || data.reset) && option.length > 0)
	{
		if(option.css('display') === 'none') option.css('display', 'block');
	}
};

const toggleFilter = () =>
{
	var container = $('.filter-container');
	var input = container.find('input[type="text"]');

	if(container.is(':visible'))
	{
		container.hide();
	} else {
		input.val(''); applyFilter('');
		container.show();
	}

	input.focus();
};

const hideOverlays = (callback = () => {}) =>
{
	let i = 0;

	[
		{e : $('.filter-container'), func : toggleFilter},
		{e : $('body > div.menu'), func : toggleMenu}
	]
	.forEach((obj) =>
	{
		if((obj.e).length > 0 && (obj.e).is(':visible'))
		{
			obj.func(); i++;
		}
	});

	callback(i > 0);
};

const bind = () =>
{
	$(document).off('keydown').on('keydown', (e) =>
	{
		if(e.shiftKey && e.keyCode === 70)
		{
			e.preventDefault();
			toggleFilter();
		} else if(e.keyCode === 27)
		{
			hideOverlays((state) =>
			{
				if(state === true) e.preventDefault();
			});
		} else if(e.keyCode === 71)
		{
			if(config.gallery.enabled === true)
			{
				var container = $('.filter-container');

				if(container.is(':visible') === false ||
					!container.find('input[type="text"]').is(':focus'))
				{
					loadGallery(null);
					toggleMenu(false);
				}
			}
		}
	});
};

const loadGallery = (index = 0) =>
{
	if(config.debug) console.log('loadGallery', index);

	if(!config.gallery.enabled)
	{
		return false;
	}

	if(lister.gallery && lister.gallery !== false)
	{
		let items = lister.refresh ? getTableItems() : null;
		if(items !== null && items.length === 0) return false;
		lister.gallery.show(true, index === null ? lister.gallery.data.selected.index : index, items);
		if(lister.refresh) lister.refresh = false;

		return;
	}

	var list_state = null;

	try
	{
		list_state = JSON.parse(Cookies.get('ei-gallery_list-state').toLowerCase());
	} catch (e) {
		Cookies.set('ei-gallery_list-state', 1, {
			sameSite : 'lax'
		});
	}

	lister.gallery = new $.fn.gallery(getTableItems(), {
		'start' : index === null ? 0 : index,
		'filter' : false,
		'console' : config.debug,
		'fade' : config.gallery.fade,
		'mobile' : config.mobile,
		'reverse_options' : config.gallery.reverse_options,
		'scroll_interval' : config.gallery.scroll_interval,
		'show_list' : list_state == null ? true : (list_state ? true : false)
	});

	if(lister.gallery !== false) $(lister.gallery).on('unbound', (e, state) => bind());
};

const debounce = (func) =>
{
	var timer;

	return (event) =>
	{
		if(timer) clearTimeout(timer);
		timer = setTimeout(func, 100, event);
	};
};

const setSorting = () =>
{
	if(config.hasOwnProperty('sorting') && config.sorting.enabled)
	{
		if(config.sorting.types === 0 || config.sorting.types === 1)
		{
			var asc = (config.sorting.order === 'asc' ? true : false), index = null;

			switch(config.sorting.sort_by)
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
				var th = $('table th span[sortable]').eq(index).parents('th');

				if(th.length > 0)
				{
					th[0].asc = asc;
					th.find('> span.sort-indicator').addClass(asc ? 'down' : 'up').fadeIn(350);
				}
			}
		}
	}
};

const createMenu = () =>
{
	let container = $('<div/>', {
		class : 'menu'
	}).appendTo($('body'));

	let items = [
		{
			text : 'Filter',
			id : 'filter'
		},
		{
			text : 'Copy wget',
			id : 'copy'
		}
	];

	if(config.gallery.enabled === true && $('a.preview').length > 0)
	{
		items.unshift({
			text : 'Gallery',
			id : 'gallery'
		})
	}

	items.forEach((item) =>
	{
		$('<div/>', {
			id : item.id,
			text : item.text,
			class : 'ns'
		}).appendTo(container);
	});

	return container;
};

const setDates = () =>
{
	let getOffset = () =>
	{
		let date = new Date();
		return date.getTimezoneOffset();
	};

	let formatDate = (ts) =>
	{
		var convert = (i) => i < 10 ? '0' + i : i, date = new Date(ts * 1000);

		return [
			`${convert(date.getDate())}/${convert(date.getMonth()+1)}/${date.getFullYear().toString().substring(2)}`,
			`${convert(date.getHours())}:${convert(date.getMinutes())}`
		];
	};

	let formatSince = (seconds) =>
	{
		if(seconds === 0) { return 'Now'; } else if(seconds < 0) { return false; }

		var t = {
			'year' : 31556926,
			'month' : 2629743,
			'week' : 604800,
			'day' : 86000,
			'hour' : 3600,
			'minute' : 60,
			'second' : 1
		}, keys = Object.keys(t), count = (keys.length - 1), value = false;

		for(var index = 0; index < keys.length; index++)
		{
			var key = keys[index]; if(seconds <= t[key]) continue;

			var n = count >= (index+1) ? keys[(index+1)] : null,
			f = Math.floor(seconds / t[key]),
			s = n ? Math.floor((seconds - (f * t[key])) / t[n]) : 0;

			value = `${f} ${key}${f == 1 ? '' : 's'}` + (s > 0 ? (` and ${s} ${n}${s == 1 ? '' : 's'}`) : '') + ' ago';

			break;
		}

		return value;
	};

	let apply = (offset) =>
	{
		$('tbody tr.directory > td:nth-child(2), tbody tr.file > td:nth-child(2)').each((index, item) =>
		{
			item = $(item);

			if(item[0].hasAttribute('data-raw'))
			{
				var [short, full] = formatDate(item.attr('data-raw'));
				var offset_hours = offset > 0 ? -Math.abs(offset) : Math.abs(offset); offset_hours = offset_hours / 60;
				var e = $('<span/>'), modtitle = formatSince(config.timestamp - parseInt(item.attr('data-raw')));

				if(modtitle)
				{
					e.attr('title', `${modtitle} (UTC${(offset_hours > 0 ? '+' : '') + offset_hours})`);
				}

				e.html(short).append($('<span/>', {
					'data-view' : 'desktop',
					text : ' ' + full
				}));

				item.html(e);
			}
		});
	};

	var offset = getOffset(), cookie = Cookies.get('ei-client_timezone_offset');

	if(cookie == null || cookie != offset)
	{
		Cookies.set('ei-client_timezone_offset', offset, {
			sameSite : 'lax'
		});

		apply(offset);
	}
};

setSorting();

if(config.debug) console.log('sorting', config.sorting);

window.addEventListener('resize', debounce((e) =>
{
	config.mobile = Modernizr.mq('(max-width: 640px)');
}));

document.addEventListener('DOMContentloaded', (e) =>
{
	if(config.debug) console.log('DOMContentloaded');
});

$(document).ready(() =>
{
	bind(); setDates();

	$('.filter-container > input[type="text"]').val('');

	config.mobile = Modernizr.mq('(max-width: 640px)');

	var menu = createMenu();

	menu.css({
		top : $('body > div.top-bar').outerHeight() + 'px',
		visibility : 'unset',
		display : 'none'
	});

	if(config.mobile === false && config.preview.enabled === true)
	{
		var preview = new $.fn.imagePreview({
			elements: ['a.preview', 'div.preview'],
			hoverDelay : config.preview.hover_delay,
			windowMargin: config.preview.window_margin,
			staticPreview : config.preview.static,
			extensions : {
				images : config.extensions.image,
				videos : config.extensions.video
			}
		});

		if(config.preview.cursor_indicator === true)
		{
			$(preview).on('load', (e, data) =>
			{
				if(config.debug) console.log('load', data);
			});

			$(preview).on('loadChange', (e, state) =>
			{
				$('body > table tr.file a.preview').css('cursor', state ? 'progress' : 'pointer');
			});
		}
	}
});