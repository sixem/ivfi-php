/**
 * @license
 * 
 * <gallery-mode-plugin> A plugin for <eyy-indexer> [https://github.com/sixem/eyy-indexer]
 * 
 * @author   emy [admin@eyy.co]
 */

(function($)
{
	'use strict';

	$.fn.gallery = function(items, options = {})
	{
		const main = {
			data : {
				busy : false,
				scrollbreak : false
			}
		};

		/* Table:
		 * http://gcctech.org/csc/javascript/javascript_keycodes.htm */
		main.data.keys = {
			escape : 27,
			pageUp : 33,
			pageDown : 34,
			arrowLeft : 37,
			arrowUp : 38,
			arrowRight : 39,
			arrowDown : 40,
			g : 71,
			l : 76
		};

		main.store = $.extend({
			extensions : {
				image : ['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'],
				video : ['mp4', 'webm', 'ogv', 'ogg']
			},
			console : true,
			blur : true,
			filter : true,
			start : 0,
			fade : 0,
			mobile : false,
			scroll_interval : 35,
			autoplay : true,
			volume : 0,
			reverse_options : true,
			fit_content : false,
			list : {
				show : true,
				reverse : false
			},
			continue : {
				video : null
			}
		}, main.store, options);

		main.loadImage = (src) =>
		{
			return new Promise((resolve, reject) => {
				var img = document.createElement('img');
				img.src = src;

				img.addEventListener('error', (e) =>
				{
					reject(new Error(`failed to load image URL: ${src}`));
				});

				let timer = setInterval(() =>
				{
					var w = img.naturalWidth, h = img.naturalHeight;
				
					if(w && h)
					{
						clearInterval(timer);
						resolve([src, img, [w, h]])
					}
				}, 30);
			});
		};

		main.encodeUrl = (input) => encodeURI(input).replace('#', '%23').replace('?', '%3F');

		main.getExtension = (filename) => (filename.split('.').pop()).toLowerCase();
		main.getObjectSet = (...elements) => $((elements.filter((value) => typeof value !== 'undefined')).map((element) => $(element)));

		main.filterItems = (items) => items.filter((item) => main.isImage(item.name) || main.isVideo(item.name));

		main.isImage = (filename, ext = null) => main.store.extensions.image.includes(ext ? ext : main.getExtension(filename));
		main.isVideo = (filename, ext = null) => main.store.extensions.video.includes(ext ? ext : main.getExtension(filename));

		main.getScrollBarWidth = (force = false) =>
		{
			if(!force) if($(document).height() <= $(window).height()) return 0;

			var outer = $('<div>').css({
				visibility: 'hidden', width: 100, overflow: 'scroll'
			}).appendTo('body')

			var widthWithScroll = $('<div>').css({
				width: '100%'
			}).appendTo(outer).outerWidth();

			outer.remove();

			return (100 - widthWithScroll);
		};

		main.data.scrollBar = {
			width : main.getScrollBarWidth(),
			widthForced : $(document).height() <= $(window).height()
		};

		main.limitBody = (bool = true) =>
		{
			/* removes the scrollbar from the body (to avoid it showing when the gallery is open)
			 * and adds a padding to it with the width of the scrollbar in order to avoid jumping elements. */

			var body = $('body'), html = $('html'), scrollpadding = main.data.scrollBar.width;

			if(bool === true)
			{
				main.data.body = {
					'max-height' : body.css('max-height'),
					'overflow' : body.css('overflow')
				};

				if(scrollpadding > 0) html.css({
					'padding-right' : scrollpadding + 'px'
				});

				body.css({
					'max-height' : 'calc(100vh - var(--height-gallery-top-bar))',
					'overflow' : 'hidden'
				});
			} else {
				if(Object.prototype.hasOwnProperty.call(main.data, 'body'))
				{
					body.css({
						'max-height' : main.data.body['max-height'],
						'overflow' : main.data.body.overflow
					});
				}

				html.css({
					'padding-right' : 'unset'
				});
			}
		};

		main.exists = () =>
		{
			main.container = $('body > div.gallery-container');

			return main.container.length > 0;
		};

		/**
		* Shows or hides the gallery. Can be called after the first initiation.
		* @param {bool}  bool  : whether to hide or show the gallery.
		* @param {int}   index : index to start at.
		* @param {array} items : if unset it will use the previously set items. pass this if the
		*                        order of items has changed or if there are any new items etc.
		*/

		main.show = (bool = true, index = null, items = null) =>
		{
			if(items)
			{
				if(main.store.console) console.log('itemsUpdate', true);

				main.data.selected.index = null;
				main.items = main.store.filter ? main.filterItems(items) : items;
				main.populateTable(main.items);
			}

			if(bool === true)
			{
				main.bind().show();

				if(index !== main.data.selected.index)
				{
					main.container.find('> div.content-container > div.media > div.wrapper img, > div.content-container > div.media > div.wrapper video').hide();
					main.navigate(index);
				}

				main.container.find('> div.content-container > div.list')
				.scrollTo(main.container.find('> div.content-container > div.list').find('tr:nth-child(' + (index + 1) + ')'));
			} else {
				main.unbind(main.data.bound);
				main.container.hide();
			}

			if(main.store.blur)
			{
				main.set.blur(bool);
				main.limitBody(bool);
			}

			var video = main.container.find('> div.content-container > div.media > div.wrapper video'),
				table = main.container.find('> div.content-container > div.list > table');

			if(video.length > 0)
			{
				if(bool === true && video.is(':visible'))
				{
					var current_time = video[0].currentTime;

					if(main.store.continue.video && video.find('source').attr('src') == main.store.continue.video.src)
					{
						current_time = main.store.continue.video.time;
						main.store.continue.video = null;
					}

					video[0].currentTime = current_time;
					video[0].muted = false;
					video[0][main.store.autoplay ? 'play' : 'pause']();

					main.video.setVolume(video[0], main.video.getVolume());
				} else if(bool === false)
				{
					// video[0].muted = true;
					video[0].pause();
				}
			}
		};

		main.data.busy = null;
		main.data.busy_handle = null;

		main.tick = (loader) =>
		{
			var tick = parseInt(loader.attr('data-tick'));

			loader.text('Loading ' + ('.').repeat(tick)).attr('data-tick', (tick >= 3) ? 1 : (tick + 1));

			return loader;
		};

		main.busy = (bool) =>
		{
			if(typeof bool != 'undefined')
			{
				main.data.busy = bool;

				var loader = main.container.find('> div.content-container > div.media > .loader');

				if(!$(loader)[0].hasAttribute('data-tick')) $(loader).attr('data-tick', 1);

				if(bool)
				{
					if(loader.is(':hidden')) loader.stop().fadeIn(400);

					main.data.busy_handle = setInterval(() => main.tick(loader), 225);
				} else {
					if(loader.is(':visible')) loader.stop().fadeOut(200, () => loader.attr('data-tick', 1).text('Loading .'));

					if(!main.data.busy) clearInterval(main.data.busy_handle);
				}
			}

			return main.data.busy;
		};

		main.populateTable = (items, table = null) =>
		{
			if(table === null)
			{
				table = main.container[0].querySelector('div.content-container > div.list > table');
			}

			var buffer = [];

			for(var i = 0; i <= items.length - 1; i++)
			{
				buffer[i] = `<tr title="${items[i].name}"><td>${items[i].name}</td></tr>`;
			}

			table.innerHTML = (buffer.join(''));

			return table;
		};

		main.update = {
			listWidth : (wrapper = null) =>
			{
				if(!wrapper) wrapper = main.container.find('> div.content-container > div.media > div.wrapper');

				var list = main.data.list ? main.data.list : (main.container.find('> div.content-container > div.list')),
					width = (main.store.mobile || !list || list.is(':hidden')) ? 0 : list.outerWidth();

				wrapper[0].style.setProperty('--width-list', width + 'px');
			}
		};

		main.getReverseOptions = (url) =>
		{
			url = main.encodeUrl(document.location.origin + url);

			return {
				'Google': 'https://www.google.com/searchbyimage?image_url=' + url + '&safe=off',
				'Yandex': 'https://yandex.com/images/search?rpt=imageview&url=' + url,
				'Bing': 'https://bing.com/images/search?q=imgurl:' + url + '&view=detailv2&iss=sbi#enterInsights',
				'SauceNAO': 'https://saucenao.com/search.php?url=' + url
			};
		};

		main.reverse = () =>
		{
			if(!main.store.reverse_options || 
				(main.container.find('> div.content-container > div.media > div.wrapper > div.cover')).length === 0) return false;

			var container = main.container.find('> div.content-container > div.media .reverse');

			if(container.length === 0)
			{
				container = $('<div/>', {
					class : 'reverse'
				}).appendTo(main.container.find('> div.content-container > div.media > div.wrapper > div.cover'));
			}

			var options = main.getReverseOptions(main.data.selected.src);

			container.html(
				Object.keys(options).map((site) => `<a class="reverse-link" target="_blank" href="${options[site]}">${site}</a>`)
			);
		};

		main.shortenString = (input, cutoff) =>
		{
			cutoff = cutoff || 28;

			if(input.length > cutoff)
			{
				return [
				input.substr(0, Math.floor((cutoff / 2) - 2)),
					input.substr(input.length - (Math.floor((cutoff / 2) - 2)), input.length)
				].join(' .. ');
			} else {
				return input;
			}
		};

		main.set = {
			cache : {
				info : null
			},
			/* Sets the item info for the current item.
			 * If update is set to false, then info is cache temporary and not shown.
			 * Set update to true in order to show cached info.
			 */
			itemInfo : (update, item = null, index = null, max = null) =>
			{
				if(main.store.console && !update)
				{
					console.log('itemSet', item);
				}

				if(update)
				{
					if(Array.isArray(main.set.cache.info))
					{
						[item, index, max] = main.set.cache.info;
					} else if(item === null || index === null || max === null)
					{
						return false;
					}
				} else {
					main.set.cache.info = [item, index, max];

					return false;
				}

				var name = main.store.mobile ? main.shortenString(item.name, 30) : item.name;
				var url = main.encodeUrl(item.url);

				main.container
				.find('.bar > .right > a.download')
				.attr('filename', item.name)
				.attr('href', url)
				.attr('title', `Download: ${item.name}`);

				main.container.find('> div.bar > div.left').html(
					`<span>${index + 1} of ${max}</span>` +
					` | <a target="_blank" href="${url}">${name}</a>` +
					(Object.prototype.hasOwnProperty.call(item, 'size') && !main.store.mobile ? ` | <span>${item.size}</span>` : '')
				);

				return true;
			},
			/* Enables blur for (almost) all child elements of body. */
			blur : (bool = true) =>
			{
				if(bool === true)
				{
					main.data.blurred = $('body > *:not(.gallery-container):not(script):not(noscript):not(style)').addClass('blur ns');
				} else {
					if(Object.prototype.hasOwnProperty.call(main.data, 'blurred'))
					{
						main.data.blurred.removeClass('blur ns');
					}
				}

				return main;
			}
		}

		/* checks if an item is visible in the viewport (can be improved upon) */
		main.isScrolledIntoView = (elem, offset) =>
		{
			var top_margin = elem.offset().top - $(window).scrollTop();
			if(top_margin < offset) return false;

			var bottom_margin = (top_margin + elem.outerHeight());
			if(bottom_margin > $(window).height()) return false;

			return true;
		};

		/* scrolls an item into view (scrollto plugin is being used over this as this needs improvement) */
		main.scrollIntoView = (element, container) =>
		{
			container.stop().animate({
				scrollTop: (element.offset().top - container.offset().top)
			}, 0);
		};

		/* calculates the new value if using +/- when navigating items. ex ((50, -10) = 40) etc. */
		main.calculateIndex = (current, change, max) =>
		{
			var adjusted = (current + change);

			if(adjusted > max)
			{
				adjusted = (adjusted - max) - 1;
			}

			if(adjusted < 0)
			{
				adjusted = max - (Math.abs(adjusted) - 1);
			}

			if(adjusted < 0 || adjusted > max)
			{
				return main.calculateIndex(current, (max - adjusted), max);
			}

			return adjusted;
		};

		main.video = {
			create : (extension) =>
			{
				var attributes = {
					controls : '',
					preload : 'none',
					loop : ''
				};

				var video = $('<video/>', attributes),
				source = $('<source>', {
					type : 'video/' + (extension === 'ogv' ? 'ogg' : extension),
					src : ''
				}).appendTo(video);

				main.video.setVolume(video.get(0), main.video.getVolume());

				return [video, source];
			},
			getVolume : () =>
			{
				var volume = parseFloat(main.store.volume);
				volume = (isNaN(volume) || volume < 0 || volume > 1) ? 0 : volume;

				return volume;
			},
			setVolume : (video, i) =>
			{
				if(i > 0)
				{
					video.volume = i >= 1 ? 1.0 : i;
				} else {
					video.muted = true;
				}

				return i;
			},
			seek : (i) =>
			{
				var video = main.container.find('> div.content-container > div.media > div.wrapper video').get(0);

				if(video)
				{
					var current = Math.round(video.currentTime), duration = Math.round(video.duration);

					if(i > 0)
					{
						if((current + i) > duration)
						{
							return true;
						} else {
							video.currentTime = current + i;
						}
					} else if(i < 0)
					{
						if((current + i) < 0)
						{
							return true;
						} else {
							video.currentTime = current + i;
						}
					}

					return false;
				}
			}
		}

		main.showItem = (type, element, src, init, index, data = null) =>
		{
			var wrapper = main.container.find('> div.content-container > div.media > div.wrapper'), video, source;

			if(main.store.fade > 0) wrapper.hide();

			var applyChange = () =>
			{
				main.container.find('> div.content-container > div.media > div.wrapper > div:not(.cover)').remove();

				main.set.itemInfo(true);

				var opp = wrapper.find(type === 0 ? 'video' : 'img').hide();

				main.data.selected.type = type;

				if(type === 1)
				{
					opp.parent('.cover').hide();
				}

				if(main.store.fade > 0)
				{
					wrapper.stop().fadeOut(main.store.fade, () =>
					{
						wrapper.stop().fadeIn(main.store.fade);
					});
				} else {
					wrapper.show();
				}

				main.busy(false);
			};

			var display = () =>
			{
				if(type === 0)
				{
					video = wrapper.find('video');

					if(main.store.fit_content)
					{
						var height = `calc(calc(100vw - var(--width-list)) / ${(data.img.width / data.img.height).toFixed(4)})`;
						
						main.update.listWidth(wrapper);

						element.css({
							width : 'auto',
							height : height
						});

						element.parent('.cover').css('height', height);
					}

					element.attr('src', '').attr('src', src).show();
					element.parent('.cover').show();

					if(video.length > 0)
					{
						video.off('error');

						video[0].pause();
						video.find('source').attr('src', '');
					}

					applyChange();
				} else if(type === 1)
				{
					if(init === false)
					{
						[video, source] = main.video.create(main.data.selected.ext);
						video.appendTo(wrapper);
					} else {
						source = element.find('source');
						video = element;
					}

					var evented = false;

					source.attr('src', src);

					var error = (err) =>
					{
						console.error('Failed to load video source.', err);
						main.busy(false);
					}

					video.on('error', (err) => error(err));
					source.on('error', (err) => error(err));

					video.on('volumechange', () =>
					{
						main.store.volume = video.get(0).muted ? 0 : parseFloat(parseFloat(video.get(0).volume).toFixed(2));

						$(main).trigger('volumeChange', main.store.volume);
					});

					video.on('canplay canplaythrough', () =>
					{
						if(evented)
						{
							return false;
						}

						var height = video[0].videoHeight, width = video[0].videoWidth;

						if(main.store.fit_content)
						{
							main.update.listWidth(wrapper);

							video.css({
								width : 'auto',
								height : `calc(calc(100vw - var(--width-list)) / ${(width / height).toFixed(4)})`
							});
						}

						if(main.store.volume)
						{
							video.get(0).volume = main.store.volume;
						}

						if(main.store.autoplay)
						{
							video[0].play();
						}

						video.show();

						/* if the gallery was hidden while loading, pause video and hide loader. */
						if(!main.container.is(':visible'))
						{
							main.container.find('> div.content-container > div.media > div.wrapper > div.loader').hide();
							video[0].pause();
						}

						if(init === false)
						{
							element.remove();
						}

						evented = true;

						applyChange();
					});

					video[0].load();

					if(main.store.continue.video && src == main.store.continue.video.src)
					{
						video[0].currentTime = main.store.continue.video.time;
						main.store.continue.video = null;
					}
				}

				main.data.selected.index = index;
			};

			display();
		};

		main.navigate = (index, step = null) =>
		{
			if(main.store.console)
			{
				console.log('busyState', main.busy());
			}

			if(main.busy())
			{
				return false;
			}

			var max = main.items.length - 1;

			if(index === null)
			{
				index = main.data.selected.index;
			}

			if(step !== null)
			{
				index = main.calculateIndex(index, step, max);
			}

			if(main.data.selected.index === index || main.busy() === true)
			{
				return false;
			}

			var video, image, init, item;

			image = main.container.find('> div.content-container > div.media > div.wrapper img');
			video = main.container.find('> div.content-container > div.media > div.wrapper video');

			var list = main.container.find('> div.content-container > div.list'),
			table = list.find('> table'),
			element = table.find('tr:nth-child(' + (index + 1) + ')');

			item = main.items[index];

			var encoded = main.encodeUrl(item.url);

			main.data.selected.src = encoded;
			main.data.selected.ext = main.getExtension(item.name);

			table.find('tr.selected').removeAttr('class');
			element.attr('class', 'selected');

			main.set.itemInfo((image.length === 0 && video.length === 0) ? true : false, item, index, max + 1);

			if(!main.isScrolledIntoView(element, Math.floor(main.container.find('> div.bar').outerHeight() - 4)))
			{
				list.scrollTo(element);
			}

			if(main.isImage(null, main.data.selected.ext))
			{
				main.busy(true);

				init = (image.length === 0);

				if(video.length > 0)
				{
					video[0].pause();
				}

				if(init === true)
				{
					var cover = $('<div/>', {
						class : 'cover'
					}).hide().prependTo(main.container.find('> div.content-container > div.media > div.wrapper'));

					image = $('<img>').prependTo(cover);
				}

				main.loadImage(encoded).then((data) =>
				{
					let [src, img, dimensions] = data, [w, h] = dimensions;

					if(main.data.selected.src === src)
					{
						main.showItem(0, image, src, init, index, {
							img : {
								width : w, height : h
							}
						});
					}
				}).catch((error) =>
				{
					console.error(error);

					main.busy(false);
					main.data.selected.index = index;

					main.container.find('> div.content-container > div.media > div.wrapper img, > div.content-container > div.media > div.wrapper video').hide();
					main.container.find('> div.content-container > div.media > div.wrapper > div:not(.cover)').remove();

					$('<div/>', {
						class : 'error',
						text : 'Error: Image could not be displayed.'
					}).prependTo(main.container.find('.media .wrapper'));
				});

				return true;
			}

			if(main.isVideo(null, main.data.selected.ext))
			{
				main.busy(true);

				init = (video.length === 0);

				if(init)
				{
					video = main.video.create(main.data.selected.ext)[0];
					video.appendTo(main.container.find('> div.content-container > div.media > div.wrapper'));
				}

				main.showItem(1, video, encoded, init, index);

				return true;
			}
		};

		main.data.key_prevent = [
			main.data.keys.pageUp,
			main.data.keys.pageDown,
			main.data.keys.arrowLeft,
			main.data.keys.arrowUp,
			main.data.keys.arrowRight,
			main.data.keys.arrowDown
		];

		main.handleKey = (key, callback) =>
		{
			if(main.store.console)
			{
				console.log('handleKey', key);
			}

			if(key === main.data.keys.escape)
			{
				main.show(false);
			} else if(key === main.data.keys.arrowDown || key === main.data.keys.pageDown || key === main.data.keys.arrowRight)
			{
				if(key === main.data.keys.arrowRight && main.data.selected.type === 1)
				{
					if(main.video.seek(5)) main.navigate(null, 1);
				} else {
					main.navigate(null, 1);
				}
			} else if(key === main.data.keys.arrowUp || key === main.data.keys.pageUp || key === main.data.keys.arrowLeft)
			{
				if(key === main.data.keys.arrowLeft && main.data.selected.type === 1)
				{
					if(main.video.seek(-5)) main.navigate(null, -1);
				} else {
					main.navigate(null, -1);
				}
			} else if(key === main.data.keys.l)
			{
				main.toggleList();
			}

			callback(main.data.key_prevent.includes(key));
		};

		main.unbind = (bound, event = true) =>
		{
			bound.forEach((value) =>
			{
				if(Object.prototype.hasOwnProperty.call(value, 'direct') && value.direct === true)
				{
					$(value.trigger).off(value.event);

					return true;
				}

				(value.trigger) ? $(document).off(value.event, value.trigger) : $(document).off(value.event);

			});

			if(event === true) $(main).trigger('unbound', true);
		};

		main.scrollBreak = () =>
		{
			main.data.scrollbreak = false;
		};

		main.toggleList = (e = null) =>
		{
			var list = main.container.find('> div.content-container > div.list'), visible = list.is(':visible'), client = JSON.parse(Cookies.get('ei-client'));

			client.gallery.list_state = (!visible ? 1 : 0);

			Cookies.set('ei-client', JSON.stringify(client), {
				sameSite : 'lax',
				expires : 365
			});

			e = (!e ? $('div.gallery-container > div.bar .right span[data-action="toggle"]') : e);

			e.text('List' + (visible ? '+' : '-'));
			list.css('display', visible ? 'none' : 'table-cell');

			main.update.listWidth();

			return !visible;
		}

		main.bind = () =>
		{
			main.data.bound = [
				{
					event : 'click',
					trigger : 'body > div.gallery-container > div.content-container > div.list table tr'
				},
				{
					event : 'click',
					trigger : 'body > div.gallery-container [data-action="close"]'
				},
				{
					event : 'click',
					trigger : 'body > div.gallery-container [data-action="toggle"]'
				},
				{
					event : 'click',
					trigger : 'body > div.gallery-container [data-action="previous"]'
				},
				{
					event : 'click',
					trigger : 'body > div.gallery-container [data-action="next"]'
				},
				{
					event : 'click',
					trigger : 'body > div.gallery-container > div.content-container > div.media'
				},
				{
					event : 'DOMMouseScroll mousewheel',
					trigger : 'body > div.gallery-container > div.content-container > div.media'
				},
				{
					event : 'mouseenter',
					trigger : 'body > div.gallery-container > div.content-container > div.media > div.wrapper > div.cover'
				},
				{
					event : 'swipeleft',
					trigger : 'body > div.gallery-container',
					direct : true
				},
				{
					event : 'swiperight',
					trigger : 'body > div.gallery-container',
					direct : true
				},
				{
					event : 'mouseup',
					trigger : 'body > div.gallery-container'
				},
				{
					event : 'keydown',
					trigger : null
				},
				{
					event : 'keyup',
					trigger : null
				}
			];

			main.unbind(main.data.bound, false);

			main.data.list_drag.on('mousedown', () =>
			{
				main.data.list_dragged = true;

				var window_width = window.innerWidth,
					wrapper = main.container.find('> div.content-container > div.media > div.wrapper');

				$('body').css('cursor', 'w-resize');
				wrapper.css('pointer-events', 'none');

				$(document).on('mousemove', 'body > div.gallery-container', (e) =>
				{
					var x = e.originalEvent.clientX;

					if(x < window_width)
					{
						var width = main.store.list.reverse ? (x + main.data.scrollbar_width) : (window_width - x);

						main.data.list.css('width', width + 'px');
					}
				});
			});

			$(document).on('mouseup', 'body > div.gallery-container', () =>
			{
				if(main.data.list_dragged === true)
				{
					$(document).off('mousemove', 'body > div.gallery-container');

					var wrapper = main.container.find('> div.content-container > div.media > div.wrapper');

					$('body').css('cursor', '');
					wrapper.css('pointer-events', 'auto');

					var lw = parseInt(main.data.list.css('width').replace(/[^-\d.]/g, ''));

					if(lw > 100)
					{
						var client = JSON.parse(Cookies.get('ei-client'));

						client.gallery.list_width = lw;

						Cookies.set('ei-client', JSON.stringify(client), {
							sameSite : 'lax',
							expires : 365
						});

						main.update.listWidth(wrapper);
					}
				}
			});

			$(document).on('click', 'body > div.gallery-container [data-action="close"]', () =>
			{
				main.show(false);
			});

			$(document).on('click', 'body > div.gallery-container [data-action="toggle"]', (e) =>
			{
				main.toggleList($(e.currentTarget));
			});

			$(document).on('click', 'body > div.gallery-container [data-action="previous"]', () =>
			{
				main.navigate(null, -1);
			});

			$(document).on('click', 'body > div.gallery-container [data-action="next"]', () =>
			{
				main.navigate(null, 1);
			});

			$(document).on('click', 'body > div.gallery-container > div.content-container > div.list table tr', (e) =>
			{
				main.navigate($(e.currentTarget).index());
			});

			$(document).on('click', 'body > div.gallery-container > div.content-container > div.media', (e) =>
			{
				if(!$(e.target).is('img, video, a')) main.show(false);
			});

			if(main.store.reverse_options === true)
			{
				$(document).on('mouseenter', 'body > div.gallery-container > div.content-container > div.media > div.wrapper > div.cover', (e) =>
				{
					main.reverse($(e.currentTarget));
				});
			}

			if(main.store.mobile === true)
			{
				$('body > div.gallery-container').on('swipeleft', () => main.navigate(null, 1));
				$('body > div.gallery-container').on('swiperight', () => main.navigate(null, -1));
			}

			$(document).on('DOMMouseScroll mousewheel', 'body > div.gallery-container > div.content-container > div.media', (e) =>
			{
				if(main.store.scroll_interval > 0 && main.data.scrollbreak === true) return false;

				main.navigate(null, (e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0) ? 1 : -1);

				if(main.store.scroll_interval > 0)
				{
					main.data.scrollbreak = true;

					setTimeout(() => main.scrollBreak(), main.store.scroll_interval);
				}
			});

			$(document).on('keydown', $.fn, (e) =>
			{
				if(main.data.key_prevent.includes(e.keyCode)) e.preventDefault();

				if(e.keyCode === main.data.keys.g)
				{
					main.show(false);
				}
			});

			$(document).on('keyup', $.fn, (e) =>
			{
				main.handleKey(e.keyCode, (prevent) =>
				{
					if(prevent) e.preventDefault();
				});
			});

			$(main).trigger('bound', true);

			return main.container;
		};

		main.barConstruct = (bar) =>
		{
			$('<a/>', {
				text : main.store.mobile ? 'Save' : 'Download', class : 'download', 'download' : '',
			}).appendTo(bar);

			if(!main.store.mobile) $('<span/>', {
				'data-action' : 'previous', text : 'Previous'
			}).appendTo(bar);

			if(!main.store.mobile) $('<span/>', {
				'data-action' : 'next', text : 'Next'
			}).appendTo(bar);

			if(!main.store.mobile) $('<span/>', {
				'data-action' : 'toggle', text : main.store.list.show ? 'List-' : 'List+'
			}).appendTo(bar);

			$('<span/>', {
				'data-action' : 'close', text : 'Close'
			}).appendTo(bar);
		};

		var initiate = (callback) =>
		{
			main.limitBody(true);

			var previews = $('body').find('body > div.preview-container');
			if(previews.length > 0) previews.remove();

			main.container = $('<div/>', {
				class : 'gallery-container',
			}).prependTo('body');

			var top = $('<div/>', {
				class : 'bar'
			}).appendTo(main.container);

			$('<div/>', {
				class : 'left'
			}).appendTo(top);

			main.barConstruct($('<div/>', {
				class : 'right'
			}).appendTo(top));

			var content = $('<div/>', {
				class : 'content-container'
			}).appendTo(main.container);

			var media = $('<div/>', {
				class : 'media'
			});

			var list = $('<div/>', {
				class : 'ns list' + (main.store.list.reverse ? ' reversed' : '')
			});

			content
			.append(main.store.list.reverse ? list : media)
			.append(main.store.list.reverse ? media : list);

			main.data.list_drag = $('<div/>', {
				class : 'drag' + (main.store.list.reverse ? ' reversed' : '')
			}).appendTo(list);

			main.data.list = list;
			main.data.list_dragged = false;
			main.data.scrollbar_width = (main.data.scrollBar.widthForced ? 0 : main.data.scrollBar.width);

			var client = JSON.parse(Cookies.get('ei-client'));

			try
			{
				var width = JSON.parse(client.gallery.list_width.toString().toLowerCase());

				if(width === false)
				{
					width = '';
				} else if(parseInt(width) > (window.innerWidth / 2))
				{
					client.gallery.list_width = Math.floor(window.innerWidth / 2);

					Cookies.set('ei-client', JSON.stringify(client), {
						sameSite : 'lax',
						expires : 365
					});
				}

				main.data.list.css('width', width);
			} catch (e) {
				client.gallery.list_width = false;

				Cookies.set('ei-client', JSON.stringify(client), {
					sameSite : 'lax',
					expires : 365
				});
			}

			if(!main.store.list.show)
			{
				list.hide();
			}

			if(main.store.mobile === true)
			{
				list.hide();

				$('<span/>', {
				}).appendTo(
					$('<div/>', {
						class : 'screen-nav left',
						'data-action' : 'previous'
				}).appendTo(content));

				$('<span/>', {
				}).appendTo(
					$('<div/>', {
						class : 'screen-nav right',
						'data-action' : 'next'
				}).appendTo(content));
			}

			$('<div/>', {
				class : 'wrapper' + (main.store.fit_content ? ' fill' : '')
			}).appendTo(media);

			$('<div/>', {
				class : 'loader' + (main.store.list.reverse ? ' reversed' : '')
			}).html('Loading ..').appendTo(media);

			$('<tbody/>').appendTo(
				$('<table/>', {
					cellspacing : '0'
				}).appendTo(list)
			);

			main.populateTable(main.items);

			callback(true);
		}

		main.container = $('body > div.gallery-container');
		main.items = main.store.filter ? main.filterItems(items) : items;

		if(main.items.length === 0) return false;

		main.data.selected = {
			src : null,
			ext : null,
			index : null,
			type : null
		};

		if(!main.exists())
		{
			initiate(() =>
			{
				main.bind();

				if(main.store.blur)
				{
					main.set.blur();
				}
			});
		} else {
			main.show(true);
		}

		main.navigate(
			main.store.start > (main.items.length - 1) ? (main.items.length - 1) : main.store.start
		);

		return main;
	};
}(jQuery));