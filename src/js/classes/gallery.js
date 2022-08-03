/* import vendors */
import cookies from 'js-cookie';
import swipe from 'vanilla-swipe';

/* import config */
import {
	user
} from '../config/config';

import {
	data
} from '../config/data';

import {
	code
} from '../config/constants';

/* import modules */
import {
	eventHandler
} from '../modules/event-handler';

/* import classes */
import {
	optimizeClass
} from './optimize';

import {
	emitterClass
} from './emitter';

/* import helpers */
import {
	dom,
	debounce
} from '../modules/helpers';

/* import stylesheet */
import '../../css/gallery.scss';

const pipe = data.instances.pipe;

export class galleryClass
{
	constructor(items, options)
	{
		options = options || new Object();

		/* get default values */
		let defaults = this.setDefaults();

		/* override any default values passed as an option */
		Object.keys(defaults).forEach((key) =>
		{
			if(!Object.prototype.hasOwnProperty.call(options, key))
			{
				options[key] = defaults[key];
			}
		});

		/* set options */
		this.options = options;

		/* logging */
		this.pipe = this.options.pipe;

		/* new event emitter */
		this.emitter = new emitterClass();

		/* initiate */
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

		/* valid extensions */
		data.extensions = {
			image : ['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'],
			video : ['mp4', 'webm', 'ogg', 'ogv', 'mov']
		};

		/* item list */
		data.list = {
			show : true,
			reverse : false
		};

		/* video */
		data.video = {
			video : null
		};

		/* performance mode */
		data.performance = false;

		/* video autoplay */
		data.autoplay = true;

		/* video volume */
		data.volume = 0;

		/* verbose */
		data.console = true;

		/* reverse image search */
		data.reverseOptions = true;

		/* blurred background */
		data.blur = true;

		/* sharpen images */
		data.sharpen = true;

		/* mobile mode */
		data.mobile = false;

		/* fit content to fill space */
		data.fitContent = false;

		/* encode all characters */
		data.encodeAll = false;

		/* forced scroll break */
		data.scrollInterval = 35;

		/* start index */
		data.start = 0;

		/* list alignment */
		data.listAlignment = 0;

		/* set class variable */
		this.defaults = data;

		return this.defaults;
	}

	init = (items) =>
	{
		/* create data object */
		this.data = new Object();

		/* busy state */
		this.data.busy = false;

		/* scrollbar data */
		this.data.scrollBar = {
			width : this.getScrollbarWidth(),
			widthForced : this.getDocumentHeight <= window.innerHeight
		};

		/* scrollbreak state */
		this.data.scrollbreak = false;

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

		this.container = document.body.querySelector(':scope > div.gallery-root');

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
		});
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

	getDocumentHeight = () =>
	{
		let body = document.body;

		let root = document.documentElement;

		let rootHeight = Math.max(
			body.scrollHeight,
			body.offsetHeight,
			root.clientHeight,
			root.scrollHeight,
			root.offsetHeight
		);

		return rootHeight;
	}

	getScrollbarWidth = (force = false) =>
	{
		if(!force)
		{
			if(this.getDocumentHeight <= window.innerHeight)
			{
				return 0;
			}
		}

		let outer = document.createElement('div');

		dom.css.set(outer, {
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
		let body = document.body;

		let root = document.documentElement;

		let scrollpadding = this.data.scrollBar.width;

		if(bool === true)
		{
			document.documentElement.setAttribute('gallery-is-visible', '');

			this.data.body = {
				'max-height' : body.style['max-height'],
				'overflow' : body.style.overflow
			};

			if(scrollpadding > 0)
			{
				dom.css.set(root, {
					'padding-right' : scrollpadding + 'px'
				});
			}

			dom.css.set(body, {
				'max-height' : 'calc(100vh - var(--height-gallery-top-bar))',
				'overflow' : 'hidden'
			});
		} else {
			document.documentElement.removeAttribute('gallery-is-visible');

			if(Object.prototype.hasOwnProperty.call(this.data, 'body'))
			{
				dom.css.set(body, {
					'max-height' : this.data.body['max-height'],
					'overflow' : this.data.body.overflow
				});
			}

			dom.css.set(root, {
				'padding-right' : 'unset'
			});
		}
	}

	exists = () =>
	{
		this.container = document.body.querySelector(':scope > div.gallery-root');

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
					':scope > div.gallery-content > div.media > div.wrapper img, \
					:scope > div.gallery-content > div.media > div.wrapper video'
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

		let video = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper video');

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
			let selectedItem = this.table.querySelector('tr.selected');
			let selectedItemTop = parseInt(selectedItem.style.top.replace(/\D+/g, ''));

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

			let loader = this.container.querySelector(':scope > div.gallery-content > div.media > div.spinner');

			if(bool)
			{
				dom.css.set(loader, {
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

			dom.css.set(this.table, {
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
				/* get scrolled position */
				let scrolled = this.list.scrollTop;

				/* trigger optimization refresh if 175 px has been scrolled */
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

		table = table || this.container.querySelector('div.gallery-content > div.list > table');

		let buffer = new Array();

		for(let i = 0; i <= items.length - 1; i++)
		{
			buffer[i] = `<tr title="${items[i].name}"><td>${items[i].name}</td></tr>`;
		}

		table.innerHTML = (buffer.join(''));

		this.list = this.container.querySelector('div.gallery-content > div.list');

		this.table = table;

		return table;
	}

	update = {
		listWidth : (wrapper) =>
		{
			wrapper = wrapper || this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper');

			let list = this.data.list ? this.data.list : (this.container.querySelector(':scope > div.gallery-content > div.list'));

			let	width = (this.options.mobile || !list || list.style.display === 'none') ? 0 : list.offsetWidth;

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

		let container = this.container.querySelector(':scope > div.gallery-content > div.media .reverse');

		if(!container)
		{
			let reverse = dom.new('div', {
				class : 'reverse'
			});

			cover.prepend(reverse);

			container = reverse;
		}

		let options = this.getReverseOptions(this.data.selected.src);

		container.innerHTML = Object.keys(options).map((site) => `<a class="reverse-link" target="_blank" href="${options[site]}">${site}</a>`).join('');

		this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper > div.cover').append(container);
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
			let item = this.items[index];

			let media = this.container.querySelector('div.media > div.item-info-static');

			if(Object.prototype.hasOwnProperty.call(item, 'dimensions') &&
				item.dimensions.height > 0 &&
				item.dimensions.width > 0)
			{
				if(!media)
				{
					media = dom.new('div', {
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

			let download = this.container.querySelector('.gallery-bar > .gallery-bar__right > a.download');
			let left = this.container.querySelector(':scope > div.gallery-bar > div.gallery-bar__left');
			let name = this.options.mobile ? this.shortenString(item.name, 30) : item.name;
			let url = this.encodeUrl(item.url);

			dom.attributes.set(download, {
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

				let ignore = ['.gallery-root', 'script', 'noscript', 'style'];

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
						element.classList.remove('blur', 'ns');
					});
				}
			}

			return this;
		}
	}

	/* checks if a list item is scrolled into view */
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
			let video = dom.new('video', {
				controls : '',
				preload : 'auto',
				loop : ''
			});

			let source = dom.new('source', {
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
			let video = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper video');

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

		let wrapper = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper');
		let video, source = null;
		let hasEvented = false;

		let applyChange = (onChange) =>
		{
			let elements = this.container.querySelectorAll(':scope > \
				div.gallery-content > div.media > div.wrapper > div:not(.cover)');

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

							dom.css.set(element, {
								'width' : 'auto',
								'height' : height
							});

							dom.css.set(element.closest('.cover'), {
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

					let height = video.videoHeight;
					let width = video.videoWidth;

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

							dom.css.set(video, {
								width : 'auto',
								height : `calc(calc(100vw - var(--width-list)) / ${(width / height).toFixed(4)})`
							});
						}

						if(this.options.volume)
						{
							video.volume = this.options.volume;
						}

						if(this.options.autoplay)
						{
							video.play();
						}

						video.style.display = 'inline-block';

						/* if the gallery was hidden while loading, pause video and hide loader. */
						if(this.container.display === 'none')
						{
							this.container.querySelector('div.gallery-content .media div.spinner').style.opacity = 0;
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

		let init = null, item = null;

		let contentContainer = this.container.querySelector(':scope > div.gallery-content');

		let image = contentContainer.querySelector(':scope > div.media > div.wrapper img');
		let video = contentContainer.querySelector(':scope > div.media > div.wrapper video');

		let list = contentContainer.querySelector(':scope > div.list');
		let table = list.querySelector('table');
		let element = table.querySelector(`tr:nth-child(${index + 1})`);

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

		let hasScrolled = false;
		let useScrollOptimize = this.options.performance && this.optimize && this.optimize.enabled;

		if(useScrollOptimize && element.classList.contains('hid-row') && element._offsetTop >= 0)
		{
			let scrollPosition = element._offsetTop - (list.offsetHeight / 2);
			/* scroll to a hidden row as a result of optimization */
			list.scrollTo(0, scrollPosition >= 0 ? scrollPosition : 0);

			/* set var to indicate that we've scrolled here instead */
			hasScrolled = true;
		}

		/* use default scrollto, if item is out of view */
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
				let cover = dom.new('div', {
					class : 'cover',
					style : 'display: none'
				});

				let wrapper = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper');

				image = dom.new('img');

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

				this.container.querySelectorAll(':scope > div.gallery-content > div.media > div.wrapper img, \
					:scope > div.gallery-content > div.media > div.wrapper video').forEach((element) =>
				{
					element.style.display = 'none';
				});

				if(this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper > div:not(.cover)'))
				{
					this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper > div:not(.cover)').remove();
				}

				let imageError = dom.new('div', {
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
				/* video.appendTo(this.container.find('> div.gallery-content > div.media > div.wrapper')); */

				this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper').append(video);
			}

			this.showItem(1, video, encoded, init, index);

			return true;
		}
	}

	handleKey = (key, callback) =>
	{
		this.pipe('handleKey', key);

		if(key === data.keys.escape)
		{
			this.show(false);
		} else if(key === data.keys.arrowDown || key === data.keys.pageDown || key === data.keys.arrowRight)
		{
			if(key === data.keys.arrowRight && this.data.selected.type === 1)
			{
				if(this.video.seek(5)) this.navigate(null, 1);
			} else {
				this.navigate(null, 1);
			}
		} else if(key === data.keys.arrowUp || key === data.keys.pageUp || key === data.keys.arrowLeft)
		{
			if(key === data.keys.arrowLeft && this.data.selected.type === 1)
			{
				if(this.video.seek(-5)) this.navigate(null, -1);
			} else {
				this.navigate(null, -1);
			}
		} else if(key === data.keys.l)
		{
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
		let list = this.container.querySelector(':scope > div.gallery-content > div.list');

		let visible = list.style.display !== 'none';

		let client = user.get();

		client.gallery.listState = (!visible ? 1 : 0);

		user.set(client);

		if(!element)
		{
			element = document.body.querySelector('div.gallery-root > div.gallery-bar .gallery-bar__right span[data-action="toggle"]');
		}

		element.textContent = `List${visible ? '+' : '-'}`;

		dom.css.set(list, {
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
				trigger : 'body > div.gallery-root > div.gallery-content > div.list table tr'
			},
			{
				event : 'click',
				trigger : 'body > div.gallery-root > div.gallery-content > div.media'
			},
			{
				event : 'DOMMouseScroll mousewheel',
				trigger : 'body > div.gallery-root > div.gallery-content > div.media'
			},
			{
				event : 'mouseenter',
				trigger : 'body > div.gallery-root > div.gallery-content > div.media > div.wrapper > div.cover'
			},
			{
				event : 'mouseup',
				trigger : 'body > div.gallery-root'
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

			let windowWidth = window.innerWidth;
			let	wrapper = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper');

			dom.css.set(document.body, {
				'cursor' : 'w-resize'
			});

			dom.css.set(wrapper, {
				'pointer-events' : 'none'
			});

			eventHandler.addListener('body > div.gallery-root', 'mousemove', 'galleryListMouseMove', (e) =>
			{
				let x = e.clientX;

				if(x < windowWidth)
				{
					let width = this.options.list.reverse ? (x + this.data.scrollbarWidth) : (windowWidth - x);

					requestAnimationFrame(() =>
					{
						dom.css.set(this.data.list, {
							'width' : `${width}px`
						});
					});
				}
			});
		});

		eventHandler.addListener('body > div.gallery-root', 'mouseup', 'galleryListMouseUp', () =>
		{
			if(this.data.listDragged === true)
			{
				eventHandler.removeListener('body > div.gallery-root', 'mousemove', 'galleryListMouseMove');

				let wrapper = this.container.querySelector(':scope > div.gallery-content > div.media > div.wrapper');

				dom.css.set(document.body, {
					'cursor' : ''
				});

				dom.css.set(wrapper, {
					'pointer-events' : 'auto'
				});

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

		/* add action events */
		eventHandler.addListener('body > div.gallery-root', 'click', 'galleryContainerClick', (e) =>
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

		/* list item click listener */
		eventHandler.addListener('body > div.gallery-root > div.gallery-content \
			> div.list table', 'click', 'listNavigateClick', (e) =>
		{
			if(e.target.tagName == 'TD')
			{
				this.navigate(dom.getIndex(e.target.closest('tr')));

			} else if(e.target.tagName == 'TR')
			{
				this.navigate(dom.getIndex(e.target));
			}
		});

		/* gallery media click listener */
		eventHandler.addListener('body > div.gallery-root > div.gallery-content \
			> div.media', 'click', 'mediaClick', (e) =>
		{
			/* hide gallery if media background is clicked */
			if(!['IMG', 'VIDEO', 'A'].includes(e.target.tagName))
			{
				this.show(false);
			}
		});

		if(this.options.mobile === true)
		{
			/* handle swipe events */
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

			/* create swipe events */
			let swipeInstance = new swipe({
				element: document.querySelector('body > div.gallery-root'),
				onSwiped: handler,
				mouseTrackingEnabled: true
			});

			swipeInstance.init();
		}

		eventHandler.addListener('body > div.gallery-root \
			> div.gallery-content > div.media', ['DOMMouseScroll', 'mousewheel'], 'galleryKeyUp', (e) =>
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

	/* construct gallery top bar items */
	barConstruct = (bar) =>
	{
		/* create `download` button */
		bar.append(dom.new('a', {
			'text' : this.options.mobile ? 'Save' : 'Download',
			'class' : 'download',
			'download' : ''
		}));

		if(!this.options.mobile)
		{
			/* create `previous` button */
			bar.append(dom.new('span', {
				'data-action' : 'previous',
				'text' : 'Previous'
			}));

			/* create `next` button */
			bar.append(dom.new('span', {
				'data-action' : 'next',
				'text' : 'Next'
			}));

			/* create `list toggle` button */
			bar.append(dom.new('span', {
				'data-action' : 'toggle',
				'text' : this.options.list.show ? 'List-' : 'List+'
			}));
		}

		/* create `close` button */
		bar.append(dom.new('span', {
			'data-action' : 'close',
			'text' : 'Close'
		}));

		return bar;
	}

	initiate = (callback) =>
	{
		/* fix body overflow and paddings */
		this.limitBody(true);

		let preview = document.body.querySelector(':scope > div.preview-container');

		/* remove any active hover previews just in case */
		if(preview)
		{
			preview.remove();
		}

		/* create main container */
		this.container = dom.new('div', {
			class : 'gallery-root'
		});

		document.body.prepend(this.container);

		/* create gallery top bar */
		let top = dom.new('div', {
			class : 'gallery-bar'
		});

		this.container.append(top);

		/* create left area of top bar */
		top.append(dom.new('div', {
			class : 'gallery-bar__left'
		}));

		/* create right area of top bar */
		top.append(this.barConstruct(dom.new('div', {
			class : 'gallery-bar__right'
		})));

		/* create content (media) outer container */
		let content = dom.new('div', {
			class : 'gallery-content' + (this.options.list.reverse ? ' reversed' : '')
		});

		this.container.append(content);

		let media = dom.new('div', {
			class : 'media'
		});

		/* create list */
		let list = dom.new('div', {
			class : 'ns list'
		});

		/* add to content container, respecting list reverse status */
		content.append(this.options.list.reverse ? list : media);
		content.append(this.options.list.reverse ? media : list);

		/* create dragable element on list edge */
		this.data.listDrag = dom.new('div', {
			class : 'drag'
		});

		list.append(this.data.listDrag);

		/* declare variables */
		this.data.list = list;
		this.data.listDragged = false;
		this.data.scrollbarWidth = (this.data.scrollBar.widthForced ? 0 : this.data.scrollBar.width);

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
				dom.css.set(this.data.list, {
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

		/* create mobile navigation (left & right) */
		if(this.options.mobile === true)
		{
			let navigateLeft = dom.new('div', {
				'class' : 'screen-navigate left',
				'data-action' : 'previous'
			});

			let navigateRight = dom.new('div', {
				'class' : 'screen-navigate right',
				'data-action' : 'next'
			});

			navigateLeft.append(dom.new('span'));
			navigateRight.append(dom.new('span'));

			content.append(navigateRight, navigateLeft);
		}

		media.append(dom.new('div', {
			class : 'wrapper' + (this.options.fitContent ? ' fill' : '')
		}));

		media.append(dom.new('div', {
			class : 'spinner'
		}));

		/* create list table */
		let table = dom.new('table', {
			cellspacing : '0'
		});

		table.append(dom.new('tbody'));

		list.append(table);

		/* add items to list */
		this.populateTable(this.items);

		callback(true);
	}
}