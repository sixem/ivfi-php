/** Config */
import data from '../../config/data';
import { config, user } from '../../config/config';
/** Helpers */
import { DOM, capitalize, checkNested } from '../../helpers';
/** Modules */
import { eventHooks } from '../../modules/event-hooks';
import { log } from '../../modules/logger';

/** Types */
import {
	MComponentSettings,
	TUserClient
} from '../../types';

/**
 * Structure functions (DOM)
 */
const create: MComponentSettings.TCreateCapsule = {};

/**
 * Update functions for settings which require live updating
 */
const update: MComponentSettings.TUpdateCapsule = {
	style: {},
	gallery: {}
};

/**
 * Theme functions
 */
const theme: MComponentSettings.TThemeCapsule = {};

/**
 * Handling of options
 */
const options: MComponentSettings.TOptionsCapsule = {};

/**
 * Creates a setting option
 */
create.option = (
	element: HTMLElement,
	text: string,
	options: {
		[key: string]: any;
	} = {},
	title: string = null) =>
{
	if(Object.prototype.hasOwnProperty.call(options, 'class'))
	{
		options.class = ('option ' + options.class);
	}

	let wrapperAttributes = Object.assign({
		class : 'option'
	}, options);

	let textAttributes: {
		class: string;
		text: string;
		title?: string;
	} = {
		class: 'option-text',
		text: text
	};

	if(title)
	{
		textAttributes.title = title;
	}

	/** Create wrapper */
	let wrapper = DOM.wrap(
		DOM.wrap(
			element, 'div'
		),
		'div', wrapperAttributes
	);

	/** Add to wrapper */
	wrapper.prepend(
		DOM.new('div', textAttributes) as HTMLElement
	);

	return wrapper;
};

/**
 * Creates a section
 */
create.section = (
	id: string,
	header: string = null) =>
{
	let container: HTMLElement = DOM.new('div', {
		'class': 'section',
		'data-key': id
	});

	container.appendChild(DOM.new('div', {
		class: 'header',
		text: header ? header : capitalize(id)
	}));

	return container;
};

/**
 * Creates a select option
 * 
 * Set options['data-key'] to override section key
 */
create.select = (
	values: Array<{
		value: string;
		text: string;
	}>,
	options: object = {},
	selected: any = null) =>
{
	let element = DOM.new(
		'select', options
	) as MComponentSettings.TIndexElement;

	values.map((value: {
		[key: string]: string;
	}, index: number) =>
	{
		value.text = capitalize(value.text);

		let option: HTMLOptionElement = DOM.new('option', value) as HTMLOptionElement;

		if(selected !== null)
		{
			if(selected(option, index, element) === true)
			{
				option.selected = true;
				element.selectedIndex = index;
			}
		}

		return option;
	}).forEach((value: HTMLElement) =>
	{
		element.appendChild(value);
	});

	return element;
};

/**
 * Creates a checkbox element
 */
create.check = (
	options: {
		[key: string]: any;
	} = {},
	selected: Function | null = null) =>
{
	let checked: boolean = (selected !== null) ? selected() : false;

	if(checked)
	{
		options.checked = '';
	}

	let checkbox = DOM.new('input', Object.assign(options, {
		type : 'checkbox'
	})) as HTMLInputElement;

	checkbox.checked = checked;

	return checkbox;
};

/**
 * Style update
 */
update.style.theme = (value: any): void =>
{
	theme.set(
		value === false ? null : value,
		false
	);
};

/**
 * Update compact state
 */
update.style.compact = (value: boolean) =>
{
	document.body.classList[value ? 'add' : 'remove']('compact');
};

/**
 * Gallery update
 */
update.gallery.listAlignment = (alignment: number) =>
{
	if(data.instances.gallery)
	{
		/** Get any active gallery container */
		let parent = document.body.querySelector(
			':scope > div.rootGallery > div.galleryContent'
		);

		/** Apply list alignment to container */
		parent.classList[alignment === 0 ? 'remove' : 'add']('reversed');

		/** Get list and media container */
		let detached: HTMLDivElement = parent.querySelector(':scope > div.list');
		let media: HTMLDivElement = parent.querySelector(':scope > div.media');

		/** Remove list */
		parent.querySelector(':scope > div.list').remove();

		/** Insert aligned list */
		media.parentNode.insertBefore(
			detached, (alignment === 1) ? media : media.nextSibling
		);

		/** Apply options to gallery directly */
		data.instances.gallery.options.list.reverse = (
			alignment === 0 ? false : true
		);
	}
};

/**
 * Update reverse search option
 */
update.gallery.reverseOptions = (value: boolean) =>
{
	if(data.instances.gallery)
	{
		/** Set option directly in active gallery instance */
		data.instances.gallery.options.reverseOptions = value;

		let element: HTMLDivElement = document.body.querySelector(
			'div.rootGallery > div.galleryContent > \
			div.media > div.wrapper > div.cover .reverse'
		);

		if(element) element.remove();
	}
};

/**
 * Update fit content option
 */
update.gallery.fitContent = (value: boolean) =>
{
	if(data.instances.gallery)
	{
		/** Set option directly in active gallery instance */
		data.instances.gallery.options.fitContent = value;

		/* Get gallery wrapper */
		let wrapper: HTMLDivElement = document.body.querySelector(
			'div.rootGallery > div.galleryContent > div.media > div.wrapper'
		);

		if(wrapper && value)
		{
			wrapper.classList.add('fill');

			/* Force height recalculation */
			data.sets.refresh = true;
			data.sets.selected = null;

		} else if(wrapper)
		{
			wrapper.classList.remove('fill');

			/* Reset dimensions of wrapper elements */
			(['.cover', '.cover img', 'video']).forEach((selector: string) =>
			{
				DOM.style.set(wrapper.querySelector(selector), {
					height : '',
					width : ''
				});
			});
		}
	}
};

/**
 * Update gallery autoplay option
 */
update.gallery.autoplay = (value: boolean) =>
{
	if(data.instances.gallery)
	{
		/** Set option directly in active gallery instance */
		data.instances.gallery.options.autoplay = value;
	}
};

/**
 * Gathers set options
 */
options.gather = (container) =>
{
	let gathered: MComponentSettings.TGathered = {};

	/* Gather settings elements */
	let elements: NodeListOf<MComponentSettings.TIndexElement> =
		container.querySelectorAll(
			'select, input[type="checkbox"]'
		);

	/* Iterate over elements, get settings */
	elements.forEach((element: MComponentSettings.TIndexElement) =>
	{
		if(element.hasAttribute('name'))
		{
			let id: string = element.getAttribute('name');

			let section: string = element.hasAttribute('data-key')
				? element.getAttribute('data-key')
				: element.closest('.section').getAttribute('data-key');

			if(!Object.prototype.hasOwnProperty.call(gathered, section))
			{
				gathered[section] = {};
			}

			if(element.tagName === 'SELECT')
			{
				gathered[section][id] = element.selectedIndex;

			} else if(element.tagName === 'INPUT'
				&& element.getAttribute('type').toUpperCase() === 'CHECKBOX')
			{
				gathered[section][id] = element.checked;
			}
		}
	});

	return gathered;
};

/**
 * Apply options
 */
options.set = (setData: object, client: TUserClient) =>
{
	client = client || user.get();

	Object.keys(setData).forEach((key) =>
	{
		let isMain: boolean = (key === 'main');

		if(!isMain
			&& !Object.prototype.hasOwnProperty.call(client, key))
		{
			client[key] = {};
		}

		Object.keys(setData[key]).forEach((option) =>
		{
			let value = null;

			config.get(`style.themes.pool.${setData[key][option]}`);

			switch(option)
			{
				case 'theme':
					if(setData[key][option]
						<= (config.get('style.themes.pool').length - 1))
					{
						let selected: string | boolean = config.get(
							`style.themes.pool.${setData[key][option]}`
						);

						value = selected === 'default'
							? false
							: selected;
					}

					break;
				default:
					value = setData[key][option];

					break;
			}

			let changed: boolean = (isMain
				? (client[option] !== value)
				: (client[key][option] !== value)
			);

			setData[key][option] = {
				value, changed
			};

			if(isMain)
			{
				client[option] = value;
			} else {
				client[key][option] = value;
			}

			if(changed)
			{
				/* Call the live update function (if any) for the changed settings */
				if(isMain
					&& Object.prototype.hasOwnProperty.call(update, option))
				{
					update[option](value);
				} else if(checkNested(update, key, option))
				{
					update[key][option](value);
				}
			}
		});
	});

	log('settings', 'Set settings:', setData);

	user.set(client);

	return setData;
};

/**
 * Sets a theme for the client
 */
theme.set = (theme: any = null, setCookie: boolean = true) =>
{
	let themesPath = config.get('style.themes.path');

	/* Get current stylesheets */
	let activeStylesheets: NodeListOf<HTMLElement> = document.querySelectorAll(
		'head > link[rel="stylesheet"]'
	);

	/** Convert to array */
	let stylesheets: Array<HTMLElement> = Array.from(activeStylesheets) || [];

	if(stylesheets.length > 0)
	{
		stylesheets = Array.from(stylesheets);

		/* Filter sheets that are not themes */
		stylesheets = (stylesheets).filter((sheet) =>
		{
			return sheet.hasAttribute('href')
				&& sheet.getAttribute('href').includes(themesPath);
		});
	}

	/* Set config theme */
	config.set('style.themes.set', theme);

	/* If null theme, then remove active sheets */
	if(theme === null || !theme)
	{
		if(stylesheets.length > 0)
		{
			stylesheets.forEach((sheet) => sheet.remove());
		}

		return false;
	} else {
		if(setCookie)
		{
			/* Save client */
			user.set(user.get().style.theme = theme);
		}
	}

	/* Create stylesheet element */
	let sheet = DOM.new('link', {
		rel : 'stylesheet',
		type : 'text/css',
		href : `${themesPath}/${theme}.css?bust=${
			config.data.bust
		}`.replace(/\/\//g, '/')
	});

	/* Apply to document */
	document.querySelector('head').append(sheet);

	/* Remove stylesheets that were active prior to change */
	if(stylesheets.length > 0)
	{
		stylesheets.forEach((sheet): void => sheet.remove());
	}
};

export class componentSettings
{
	private client: TUserClient;

	private boundEvents: {
		selector?: any;
		events?: Array<string>;
	}

	constructor()
	{
		return this;
	}

	available = (): boolean =>
	{
		if(config.exists('style.themes.pool')
			&& config.get('style.themes.pool').length > 0
			|| config.get('gallery.enabled') === true)
		{
			return true;
		}

		return false;
	}

	/**
	 * Apply settings (gather and set settings, then close menu)
	 */
	apply = (element: HTMLElement, client: TUserClient): void =>
	{
		client = client || user.get();

		options.set(options.gather(element), client);

		data.components.settings.close();
		data.layer.main.update();
	}

	/**
	 * Close settings menu
	 */
	close = (): void =>
	{
		/* Remove events */
		Object.keys(this.boundEvents).forEach((eventId: string) =>
		{
			let { selector, events } = this.boundEvents[eventId];

			/** Unlisten to events */
			eventHooks.unlisten(selector, events, eventId);
		});

		this.boundEvents = {};

		/** Remove settings elements */
		document.body.querySelectorAll(
			':scope > div.focusOverlay, :scope > div.settingsContainer'
		).forEach((element) => element.remove());
	}

	getSectionGallery = (section = create.section('gallery'), settings: number = 0) =>
	{
		if(!config.get('mobile'))
		{
			section.append(create.option(
				create.select(['right', 'left'].map((alignment: string) =>
				{
					return {
						value: ('align-' + alignment),
						text: alignment
					};
				}), {
					name : 'listAlignment'
				}, (option: any, index: number) =>
				{
					return (index === this.client.gallery.listAlignment);
				}), data.text.settingsLabels.galleryListAlignment.text)
			);

			settings++;
		}

		let sets = [];

		sets.push([
			data.text.settingsLabels.galleryReverseSearch.text,
			'reverseOptions',
			data.text.settingsLabels.galleryReverseSearch.description
		]);

		sets.push([
			data.text.settingsLabels.galleryVideoAutoplay.text,
			'autoplay',
			data.text.settingsLabels.galleryVideoAutoplay.description
		]);

		sets.push([
			data.text.settingsLabels.galleryFitContent.text,
			'fitContent',
			data.text.settingsLabels.galleryFitContent.description
		]);

		sets.forEach((e) =>
		{
			let [label, key, description] = e;

			section.append(create.option(
				create.check({
					name : key
				}, () =>
				{
					return checkNested(this.client, 'gallery', key) ? (this.client.gallery[key]) : config.get(`gallery.${key}`);
				}), label, {
					class : 'interactable'
				}, description)
			);

			settings++;
		});

		return {
			settings,
			section
		};
	}

	getSectionMain = (section: HTMLElement = create.section('main'), settings: number = 0) =>
	{
		if(config.exists('style.themes.pool')
			&& config.get('style.themes.pool').length > 0)
		{
			type TPoolItem = {
				value: string;
				text: string;
			};

			type TPoolCapsule = Array<TPoolItem>;

			let setTheme: string | null = config.get('style.themes.set');

			let themePool: TPoolCapsule = config.get(
				'style.themes.pool'
			).map((theme: TPoolItem) =>
			{
				return {
					value: theme,
					text: theme
				};
			});

			let selectTemplate: [TPoolCapsule, object, any] = [themePool, {
				'name': 'theme',
				'data-key': 'style'
			}, (option: { value: string; }, index: number) =>
				(setTheme === null
					&& index === 0)
					|| (option.value === setTheme)
			];

			section.append(create.option(
				create.select(...selectTemplate), 'Theme')
			);

			settings++;
		}

		if(config.exists('style.compact') && !config.get('mobile'))
		{
			let checkTemplate = [];

			checkTemplate.push({
				'name' : 'compact',
				'data-key' : 'style'
			});

			checkTemplate.push(() =>
			{
				if(checkNested(this.client, 'style', 'compact'))
				{
					return this.client.style.compact;
				} else {
					return config.get('style.compact');
				} 
			});

			let checkElement = create.check(...checkTemplate);

			let option = create.option(
				checkElement,
				data.text.settingsLabels.stylingCompact.text, {
					class : 'interactable'
				}, data.text.settingsLabels.stylingCompact.description
			);

			section.appendChild(option);

			settings++;
		}

		return {
			settings,
			section
		};
	}

	removeOnUnbind = ({ selector, events, id }) =>
	{
		this.boundEvents[id] = {
			selector, events
		};
	}

	/**
	 * Create and show the settings menu
	 */
	show = () =>
	{
		if(document.body.querySelector(':scope > div.settingsContainer'))
		{
			return;
		}

		this.client = user.get();
		this.boundEvents = {};

		let sections = [];

		if(!document.body.querySelector(':scope > div.focusOverlay'))
		{
			let overlay = DOM.new('div', {
				class : 'focusOverlay'
			});

			document.body.appendChild(overlay);

			eventHooks.listen(overlay, 'click', 'settingsOverlayClick', () =>
			{
				data.components.settings.close();
			}, {
				onAdd: this.removeOnUnbind
			});
		}

		let container = DOM.new('div', {
			class : 'settingsContainer'
		});

		sections.push(this.getSectionMain());

		if(config.get('gallery.enabled'))
		{
			sections.push(this.getSectionGallery());
		}

		let wrapper = DOM.new('div', {
			class : 'wrapper'
		});

		wrapper.append(...sections.map((item) =>
		{
			return item.settings > 0 ? item.section : null;
		}).filter((item) =>
		{
			return item !== null;
		}));

		let bottom = DOM.new('div', {
			class : 'bottom'
		});

		let applyButton = DOM.new('div', {
			class : 'apply ns',
			text : 'Apply'
		});

		let cancelButton = DOM.new('div', {
			class : 'cancel ns',
			text : 'Cancel'
		});

		container.append(wrapper, bottom);

		/* Add `Apply` and `Cancel` buttons and add callbacks on `click` */
		[[applyButton, 'settignsApplyClick', () => this.apply(container, this.client)],
			[cancelButton, 'settingsCancelClick', () => this.close()]
		].forEach(([ element, id, callback ]) =>
		{
			bottom.append(element as Node);

			eventHooks.listen(element, 'click', id, callback, {
				onAdd: this.removeOnUnbind
			});
		});

		document.body.appendChild(container);

		container.querySelectorAll('div.section > .option.interactable').forEach((option, index) =>
		{
			eventHooks.listen(option, 'mouseup', `settingsMouseUp_${index}`, (e) =>
			{
				if(window.getSelection().toString())
				{
					return;
				}

				if(e.target.tagName !== 'INPUT')
				{
					let checkbox = e.currentTarget.querySelector('input[type="checkbox"]');

					if(checkbox)
					{
						checkbox.checked = !checkbox.checked;

						return;
					}
				}
			}, {
				onAdd: this.removeOnUnbind
			});
		});
	}
}