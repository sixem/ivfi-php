/**
 * @license
 * 
 * <eyy-indexer-main> [https://github.com/sixem/eyy-indexer]
 * 
 * Licensed under GPL-3.0
 * @author   emy [admin@eyy.co]
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
			refresh : false,
		},
		debounce : (f) =>
		{
			var timer;

			return (e) =>
			{
				if(timer) clearTimeout(timer);
				timer = setTimeout(f, 100, e);
			};
		},
		checkNested : (obj, ...args) =>
		{
			for(var i = 0; i < args.length; i++)
			{
				if(!obj || !Object.prototype.hasOwnProperty.call(obj, args[i])) return false;
				obj = obj[args[i]];
			}

			return true;
		},
		getReadableSize : (bytes = 0) =>
		{
			/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

			if(bytes === 0) return '0.00' + config.format.sizes[0];

			var i = 0;

			do {
				bytes = bytes / 1024; i++;
			} while (bytes > 1024);

			return Math.max(bytes, 0.1).toFixed(i < 2 ? 0 : 2) + config.format.sizes[i];
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
				var client, keys_required = ['gallery', 'sort', 'style'], defaults = {
					gallery : {
						reverse_options : config.gallery.reverse_options,
						list_alignment : config.gallery.list_alignment,
						fit_content : config.gallery.fit_content,
						autoplay : true
					},
					style : {
						compact : config.style.compact,
						theme : false
					}
				};

				try
				{
					client = JSON.parse(Cookies.get('ei-client'));

					(keys_required).forEach((key) =>
					{
						if(!Object.prototype.hasOwnProperty.call(client, key))
						{
							client[key] = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : {};
						}
					});

					var update = false;

					Object.keys(defaults).forEach((key) =>
					{
						Object.keys(defaults[key]).forEach((option) =>
						{
							if(!Object.prototype.hasOwnProperty.call(client[key], option))
							{
								client[key][option] = defaults[key][option];
								update = true;
							}
						});
					});

					if(update)
					{
						main.client.set(client);
					}
				} catch (e) /* On JSON.parse() error. Means that the client does not have a valid cookie, so we're creating it. */
				{
					client = {};

					/* Set default theme (if any). */
					if(config.style.themes.set)
					{
						defaults.style.theme = config.style.themes.set;
					}

					/* Create keys. */
					(keys_required).forEach((key) => client[key] = {});

					/* Merge and set cookie. */
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
				if(main.checkNested(config, 'style', 'themes', 'pool') && config.style.themes.pool.length > 0 ||
					config.gallery.enabled === true)
				{
					return true;
				}

				return false;
			},
			create : {
				option : (e, text, options = {}, title = null) =>
				{
					if(Object.prototype.hasOwnProperty.call(options, 'class')) options.class = ('option ' + options.class);

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
				/* creates a select option.
				 * set options['data-key'] to override section key. */
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
				/* creates a checkbox option.
				 * set options['data-key'] to override section key. */
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
			/* update functions for settings which require live updating */
			update : {
				style : {
					theme : (theme) =>
					{
						main.theme.set(theme === false ? null : theme, false);
					},
					compact : (value) =>
					{
						$('body')[value ? 'addClass' : 'removeClass']('compact');
					}
				},
				gallery : {
					list_alignment : (alignment) =>
					{
						if(main.gallery.instance)
						{
							var elements = [
								'.gallery-container div.content-container .media .loader',
								'.gallery-container div.content-container .list',
								'.gallery-container div.content-container .list > div.drag'
							];

							elements.forEach((e) => alignment === 0 ? $(e).removeClass('reversed') : $(e).addClass('reversed'));
							var detached = $(elements[1]).detach(), media = ('.gallery-container div.content-container .media');
							alignment === 1 ? detached.insertBefore(media) : detached.insertAfter(media);
							(main.gallery.instance).store.list.reverse = (alignment === 0 ? false : true);
						}
					},
					reverse_options : (value) =>
					{
						if(main.gallery.instance)
						{
							main.gallery.instance.store.reverse_options = value;
							var e = $('.gallery-container div.content-container .media .wrapper .cover .reverse');
							console.log(e);
							if(e.length > 0) e.remove();
						}
					},
					autoplay : (value) =>
					{
						if(main.gallery.instance) main.gallery.instance.store.autoplay = value;
					},
					fit_content : (value) =>
					{
						if(main.gallery.instance)
						{
							main.gallery.instance.store.fit_content = value;
							var wrapper = $('.gallery-container div.content-container .media .wrapper');

							if(wrapper && value)
							{
								wrapper.addClass('fill');

								/* force height recalculation */
								main.store.refresh = true;
								main.store.selected = null;
							} else if(wrapper)
							{
								wrapper.removeClass('fill');

								['.cover', '.cover img', 'video'].forEach((e) => $(e).css({
									height : '',
									width : ''
								}));
							}
						}
					}
				}
			},
			options : {
				gather : (container) =>
				{
					/* gather set settings data */
					var elements = ['select', 'input[type="checkbox"]'],
						data = {};

					container.find(elements.join(',')).each((i, e) =>
					{
						e = $(e);

						if(e[0].hasAttribute('name'))
						{
							var id = e.attr('name'),
								section = e[0].hasAttribute('data-key') ? e.attr('data-key') : e.closest('.section').attr('data-key');

							if(!Object.prototype.hasOwnProperty.call(data, section)) data[section] = {};

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

						if(!is_main && !Object.prototype.hasOwnProperty.call(client, key)) client[key] = {};

						Object.keys(data[key]).forEach((option) =>
						{
							var value = null;

							switch(option)
							{
								case ('theme'):
									if(data[key][option] <= (config.style.themes.pool.length - 1))
										value = config.style.themes.pool[data[key][option]] === 'default' ? false : config.style.themes.pool[data[key][option]]; break;
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
								if(is_main && Object.prototype.hasOwnProperty.call(main.settings.update, option))
								{
									main.settings.update[option](value);
								} else if(main.checkNested(main.settings.update, key, option))
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

				if(!client)
				{
					client = main.client.get();
				}

				main.settings.options.set(main.settings.options.gather(e), client);
				main.settings.close();
			},
			show : () =>
			{
				/* build the settings menu */

				if($('.settings-container').length > 0) return;

				if($('.focus-overlay').length === 0) $('<div/>', { class : 'focus-overlay' })
					.appendTo($('body')).on('click', () => main.settings.close());

				let container = $('<div/>', {
					class : 'settings-container'
				}), client = main.client.get();

				var getMain = (section = main.settings.create.section('main'), settings = 0) =>
				{
					if(main.checkNested(config, 'style', 'themes', 'pool') && config.style.themes.pool.length > 0)
					{
						section.append(main.settings.create.option(
							main.settings.create.select(config.style.themes.pool.map((e) =>
							{
								return { value : e, text : e };
							}), { name : 'theme', 'data-key' : 'style' }, (option, index) =>
							{
								return (config.style.themes.set === null && index === 0) || (option[0].value == config.style.themes.set);
							}), 'Theme')); settings++;
					}

					if(main.checkNested(config, 'style', 'compact') && !config.mobile)
					{
						var label = 'Compact Style',
							description = 'Set the page to use a more compact style.';

						section.append(main.settings.create.option(
							main.settings.create.check({ name : 'compact', 'data-key' : 'style' },
								() => {
									return main.checkNested(client, 'style', 'compact') ? (client.style.compact) : config.style.compact;
								}), label, { class : 'interactable' }, description)); settings++;
					}

					return { settings, section };
				};

				var getGallery = (section = main.settings.create.section('gallery'), settings = 0) =>
				{
					if(!config.mobile)
					{
						section.append(main.settings.create.option(
							main.settings.create.select(['right', 'left'].map((e) =>
							{
								return { value : 'align-' + e, text : e };
							}), { name : 'list_alignment' }, (option, index) =>
							{
								return (index === client.gallery.list_alignment);
							}), 'List Alignment')); settings++;
					}

					var sets = [];

					/* toggleable gallery options (title, json key, description).*/
					sets.push(
						['Reverse Search', 'reverse_options', 'Toggle the visibility of reverse search options on images.'],
						['Autoplay Videos', 'autoplay', 'Toggle the autoplaying of videos.'],
						['Fit Content', 'fit_content', 'Force images and videos to fill the screen.']
					);

					sets.forEach((e) =>
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
				.on('click', () => main.settings.apply(container, client));

				$('<div/>', {
					class : 'cancel ns',
					text : 'Cancel'
				}).appendTo(bottom)
				.on('click', () => main.settings.close());

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
						class : 'ns' + (Object.prototype.hasOwnProperty.call(item, 'class') ? ' ' + item.class : '')
					}).appendTo(container);

					if(Object.prototype.hasOwnProperty.call(item, 'id')) e.attr('id', item.id);
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
					sheet.hasAttribute('href') && (sheet.getAttribute('href')).match(new RegExp('/(themes)/', 'i')));

				config.style.themes.set = theme;
				
				if(theme === null || !theme)
				{
					sheets.each((i, sheet) => sheet.remove());

					return false;
				} else {
					if(set_cookie)
					{
						main.client.set(main.client.get().style.theme = theme);
					}
				}

				$('head').append($('<link/>', {
					rel : 'stylesheet',
					type : 'text/css',
					href : `${config.style.themes.path}/${theme}.css`
				}));

				sheets.each((i, sheet) => sheet.remove());
			}
		},
		filter : {
			apply : (query = null) =>
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

				if(main.gallery.instance) main.gallery.instance.data.selected.index = 0;

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

				if(!Object.prototype.hasOwnProperty.call(main.store.defaults, 'top_values'))
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
			/* https://github.com/kvz/locutus/blob/master/src/php/datetime/date.js
			 * Copyright (c) 2007-2016 Kevin van Zonneveld (https://kvz.io) ) */
			format : (format, timestamp) =>
			{
				var jsdate, f, txtWords = [
					'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
					'January', 'February', 'March', 'April', 'May', 'June',
					'July', 'August', 'September', 'October', 'November', 'December'
				], formatChr = /\\?(.?)/gi;

				var formatChrCb = (t, s) => f[t] ? f[t]() : s;

				var _pad = (n, c) =>
				{
					n = String(n);
					while(n.length < c) n = '0' + n;
					return n;
				};

				f = {
					d: () => _pad(f.j(), 2),
					D: () => f.l().slice(0, 3),
					j: () => jsdate.getDate(),
					l: () => txtWords[f.w()] + 'day',
					N: () => f.w() || 7,
					S: () =>
					{
						var j = f.j(),
							i = j % 10;

						if(i <= 3 && parseInt((j % 100) / 10, 10) === 1) i = 0;

						return ['st', 'nd', 'rd'][i - 1] || 'th';
					},
					w: () => jsdate.getDay(),
					z: () =>
					{
						var a = new Date(f.Y(), f.n() - 1, f.j()),
							b = new Date(f.Y(), 0, 1);

						return Math.round((a - b) / 864e5);
					},
					W: () =>
					{
						var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
							b = new Date(a.getFullYear(), 0, 4);

						return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
					},
					F: () => txtWords[6 + f.n()],
					m: () => _pad(f.n(), 2),
					M: () => f.F().slice(0, 3),
					n: () => jsdate.getMonth() + 1,
					t: () => (new Date(f.Y(), f.n(), 0)).getDate(),
					L: () =>
					{
						var j = f.Y();

						return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
					},
					o: () =>
					{
						var n = f.n(),
							W = f.W(),
							Y = f.Y();

						return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
					},
					Y: () => jsdate.getFullYear(),
					y: () => f.Y().toString().slice(-2),
					a: () => jsdate.getHours() > 11 ? 'pm' : 'am',
					A: () => f.a().toUpperCase(),
					B: () =>
					{
						var H = jsdate.getUTCHours() * 36e2,
							i = jsdate.getUTCMinutes() * 60,
							s = jsdate.getUTCSeconds();

						return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
					},
					g: () => f.G() % 12 || 12,
					G: () => jsdate.getHours(),
					h: () => _pad(f.g(), 2),
					H: () => _pad(f.G(), 2),
					i: () => _pad(jsdate.getMinutes(), 2),
					s: () => _pad(jsdate.getSeconds(), 2),
					u: () => _pad(jsdate.getMilliseconds() * 1000, 6),
					e: () =>
					{
						var msg = 'Not supported (see source code of date() for timezone on how to add support)'
						throw new Error(msg)
					},
					I: () =>
					{
						var a = new Date(f.Y(), 0),
							c = Date.UTC(f.Y(), 0),
							b = new Date(f.Y(), 6),
							d = Date.UTC(f.Y(), 6);

						return ((a - c) !== (b - d)) ? 1 : 0;
					},
					O: () =>
					{
						var tzo = jsdate.getTimezoneOffset(),
							a = Math.abs(tzo);

						return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
					},
					P: () =>
					{
						var O = f.O();

						return (O.substr(0, 3) + ':' + O.substr(3, 2));
					},
					T: () => 'UTC',
					Z: () => -jsdate.getTimezoneOffset() * 60,
					c: () => 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb),
					r: () => 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb),
					U: () => jsdate / 1000 | 0
				};

				var _date = (format, timestamp) =>
				{
					jsdate = (timestamp === undefined ? new Date()
						: (timestamp instanceof Date) ? new Date(timestamp)
						: new Date(timestamp * 1000)
					);

					return format.replace(formatChr, formatChrCb);
				};

				return _date(format, timestamp);
			},
			load : () =>
			{
				/* get client's UTC offset */
				var offsetGet = () => (new Date()).getTimezoneOffset();

				var formatSince = (seconds) =>
				{
					/* formats seconds to an 'ago' string.
					 * example: formatSince(3720); returns 1 hour and 2 minutes ago. */

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

				var apply = (offset, format = true) =>
				{
					$('tbody tr.directory > td:nth-child(2), tbody tr.file > td[data-raw]:nth-child(2)')
					.each((index, item) =>
					{
						item = $(item);

						var timestamp = parseInt(item.attr('data-raw')),
							since = formatSince(config.timestamp - timestamp),
							span = (format === true ? $('<span/>') : item.find('> span'));

						/* update the date formats if the offset has been changed or set for the first time */
						if(format === true)
						{
							(config.format.date).forEach((f, index) =>
							{
								if(index <= 1)
								{
									var element = $('<span/>', {
										text : main.dates.format(f, timestamp)
									});

									if(config.format.date.length > 1)
									{
										element.attr('data-view', index === 0 ? 'desktop' : 'mobile')
									}

									span.append(element);
								}
							});

							item.html(span);
						}

						if(since) span.attr('title', `${since} (UTC${(offset.hours > 0 ? '+' : '') + offset.hours})`);
					});

					$('.top-bar > .directory-info div[data-count="files"], \
						.top-bar > .directory-info div[data-count="directories"]').each((index, item) =>
					{
						item = $(item);

						if(item[0].hasAttribute('data-raw'))
						{
							$(item).attr('title', 'Newest: ' + main.dates.format(config.format.date[0], parseInt(item.attr('data-raw'))))
						}
					});
				};

				var offset = offsetGet(),
					client = main.client.get(),
					update = client.timezone_offset != offset;

				/* only update if offset is changed or unset */
				if(update)
				{
					client.timezone_offset = offset;
					main.client.set(client);
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
				if(Object.prototype.hasOwnProperty.call(config, 'sorting') && config.sorting.enabled)
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
			instance : null,
			load : (index = 0) =>
			{
				if(!config.gallery.enabled)
				{
					return false;
				}

				if(config.debug) console.log('gallery.load =>', index);

				/* if a gallery instance is already active, show it */
				if(main.gallery.instance && main.gallery.instance !== false)
				{
					(main.gallery.instance).store.continue.video = main.store.preview.video ? {
						'src' : main.store.preview.video.find('source').attr('src'),
						'time' : main.store.preview.video[0].currentTime
					} : null;

					main.store.preview.video = null;

					let items = main.store.refresh ? main.getTableItems() : null;

					if(items !== null && items.length === 0)
					{
						return false;
					} else {
						main.gallery.instance.show(true, index === null ? main.gallery.instance.data.selected.index : index, items);

						if(main.store.refresh)
						{
							main.store.refresh = false;
						}
					}

					return;
				}

				/* set gallery options and start a new instance */
				var client = main.client.get(), options = {},
					list_state = JSON.parse(Object.prototype.hasOwnProperty.call(client.gallery, 'list_state') ? 
						client.gallery.list_state : 1);

				options.start = index === null ? 0 : index;
				options.filter = false;

				options.console = config.debug;
				options.fade = config.gallery.fade;

				options.mobile = config.mobile;

				options.reverse_options = main.checkNested(client, 'gallery', 'reverse_options') ? 
					(client.gallery.reverse_options) : 
					config.gallery.autoplay;

				options.autoplay = main.checkNested(client, 'gallery', 'autoplay') ?
					(client.gallery.autoplay) :
					config.gallery.autoplay;

				options.fit_content = main.checkNested(client, 'gallery', 'fit_content') ?
					(client.gallery.fit_content) :
					config.gallery.fit_content;

				options.scroll_interval = config.gallery.scroll_interval;

				options.list = {
					show : list_state == null ? true : (list_state ? true : false),
					reverse : main.checkNested(client, 'gallery', 'list_alignment') ?
						(client.gallery.list_alignment === 0 ? false : true) :
						false
				};

				options.continue = {
					video : main.store.preview.video ? {
						src : main.store.preview.video.find('source').attr('src'),
						time : main.store.preview.video[0].currentTime
					} : null
				}

				main.gallery.instance = new $.fn.gallery(main.getTableItems(), options);

				if(main.gallery.instance !== false)
				{
					$(main.gallery.instance).on('unbound', () => main.bind());
				}
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

			$(window).on('scroll', main.debounce(() =>
			{
				main.events.scroll();
			}));
		}
	};

	$('body > .top-bar > div.extend').on('click', (e) =>
	{
		main.menu.toggle(e.currentTarget);
	});

	$('.filter-container > div.close > span').on('click', () =>
	{
		main.filter.toggle();
	});

	$('.filter-container > div input[type="text"]').on('input', (e) =>
	{
		var target = $(e.currentTarget);

		main.filter.apply(target.val());
	});

	$(document).on('click', 'body > div.menu #filter', () =>
	{
		main.filter.toggle();
		main.menu.toggle();
	});

	$(document).on('click', 'body > div.menu #settings', () =>
	{
		main.settings.show();
		main.menu.toggle(false);
	});

	if(config.gallery.enabled === true)
	{
		$(document).on('click', 'body > div.menu #gallery', () =>
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

	$(document).on('click', 'body > div.menu #copy', () =>
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
		var skip_directories = (Object.prototype.hasOwnProperty.call(config.sorting, 'sort_by') &&
			(index === 2 || index === 3));

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

	window.addEventListener('resize', main.debounce(() =>
	{
		if(config.debug)
		{
			console.log('resized');
		}

		config.mobile = Modernizr.mq('(max-width: 640px)');

		if(main.gallery.instance)
		{
			(main.gallery.instance).store.mobile = config.mobile;
			(main.gallery.instance).update.listWidth();
		}
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
					main.store.preview.video = (data.itemType === 1 ? data.element : null);

					if(config.debug)
					{
						console.log('preview_loaded', data);
					}
				} else {
					main.store.preview.video = null;
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