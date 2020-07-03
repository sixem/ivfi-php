/**
 * @license
 * 
 * <eyy-indexer-main> [https://github.com/sixem/eyy-indexer]
 * 
 * Licensed under GPL-3.0
 * @author   emy [admin@eyy.co]
 * @version  1.1.5
 */

'use strict';

(() =>
{
	const main = {
		store  : {
			defaults : {},
			selection : {},
			selected : null,
			gallery : null,
			refresh : false
		},
		debounce : (f) =>
		{
			var timer;

			return (e) =>
			{
				if(timer)
				{
					clearTimeout(timer);
				}

				timer = setTimeout(f, 100, e);
			};
		},
		getReadableSize : (bytes = 0) =>
		{
			/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

			if(bytes === 0) return '0.00 B';

			var byteUnits = [...config.format.sizes], i = -1;

			byteUnits.shift();

			do{
				bytes = bytes / 1024; i++;
			} while (bytes > 1024);

			return Math.max(bytes, 0.1).toFixed(1) + byteUnits[i];
		},
		capitalize : (input) =>
		{
			return input.charAt(0).toUpperCase() + input.slice(1);
		},
		fallbackCopyTextToClipboard : (text) =>
		{
			/* https://stackoverflow.com/a/30810322 */

			var area = document.createElement('textarea');
			area.value = text; area.style.position = 'fixed';

			document.body.appendChild(area);
			area.focus(); area.select();

			try
			{
				var successful = document.execCommand('copy');
				if(config.debug) console.log('fallback', 'copying text command was ' + (successful ? 'successful' : 'unsuccessful'));
			} catch (err) {
				if(config.debug) console.error('fallback', 'unable to copy', err);
			}

			document.body.removeChild(area);
		},
		copyTextToClipboard : (text) =>
		{
			/* https://stackoverflow.com/a/30810322 */

			if(!navigator.clipboard)
			{
				main.fallbackCopyTextToClipboard(text); return;
			}

			navigator.clipboard.writeText(text).then(() =>
			{
				if(config.debug) console.log('async', 'copying to clipboard was successful.');
			}, (err) =>
			{
				if(config.debug) console.error('async', 'could not copy text: ', err);
			});
		},
		getCellValue : (row, index) =>
		{
			var attribute = $(row).children('td').eq(index).data('raw');
			return attribute !== undefined ? attribute : $(row).children('td').eq(index).text();
		},
		comparer : (index) =>
		{
			return (a, b) =>
			{
				var valA = main.getCellValue(a, index), valB = main.getCellValue(b, index);
				return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
			};
		},
		client : {
			get : () =>
			{
				var client;

				try
				{
					client = JSON.parse(Cookies.get('ei-client'));
					['gallery', 'sort'].forEach((key) =>
					{
						if(!client.hasOwnProperty(key)) client[key] = {};
					});
				} catch (e) {
					client = {
						gallery : {},
						sort : {}
					};

					main.client.set(client);
				}

				return client;
			},
			set : (client, options = {}) =>
			{
				options = Object.assign({
					sameSite : 'lax',
					expires : 365
				}, options);

				Cookies.set('ei-client', JSON.stringify(client), options);
			}
		},
		settings : {
			close : () =>
			{
				[$('.focus-overlay'), $('.settings-container')].forEach((e) => e.remove());
			},
			apply : (e, client = null) =>
			{
				if(!client) client = main.client.get();

				var getValue = (selector, key) =>
				{
					var element = e.find(selector);
					return (element.length > 0) ? element[0][key] : null;
				};

				var applied = {
					theme : getValue('div.section.main > div > select#theme-select', 'selectedIndex'),
					gallery : {
						list_alignment : getValue('div.section.gallery > div > select#list-alignment', 'selectedIndex')
					}
				};

				/* Save and set theme */
				if(applied.theme && applied.theme === 0)
				{
					client.theme = false;

					main.theme.set(null, false);
				} else if(applied.theme <= (config.themes.pool.length - 1)) {
					var theme = config.themes.pool[applied.theme];

					main.theme.set(theme, false);
					client.theme = theme;
				}

				/* Save gallery list alignment and apply it if the gallery is active */
				if(applied.gallery.list_alignment && client.gallery.hasOwnProperty('list_alignment') && 
					client.gallery.list_alignment !== applied.gallery.list_alignment && main.store.gallery)
				{
					var elements = [
						'.gallery-container div.content-container .media .loader',
						'.gallery-container div.content-container .list',
						'.gallery-container div.content-container .list > div.drag'
					];

					elements.forEach((e) => applied.gallery.list_alignment === 0 ? $(e).removeClass('reversed') : $(e).addClass('reversed'));
					var detached = $(elements[1]).detach(), media = ('.gallery-container div.content-container .media');
					applied.gallery.list_alignment === 1 ? detached.insertBefore(media) : detached.insertAfter(media);
					(main.store.gallery).settings.list.reverse = (applied.gallery.list_alignment === 0 ? false : true);
				}

				client.gallery.list_alignment = applied.gallery.list_alignment;

				/* Update client cookie */
				main.client.set(client);
				main.settings.close();
			},
			show : () =>
			{
				if($('.settings-container').length > 0) return;

				if($('.focus-overlay').length === 0)
				{
					var overlay = $('<div/>', {
						class : 'focus-overlay'
					}).appendTo($('body'));

					overlay.on('click', (e) =>
					{
						main.settings.close();
					});
				}

				var container = $('<div/>', {
					class : 'settings-container'
				}), client = main.client.get();

				if(!client.hasOwnProperty('gallery')) client.gallery = {};

				var base = () =>
				{
					var section = $('<div/>', {
						class : 'section main'
					})
					.append($('<div/>', {
						class : 'header',
						text : 'Main'
					})), settings = 0;

					if(config.hasOwnProperty('themes') && config.themes.pool.length > 0)
					{
						var theme = $('<div/>')
						.append($('<span/>', {
							text : 'Theme: '
						}))
						.append($('<select/>', {
							id : 'theme-select'
						}).append(config.themes.pool.map((e, i) =>
						{
							return $('<option/>', { value : e, text : main.capitalize(e) });
						})));

						theme.find('> select > option').each((i, e) =>
						{
							if((config.themes.set === null && i === 0) || e.value == config.themes.set)
							{
								e.selected = true; $(e).parent('select')[0].selectedIndex = i;
							}
						});

						settings++;
						section.append(theme);
					}

					return { settings, section };
				};

				var gallery = () =>
				{
					var section = $('<div/>', { class : 'section gallery' })
					.append($('<div/>', { class : 'header', text : 'Gallery' })), settings = 0;

					if(!config.mobile)
					{
						var list_alignment = $('<div/>')
						.append($('<span/>', {
							text : 'List Alignment: '
						}))
						.append($('<select/>', {
							id : 'list-alignment'
						}).append(['right', 'left'].map((e, i) =>
							$('<option/>', {
								value : ('align-' + e),
								text : main.capitalize(e)
							})
						)));

						if(client.gallery.hasOwnProperty('list_alignment'))
						{
							list_alignment.find('> select > option').each((i, e) =>
							{
								if(i === client.gallery.list_alignment)
								{
									e.selected = true; $(e).parent('select')[0].selectedIndex = i;
								}
							});
						}

						settings++;
						section.append(list_alignment);
					}

					return { settings, section };
				};

				var base = base(), gallery = gallery();

				container.append($('<div/>', {
					class : 'wrapper'
				})
				.append(base.settings > 0 ? base.section : null)
				.append(gallery.settings > 0 ? gallery.section : null));

				var bottom = $('<div/>', { class : 'bottom' }).appendTo(container),
				apply = $('<div/>', { class : 'apply ns', text : 'Apply' }).appendTo(bottom),
				cancel = $('<div/>', { class : 'cancel ns', text : 'Cancel' }).appendTo(bottom);

				apply.on('click', (e) => main.settings.apply(container, client));
				cancel.on('click', (e) => main.settings.close());

				$('body').append(container);
			}
		},
		menu : {
			create : () =>
			{
				var container = $('<div/>', {
					class : 'menu'
				}).appendTo($('body'));

				var items = [
					{
						text : '[Show] Filter',
						id : 'filter'
					},
					{
						text : '[Copy] WGET',
						id : 'copy'
					},
				];

				if(config.gallery.enabled === true && $('a.preview').length > 0)
				{
					items.unshift({
						text : '[Open] Gallery',
						id : 'gallery'
					});
				}

				items.unshift({
					text : '[Open] Settings',
					id : 'settings',
					class : 'settings'
				});

				items.forEach((item) =>
				{
					var e = $('<div/>', {
						text : item.text,
						class : 'ns' + (item.hasOwnProperty('class') ? ' ' + item.class : '')
					}).appendTo(container);

					if(item.hasOwnProperty('id')) e.attr('id', item.id);
				});

				return container;
			},
			toggle : (state = null) =>
			{
				var menu = $('body > div.menu');

				menu.css(
					'display',
					typeof state === 'boolean' ? (state ? 'inline-block' : 'none') : (menu.is(':hidden') ? 'inline-block' : 'none')
				);

				$('body > .top-bar > div.extend').html(menu.is(':hidden') ? '&#x25BE;' : '&#x25B4;');

				return menu.is(':hidden');
			}
		},
		theme : {
			set : (theme = null, set_cookie = true) =>
			{
				var sheets = $('head > link[rel="stylesheet"]').filter((i, sheet) =>
					sheet.hasAttribute('href') && (sheet.getAttribute('href')).match(new RegExp('\/(themes)\/', 'i')));

				config.themes.set = theme;
				
				if(theme === null | !theme)
				{
					sheets.each((i, sheet) => sheet.remove());

					return false;
				} else {
					if(set_cookie)
					{
						main.client.set(main.client.get().theme = theme);
					}
				}

				$('head').append($('<link/>', {
					rel : 'stylesheet',
					type : 'text/css',
					href : `${config.themes.path}/${theme}.css`
				}));

				sheets.each((i, sheet) => sheet.remove());
			}
		},
		filter : {
			apply : (query = null) =>
			{
				main.store.refresh = true;

				if(!query)
				{
					query = '';
				}

				var data = {
					reset : query === '',
					shown : { directories : 0, files : 0 },
					hidden : { directories : 0, files : 0 },
					size : 0
				};

				$('body > table tr.file, body > table tr.directory').each((index, item) =>
				{
					item = $(item); 

					if(data.reset === true)
					{
						item.css('display', '');
						return true;
					}

					var is_file = item.hasClass('file'), match = (item.find('td:eq(0)').attr('data-raw')).match(new RegExp(query, 'i'));

					item.css('display', match ? '' : 'none');

					if(match && is_file)
					{
						var size = item.find('td:eq(2)').attr('data-raw');
						if(!isNaN(size)) data.size = (data.size + parseInt(size));
					}

					(match) ? ((is_file) ? data.shown.files++ : data.shown.directories++) : ((is_file) ? data.hidden.files++ : data.hidden.directories++);
				});

				var top = {
					container : $('body > div.top-bar')
				};

				['size', 'files', 'directories'].forEach((s) => top[s] = top.container.find(`[data-count="${s}"]`));

				if(!main.store.defaults.hasOwnProperty('top_values'))
				{
					main.store.defaults.top_values = {
						size : top.size.text(),
						files : top.files.text(),
						directories : top.directories.text()
					};
				}

				top.size.text(
					(data.reset) ? main.store.defaults.top_values.size : 
					main.getReadableSize(data.size)
				);

				top.files.text(
					(data.reset) ? main.store.defaults.top_values.files : 
					`${data.shown.files} file${data.shown.files === 1 ? '' : 's'}`
				);

				top.directories.text(
					(data.reset) ? main.store.defaults.top_values.directories : 
					`${data.shown.directories} ${data.shown.directories === 1 ? 'directory' : 'directories'}`
				);

				var option = $('body > div.menu > #gallery'), previews = $('body > table tr.file:visible a.preview').length;

				if(!data.reset && previews === 0 && option.length > 0)
				{
					if(option.css('display') !== 'none')
					{
						option.css('display', 'none');
					}
				} else if((previews > 0 || data.reset) && option.length > 0)
				{
					if(option.css('display') === 'none')
					{
						option.css('display', 'block');
					}
				}
			},
			toggle : () =>
			{
				var container = $('.filter-container'), input = container.find('input[type="text"]');

				if(container.is(':visible'))
				{
					container.hide();
				} else {
					input.val('');
					main.filter.apply(null);
					container.show();
				}

				input.focus();
			}
		},
		dates : {
			convert : (i) =>
			{
				return i < 10 ? '0' + i : i;
			},
			load : () =>
			{
				var offsetGet = () =>
				{
					let date = new Date();
					return date.getTimezoneOffset();
				};

				var formatDate = (ts) =>
				{
					var convert = main.dates.convert, date = new Date(ts * 1000);

					return [
						`${convert(date.getDate())}/${convert(date.getMonth()+1)}/${date.getFullYear().toString().substring(2)}`,
						`${convert(date.getHours())}:${convert(date.getMinutes())}`
					];
				};

				var formatSince = (seconds) =>
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

				var apply = (offset) =>
				{
					$('tbody tr.directory > td:nth-child(2), tbody tr.file > td:nth-child(2)').each((index, item) =>
					{
						item = $(item);

						if(item[0].hasAttribute('data-raw'))
						{
							var [short, full] = formatDate(item.attr('data-raw'));
							var offset_hours = offset > 0 ? -Math.abs(offset) : Math.abs(offset); offset_hours = offset_hours / 60;
							var e = $('<span/>'), mt = formatSince(config.timestamp - parseInt(item.attr('data-raw')));

							if(mt)
							{
								e.attr('title', `${mt} (UTC${(offset_hours > 0 ? '+' : '') + offset_hours})`);
							}

							e.html(short).append($('<span/>', {
								'data-view' : 'desktop',
								text : ' ' + full
							}));

							item.html(e);
						}
					});
				};

				var offset = offsetGet(), client = main.client.get();
				client.timezone_offset = offset;
				main.client.set(client);

				apply(offset);
			}
		},
		sort : {
			load : () =>
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
			}
		},
		gallery : {
			load : (index = 0) =>
			{
				if(config.debug) console.log('gallery.load =>', index);
				if(!config.gallery.enabled) return false;

				if(main.store.gallery && main.store.gallery !== false)
				{
					let items = main.store.refresh ? main.getTableItems() : null;
					if(items !== null && items.length === 0) return false;
					main.store.gallery.show(true, index === null ? main.store.gallery.data.selected.index : index, items);
					if(main.store.refresh) main.store.refresh = false;

					return;
				}

				var list_state = null, client = main.client.get();

				if(!client.hasOwnProperty('gallery'))
				{
					client.gallery = {
						'list_state' : 1
					};

					main.client.set(client);
				}

				list_state = JSON.parse(client.gallery.hasOwnProperty('list_state') ? client.gallery.list_state : 1);

				main.store.gallery = new $.fn.gallery(main.getTableItems(), {
					'start' : index === null ? 0 : index,
					'filter' : false,
					'console' : config.debug,
					'fade' : config.gallery.fade,
					'mobile' : config.mobile,
					'reverse_options' : config.gallery.reverse_options,
					'scroll_interval' : config.gallery.scroll_interval,
					'list' : {
						'show' : list_state == null ? true : (list_state ? true : false),
						'reverse' : client.gallery.hasOwnProperty('list_alignment') ? (client.gallery.list_alignment === 0 ? false : true) : false
					}
				});

				if(main.store.gallery !== false) $(main.store.gallery).on('unbound', (e, state) => main.bind());
			}
		},
		overlay : {
			hide : (callback = () => {}) =>
			{
				var i = 0;

				[
					{
						e : $('.filter-container'),
						func : main.filter.toggle
					},
					{
						e : $('body > div.menu'),
						func : main.menu.toggle
					}
				]
				.forEach((obj) =>
				{
					if((obj.e).length > 0 && (obj.e).is(':visible'))
					{
						obj.func(); i++;
					}
				});

				callback(i > 0);
			}
		},
		getTableItems : () =>
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
		},
		bind : () =>
		{
			$(document).off('keydown').on('keydown', (e) =>
			{
				if(e.shiftKey && e.keyCode === 70)
				{
					e.preventDefault();
					main.filter.toggle();
				} else if(e.keyCode === 27)
				{
					main.overlay.hide((state) =>
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
							main.gallery.load(null);
							main.menu.toggle(false);
						}
					}
				}
			});
		}
	};

	$('body > .top-bar > div.extend').on('click', (e) =>
	{
		main.menu.toggle();
	});

	$('.filter-container > div.close > span').on('click', (e) =>
	{
		main.filter.toggle();
	});

	$('.filter-container > div input[type="text"]').on('input', (e) =>
	{
		main.filter.apply(
			$(e.currentTarget).val()
		);
	});

	$(document).on('click', 'body > div.menu #filter', (e) =>
	{
		main.filter.toggle(); main.menu.toggle();
	});

	$(document).on('click', 'body > div.menu #settings', (e) =>
	{
		main.settings.show();
		main.menu.toggle(false);
	});

	if(config.gallery.enabled === true)
	{
		$(document).on('click', 'body > div.menu #gallery', (e) =>
		{
			main.gallery.load(null); main.menu.toggle(false);
		});

		$('tbody tr.file a.preview').on('click', (e) =>
		{
			e.preventDefault();

			if($(e.target).is('a'))
			{
				var parents = $(e.target).closest('table').find('tr.file:visible')
				.filter((index, element) => $(element).find('a.preview').length > 0);

				let index = parents.index($(e.target).closest('tr.file'));

				main.gallery.load(index !== -1 ? index : 0);
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

		main.copyTextToClipboard(wget());
		main.menu.toggle(false);
	});

	$('table th span[sortable]').on('click', (e) =>
	{
		var parent = $(e.currentTarget).parents('th'), index = parent.index();
		var column = !$(e.currentTarget).is('th') ? parent[0] : e.currentTarget;
		var table = $(column).parents('table').eq(0);

		var rows = {
			directories : table.find('tbody tr.directory').toArray(),
			files : table.find('tbody tr.file').toArray()
		};

		/* Set a skip directory var if we're only sorting sizes or types (as they should be unaffected by these). */
		var skip_directories = (config.sorting.hasOwnProperty('sort_by') && (index === 2 || index === 3))

		if(config.sorting.types === 0 || config.sorting.types === 2)
		{
			if(!skip_directories) rows.directories.sort(main.comparer($(column).index()))
		}

		if(config.sorting.types === 0 || config.sorting.types === 1)
		{
			rows.files.sort(main.comparer($(column).index()))
		}

		column.asc = !column.asc;

		$('body > table span.sort-indicator').removeClass('up down');
		parent.find('> span.sort-indicator').addClass(column.asc ? 'down' : 'up').show();

		var client = main.client.get();
		if(!client.hasOwnProperty('sort')) client.sort = {};
		client.sort.ascending = (column.asc ? 1 : 0);
		client.sort.row = index;
		main.client.set(client);

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

		main.store.refresh = true;
		main.store.selected = null;

		$('tbody tr.last').removeClass('last');
	});

	window.addEventListener('resize', main.debounce((e) =>
	{
		config.mobile = Modernizr.mq('(max-width: 640px)');
	}));

	document.addEventListener('DOMContentloaded', (e) =>
	{
		if(config.debug) console.log('DOMContentloaded');
	});

	$(document).ready(() =>
	{
		main.bind();
		main.dates.load();

		$('.filter-container > input[type="text"]').val('');

		config.mobile = Modernizr.mq('(max-width: 640px)');

		var menu = main.menu.create();

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

	/* Create client cookie if it doesn't exist or is invalid JSON. */
	main.client.get();

	/* Load sorting indicators */
	main.sort.load();

	if(config.debug) console.log('config', config);
})();