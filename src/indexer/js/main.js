/**
 * @license
 * 
 * <eyy-indexer-main> [https://github.com/sixem/eyy-indexer]
 * 
 * Licensed under GPL-3.0
 * @author   emy [admin@eyy.co]
 * @version  1.1.5
 */

(() =>
{
	'use strict';

	const main = {
		store  : {
			preview : {},
			defaults : {},
			selection : {},
			selected : null,
			gallery : null,
			refresh : false,
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
		checkNested : (obj, ...args) =>
		{
			for (var i = 0; i < args.length; i++)
			{
				if(!obj || !obj.hasOwnProperty(args[i])) return false;
				obj = obj[args[i]];
			}
			return true;
		},
		getReadableSize : (bytes = 0) =>
		{
			/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

			if(bytes === 0) return '0.00 B';

			var byteUnits = [...config.format.sizes], i = -1;

			byteUnits.shift();

			do {
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
				var client, keys_required = ['gallery', 'sort'], defaults = {
					gallery : {
						reverse_options : config.gallery.reverse_options,
						list_alignment : config.gallery.list_alignment,
						autoplay : true
					}
				};

				try
				{
					client = JSON.parse(Cookies.get('ei-client'));

					(keys_required).forEach((key) =>
					{
						if(!client.hasOwnProperty(key))
						{
							client[key] = defaults.hasOwnProperty(key) ? defaults[key] : {};
						}
					});

					Object.keys(defaults).forEach((key) =>
					{
						Object.keys(defaults[key]).forEach((option) =>
						{
							if(!client[key].hasOwnProperty(option)) client[key][option] = defaults[key][option];
						});
					});
				} catch (e) {
					var client = {};

					(keys_required).forEach((key) => client[key] = {});

					main.client.set(Object.assign(client, defaults));
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
			available : () =>
			{
				if(config.hasOwnProperty('themes') && config.themes.pool.length > 0 ||
					config.gallery.enabled === true)
				{
					return true;
				}

				return false;
			},
			create : {
				option : (e, text, options = {}, title = null) =>
				{
					if(options.hasOwnProperty('class')) options.class = ('option ' + options.class);

					var wrapper_attributes = Object.assign({
						class : 'option'
					}, options), text_attributes = {
						class : 'option-text',
						text : text
					};

					if(title) text_attributes.title = title;

					return e
					.wrap($('<div/>'))
					.parent().wrap($('<div/>', wrapper_attributes))
					.parent().prepend($('<div/>', text_attributes));
				},
				section : (id, header = null) =>
				{
					return $('<div/>', {
						'class' : 'section' ,
						'data-key' : id
					})
					.append($('<div/>', {
						class : 'header',
						text : header ? header : main.capitalize(id)
					}));
				},
				select : (values, options = {}, selected = null) =>
				{
					var e = $('<select/>', options);

					e.append(values.map((value, index) =>
					{
						value.text = main.capitalize(value.text);
						var option = $('<option/>', value);

						if(selected !== null)
						{
							if(selected(option, index, e) === true)
							{
								option[0].selected = true;
								e[0].selectedIndex = index;
							}
						}

						return option;
					}));

					return e;
				},
				check : (options = {}, selected = null) =>
				{
					var checked = (selected !== null) ? selected() : false;
					if(checked) options.checked = '';
					var e = $('<input/>', Object.assign(options, {
						type : 'checkbox'
					})); e[0].checked = checked;
					return e;
				}
			},
			close : () =>
			{
				$('.focus-overlay, .settings-container').remove();
			},
			update : {  /* update functions for settings which require live updating */
				theme : (theme) =>
				{
					main.theme.set(theme === false ? null : theme, false);
				},
				gallery : {
					list_alignment : (alignment) =>
					{
						if(main.store.gallery)
						{
							var elements = [
								'.gallery-container div.content-container .media .loader',
								'.gallery-container div.content-container .list',
								'.gallery-container div.content-container .list > div.drag'
							];

							elements.forEach((e) => alignment === 0 ? $(e).removeClass('reversed') : $(e).addClass('reversed'));
							var detached = $(elements[1]).detach(), media = ('.gallery-container div.content-container .media');
							alignment === 1 ? detached.insertBefore(media) : detached.insertAfter(media);
							(main.store.gallery).settings.list.reverse = (alignment === 0 ? false : true);
						}
					},
					reverse_options : (value) =>
					{
						if(main.store.gallery) main.store.gallery.settings.reverse_options = value;
					},
					autoplay : (value) =>
					{
						if(main.store.gallery) main.store.gallery.settings.autoplay = value;
					}
				}
			},
			options : {
				gather : (container) =>
				{
					/* gather set settings data */
					var elements = ['select', 'input[type="checkbox"]'], data = {};

					container.find(elements.join(',')).each((i, e) =>
					{
						e = $(e);

						if(e[0].hasAttribute('name'))
						{
							var id = e.attr('name'), section = e.closest('.section').attr('data-key');

							if(!data.hasOwnProperty(section)) data[section] = {};

							if(e.is('select'))
							{
								data[section][id] = e[0].selectedIndex;
							} else if(e.is('input[type="checkbox"]'))
							{
								data[section][id] = e[0].checked;
							}
						}
					});

					return data;
				},
				set : (data, client = null) =>
				{
					/* set gathered settings data */
					if(!client) client = main.client.get();

					Object.keys(data).forEach((key) =>
					{
						var is_main = (key === 'main');

						if(!is_main && !client.hasOwnProperty(key)) client[key] = {};

						Object.keys(data[key]).forEach((option) =>
						{
							var value = null;

							switch(option)
							{
								case ('theme'):
									if(data[key][option] <= (config.themes.pool.length - 1))
										value = config.themes.pool[data[key][option]] === 'default' ? false : config.themes.pool[data[key][option]]; break;
								default:
									value = data[key][option]; break;
							}

							var changed = (is_main ? (client[option] !== value) : (client[key][option] !== value));

							data[key][option] = { value, changed };

							if(is_main)
							{
								client[option] = value;
							} else {
								client[key][option] = value;
							}

							if(changed)
							{
								/* call the live update function (if any) for the changed settings */
								if(is_main && main.settings.update.hasOwnProperty(option))
								{
									main.settings.update[option](value);
								} else if(main.settings.update[key].hasOwnProperty(option))
								{
									main.settings.update[key][option](value);
								}
							}
						});
					});

					if(config.debug) console.log('set settings', data);

					main.client.set(client);

					return data;
				}
			},
			apply : (e, client = null) =>
			{
				/* apply settings (gather and set settings, then close menu) */
				if(!client) client = main.client.get();
				var set = main.settings.options.set(main.settings.options.gather(e), client);
				main.settings.close();
			},
			show : () =>
			{
				/* build the settings menu */
				if($('.settings-container').length > 0) return;

				if($('.focus-overlay').length === 0) $('<div/>', { class : 'focus-overlay' })
					.appendTo($('body')).on('click', (e) => main.settings.close());

				let container = $('<div/>', {
					class : 'settings-container'
				}), client = main.client.get();

				var getMain = (section = main.settings.create.section('main'), settings = 0) =>
				{
					if(config.hasOwnProperty('themes') && config.themes.pool.length > 0)
					{
						section.append(main.settings.create.option(
							main.settings.create.select(config.themes.pool.map((e, i) =>
							{
								return { value : e, text : e };
							}), { name : 'theme' }, (option, index, parent) =>
							{
								return (config.themes.set === null && index === 0) || (option[0].value == config.themes.set);
							}), 'Theme')); settings++;
					}

					return { settings, section };
				};

				var getGallery = (section = main.settings.create.section('gallery'), settings = 0) =>
				{
					if(!config.mobile)
					{
						section.append(main.settings.create.option(
							main.settings.create.select(['right', 'left'].map((e, i) =>
							{
								return { value : 'align-' + e, text : e };
							}), { name : 'list_alignment' }, (option, index, parent) =>
							{
								return (index === client.gallery.list_alignment);
							}), 'List Alignment')); settings++;
					}

					[['Reverse Search', 'reverse_options', 'Toggle visibility of reverse search options on images.'],
					['Autoplay Videos', 'autoplay', 'Toggle autoplaying of videos.']]
					.forEach((e) =>
					{
						var [label, key, description] = e;

						section.append(main.settings.create.option(
							main.settings.create.check({ name : key },
								() => {
									return main.checkNested(client, 'gallery', key) ? (client.gallery[key]) : config.gallery[key];
								}), label, { class : 'interactable' }, description)); settings++;
					});

					return { settings, section };
				};

				var sections = [getMain()];
				if(config.gallery.enabled) sections.push(getGallery());

				container.append($('<div/>', {
					class : 'wrapper'
				}).append(sections.map((e) => e.settings > 0 ? e.section : null).filter((e) => e !== null)));

				var bottom = $('<div/>', {
					class : 'bottom' })
				.appendTo(container);

				$('<div/>', {
					class : 'apply ns',
					text : 'Apply'
				}).appendTo(bottom)
				.on('click', (e) => main.settings.apply(container, client));

				$('<div/>', {
					class : 'cancel ns',
					text : 'Cancel'
				}).appendTo(bottom)
				.on('click', (e) => main.settings.close());

				$('body').append(container);

				/* make option divs click event toggle the input value */
				container.find('div.section > .option.interactable').on('mouseup', (e) =>
				{
					/* cancel the event if any text is selected */
					if(window.getSelection().toString()) return;

					var checkbox = $(e.currentTarget).find('input[type="checkbox"]');

					if(checkbox.length > 0 && !$(e.target).is('input'))
					{
						checkbox[0].checked = !checkbox[0].checked; return;
					}
				});
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

				/* add menu item if gallery is enabled */
				if(config.gallery.enabled === true && $('a.preview').length > 0)
				{
					items.unshift({
						text : '[Open] Gallery',
						id : 'gallery'
					});
				}

				/* do a light check to see if any settings are available to be changed, if so, add menu item */
				if(main.settings.available())
				{
					items.unshift({
						text : '[Open] Settings',
						id : 'settings',
						class : 'settings'
					});
				}

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
				
				if(theme === null || !theme)
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
			apply : (query = null, selector = null) =>
			{
				main.store.refresh = true;

				if(!query) query = '';

				var data = {
					reset : query === '',
					shown : {
						directories : 0,
						files : 0
					},
					hidden : {
						directories : 0,
						files : 0
					},
					size : 0
				}, match = null;

				if(main.store.gallery) main.store.gallery.data.selected.index = 0;

				$('body > table tr.file, body > table tr.directory').each((index, item) =>
				{
					item = $(item); 

					if(data.reset === true)
					{
						item.css('display', '');
						return true;
					}

					var is_file = item.hasClass('file');

					try
					{
						match = {
							valid : true,
							data : (item.find('td:eq(0)').attr('data-raw')).match(new RegExp(query, 'i'))
						};
					} catch(e) {
						match = {
							valid : false,
							reason : e
						}
					}

					item.css('display', (match.valid && match.data) ? '' : 'none');

					if(match.valid && match.data && is_file)
					{
						var size = item.find('td:eq(2)').attr('data-raw');
						if(!isNaN(size)) data.size = (data.size + parseInt(size));
					}

					(match.valid && match.data) ?
						((is_file) ? data.shown.files++ : data.shown.directories++) :
						((is_file) ? data.hidden.files++ : data.hidden.directories++);
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

				var option = $('body > div.menu > #gallery'), previews = $('body > table tr.file:visible a.preview').length, status = $('.filter-container div.status');

				if(status.length > 0)
				{
					if(data.reset)
					{
						status.text('').removeClass('se');
					} else {
						if(match && match.valid === false)
						{
							status.text(match.reason).addClass('se');
						} else {
							var matches = (data.shown.files + data.shown.directories);
							status.text(`${matches} result${matches === 1 ? '' : 's'}.`).removeClass('se');
						}
					}
				}

				/* hide or show the gallery menu option */
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
					if(seconds === 0)
					{
						return 'Now';
					} else if(seconds < 0)
					{
						return false;
					}

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
					'reverse_options' : main.checkNested(client, 'gallery', 'reverse_options') ? (client.gallery.reverse_options) : config.gallery.reverse_options,
					'autoplay' : main.checkNested(client, 'gallery', 'autoplay') ? (client.gallery.autoplay) : config.gallery.autoplay,
					'scroll_interval' : config.gallery.scroll_interval,
					'list' : {
						'show' : list_state == null ? true : (list_state ? true : false),
						'reverse' : main.checkNested(client, 'gallery', 'list_alignment') ? (client.gallery.list_alignment === 0 ? false : true) : false
					}
				});

				if(main.store.gallery !== false) $(main.store.gallery).on('unbound', (e, state) => main.bind());
			}
		},
		overlay : {
			hide : (callback = () => {}) =>
			{
				var i = 0;

				[{
					e : $('.filter-container'),
					func : main.filter.toggle
				},
				{
					e : $('body > div.menu'),
					func : main.menu.toggle
				}]
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
		events : {
			scroll : () =>
			{
				var path = $('body > div.path'),
				top = $('div.top-bar > div.directory-info > div.quick-path'),
				visible = $(window).scrollTop() < path.offset().top + path.outerHeight();

				if(!visible)
				{
					if(top.length === 0)
					{
						top = $('<div/>', {
							'class' : 'quick-path',
							'data-view' : 'desktop'
						}).html($('body > div.path').html());

						$('div.top-bar > div.directory-info').append(top);
					}

					top.fadeIn(150).css('display', 'inline-block');
				} else {
					top.fadeOut(150);
				}
			}
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

			$(window).on('scroll', main.debounce((e) =>
			{
				main.events.scroll();
			}));
		}
	};

	$('body > .top-bar > div.extend').on('click', (e) =>
	{
		main.menu.toggle(e.currentTarget);
	});

	$('.filter-container > div.close > span').on('click', (e) =>
	{
		main.filter.toggle();
	});

	$('.filter-container > div input[type="text"]').on('input', (e) =>
	{
		var target = $(e.currentTarget);

		main.filter.apply(target.val(), target);
	});

	$(document).on('click', 'body > div.menu #filter', (e) =>
	{
		main.filter.toggle();
		main.menu.toggle();
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
			main.gallery.load(null);
			main.menu.toggle(false);
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

		/* set a skip directory var if we're only sorting sizes or types (as they should be unaffected by these). */
		var skip_directories = (config.sorting.hasOwnProperty('sort_by') && (index === 2 || index === 3));

		if(config.sorting.types === 0 || config.sorting.types === 2)
		{
			if(!skip_directories) rows.directories.sort(main.comparer($(column).index()));
		}

		if(config.sorting.types === 0 || config.sorting.types === 1)
		{
			rows.files.sort(main.comparer($(column).index()));
		}

		column.asc = !column.asc;

		$('body > table span.sort-indicator').removeClass('up down');
		parent.find('> span.sort-indicator').addClass(column.asc ? 'down' : 'up').show();

		var client = main.client.get();

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

	$(document).ready(() =>
	{
		main.bind();
		main.dates.load();

		$('.filter-container > input[type="text"]').val('');

		config.mobile = Modernizr.mq('(max-width: 640px)');

		var menu = main.menu.create();

		menu.css({
			top : $('body > div.top-bar').innerHeight() + 'px',
			visibility : 'unset',
			display : 'none'
		});

		if(config.mobile === false && config.preview.enabled === true)
		{
			main.store.preview.main = new $.fn.imagePreview({
				elements: ['a.preview', 'div.preview'],
				hoverDelay : config.preview.hover_delay,
				windowMargin: config.preview.window_margin,
				staticPreview : config.preview.static,
				extensions : {
					images : config.extensions.image,
					videos : config.extensions.video
				}
			});

			$(main.store.preview.main).on('loaded', (e, data) =>
			{
				if(data)
				{
					if(config.debug)
					{
						console.log('preview_loaded', data);
					}
				}
			});

			if(config.preview.cursor_indicator === true)
			{
				$(main.store.preview.main).on('loadChange', (e, state) =>
				{
					$('body > table tr.file a.preview').css('cursor', state ? 'progress' : 'pointer');
				});
			}
		}

		main.events.scroll();
	});

	/* create client cookie if it doesn't exist or is invalid JSON. */
	main.client.get();

	/* load sorting indicators */
	main.sort.load();

	if(config.debug) console.log('config', config);
})();