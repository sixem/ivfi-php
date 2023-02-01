/** Vendors */
import cookies from 'js-cookie';
import { SwipeEvent } from '../../vendors/swiped-events';
/** Config */
import data from '../../config/data';
import { user } from '../../config/config';
/** Modules */
import { log } from '../../modules/logger';
import { eventHooks } from '../../modules/event-hooks';
/** Classes */
import optimizeClass from './../optimize';
/** Helpers */
import { DOM, debounce, shortenString } from '../../helpers';
/** Stylesheet */
import '../../../css/gallery.scss';

/** Constants */
import { Keys, CookieKey } from '../../constant';

/** Types */
import {
	TGalleryDefaults,
	TPageObject,
	TGalleryDataActive,
	TGalleryTableItem,
	IGalleryOptions,
	TUserStorage,
	TPayloadgalleryItemChanged,
	THTMLElement,
	HTMLElementExtend
} from '../../types';

export default class galleryClass
{
	private isVisible: null | boolean;

	private container: THTMLElement;

	private table: THTMLElement;

	private list: THTMLElement;

	private defaults: object;

	private items: Array<TGalleryTableItem>;

	private optimize: optimizeClass;

	private page: TPageObject;

	public data: TGalleryDataActive;

	public options: IGalleryOptions;

	constructor(items: Array<TGalleryTableItem>, options: object = {})
	{
		/* Get default values */
		const defaults = this.setDefaults();

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

		/* Initiate */
		this.init(items);

		return this;
	}

	private setDefaults = (): object =>
	{
		const data: TGalleryDefaults = {};

		/* Valid extensions */
		data.extensions = {
			image: ['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'],
			video: ['mp4', 'webm', 'ogg', 'ogv', 'mov']
		};

		/* Item list */
		data.list = {
			show: true,
			reverse: false
		};

		/* Video */
		data.video = {
			video: null
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

	/**
	 * Initiates the class
	 * 
	 * Set values, options and call initiating functions
	 */
	private init = (items: Array<TGalleryTableItem>) =>
	{
		/* Create data object */
		this.data = {};

		/* Busy state */
		this.data.busy = false;

		/* Store bound listeners */
		this.data.boundEvents = {};

		/* Scrollbreak state */
		this.data.scrollbreak = false;

		/* Apply prevent default to these keys */
		this.data.keyPrevent = [
			Keys.pageUp,
			Keys.pageDown,
			Keys.arrowLeft,
			Keys.arrowUp,
			Keys.arrowRight,
			Keys.arrowDown
		];

		this.data.selected = {
			src: null,
			ext: null,
			index: null,
			type: null
		};

		this.container = document.body.querySelector(':scope > div.rootGallery');
		this.items = this.options.filter ? this.filterItems(items): items;

		if(this.items.length === 0)
		{
			return false;
		}

		if(!this.exists())
		{
			this.initiate((): void =>
			{
				this.bind();
			});
		} else {
			this.show(true);
		}

		const start = this.options.start > (this.items.length - 1) ? (this.items.length - 1): this.options.start;

		this.navigate(start);

		/* Enable optimizer if enabled */
		if(this.options.performance)
		{
			this.useOptimzer(this.table);
		}

		/* Hide list if option is set or on mobile */
		if(!this.options.list.show || this.options.mobile)
		{
			this.list.style.display = 'none';
		}
	}

	/**
	 * Preloads an image
	 */
	private loadImage = (src: string): Promise<{
		src: string,
		img: HTMLImageElement,
		cancelled: boolean,
		dimensions:
		{
			height: number;
			width: number;
		}
	}> =>
	{
		eventHooks.unsubscribe('galleryItemChanged', 'loadImage');

		return new Promise((resolve, reject) =>
		{
			let img: HTMLImageElement = document.createElement('img');

			const onError = (): void =>
			{
				reject(new Error(`failed to load image URL: ${src}`));
			};

			const onLoad = (): void =>
			{
				const dimensions = {
					width: img.naturalWidth,
					height: img.naturalHeight
				};

				resolve({ src, img, dimensions, cancelled: false });
			};

			img.src = src;

			/* Add listeners */
			img.addEventListener('error', onError, true);
			img.addEventListener('load', onLoad, true);

			eventHooks.subscribe('galleryItemChanged', 'loadImage', (event: TPayloadgalleryItemChanged) =>
			{
				/* If current source has changed to something else, cancel load */
				if(event.source !== src)
				{
					/* Remove listeners */
					img.removeEventListener('error', onError, true);
					img.removeEventListener('load', onLoad, true);
				
					/* Clear image object */
					img.src = '';
					img = null;

					/* "self destruct" on trigger */
					eventHooks.unsubscribe('galleryItemChanged', 'loadImage');
				}

				resolve({ src, img: null, dimensions: null, cancelled: true });
			});
		});
	}

	/**
	 * Checks if an element has a scrollbar
	 */
	private elementHasScrollbar = (element: HTMLElement): boolean =>
	{
		let height = element.getBoundingClientRect().height;
		const style = window.getComputedStyle(element);

		height = ['top', 'bottom'].map((side) =>
		{
			return parseInt(style['margin-' + side], 10);
		}).reduce((total, side) =>
		{
			return total + side;
		}, height);

		return height > window.innerHeight;
	}

	/**
	 * Encodes a URL
	 */
	private encodeUrl = (input: string): string => 
	{
		let encoded = !this.options.encodeAll ? encodeURI(input) : input;

		if(this.options.encodeAll)
		{
			encoded = encoded.replace('#', '%23').replace('?', '%3F');
		}

		encoded = encoded.replace('+', '%2B');

		return encoded;
	}

	/**
	 * Gets the extension from a filename
	 */
	private getExtension = (filename: string): string =>
	{
		return filename.split('.').pop().toLowerCase();
	}

	/**
	 * Checks if the filename is an image
	 */
	private isImage = (filename: string, extension: string | null = null): boolean =>
	{
		return this.options.extensions.image.includes(
			extension ? extension: this.getExtension(filename)
		);
	}

	/**
	 * Checks if the filename is a video
	 */
	private isVideo = (filename: string, extension: string | null = null): boolean =>
	{
		return this.options.extensions.video.includes(
			extension ? extension: this.getExtension(filename)
		);
	}

	/**
	 * Filters an array of items to make sure it only contains videos and images 
	 */
	private filterItems = (items: Array<TGalleryTableItem>) =>
	{
		return items.filter((item: { name: string }): boolean =>
		{
			return this.isImage(item.name) || this.isVideo(item.name);
		});
	}

	/**
	 * Gets the width of the scrollbar
	 */
	private getScrollbarWidth = (): number =>
	{
		if(!this.elementHasScrollbar(document.body))
		{
			return 0;
		}

		const outer: HTMLDivElement = document.createElement('div');

		DOM.style.set(outer, {
			visibility: 'hidden',
			overflow: 'scroll',
			msOverflowStyle: 'scrollbar'
		});

		document.body.appendChild(outer);

		const inner = document.createElement('div');

		outer.appendChild(inner);

		const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth);

		outer.parentNode.removeChild(outer);

		return scrollbarWidth;
	}

	/**
	 * Limits the body (hides overflow etc.)
	 * 
	 * This allows the gallery to operate without a scrollbar in the background
	 */
	limitBody = (bool = true): void =>
	{
		const body: HTMLElement = document.body,
			root: HTMLElement = document.documentElement,
			scrollpadding: number = this.getScrollbarWidth();

		if(bool === true)
		{
			document.documentElement.setAttribute('gallery-is-visible', '');
			this.isVisible = true;

			this.data.body = {
				'max-height': body.style['max-height'],
				'overflow': body.style.overflow
			};

			if(scrollpadding > 0)
			{
				DOM.style.set(root, {
					'padding-right': scrollpadding + 'px'
				});
			}

			DOM.style.set(body, {
				'overflow': 'hidden'
			});
		} else {
			document.documentElement.removeAttribute('gallery-is-visible');
			this.isVisible = false;

			if(Object.prototype.hasOwnProperty.call(this.data, 'body'))
			{
				DOM.style.set(body, {
					'overflow': this.data.body['overflow']
				});
			}

			DOM.style.set(root, {
				'padding-right': 'unset'
			});
		}
	}

	/**
	 * Checks for an active gallery DOM element
	 */
	private exists = (): boolean =>
	{
		this.container = document.body.querySelector(':scope > div.rootGallery');

		return this.container ? true: false;
	}

	/**
	 * Shows or hides the gallery
	 */
	public show = (bool = true, index: null | number = null, items: Array<TGalleryTableItem> = null): void =>
	{
		if(items)
		{
			log('gallery', 'itemsUpdate', true);

			this.data.selected.index = null;
			this.items = this.options.filter ? this.filterItems(items): items;
			this.populateTable(this.items);
		}

		if(bool === true)
		{
			this.bind().style.display = 'block';

			if(index !== this.data.selected.index)
			{
				const elements: NodeList = this.container.querySelectorAll(
					':scope > div.galleryContent > div.media > div.wrapper img, \
					:scope > div.galleryContent > div.media > div.wrapper video'
				);

				elements.forEach((element: HTMLElement) =>
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
			this.unbind();
			this.container.style.display = 'none';
		}

		this.limitBody(bool);

		const video: HTMLVideoElement = this.container.querySelector(
			':scope > div.galleryContent > div.media > div.wrapper video'
		);

		if(video)
		{
			if(bool === true &&
				video.style.display !== 'none')
			{
				let currentTime: number = video.currentTime,
					sourceMatch = false;

				if(this.options.continue.video &&
					Object.prototype.hasOwnProperty.call(this.options.continue.video, 'src'))
				{
					sourceMatch = video.querySelector('source').getAttribute('src') === this.options.continue.video.src;
				}

				if(this.options.continue.video && sourceMatch)
				{
					currentTime = this.options.continue.video.time;
					this.options.continue.video = null;
				}

				video.currentTime = currentTime;
				video.muted = false;
				video[this.options.autoplay ? 'play': 'pause']();

				this.video.setVolume(video, this.video.getVolume());
			} else if(bool === false)
			{
				video.pause();
			}
		}

		/* Optimization refreshing */
		if(bool &&
			this.options.performance &&
			this.optimize &&
			this.list &&
			this.table)
		{
			const selectedItem: HTMLElement = this.table.querySelector('tr.selected');

			let selectedItemTop: number | boolean = parseInt(
				selectedItem.style.top.replace(/\D+/g, '')
			);

			if(Number.isInteger(selectedItemTop) && !(selectedItemTop >= 0))
			{
				selectedItemTop = false;
			}

			if(selectedItemTop)
			{
				if(!(this.list.scrollTop <= selectedItemTop &&
					selectedItemTop <= (this.list.scrollTop + this.list.offsetHeight)))
				{
					this.list.scrollTo(0, selectedItemTop);
				}
			}

			this.optimize.attemptRefresh();
		}
	}

	/**
	 * Sets the busy state (while loading images/videos)
	 */
	private busy = (bool?: boolean): boolean =>
	{
		if(bool === true || bool === false)
		{
			this.data.busy = bool;

			const loader: HTMLElement = this.container.querySelector(
				':scope > div.galleryContent > div.media > div.spinner'
			);

			if(bool)
			{
				DOM.style.set(loader, {
					opacity: '1'
				});
			} else {
				loader.style.opacity = '0';
			}
		}

		return this.data.busy;
	}

	/**
	 * Enables the optimizer (performance mode) on the gallery list
	 */
	private useOptimzer = (table: HTMLElement): optimizeClass =>
	{
		/* Removes any previous optimize instances */
		if(this.optimize)
		{
			delete this.optimize;

			eventHooks.unlisten(this.list, 'scroll', 'galleryTableScroll');

			DOM.style.set(this.table, {
				height: 'auto'
			});
		}

		/* Creates a page object for the optimizer */
		const page: TPageObject = {
			update: () =>
			{
				page.windowHeight = window.innerHeight;
				page.windowWidth = window.innerWidth;
				page.scrolledY = window.scrollY;

				return true;
			},
			scope: table
		};

		data.layer.gallery = page;

		/* Update function (called on scroll, resize etc.) */
		page.update = () =>
		{
			page.windowHeight = window.innerHeight;
			page.windowWidth = window.innerWidth;
			page.scrolledY = this.list.scrollTop;

			return true;
		};

		/** Initiating update call */
		page.update();

		this.page = page;

		/* Initialize optimize class */
		this.optimize = new optimizeClass({
			page: page,
			table: table,
			scope: [this.list, 'scrollTop']
		});

		/** Remove any previous listeners */
		eventHooks.unlisten(window, 'resize', 'windowGalleryResize');

		/** Listen to window resizing */
		eventHooks.listen(window, 'resize', 'windowGalleryResize', debounce((): void =>
		{
			if(this.options.performance && this.optimize.enabled)
			{
				log('gallery', 'windowResize (gallery)', 'Resized.');
				page.update();
			}
		}));

		let scrollEndTimer: null | number = null;

		/** Listen to list scrolling */
		eventHooks.listen(this.list, 'scroll', 'galleryTableScroll', (): void =>
		{
			if(this.options.performance &&
				this.optimize.enabled)
			{
				/* Get scrolled position */
				const scrolled = this.list.scrollTop;

				/* Trigger optimization refresh if 175 px has been scrolled */
				if(Math.abs(scrolled - (this.page).scrolledY) > 175)
				{
					this.optimize.attemptRefresh();
				}

				clearTimeout(scrollEndTimer);

				scrollEndTimer = window.setTimeout(() =>
				{
					this.optimize.attemptRefresh();
				}, 150);
			}
		});

		return this.optimize;
	}

	/**
	 * Populates the gallery table
	 */
	private populateTable = (items: Array<TGalleryTableItem>, table?: HTMLElement): HTMLElement =>
	{
		log('gallery', 'Populating gallery list ..');

		table = table || this.container.querySelector(
			'div.galleryContent > div.list > table'
		);

		const buffer: Array<string> = [];

		for(let i = 0; i <= items.length - 1; i++)
		{
			buffer[i] = `<tr title="${items[i].name}"><td>${items[i].name}</td></tr>`;
		}

		/* Set directly all at once instead of appending (faster .. ? probably?) */
		table.innerHTML = (buffer.join(''));

		this.list = this.container.querySelector('div.galleryContent > div.list');
		this.table = table;

		return table;
	}

	/**
	 * Updating functions
	 */
	public update = {
		/* Updates the list width */
		listWidth: (wrapper?: HTMLElement): void =>
		{
			wrapper = wrapper || this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

			const list: HTMLElement = this.data.list ? this.data.list : (
				this.container.querySelector(':scope > div.galleryContent > div.list')
			);

			const width = (this.options.mobile || !list || list.style.display === 'none') ? 0: list.offsetWidth;

			wrapper.style.setProperty('--width-list', `${width}px`);
		}
	}

	/**
	 * Constructs reverse search URLs
	 */
	private getReverseOptions = (url: string): object =>
	{
		url = this.encodeUrl(document.location.origin + url);

		const reverseObj = {};

		Object.keys(data.text.reverseSearch).forEach((key: string) =>
		{
			reverseObj[key] = data.text.reverseSearch[key].replace('{URL}', url);
		});

		return reverseObj;
	}

	/**
	 * Adds image reverse search options
	 */
	private reverse = (cover: HTMLElement): void | boolean =>
	{
		if(!this.options.reverseOptions)
		{
			return false;
		}

		let container: HTMLElement = this.container.querySelector(
			':scope > div.galleryContent > div.media .reverse'
		);

		if(!container)
		{
			const reverse: HTMLDivElement = DOM.new('div', {
				class: 'reverse'
			}) as HTMLDivElement;

			cover.prepend(reverse);
			container = reverse;
		}

		const options: object = this.getReverseOptions(this.data.selected.src);

		container.innerHTML = Object.keys(options).map((site: string) =>
		{
			return `<a class="reverse-link" target="_blank" href="${options[site]}">${site}</a>`;
		}).join('');

		this.container.querySelector(
			':scope > div.galleryContent > div.media > div.wrapper > div.cover'
		).append(container);
	}

	/**
	 * Apply functions
	 */
	private apply = {
		cache: {
			info: null
		},
		timers: {
			dimensions: null
		},
		/* Sets an item dimension notification on navigate change */
		itemDimensions: (index: number) =>
		{
			const item: TGalleryTableItem = this.items[index];
			let media: HTMLElement = this.container.querySelector('div.media > div.item-info-static');

			if(Object.prototype.hasOwnProperty.call(item, 'dimensions') &&
				item.dimensions.height > 0 &&
				item.dimensions.width > 0)
			{
				if(!media)
				{
					media = DOM.new('div', {
						class: 'item-info-static'
					});

					this.container.querySelector('div.media').appendChild(media);
				}

				media.style.opacity = '1';
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
					media.style.opacity = '0';
				}
			}, 3E3);
		},
		/* Displays item information in the top bar */
		itemInfo: (
			update: boolean,
			item: TGalleryTableItem | null = null,
			index: number | null = null,
			max: number | null = null
		): boolean =>
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

			const download: HTMLElement = this.container.querySelector(
				'.galleryBar > .galleryBarRight > a.download'
			);

			const left: HTMLElement = this.container.querySelector(
				':scope > div.galleryBar > div.galleryBarLeft'
			);

			const name: string = this.options.mobile ? shortenString(item.name, 30): item.name;
			const url: string = this.encodeUrl(item.url);

			DOM.attributes.set(download, {
				filename: item.name,
				href: url,
				title: `Download: ${item.name}`
			});

			const buffer: Array<string> = [
				`<span>${index + 1} of ${max}</span>`,
				`<a target="_blank" href="${url}">${name}</a>`
			];

			if(Object.prototype.hasOwnProperty.call(item, 'size') && !this.options.mobile)
			{
				buffer.push(`<span>${item.size}</span>`);
			}

			left.innerHTML = buffer.join('');

			return true;
		}
	}

	/* Checks if a list item is scrolled into view */
	private isScrolledIntoView = (container: HTMLElement, element: HTMLElement): boolean =>
	{
		const parent = {
			scrolled: container.scrollTop,
			height: container.offsetHeight
		};

		const child = {
			offset: element.offsetTop,
			height: (element.children[0] as HTMLElement).offsetHeight
		};

		log('gallery', 'isScrolledIntoView', parent, child);

		return child.offset >= parent.scrolled &&
			(child.offset + child.height) <= (parent.scrolled + parent.height);
	}

	/**
	 * Calculates the navigational index
	 */
	private calculateIndex = (current: number, change: number, max: number): number =>
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

	/**
	 * Video functions
	 */
	private video = {
		/* Creates a video element */
		create: (extension: string): [HTMLVideoElement, HTMLSourceElement] =>
		{
			const video: HTMLVideoElement = DOM.new('video', {
				controls: '',
				preload: 'auto',
				loop: ''
			}) as HTMLVideoElement;

			const source: HTMLSourceElement = DOM.new('source', {
				type: `video/${extension === 'mov' ? 'mp4': (
					extension === 'ogv' ? 'ogg': extension
				)}`,
				src: ''
			}) as HTMLSourceElement;

			video.append(source);

			this.video.setVolume(video, this.video.getVolume());

			return [video, source];
		},
		/* Volume getter */
		getVolume: (): number =>
		{
			let volume = parseFloat(this.options.volume.toString());

			volume = (isNaN(volume) || volume < 0 || volume > 1) ? 0: volume;

			return volume;
		},
		/* Volume setter */
		setVolume: (video: HTMLVideoElement, i: number): number =>
		{
			if(i > 0)
			{
				video.volume = i >= 1 ? 1.0: i;
			} else {
				video.muted = true;
			}

			return i;
		},
		/* Video seeker */
		seek: (i: number): void | boolean =>
		{
			const video: HTMLVideoElement = this.container.querySelector(
				':scope > div.galleryContent > div.media > div.wrapper video'
			);

			if(video)
			{
				const current = Math.round(video.currentTime), duration = Math.round(video.duration);

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

	/**
	 * Shows an item (called on show, navigate etc.)
	 */
	private showItem = (
		type: number,
		element: HTMLVideoElement | HTMLImageElement,
		src: string,
		init: boolean,
		index: number,
		data: {
			img?: {
				height: number;
				width: number;
			}
		} = null
	): void =>
	{
		log('gallery', 'showItem', { type, element, src, init, index, data });

		const wrapper: HTMLElement = this.container.querySelector(
			':scope > div.galleryContent > div.media > div.wrapper'
		);

		let video: any;
		let source: HTMLSourceElement = null;
		let hasEvented = false;

		/* Hides the opposite media element */
		const hideOther = (): void =>
		{
			const opposite: HTMLElement = wrapper.querySelector(type === 0 ? 'video': 'img');

			if(opposite && type === 1)
			{
				(opposite.closest('.cover') as HTMLElement).style.display = 'none';
			}

			if(opposite)
			{
				opposite.style.display = 'none';
			}
		};

		const applyChange = (onChange?: () => void) =>
		{
			const elements: NodeList = this.container.querySelectorAll(':scope > \
				div.galleryContent > div.media > div.wrapper > div:not(.cover)');

			elements.forEach((element: HTMLElement) => element.remove());

			this.apply.itemInfo(true);
			this.data.selected.type = type;

			wrapper.style.display = '';

			if(onChange)
			{
				onChange();
			}

			this.busy(false);
		};

		const display = (): void =>
		{
			/* Image type */
			if(type === 0)
			{
				/* Select video from wrapper */
				video = wrapper.querySelector('video');

				/* Get dimensions */
				this.items[index].dimensions = {
					height: data.img.height,
					width: data.img.width
				};

				/* Apply dimensions */
				this.apply.itemDimensions(index);

				/* Call `applyChange` */
				applyChange((): void =>
				{
					if(this.options.sharpen)
					{
						element.setAttribute('sharpened', '');
					}

					element.onload = (): void =>
					{
						/* Hide any image elements from the cover */
						hideOther();

						/* Fit content */
						if(this.options.fitContent)
						{
							const height = `calc(calc(100vw - var(--width-list)) / ${
								(data.img.width / data.img.height).toFixed(4)
							})`;
							
							this.update.listWidth(wrapper);

							DOM.style.set(element, {
								'width': 'auto',
								'height': height
							});

							DOM.style.set(element.closest('.cover'), {
								'height': height
							});
						}
					};

					/* Set style and attribute */
					element.setAttribute('src', src);
					element.style.display = 'inline-block';
					(element.closest('.cover') as HTMLElement).style.display = '';

					/* If a video exists, pause and reset source */
					if(video)
					{
						/* Get source */
						const videoSource = video.querySelector('source');

						/* Pause and reset source */
						video.pause();
						videoSource.setAttribute('src', '');

						const videoListeners: Array<any> = [
							[video, 'videoError'],
							[videoSource, 'sourceError']
						];

						/* Unlisten to video events */
						(videoListeners).forEach(([element, id]: Array<any>): void =>
						{
							eventHooks.unlisten(element, 'error', id);
						});
					}
				});
			/* Video type */
			} else if(type === 1)
			{
				if(init === false)
				{
					/* Create a new video element if `!init` */
					[video, source] = this.video.create(this.data.selected.ext);
					wrapper.append(video);
				} else {
					/* Select existing source and video */
					source = element.querySelector('source');
					video = element;
				}

				/* Set video source */
				source.setAttribute('src', src);

				video.srcId = src;

				/** Triggered on video error */
				const error = (event: Event) =>
				{
					console.error('Failed to load video source.', event);
					
					this.busy(false);

					video.remove();
				};

				const videoListeners: Array<[HTMLVideoElement | HTMLSourceElement, string]> = [
					[video, 'videoError'],
					[source, 'sourceError']
				];

				/* Add video error listeners */
				(videoListeners).forEach(([element, id]: Array<any>): void =>
				{
					eventHooks.listen(element, 'error', id, (event: Event): void =>
					{
						error(event);
					});
				});

				/* Add video volume change listener */
				eventHooks.listen(video, 'volumechange', 'galleryVideoVolumeChange', (): void =>
				{
					this.options.volume = video.muted ? 0: parseFloat(
						parseFloat(video.volume).toFixed(2)
					);

					/* Trigger volume change event */
					eventHooks.trigger('galleryVolumeChange', this.options.volume);
				});

				/* Events that indiciate that the video is "ready" */
				const videoReadyEvents: Array<string> = [
					'canplay',
					'canplaythrough',
					'playing'
				];

				/* Listen for gallery item changes */
				eventHooks.subscribe('galleryItemChanged', 'loadVideo', () =>
				{
					if(video.srcId !== this.data.selected.src)
					{
						/* Cancel video load */
						source.setAttribute('src', '');

						/* Unlisten and unsubscribe */
						eventHooks.unlisten(video, videoReadyEvents, 'awaitGalleryVideo');
						eventHooks.unsubscribe('galleryItemChanged', 'loadVideo');

						/**
						 * [Mark video as disposable]
						 * 
						 * We could just remove it here, but the transition
						 * between loading videos will be smoother if we let
						 * this element remain visible until the next video has
						 * finished loading, and then we remove all `video.disposable`.
						 */
						video.classList.add('disposable');
					}
				});

				/* Add video load listener */
				eventHooks.listen(video, videoReadyEvents, 'awaitGalleryVideo', (): boolean | void =>
				{
					/** Clear listener */

					//eventHooks.unlisten(video, videoReadyEvents, 'awaitGalleryVideo');

					if(hasEvented || video.srcId !== this.data.selected.src)
					{
						return false;
					}

					/* Video dimensions */
					const height: number = video.videoHeight,
						width: number = video.videoWidth;

					this.items[index].dimensions = {
						height: height,
						width: width
					};

					/* Apply dimensions */
					this.apply.itemDimensions(index);

					applyChange((): void =>
					{
						if(this.options.fitContent)
						{
							this.update.listWidth(wrapper);

							DOM.style.set(video, {
								width: 'auto',
								height: `calc(calc(100vw - var(--width-list)) / ${(width / height).toFixed(4)})`
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

						/* Remove disposable video elements */
						this.container.querySelectorAll('video.disposable').forEach((item) => item.remove());

						/* Hide any image elements from the cover */
						hideOther();

						/* Show video */
						video.style.display = 'inline-block';

						/* If the gallery was hidden while loading, pause video and hide loader. */
						if(this.container.style.display === 'none')
						{
							(this.container.querySelector(
								'div.galleryContent .media div.spinner'
							) as HTMLElement).style.opacity = '0';

							video.pause();
						}

						if(init === false)
						{
							element.remove();
						}

						hasEvented = true;
					});
				}, {
					destroy: true
				});

				if(this.options.continue.video &&
					src == this.options.continue.video.src)
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
	private navigate = (index: number, step: number = null): boolean | void =>
	{
		log('gallery', 'busyState', this.busy());

		/* Set maximum navigation index */
		const max = this.items.length - 1;

		/* Index defaulting */
		if(index === null)
		{
			index = this.data.selected.index;
		}

		/* Step defaulting */
		if(step !== null)
		{
			index = this.calculateIndex(index, step, max);
		}

		if(this.data.selected.index === index)
		{
			return false;
		}

		let init = null, item = null;

		const contentContainer: HTMLElement = this.container.querySelector(':scope > div.galleryContent');

		/* Select video and image elements */
		let image: HTMLImageElement = contentContainer.querySelector(':scope > div.media > div.wrapper img'),
			video: HTMLVideoElement = contentContainer.querySelector(':scope > div.media > div.wrapper video');

		/* Select list, table and table items */
		const list: HTMLElement = contentContainer.querySelector(':scope > div.list'),
			table: HTMLElement = list.querySelector('table'),
			element: HTMLElementExtend = table.querySelector(`tr:nth-child(${index + 1})`);

		item = this.items[index];

		const encodedItemSource = this.encodeUrl(item.url);

		this.data.selected.src = encodedItemSource;
		this.data.selected.ext = this.getExtension(item.name);

		/* Remove previously selected */
		if(table.querySelector('tr.selected'))
		{
			table.querySelector('tr.selected').classList.remove('selected');
		}

		/* Select element */
		element.classList.add('selected');

		/* Set item information */
		this.apply.itemInfo((!image && !video) ? true: false, item, index, max + 1);

		let hasScrolled = false;

		const useScrollOptimize: boolean = this.options.performance
				&& this.optimize
				&& this.optimize.enabled;

		if(useScrollOptimize && element.classList.contains('hid-row') && element._offsetTop >= 0)
		{
			const scrollPosition = element._offsetTop - (list.offsetHeight / 2);
			/* Scroll to a hidden row as a result of optimization */
			list.scrollTo(0, scrollPosition >= 0 ? scrollPosition: 0);

			/* Set variable to indicate that we've scrolled here instead */
			hasScrolled = true;
		}

		/* Use default `scrollto` if item is out of view */
		if(!hasScrolled && !this.isScrolledIntoView(list, element))
		{
			list.scrollTo(0, element.offsetTop);
		}

		/* Trigger gallery item change event */
		eventHooks.trigger('galleryItemChanged', {
			source: encodedItemSource,
			index, image, video
		});

		/* If selected item is an image */
		if(this.isImage(null, this.data.selected.ext))
		{
			/* Set busy state */
			this.busy(true);

			init = image ? false: true;

			if(video)
			{
				/* Pause any existing videos */
				video.pause();
			}

			/* If initial navigate, create image element */
			if(init === true)
			{
				const cover: HTMLElement = DOM.new('div', {
					class: 'cover',
					style: 'display: none'
				});

				const wrapper = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

				image = DOM.new('img') as HTMLImageElement;

				wrapper.prepend(cover);
				cover.append(image);
			}

			/* Await image loading */
			this.loadImage(encodedItemSource).then(({ src, dimensions, cancelled }) =>
			{
				if(dimensions && !cancelled)
				{
					const [w, h] = [dimensions.width, dimensions.height];

					if(this.data.selected.src === src)
					{
						this.showItem(0, image, src, init, index, {
							img: {
								width: w,
								height: h
							}
						});

						if(this.options.reverseOptions)
						{
							/* Show reverse options if enabled */
							this.reverse(image as HTMLElement);
						}
					}
				}
			}).catch((error: unknown) =>
			{
				/* Image could not be loaded */
				console.error(error);

				this.busy(false);
				this.data.selected.index = index;

				this.container.querySelectorAll(':scope > div.galleryContent > div.media > div.wrapper img, \
					:scope > div.galleryContent > div.media > div.wrapper video').forEach((element: HTMLElement) =>
				{
					element.style.display = 'none';
				});

				if(this.container.querySelector(
					':scope > div.galleryContent > div.media > div.wrapper > div:not(.cover)'
				)) {
					this.container.querySelector(
						':scope > div.galleryContent > div.media > div.wrapper > div:not(.cover)'
					).remove();
				}

				const imageError: HTMLElement = DOM.new('div', {
					class: 'error'
				});

				imageError.innerHTML = 'Error: Image could not be displayed.';

				this.container.querySelector('.media .wrapper').append(imageError);
			});

			return true;
		}

		/* If selected item is a video */
		if(this.isVideo(null, this.data.selected.ext))
		{
			/* Set busy state */
			this.busy(true);

			init = (video ? false: true);

			if(init)
			{
				/* Create video if initial navigate */
				video = this.video.create(this.data.selected.ext)[0];

				this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper').append(video);
			}

			this.showItem(1, video, encodedItemSource, init, index);

			return true;
		}
	}

	/**
	 * Handles keypresses
	 */
	private handleKey = (key: string, callback: (prevent: boolean) => void) =>
	{
		log('gallery', 'handleKey', key);

		if(key === Keys.escape)
		{
			/* Close gallery on `escape` */
			this.show(false);
		} else if(key === Keys.arrowDown
			|| key === Keys.pageDown
			|| key === Keys.arrowRight)
		{
			if(key === Keys.arrowRight && this.data.selected.type === 1)
			{
				/* Seek (+) video on `arrowRight` (video elements) */
				if(this.video.seek(5)) this.navigate(null, 1);
			} else {
				/* Next gallery item on `arrowRight` (image elements) */
				this.navigate(null, 1);
			}
		} else if(key === Keys.arrowUp
			|| key === Keys.pageUp
			|| key === Keys.arrowLeft)
		{
			if(key === Keys.arrowLeft && this.data.selected.type === 1)
			{
				/* Seek (-) video on `arrowLeft` (video elements) */
				if(this.video.seek(-5)) this.navigate(null, -1);
			} else {
				/* Previous gallery item on `arrowLeft` (image elements) */
				this.navigate(null, -1);
			}
		} else if(key === Keys.l)
		{
			/* Toggle list on `l` */
			this.toggleList();
		}

		callback(this.data.keyPrevent.includes(key));
	}

	/**
	 * Prepares a listener to be removed on gallery unbind
	 */
	private removeOnUnbind = (
		selector: HTMLElement,
		events: Array<string> | string,
		id: string): void =>
	{
		this.data.boundEvents[id] = {
			selector, events
		};
	}

	/**
	 * Unbinds gallery listeners (called on gallery hide)
	 */
	private unbind = (): void =>
	{
		Object.keys(this.data.boundEvents).forEach((eventId: string) =>
		{
			const { selector, events }: {
				selector: HTMLElement,
				events: Array<string> | string
			} = this.data.boundEvents[eventId];

			eventHooks.unlisten(selector, events, eventId);
		});

		this.data.boundEvents = {};

		eventHooks.trigger('galleryUnbound');
	}

	/**
	 * Scrollbreak
	 */
	private scrollBreak = (): void =>
	{
		this.data.scrollbreak = false;
	}

	/**
	 * Toggles the visibility of the list of items
	 */
	private toggleList = (element: HTMLElement = null): boolean =>
	{
		const list: HTMLElement = this.container.querySelector(':scope > div.galleryContent > div.list');
		const visible: boolean = list.style.display !== 'none';
		const client: TUserStorage = user.get();

		client.gallery.listState = (!visible ? 1: 0);

		user.set(client);

		if(!element)
		{
			element = document.body.querySelector(
				'div.rootGallery > div.galleryBar .galleryBarRight span[data-action="toggle"]'
			);
		}

		element.innerHTML = `List<span class="inheritParentAction">${visible ? '+': '-'}</span>`;

		DOM.style.set(list, {
			'display': visible ? 'none': 'table-cell'
		});

		this.update.listWidth();

		if(!visible && this.options.performance && this.optimize.enabled)
		{
			this.optimize.attemptRefresh();
		}

		return !visible;
	}

	/**
	 * Binds listeners (called on create, show etc.)
	 */
	private bind = (): HTMLElement =>
	{
		this.unbind();

		eventHooks.listen(this.data.listDrag, 'mousedown', 'galleryListMouseDown', (): void =>
		{
			this.data.listDragged = true;

			const windowWidth = window.innerWidth,
				wrapper: HTMLElement = this.container.querySelector(':scope > div.galleryContent > div.media > div.wrapper');

			/* Set cursors and pointer events */
			DOM.style.set(document.body, {
				'cursor': 'w-resize'
			});

			DOM.style.set(wrapper, {
				'pointer-events': 'none'
			});

			if(this.list)
			{
				DOM.style.set(this.list, {
					'pointer-events': 'none'
				});
			}

			/* Remove `dragged` attribute */
			if(this.data.listDrag)
			{
				this.data.listDrag.setAttribute('dragged', 'true');
			}

			/* Listens for `mousemove` - this changes the width of the list */
			eventHooks.listen('body > div.rootGallery', 'mousemove', 'galleryListMouseMove', (event: MouseEvent): void =>
			{
				const x = event.clientX;

				if(x < windowWidth)
				{
					const width = this.options.list.reverse ? (x + this.getScrollbarWidth()) : (windowWidth - x);

					requestAnimationFrame((): void =>
					{
						DOM.style.set(this.data.list, {
							'width': `${width}px`
						});
					});
				}
			}, {
				onAdd: this.removeOnUnbind
			});
		}, {
			onAdd: this.removeOnUnbind
		});

		eventHooks.listen('body > div.rootGallery', 'mouseup', 'galleryListMouseUp', (): void =>
		{
			if(this.data.listDragged === true)
			{
				eventHooks.unlisten('body > div.rootGallery', 'mousemove', 'galleryListMouseMove');

				const wrapper: HTMLElement = this.container.querySelector(
					':scope > div.galleryContent > div.media > div.wrapper'
				);

				/* Unset cursors and pointer events */
				DOM.style.set(document.body, {
					'cursor': ''
				});

				DOM.style.set(wrapper, {
					'pointer-events': 'auto'
				});

				if(this.list)
				{
					DOM.style.set(this.list, {
						'pointer-events': 'auto'
					});
				}

				/* Remove `dragged` attribute */
				if(this.data.listDrag)
				{
					this.data.listDrag.removeAttribute('dragged');
				}

				const lw: number = parseInt(this.data.list.style.width.replace(/[^-\d.]/g, ''));

				log('gallery', 'Set list width', lw);

				if(lw > 100)
				{
					const client = JSON.parse(cookies.get(CookieKey));

					client.gallery.listWidth = lw;

					cookies.set(CookieKey, JSON.stringify(client), {
						sameSite: 'lax',
						expires: 365
					});

					this.update.listWidth(wrapper);
				}

				this.data.listDragged = false;
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Add action events */
		eventHooks.listen('body > div.rootGallery', 'click', 'galleryContainerClick', (event: MouseEvent) =>
		{
			let eventTarget = event.target as HTMLElement;

			if(eventTarget && eventTarget.tagName === 'SPAN'
				&& eventTarget.classList.contains('inheritParentAction'))
			{
				eventTarget = eventTarget.parentNode as HTMLElement;
			}

			if(eventTarget && eventTarget.hasAttribute('data-action'))
			{
				/* Current action */
				const action = eventTarget.getAttribute('data-action').toLowerCase();
			
				/* Translate action */
				const translate = {
					next: ((): void =>
					{
						this.navigate(null, 1);
					}),
					previous: ((): void =>
					{
						this.navigate(null, -1);
					}),
					toggle: ((): void =>
					{
						this.toggleList(eventTarget);
					}),
					close: ((): void =>
					{
						this.show(false);
					})
				};

				/* Call action if present */
				if(translate[action])
				{
					translate[action]();
				}
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* List item click listener */
		eventHooks.listen('body > div.rootGallery > div.galleryContent \
			> div.list table', 'click', 'listNavigateClick', (event: MouseEvent): void =>
		{
			if((event.target as HTMLElement).tagName === 'TD')
			{
				this.navigate(DOM.getIndex((event.target as HTMLElement).closest('tr')));

			} else if((event.target as HTMLElement).tagName === 'TR')
			{
				this.navigate(DOM.getIndex((event.target as HTMLElement)));
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Gallery media click listener */
		eventHooks.listen('body > div.rootGallery > div.galleryContent \
			> div.media', 'click', 'mediaClick', (event: MouseEvent) =>
		{
			/* Hide gallery if media background is clicked */
			if(!['IMG', 'VIDEO', 'A'].includes((event.target as HTMLElement).tagName))
			{
				this.show(false);
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Used to create a scroll break to avoid accidental multi-swipes */
		let swipeTimeout: null | number = null;
		let swipeBreak = false;

		if(this.options.mobile === true)
		{
			const swipeTarget = document.querySelector('body > div.rootGallery div.wrapper');

			/* Handle swipe events */
			swipeTarget.addEventListener('swiped', (e: SwipeEvent) =>
			{
				clearTimeout(swipeTimeout);

				if(!swipeBreak)
				{
					if(e.detail.dir === 'down' || e.detail.dir === 'right')
					{
						/** Navigate forwards */
						this.navigate(null, -1);

						swipeBreak = true;
					} else if(e.detail.dir === 'up' || e.detail.dir === 'left')
					{
						/** Navigate backwards */
						this.navigate(null, 1);

						swipeBreak = true;
					}
				}
				
				/** Effectively locks swiping for 200 ms */
				swipeTimeout = window.setTimeout(() =>
				{
					swipeBreak = false;
				}, 200);
			});
		}

		/* Scroll navigation listener */
		eventHooks.listen(
			'body > div.rootGallery  > div.galleryContent > div.media',
			['scroll', 'DOMMouseScroll', 'mousewheel'], 'galleryScrollNavigate', 
		(event: WheelEvent): void | boolean =>
		{
			if(this.options.scrollInterval > 0 && this.data.scrollbreak === true)
			{
				return false;
			}

			this.navigate(null, (event.detail > 0 || event.deltaY > 0) ? 1 : -1);

			if(this.options.scrollInterval > 0)
			{
				this.data.scrollbreak = true;

				setTimeout(() => this.scrollBreak(), this.options.scrollInterval);
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Handles `keyup` events in the gallery (well - document, but unbinds on close) */
		eventHooks.listen(window, 'keyup', 'galleryKeyUp', (event: KeyboardEvent): void =>
		{
			this.handleKey(event.code, (prevent: boolean) =>
			{
				if(prevent)
				{
					event.preventDefault();
				}
			});
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Handles `keydown` events */
		eventHooks.listen(window, 'keydown', 'galleryKeyDown', (event: KeyboardEvent): void =>
		{
			if(this.data.keyPrevent.includes(event.code))
			{
				event.preventDefault();
			}

			if(event.code === Keys.g)
			{
				this.show(false);
			}
		}, {
			onAdd: this.removeOnUnbind
		});

		/* Dispatches a `bound` event */
		eventHooks.trigger('galleryBound', true);

		return this.container;
	}

	/* Construct gallery top bar items */
	private barConstruct = (bar: HTMLElement): HTMLElement =>
	{
		/* Create `download` button */
		bar.append(DOM.new('a', {
			'text': this.options.mobile ? 'Save': 'Download',
			'class': 'download',
			'download': ''
		}));

		if(!this.options.mobile)
		{
			/* Create `previous` button */
			bar.append(DOM.new('span', {
				'data-action': 'previous',
				'text': 'Previous'
			}));

			/* Create `next` button */
			bar.append(DOM.new('span', {
				'data-action': 'next',
				'text': 'Next'
			}));

			/* Create `list toggle` button */
			const listToggle: HTMLElement = DOM.new('span', {
				'data-action': 'toggle',
				'text': 'List'
			});

			listToggle.append(DOM.new('span', {
				'class': 'inheritParentAction',
				'text': this.options.list.show ? '-': '+'
			}));

			/* Create `list toggle` button */
			bar.append(listToggle);
		}

		/* Create `close` button */
		bar.append(DOM.new('span', {
			'data-action': 'close',
			'text': 'Close'
		}));

		return bar;
	}

	/**
	 * Creates the gallery elements, populates the table etc.
	 */
	private initiate = (callback: (state?: boolean) => void): void =>
	{
		/* Fix body overflow and paddings */
		this.limitBody(true);

		const preview: HTMLElement = document.body.querySelector(
			':scope > div.preview-container'
		);

		/* Remove any active hover previews just in case */
		if(preview)
		{
			preview.remove();
		}

		/* Create main container */
		this.container = DOM.new('div', {
			class: 'rootGallery'
		});

		document.body.prepend(this.container);

		/* Create gallery top bar */
		const top: HTMLElement = DOM.new('div', {
			class: 'galleryBar'
		});

		this.container.append(top);

		/* Create left area of top bar */
		top.append(DOM.new('div', {
			class: 'galleryBarLeft'
		}));

		/* Create right area of top bar */
		top.append(this.barConstruct(DOM.new('div', {
			class: 'galleryBarRight'
		})));

		/* Create content (media) outer container */
		const content: HTMLElement = DOM.new('div', {
			class: 'galleryContent' + (this.options.list.reverse ? ' reversed': '')
		});

		this.container.append(content);

		const media: HTMLElement = DOM.new('div', {
			class: 'media'
		});

		/* Create list */
		const list: HTMLElement = DOM.new('div', {
			class: 'ns list'
		});

		/* Add to content container, respecting list reverse status */
		content.append(this.options.list.reverse ? list: media);
		content.append(this.options.list.reverse ? media: list);

		/* Create dragable element on list edge */
		this.data.listDrag = DOM.new('div', {
			class: 'drag'
		});

		list.append(this.data.listDrag);

		/* Declare variables */
		this.data.list = list;
		this.data.listDragged = false;

		/* Get user storage */
		const client: TUserStorage = JSON.parse(
			cookies.get(CookieKey)
		);

		try
		{
			/* Get gallery list width */
			const width: number = JSON.parse(
				client.gallery.listWidth.toString().toLowerCase()
			);

			/* If list width is settable */
			if(width && parseInt(width.toString()) > (window.innerWidth / 2))
			{
				client.gallery.listWidth = Math.floor(window.innerWidth / 2);

				cookies.set(CookieKey, JSON.stringify(client), {
					sameSite: 'lax',
					expires: 365
				});
			}

			if(width)
			{
				DOM.style.set(this.data.list, {
					'width': `${width}px`
				});
			}
		} catch (e: unknown) {
			client.gallery.listWidth = false;

			cookies.set(CookieKey, JSON.stringify(client), {
				sameSite: 'lax',
				expires: 365
			});
		}

		/* Create mobile navigation (left & right) */
		if(this.options.mobile === true)
		{
			const navigateLeft: HTMLElement = DOM.new('div', {
				'class': 'screenNavigate navigateLeft',
				'data-action': 'previous'
			});

			const navigateRight: HTMLElement = DOM.new('div', {
				'class': 'screenNavigate navigateRight',
				'data-action': 'next'
			});

			navigateLeft.append(DOM.new('span'));
			navigateRight.append(DOM.new('span'));

			content.append(navigateRight, navigateLeft);
		}

		media.append(DOM.new('div', {
			class: 'wrapper' + (this.options.fitContent ? ' fill': '')
		}));

		media.append(DOM.new('div', {
			class: 'spinner'
		}));

		/* Create list table */
		const table = DOM.new('table', {
			cellspacing: '0'
		});

		table.append(DOM.new('tbody'));

		list.append(table);

		/* Add items to list */
		this.populateTable(this.items);

		callback(true);
	}
}