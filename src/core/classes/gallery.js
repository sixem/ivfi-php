/** Import `cookies` */
import cookies from 'js-cookie';

/** Import `swipe` */
import swipe from 'vanilla-swipe';

/** Import `config` */
import {
	user
} from '../config/config';

/** Import `data` */
import data from '../config/data';

/** Import `code` */
import {
	code
} from '../config/constants';

/** Import `eventHandler` */
import eventHandler from '../modules/event-handler';

/** Import `optimizeClass` */
import optimizeClass from './optimize';

/** Import `emitterClass` */
import emitterClass from './emitter';

/** Import `DOM`, `debounce` */
import {
	DOM,
	debounce
} from '../modules/helpers';

/* Import stylesheet */
import '../../css/gallery.scss';

const pipe = data.instances.pipe;

export default class galleryClass
{
	constructor(items, options)
	{
		options = options || new Object();

		/* Get default values */
		let defaults = this.setDefaults();

		/* Override any default values passed as an option */
		Object.keys(defaults).forEach((key) =>
		{
			if(!Object.prototype.hasOwnProperty.call(options, key))
			{
				options[key] = defaults[key];
			}
		});

		this.isVisible = null;

		/* Set options */
		this.options = options;

		/* Logging */
		this.pipe = this.options.pipe;

		/* New event emitter */
		this.emitter = new emitterClass();

		/* Initiate */
		this.init(items);

		return this;
	}

	listen = (event, callback) =>
	{
		this.emitter.listen(event, callback);
	}

	setDefaults = () =>
	{
		let data = new Object();

		/* Valid extensions */
		data.extensions = {
			image : ['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'],
			video : ['mp4', 'webm', 'ogg', 'ogv', 'mov']
		};

		/* Item list */
		data.list = {
			show : true,
			reverse : false
		};

		/* Video */
		data.video = {
			video : null
		};

		/* Performance mode */
		data.performance = false;

		/* Video autoplay */
		data.autoplay = true;

		/* Video volume */
		data.volume = 0;

		/* Verbose */
		data.console = true;

		/* Reverse image search */
		data.reverseOptions = true;

		/* Blurred background */
		data.blur = true;

		/* Sharpen images */
		data.sharpen = true;

		/* Mobile mode */
		data.mobile = false;

		/* Fit content to fill space */
		data.fitContent = false;

		/* Encode all characters */
		data.encodeAll = false;

		/* Forced scroll break */
		data.scrollInterval = 35;

		/* Start index */
		data.start = 0;

		/* List alignment */
		data.listAlignment = 0;

		/* Set class variable */
		this.defaults = data;

		return this.defaults;
	}

	init = (items) =>
	{
		/* Create data object */
		this.data = new Object();

		/* Busy state */
		this.data.busy = false;

		/* Scrollbreak state */
		this.data.scrollbreak = false;

		/* Apply prevent default to these keys */
		this.data.keyPrevent = [
			data.keys.pageUp,
			data.keys.pageDown,
			data.keys.arrowLeft,
			data.keys.arrowUp,
			data.keys.arrowRight,
			data.keys.arrowDown
		];

		this.data.selected = {
			src : null,
			ext : null,
			index : null,
			type : null
		};

		this.container = document.body.querySelector(':scope > div.rootGallery');
		this.items = this.options.filter ? this.filterItems(items) : items;

		if(this.items.length === 0)
		{
			return false;
		}

		if(!this.exists())
		{
			this.initiate(() =>
			{
				this.bind();

				if(this.options.blur)
				{
					this.apply.blur();
				}
			});
		} else {
			this.show(true);
		}

		let start = this.options.start > (this.items.length - 1) ? (this.items.length - 1) : this.options.start;

		this.navigate(start);

		if(this.options.performance)
		{
			this.useOptimzer(this.table);
		}

		if(!this.options.list.show || this.options.mobile)
		{
			this.list.style.display = 'none';
		}
	}

	loadImage = (src) =>
	{
		return new Promise((resolve, reject) =>
		{
			let img = document.createElement('img');

			img.src = src;

			img.addEventListener('error', () =>
			{
				reject(new Error(`failed to load image URL: ${src}`));
			});

			img.addEventListener('load', () =>
			{
				let w = img.naturalWidth;
				let h = img.naturalHeight;

				resolve([src, img, [w, h]]);
			});

			/*

			[Previous method for returning width and height]

			let timer = setInterval(() =>
			{
				let w = img.naturalWidth;
				let h = img.naturalHeight;
				
				if(w && h)
				{
					clearInterval(timer);
					resolve([src, img, [w, h]]);
				}
			}, 30);

			*/
		});
	}

	elementHasScrollbar = (element) =>
	{
		let height = element.getBoundingClientRect().height,
			style = window.getComputedStyle(element);

		height = ['top', 'bottom'].map((side) =>
		{
			return parseInt(style['margin-' + side], 10);
		}).reduce((total, side) =>
		{
			return total + side;
		}, height);

		return height > window.innerHeight;
	}

	encodeUrl = (input) => 
	{
		let encoded = encodeURI(input);

		if(this.options.encodeAll)
		{
			encoded = encoded.replace('#', '%23').replace('?', '%3F');
		}

		encoded = encoded.replace('+', '%2B');

		return encoded;
	}

	getExtension = (filename) =>
	{
		return filename.split('.').pop().toLowerCase();
	}

	isImage = (filename, extension = null) =>
	{
		return this.options.extensions.image.includes(extension ? extension : this.getExtension(filename));
	}

	isVideo = (filename, extension = null) =>
	{
		return this.options.extensions.video.includes(extension ? extension : this.getExtension(filename));
	}

	filterItems = (items) =>
	{
		return items.filter((item) =>
		{
			return this.isImage(item.name) || this.isVideo(item.name);
		});
	}

	getScrollbarWidth = () =>
	{
		if(!this.elementHasScrollbar(document.body))
		{
			return 0;
		}

		let outer = document.createElement('div');

		DOM.css.set(outer, {
			visibility : 'hidden',
			overflow : 'scroll',
			msOverflowStyle : 'scrollbar'
		});

		document.body.appendChild(outer);

		let inner = document.createElement('div');

		outer.appendChild(inner);

		let scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

		outer.parentNode.removeChild(outer);

		return scrollbarWidth;
	}

	limitBody = (bool = true) =>
	{
		let body = document.body,
			root = document.documentElement,
			scrollpadding = this.getScrollbarWidth();

		if(bool === true)
		{
			document.documentElement.setAttribute('gallery-is-visible', '');
			this.isVisible = true;

			this.data.body = {
				'max-height' : body.style['max-height'],
				'overflow' : body.style.overflow
			};

			if(scrollpadding > 0)
			{
				DOM.css.set(root, {
					'padding-right' : scrollpadding + 'px'
				});
			}

			DOM.css.set(body, {
				'max-height' : 'calc(100vh - var(--height-gallery-top-bar))',
				'overflow' : 'hidden'
			});
		} else {
			document.documentElement.removeAttribute('gallery-is-visible');
			this.isVisible = false;

			if(Object.prototype.hasOwnProperty.call(this.data, 'body'))
			{
				DOM.css.set(body, {
					'max-height' : this.data.body['max-height'],
					'overflow' : this.data.body.overflow
				});
			}

			DOM.css.set(root, {
				'padding-right' : 'unset'
			});
		}
	}

	exists = () =>
	{
		this.container = document.body.querySelector(':scope > div.rootGallery');

		return this.container ? true : false;
	}

	show = (bool = true, index = null, items = null) =>
	{
		if(items)
		{
			this.pipe('itemsUpdate', true);

			this.data.selected.index = null;
			this.items = this.options.filter ? this.filterItems(items) : items;

			this.populateTable(this.items);
		}

		if(bool === true)
		{
			this.bind().style.display = 'block';

			if(index !== this.data.selected.index)
			{
				let elements = this.container.querySelectorAll(
					':scope > div.galleryContent > div.media > div.wrapper img, \
					:scope > div.galleryContent > div.media > div.wrapper video'
				);

				elements.forEach((element) =>
				{
					element.style.display = 'none';
				});

				this.navigate(index);

				if(items && this.options.performance)
				{
					this.useOptimzer(this.table);
				}
			}
		} else {
			this.unbind(this.data.bound);

			this.container.style.display = 'none';
		}

		if(this.options.blur)
		{
			this.apply.blur(bool);
		}

		this.limitBody(bool);

		let video = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper video');

		if(video)
		{
			if(bool === true && video.style.display !== 'none')
			{
				let currentTime = video.currentTime;
				let sourceMatch = false;

				if(this.options.continue.video &&
					Object.prototype.hasOwnProperty.call(this.options.continue.video, 'src'))
				{
					sourceMatch = video.querySelector('source').getAttribute('src') == this.options.continue.video.src;
				}

				if(this.options.continue.video && sourceMatch)
				{
					currentTime = this.options.continue.video.time;
					this.options.continue.video = null;
				}

				video.currentTime = currentTime;
				video.muted = false;
				video[this.options.autoplay ? 'play' : 'pause']();

				this.video.setVolume(video, this.video.getVolume());
			} else if(bool === false)
			{
				video.pause();
			}
		}

		if(bool && this.options.performance && this.optimize && this.list && this.table)
		{
			let selectedItem = this.table.querySelector('tr.selected'),
				selectedItemTop = parseInt(selectedItem.style.top.replace(/\D+/g, ''));

			if(Number.isInteger(selectedItemTop) && !(selectedItemTop >= 0))
			{
				selectedItemTop = false;
			}

			if(!(this.list.scrollTop <= selectedItemTop && selectedItemTop <= (this.list.scrollTop + this.list.offsetHeight)))
			{
				this.list.scrollTo(0, selectedItemTop);
			}

			this.optimize.attemptRefresh();
		}
	}

	busy = (bool) =>
	{
		if(typeof bool != 'undefined')
		{
			this.data.busy = bool;

			let loader = this.container.querySelector(':scope > div.galleryContent > div.media > div.spinner');

			if(bool)
			{
				DOM.css.set(loader, {
					opacity : 1
				});
			} else {
				loader.style.opacity = 0;
			}
		}

		return this.data.busy;
	}

	useOptimzer = (table) =>
	{
		/* delete any previous instances */
		if(this.optimize)
		{
			delete this.optimize;

			eventHandler.removeListener(this.list, 'scroll', 'galleryTableScroll');

			DOM.css.set(this.table, {
				height : 'auto'
			});
		}

		const page = {
			update : () =>
			{
				page.windowHeight = window.innerHeight;
				page.windowWidth = window.innerWidth;
				page.scrolledY = window.scrollY;

				return true;
			}
		};

		data.layer.gallery = page;

		page.scope = table;

		page.update = () =>
		{
			page.windowHeight = window.innerHeight;
			page.windowWidth = window.innerWidth;
			page.scrolledY = this.list.scrollTop;

			return true;
		};

		page.update();

		this.page = page;

		this.optimize = new optimizeClass({
			pipe : this.pipe,
			page : page,
			table : table,
			scope : [this.list, 'scrollTop']
		});

		eventHandler.removeListener(window, 'resize', 'windowGalleryResize');

		eventHandler.addListener(window, 'resize', 'windowGalleryResize', debounce(() =>
		{
			if(this.options.performance && this.optimize.enabled)
			{
				pipe('windowResize (gallery)', 'Resized.');

				page.update();
			}
		}));

		let scrollEndTimer = null;

		eventHandler.addListener(this.list, 'scroll', 'galleryTableScroll', () =>
		{
			if(this.options.performance && this.optimize.enabled)
			{
				/* Get scrolled position */
				let scrolled = this.list.scrollTop;

				/* Trigger optimization refresh if 175 px has been scrolled */
				if(Math.abs(scrolled - (this.page).scrolledY) > 175)
				{
					this.optimize.attemptRefresh();
				}

				clearTimeout(scrollEndTimer);

				scrollEndTimer = setTimeout(() =>
				{
					this.optimize.attemptRefresh();
				}, 150);
			}
		});

		return this.optimize;
	}

	populateTable = (items, table) =>
	{
		this.pipe('Populating gallery list ..');

		table = table || this.container.querySelector('div.galleryContent > div.list > table');

		let buffer = new Array();

		for(let i = 0; i <= items.length - 1; i++)
		{
			buffer[i] = `<tr title="${items[i].name}"><td>${items[i].name}</td></tr>`;
		}

		table.innerHTML = (buffer.join(''));

		this.list = this.container.querySelector('div.galleryContent > div.list');
		this.table = table;

		return table;
	}

	update = {
		listWidth : (wrapper) =>
		{
			wrapper = wrapper || this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

			let list = this.data.list ? this.data.list : (this.container.querySelector(':scope > div.galleryContent > div.list')),
				width = (this.options.mobile || !list || list.style.display === 'none') ? 0 : list.offsetWidth;

			wrapper.style.setProperty('--width-list', `${width}px`);
		}
	}

	getReverseOptions = (url) =>
	{
		url = this.encodeUrl(document.location.origin + url);

		let reverseObj = new Object();

		Object.keys(data.text.reverseSearch).forEach((key) =>
		{
			reverseObj[key] = data.text.reverseSearch[key].replace('{URL}', url);
		});

		return reverseObj;
	}

	reverse = (cover) =>
	{
		if(!this.options.reverseOptions)
		{
			return false;
		}

		let container = this.container.querySelector(':scope > div.galleryContent > div.media .reverse');

		if(!container)
		{
			let reverse = DOM.new('div', {
				class : 'reverse'
			});

			cover.prepend(reverse);

			container = reverse;
		}

		let options = this.getReverseOptions(this.data.selected.src);

		container.innerHTML = Object.keys(options).map((site) => `<a class="reverse-link" target="_blank" href="${options[site]}">${site}</a>`).join('');

		this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper > div.cover').append(container);
	}

	shortenString = (input, cutoff) =>
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
	}

	apply = {
		cache : {
			info : null
		},
		timers : {
			dimensions : null
		},
		itemDimensions : (index) =>
		{
			let item = this.items[index],
				media = this.container.querySelector('div.media > div.item-info-static');

			if(Object.prototype.hasOwnProperty.call(item, 'dimensions') &&
				item.dimensions.height > 0 &&
				item.dimensions.width > 0)
			{
				if(!media)
				{
					media = DOM.new('div', {
						class : 'item-info-static'
					});

					this.container.querySelector('div.media').appendChild(media);
				}

				media.style.opacity = 1;
				media.style.display = 'inline-block';

				media.textContent = `${item.dimensions.width} x ${item.dimensions.height} (${item.size})`;
			} else if(media) {
				media.style.display = 'none';
			}

			clearTimeout(this.apply.timers.dimensions);

			this.apply.timers.dimensions = setTimeout(() =>
			{
				if(media)
				{
					media.style.opacity = 0;
				}
			}, 3E3);
		},
		itemInfo : (update, item = null, index = null, max = null) =>
		{
			if(update)
			{
				if(Array.isArray(this.apply.cache.info))
				{
					[item, index, max] = this.apply.cache.info;
				} else if(item === null || index === null || max === null)
				{
					return false;
				}
			} else {
				this.apply.cache.info = [item, index, max];

				return false;
			}

			let download = this.container.querySelector('.galleryBar > .galleryBarRight > a.download'),
				left = this.container.querySelector(':scope > div.galleryBar > div.galleryBarLeft'),
				name = this.options.mobile ? this.shortenString(item.name, 30) : item.name,
				url = this.encodeUrl(item.url);

			DOM.attributes.set(download, {
				'filename' : item.name,
				'href' : url,
				'title' : `Download: ${item.name}`
			});

			left.innerHTML = `<span>${index + 1} of ${max}</span>`;
			left.innerHTML += `<a target="_blank" href="${url}">${name}</a>`;

			if(Object.prototype.hasOwnProperty.call(item, 'size') && !this.options.mobile)
			{
				left.innerHTML += `<span>${item.size}</span>`;
			}

			return true;
		},
		blur : (bool = true) =>
		{
			if(bool === true)
			{
				this.data.blurred = new Array();

				let ignore = ['.rootGallery', 'script', 'noscript', 'style'];

				document.body.querySelectorAll(`:scope > div${ignore.map((e) => `:not(${e})`).join('')}`).forEach((element) =>
				{
					element.classList.add('blur');

					this.data.blurred.push(element);
				});
			} else {
				if(Object.prototype.hasOwnProperty.call(this.data, 'blurred'))
				{
					this.data.blurred.forEach((element) =>
					{
						element.classList.remove('blur');
					});
				}
			}

			return this;
		}
	}

	/* Checks if a list item is scrolled into view */
	isScrolledIntoView = (container, element) =>
	{
		let parent = {
			scrolled : container.scrollTop,
			height : container.offsetHeight
		};

		let child = {
			offset : element.offsetTop,
			height : element.children[0].offsetHeight
		};

		pipe('-> isScrolledIntoView ->', parent, child);

		return child.offset >= parent.scrolled &&
			(child.offset + child.height) <= (parent.scrolled + parent.height);
	}

	calculateIndex = (current, change, max) =>
	{
		let adjusted = (current + change);

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
			return this.calculateIndex(current, (max - adjusted), max);
		}

		return adjusted;
	}

	video = {
		create : (extension) =>
		{
			let video = DOM.new('video', {
				controls : '',
				preload : 'auto',
				loop : ''
			});

			let source = DOM.new('source', {
				type : `video/${extension === 'mov' ? 'mp4' : (extension === 'ogv' ? 'ogg' : extension)}`,
				src : ''
			});

			video.append(source);

			this.video.setVolume(video, this.video.getVolume());

			return [video, source];
		},
		getVolume : () =>
		{
			let volume = parseFloat(this.options.volume);

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
			let video = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper video');

			if(video)
			{
				let current = Math.round(video.currentTime), duration = Math.round(video.duration);

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

	showItem = (type, element, src, init, index, data = null) =>
	{
		this.pipe('showItem', type, element, src, init, index, data);

		let wrapper = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper'),
			video, source = null,
			hasEvented = false;

		let applyChange = (onChange) =>
		{
			let elements = this.container.querySelectorAll(':scope > \
				div.galleryContent > div.media > div.wrapper > div:not(.cover)');

			elements.forEach((element) =>
			{
				if(element)
				{
					element.remove();
				}
			});

			this.apply.itemInfo(true);
			this.data.selected.type = type;

			let hideOther = () =>
			{
				let opposite = wrapper.querySelector(type === 0 ? 'video' : 'img');

				if(opposite && type === 1)
				{
					opposite.closest('.cover').style.display = 'none';
				}

				if(opposite)
				{
					opposite.style.display = 'none';
				}
			};

			wrapper.style.display = '';

			if(onChange)
			{
				onChange();
			}

			hideOther();

			this.busy(false);
		};

		let display = () =>
		{
			if(type === 0)
			{
				video = wrapper.querySelector('video');

				this.items[index].dimensions = {
					height : data.img.height,
					width : data.img.width
				};

				this.apply.itemDimensions(index);

				applyChange(() =>
				{
					if(this.options.sharpen)
					{
						element.setAttribute('sharpened', '');
					}

					element.onload = () =>
					{
						if(this.options.fitContent)
						{
							let height = `calc(calc(100vw - var(--width-list)) / ${(data.img.width / data.img.height).toFixed(4)})`;
							
							this.update.listWidth(wrapper);

							DOM.css.set(element, {
								'width' : 'auto',
								'height' : height
							});

							DOM.css.set(element.closest('.cover'), {
								'height' : height
							});
						}
					};

					element.setAttribute('src', src);
					element.style.display = 'inline-block';
					element.closest('.cover').style.display = '';

					if(video)
					{
						let videoSource = video.querySelector('source');

						video.pause();

						videoSource.setAttribute('src', '');

						eventHandler.removeListener(video, 'error', code.ERROR_VIDEO_ID);
						eventHandler.removeListener(videoSource, 'error', code.ERROR_SOURCE_ID);
					}
				});
			} else if(type === 1)
			{
				if(init === false)
				{
					[video, source] = this.video.create(this.data.selected.ext);

					wrapper.append(video);
				} else {
					source = element.querySelector('source');
					video = element;
				}

				source.setAttribute('src', src);

				let error = (e) =>
				{
					console.error('Failed to load video source.', e);

					this.busy(false);
				};

				eventHandler.addListener(video, 'error', code.ERROR_VIDEO_ID, (e) =>
				{
					error(e);
				});

				eventHandler.addListener(source, 'error', code.ERROR_SOURCE_ID, (e) =>
				{
					error(e);
				});

				eventHandler.addListener(video, ['volumechange'], null, () =>
				{
					this.options.volume = video.muted ? 0 : parseFloat(parseFloat(video.volume).toFixed(2));
					this.emitter.dispatch('volumeChange', this.options.volume);
				});

				eventHandler.addListener(video, [
					'canplay', 'canplaythrough', 'loadeddata', 'playing'
				], null, () =>
				{
					if(hasEvented)
					{
						return false;
					}

					let height = video.videoHeight,
						width = video.videoWidth;

					this.items[index].dimensions = {
						height : height,
						width : width
					};

					this.apply.itemDimensions(index);

					applyChange(() =>
					{
						if(this.options.fitContent)
						{
							this.update.listWidth(wrapper);

							DOM.css.set(video, {
								width : 'auto',
								height : `calc(calc(100vw - var(--width-list)) / ${(width / height).toFixed(4)})`
							});
						}

						if(this.options.volume)
						{
							video.volume = this.options.volume;
						}

						/* Plays the video if the gallery is visible, otherwise pauses it */
						if(this.isVisible && this.options.autoplay)
						{
							video.play();
						} else if(!this.isVisible)
						{
							video.pause();
						}

						video.style.display = 'inline-block';

						/* If the gallery was hidden while loading, pause video and hide loader. */
						if(this.container.display === 'none')
						{
							this.container.querySelector('div.galleryContent .media div.spinner').style.opacity = 0;
							video.pause();
						}

						if(init === false)
						{
							element.remove();
						}

						hasEvented = true;
					});
				});

				video.load();

				if(this.options.continue.video && src == this.options.continue.video.src)
				{
					video.currentTime = this.options.continue.video.time;
					this.options.continue.video = null;
				}
			}

			this.data.selected.index = index;
		};

		display();
	}

	/**
	 * Navigates the gallery
	 */
	navigate = (index, step = null) =>
	{
		this.pipe('busyState', this.busy());

		if(this.busy())
		{
			return false;
		}

		let max = this.items.length - 1;

		if(index === null)
		{
			index = this.data.selected.index;
		}

		if(step !== null)
		{
			index = this.calculateIndex(index, step, max);
		}

		if(this.data.selected.index === index || this.busy() === true)
		{
			return false;
		}

		let init = null,
			item = null,
			contentContainer = this.container.querySelector(':scope > div.galleryContent');

		let image = contentContainer.querySelector(':scope > div.media > div.wrapper img'),
			video = contentContainer.querySelector(':scope > div.media > div.wrapper video');

		let list = contentContainer.querySelector(':scope > div.list'),
			table = list.querySelector('table'),
			element = table.querySelector(`tr:nth-child(${index + 1})`);

		item = this.items[index];

		let encoded = this.encodeUrl(item.url);

		this.data.selected.src = encoded;
		this.data.selected.ext = this.getExtension(item.name);

		if(table.querySelector('tr.selected'))
		{
			table.querySelector('tr.selected').classList.remove('selected');
		}

		element.classList.add('selected');

		table.querySelector('tr.selected').classList.add('selected');

		this.apply.itemInfo((!image && !video) ? true : false, item, index, max + 1);

		let hasScrolled = false,
			useScrollOptimize = this.options.performance && this.optimize && this.optimize.enabled;

		if(useScrollOptimize && element.classList.contains('hid-row') && element._offsetTop >= 0)
		{
			let scrollPosition = element._offsetTop - (list.offsetHeight / 2);
			/* Scroll to a hidden row as a result of optimization */
			list.scrollTo(0, scrollPosition >= 0 ? scrollPosition : 0);

			/* Set variable to indicate that we've scrolled here instead */
			hasScrolled = true;
		}

		/* Use default `scrollto` if item is out of view */
		if(!hasScrolled && !this.isScrolledIntoView(list, element))
		{
			list.scrollTo(0, element.offsetTop);
		}

		if(this.isImage(null, this.data.selected.ext))
		{
			this.busy(true);

			init = image ? false : true;

			if(video)
			{
				video.pause();
			}

			if(init === true)
			{
				let cover = DOM.new('div', {
					class : 'cover',
					style : 'display: none'
				});

				let wrapper = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

				image = DOM.new('img');

				wrapper.prepend(cover);

				cover.append(image);

				cover.addEventListener('mouseenter', (e) =>
				{
					if(this.options.reverseOptions)
					{
						this.reverse(e.currentTarget);
					}
				});
			}

			this.loadImage(encoded).then((data) =>
			{
				let [src, , dimensions] = data;
				let [w, h] = dimensions;

				if(this.data.selected.src === src)
				{
					this.showItem(0, image, src, init, index, {
						img : {
							width : w,
							height : h
						}
					});
				}
			}).catch((error) =>
			{
				console.error(error);

				this.busy(false);
				this.data.selected.index = index;

				this.container.querySelectorAll(':scope > div.galleryContent > div.media > div.wrapper img, \
					:scope > div.galleryContent > div.media > div.wrapper video').forEach((element) =>
				{
					element.style.display = 'none';
				});

				if(this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper > div:not(.cover)'))
				{
					this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper > div:not(.cover)').remove();
				}

				let imageError = DOM.new('div', {
					class : 'error'
				});

				imageError.innerHTML = 'Error: Image could not be displayed.';

				this.container.querySelector('.media .wrapper').append(imageError);
			});

			return true;
		}

		if(this.isVideo(null, this.data.selected.ext))
		{
			this.busy(true);

			init = (video ? false : true);

			if(init)
			{
				video = this.video.create(this.data.selected.ext)[0];
				/* video.appendTo(this.container.find('> div.galleryContent > div.media > div.wrapper')); */

				this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper').append(video);
			}

			this.showItem(1, video, encoded, init, index);

			return true;
		}
	}

	/**
	 * Handles keypresses
	 */
	handleKey = (key, callback) =>
	{
		this.pipe('handleKey', key);

		if(key === data.keys.escape)
		{
			/* Close gallery on `escape` */
			this.show(false);
		} else if(key === data.keys.arrowDown || key === data.keys.pageDown || key === data.keys.arrowRight)
		{
			if(key === data.keys.arrowRight && this.data.selected.type === 1)
			{
				/* Seek (+) video on `arrowRight` (video elements) */
				if(this.video.seek(5)) this.navigate(null, 1);
			} else {
				/* Next gallery item on `arrowRight` (image elements) */
				this.navigate(null, 1);
			}
		} else if(key === data.keys.arrowUp || key === data.keys.pageUp || key === data.keys.arrowLeft)
		{
			if(key === data.keys.arrowLeft && this.data.selected.type === 1)
			{
				/* Seek (-) video on `arrowLeft` (video elements) */
				if(this.video.seek(-5)) this.navigate(null, -1);
			} else {
				/* Previous gallery item on `arrowLeft` (image elements) */
				this.navigate(null, -1);
			}
		} else if(key === data.keys.l)
		{
			/* Toggle list on `l` */
			this.toggleList();
		}

		callback(this.data.keyPrevent.includes(key));
	}

	unbind = (bound, event = true) =>
	{
		bound.forEach((value) =>
		{
			if(Object.prototype.hasOwnProperty.call(value, 'direct') && value.direct === true)
			{
				eventHandler.removeListener(value.trigger, value.event);

				return true;
			}

			let identifier = Object.prototype.hasOwnProperty.call(value, 'id') ? value.id : null;

			if(value.trigger)
			{
				eventHandler.removeListener(value.trigger, value.event, identifier);

			} else {
				eventHandler.removeListener(document, value.event, identifier);
			}
		});

		if(event === true)
		{
			this.emitter.dispatch('unbound', true);
		}
	}

	scrollBreak = () =>
	{
		this.data.scrollbreak = false;
	}

	toggleList = (element = null) =>
	{
		let list = this.container.querySelector(':scope > div.galleryContent > div.list'),
			visible = list.style.display !== 'none',
			client = user.get();

		client.gallery.listState = (!visible ? 1 : 0);

		user.set(client);

		if(!element)
		{
			element = document.body.querySelector('div.rootGallery > div.galleryBar .galleryBarRight span[data-action="toggle"]');
		}

		element.innerHTML = `List<span>${visible ? '+' : '-'}</span>`;

		DOM.css.set(list, {
			'display' : visible ? 'none' : 'table-cell'
		});

		this.update.listWidth();

		if(!visible && this.options.performance && this.optimize.enabled)
		{
			this.optimize.attemptRefresh();
		}

		return !visible;
	}

	bind = () =>
	{
		this.data.bound = [
			{
				event : 'click',
				trigger : 'body > div.rootGallery > div.galleryContent > div.list table tr'
			},
			{
				event : 'click',
				trigger : 'body > div.rootGallery > div.galleryContent > div.media'
			},
			{
				event : 'DOMMouseScroll mousewheel',
				trigger : 'body > div.rootGallery > div.galleryContent > div.media'
			},
			{
				event : 'mouseenter',
				trigger : 'body > div.rootGallery > div.galleryContent > div.media > div.wrapper > div.cover'
			},
			{
				event : 'mouseup',
				trigger : 'body > div.rootGallery'
			},
			{
				event : 'keydown',
				trigger : null,
				id : 'galleryKeyDown'
			},
			{
				event : 'keyup',
				trigger : null,
				id : 'galleryKeyUp'
			}
		];

		this.unbind(this.data.bound, false);

		eventHandler.addListener(this.data.listDrag, 'mousedown', 'galleryListMouseDown', () =>
		{
			this.data.listDragged = true;

			let windowWidth = window.innerWidth,
				wrapper = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

			/* Set cursors and pointer events */
			DOM.css.set(document.body, {
				'cursor': 'w-resize'
			});

			DOM.css.set(wrapper, {
				'pointer-events': 'none'
			});

			if(this.list)
			{
				DOM.css.set(this.list, {
					'pointer-events': 'none'
				});
			}

			/* Remove `dragged` attribute */
			if(this.data.listDrag)
			{
				this.data.listDrag.setAttribute('dragged', true);
			}

			eventHandler.addListener('body > div.rootGallery', 'mousemove', 'galleryListMouseMove', (e) =>
			{
				let x = e.clientX;

				if(x < windowWidth)
				{
					let width = this.options.list.reverse ? (x + this.getScrollbarWidth()) : (windowWidth - x);

					requestAnimationFrame(() =>
					{
						DOM.css.set(this.data.list, {
							'width' : `${width}px`
						});
					});
				}
			});
		});

		eventHandler.addListener('body > div.rootGallery', 'mouseup', 'galleryListMouseUp', () =>
		{
			if(this.data.listDragged === true)
			{
				eventHandler.removeListener('body > div.rootGallery', 'mousemove', 'galleryListMouseMove');

				let wrapper = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

				/* Unset cursors and pointer events */
				DOM.css.set(document.body, {
					'cursor': ''
				});

				DOM.css.set(wrapper, {
					'pointer-events': 'auto'
				});

				if(this.list)
				{
					DOM.css.set(this.list, {
						'pointer-events': 'auto'
					});
				}

				/* Remove `dragged` attribute */
				if(this.data.listDrag)
				{
					this.data.listDrag.removeAttribute('dragged');
				}

				let lw = parseInt(this.data.list.style.width.replace(/[^-\d.]/g, ''));

				this.pipe('Set list width', lw);

				if(lw > 100)
				{
					let client = JSON.parse(cookies.get('ei-client'));

					client.gallery.listWidth = lw;

					cookies.set('ei-client', JSON.stringify(client), {
						sameSite : 'lax',
						expires : 365
					});

					this.update.listWidth(wrapper);
				}

				this.data.listDragged = false;
			}
		});

		/* Add action events */
		eventHandler.addListener('body > div.rootGallery', 'click', 'galleryContainerClick', (e) =>
		{
			if(e.target && e.target.hasAttribute('data-action'))
			{
				let action = e.target.getAttribute('data-action').toLowerCase();

				switch(action)
				{
					case 'next':
						this.navigate(null, 1);
						break;

					case 'previous':
						this.navigate(null, -1);
						break;

					case 'toggle':
						this.toggleList(e.target);
						break;

					case 'close':
						this.show(false);
						break;
				}
			}
		});

		/* List item click listener */
		eventHandler.addListener('body > div.rootGallery > div.galleryContent \
			> div.list table', 'click', 'listNavigateClick', (e) =>
		{
			if(e.target.tagName == 'TD')
			{
				this.navigate(DOM.getIndex(e.target.closest('tr')));

			} else if(e.target.tagName == 'TR')
			{
				this.navigate(DOM.getIndex(e.target));
			}
		});

		/* Gallery media click listener */
		eventHandler.addListener('body > div.rootGallery > div.galleryContent \
			> div.media', 'click', 'mediaClick', (e) =>
		{
			/* Hide gallery if media background is clicked */
			if(!['IMG', 'VIDEO', 'A'].includes(e.target.tagName))
			{
				this.show(false);
			}
		});

		if(this.options.mobile === true)
		{
			/* Handle swipe events */
			let handler = (event, eventData) =>
			{
				switch(eventData.directionX)
				{
					case 'RIGHT':
						this.navigate(null, -1);
						break;

					case 'LEFT':
						this.navigate(null, 1);
						break;
				}
			};

			/* Create swipe events */
			let swipeInstance = new swipe({
				element: document.querySelector('body > div.rootGallery'),
				onSwiped: handler,
				mouseTrackingEnabled: true
			});

			swipeInstance.init();
		}

		eventHandler.addListener('body > div.rootGallery \
			> div.galleryContent > div.media', ['DOMMouseScroll', 'mousewheel'], 'galleryKeyUp', (e) =>
		{
			if(this.options.scrollInterval > 0 && this.data.scrollbreak === true)
			{
				return false;
			}

			this.navigate(null, (e.detail > 0 || e.wheelDelta < 0) ? 1 : -1);

			if(this.options.scrollInterval > 0)
			{
				this.data.scrollbreak = true;

				setTimeout(() => this.scrollBreak(), this.options.scrollInterval);
			}
		});

		eventHandler.addListener(document, 'keyup', 'galleryKeyUp', (e) =>
		{
			this.handleKey(e.keyCode, (prevent) =>
			{
				if(prevent)
				{
					e.preventDefault();
				}
			});
		});

		eventHandler.addListener(document, 'keydown', 'galleryKeyDown', (e) =>
		{
			if(this.data.keyPrevent.includes(e.keyCode))
			{
				e.preventDefault();
			}

			if(e.keyCode === data.keys.g)
			{
				this.show(false);
			}
		});

		this.emitter.dispatch('bound', true);

		return this.container;
	}

	/* Construct gallery top bar items */
	barConstruct = (bar) =>
	{
		/* Create `download` button */
		bar.append(DOM.new('a', {
			'text' : this.options.mobile ? 'Save' : 'Download',
			'class' : 'download',
			'download' : ''
		}));

		if(!this.options.mobile)
		{
			/* Create `previous` button */
			bar.append(DOM.new('span', {
				'data-action' : 'previous',
				'text' : 'Previous'
			}));

			/* Create `next` button */
			bar.append(DOM.new('span', {
				'data-action' : 'next',
				'text' : 'Next'
			}));

			/* Create `list toggle` button */
			let listToggle = DOM.new('span', {
				'data-action' : 'toggle',
				'text' : 'List'
			});

			listToggle.append(DOM.new('span', {
				'text' : this.options.list.show ? '-' : '+'
			}));

			/* Create `list toggle` button */
			bar.append(listToggle);
		}

		/* Create `close` button */
		bar.append(DOM.new('span', {
			'data-action' : 'close',
			'text' : 'Close'
		}));

		return bar;
	}

	initiate = (callback) =>
	{
		/* Fix body overflow and paddings */
		this.limitBody(true);

		let preview = document.body.querySelector(':scope > div.preview-container');

		/* Remove any active hover previews just in case */
		if(preview)
		{
			preview.remove();
		}

		/* Create main container */
		this.container = DOM.new('div', {
			class : 'rootGallery'
		});

		document.body.prepend(this.container);

		/* Create gallery top bar */
		let top = DOM.new('div', {
			class : 'galleryBar'
		});

		this.container.append(top);

		/* Create left area of top bar */
		top.append(DOM.new('div', {
			class : 'galleryBarLeft'
		}));

		/* Create right area of top bar */
		top.append(this.barConstruct(DOM.new('div', {
			class : 'galleryBarRight'
		})));

		/* Create content (media) outer container */
		let content = DOM.new('div', {
			class : 'galleryContent' + (this.options.list.reverse ? ' reversed' : '')
		});

		this.container.append(content);

		let media = DOM.new('div', {
			class : 'media'
		});

		/* Create list */
		let list = DOM.new('div', {
			class : 'ns list'
		});

		/* Add to content container, respecting list reverse status */
		content.append(this.options.list.reverse ? list : media);
		content.append(this.options.list.reverse ? media : list);

		/* Create dragable element on list edge */
		this.data.listDrag = DOM.new('div', {
			class : 'drag'
		});

		list.append(this.data.listDrag);

		/* Declare variables */
		this.data.list = list;
		this.data.listDragged = false;

		let client = JSON.parse(cookies.get('ei-client'));

		try
		{
			let width = JSON.parse(client.gallery.listWidth.toString().toLowerCase());

			if(width && parseInt(width) > (window.innerWidth / 2))
			{
				client.gallery.listWidth = Math.floor(window.innerWidth / 2);

				cookies.set('ei-client', JSON.stringify(client), {
					sameSite : 'lax',
					expires : 365
				});
			}

			if(width)
			{
				DOM.css.set(this.data.list, {
					'width' : `${width}px`
				});
			}
		} catch (e) {
			client.gallery.listWidth = false;

			cookies.set('ei-client', JSON.stringify(client), {
				sameSite : 'lax',
				expires : 365
			});
		}

		/* Create mobile navigation (left & right) */
		if(this.options.mobile === true)
		{
			let navigateLeft = DOM.new('div', {
				'class' : 'screenNavigate navigateLeft',
				'data-action' : 'previous'
			});

			let navigateRight = DOM.new('div', {
				'class' : 'screenNavigate navigateRight',
				'data-action' : 'next'
			});

			navigateLeft.append(DOM.new('span'));
			navigateRight.append(DOM.new('span'));

			content.append(navigateRight, navigateLeft);
		}

		media.append(DOM.new('div', {
			class : 'wrapper' + (this.options.fitContent ? ' fill' : '')
		}));

		media.append(DOM.new('div', {
			class : 'spinner'
		}));

		/* Create list table */
		let table = DOM.new('table', {
			cellspacing : '0'
		});

		table.append(DOM.new('tbody'));

		list.append(table);

		/* Add items to list */
		this.populateTable(this.items);

		callback(true);
	}
}