/** Import `data` */
import data from '../config/data';

/** Import `code` */
import {
	code
} from '../config/constants';

/** Import `config`, `user` */
import {
	config,
	user
} from '../config/config';

/** Import `eventHandler` */
import eventHandler from '../modules/event-handler';

/** Import `DOM`, `capitalize`, `checkNested` */
import {
	DOM,
	capitalize,
	checkNested
} from '../modules/helpers';

const pipe = data.instances.pipe,
	create = {};

/**
 * Update functions for settings which require live updating
 */
const update = {
	style : {},
	gallery : {}
};

create.option = (element, text, options = {}, title = null) =>
{
	if(Object.prototype.hasOwnProperty.call(options, 'class'))
	{
		options.class = ('option ' + options.class);
	}

	let wrapperAttributes = Object.assign({
		class : 'option'
	}, options);

	let textAttributes = {
		class : 'option-text',
		text : text
	};

	if(title)
	{
		textAttributes.title = title;
	}

	let wrapper = DOM.wrap(
		DOM.wrap(
			element, 'div'
		),
		'div',
		wrapperAttributes
	);

	wrapper.prepend(DOM.new('div', textAttributes));

	return wrapper;
};

create.section = (id, header = null) =>
{
	let container = DOM.new('div', {
		'class' : 'section',
		'data-key' : id
	});

	container.appendChild(DOM.new('div', {
		class : 'header',
		text : header ? header : capitalize(id)
	}));

	return container;
};

/**
 * Creates a select option
 * 
 * Set options['data-key'] to override section key
 */
create.select = (values, options = {}, selected = null) =>
{
	let element = DOM.new('select', options);

	element.append(...values.map((value, index) =>
	{
		value.text = capitalize(value.text);

		let option = DOM.new('option', value);

		if(selected !== null)
		{
			if(selected(option, index, element) === true)
			{
				option.selected = true;

				element.selectedIndex = index;
			}
		}

		return option;
	}));

	return element;
};

/**
 * Creates a checkbox element
 */
create.check = (options = {}, selected = null) =>
{
	let checked = (selected !== null) ? selected() : false;

	if(checked)
	{
		options.checked = '';
	}

	let checkbox = DOM.new('input', Object.assign(options, {
		type : 'checkbox'
	}));

	checkbox.checked = checked;

	return checkbox;
};

/**
 * Style update
 */
update.style.theme = (value) =>
{
	theme.set(value === false ? null : value, false);
};

update.style.compact = (value) =>
{
	document.body.classList[value ? 'add' : 'remove']('compact');
};

/**
 * Gallery update
 */
update.gallery.listAlignment = (alignment) =>
{
	if(data.instances.gallery)
	{
		let parent = document.body.querySelector(':scope > div.rootGallery > div.galleryContent');

		parent.classList[alignment === 0 ? 'remove' : 'add']('reversed');

		let detached = parent.querySelector(':scope > div.list'),
			media = parent.querySelector(':scope > div.media');

		parent.querySelector(':scope > div.list').remove();

		media.parentNode.insertBefore(detached, (alignment === 1) ? media : media.nextSibling);

		data.instances.gallery.options.list.reverse = (alignment === 0 ? false : true);
	}
};

update.gallery.reverseOptions = (value) =>
{
	if(data.instances.gallery)
	{
		data.instances.gallery.options.reverseOptions = value;

		let element = document.body.querySelector('div.rootGallery \
			> div.galleryContent > div.media > div.wrapper > div.cover .reverse');

		if(element)
		{
			element.remove();
		}
	}
};

update.gallery.fitContent = (value) =>
{
	if(data.instances.gallery)
	{
		data.instances.gallery.options.fitContent = value;

		/* Get gallery wrapper */
		let wrapper = document.body.querySelector('div.rootGallery \
			> div.galleryContent > div.media > div.wrapper');

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
			(['.cover', '.cover img', 'video']).forEach((selector) =>
			{
				DOM.css.set(wrapper.querySelector(selector), {
					height : '',
					width : ''
				});
			});
		}
	}
};

update.gallery.autoplay = (value) =>
{
	if(data.instances.gallery)
	{
		data.instances.gallery.options.autoplay = value;
	}
};

const options = {};

options.gather = (container) =>
{
	let gathered = {};

	/* Gather settings elements */
	let elements = container.querySelectorAll('select, input[type="checkbox"]');

	/* Iterate over elements, get settings */
	elements.forEach((element) =>
	{
		if(element.hasAttribute('name'))
		{
			let id = element.getAttribute('name');

			let section = element.hasAttribute('data-key') ?
				element.getAttribute('data-key') :
				element.closest('.section').getAttribute('data-key');

			if(!Object.prototype.hasOwnProperty.call(gathered, section))
			{
				gathered[section] = {};
			}

			if(element.tagName === 'SELECT')
			{
				gathered[section][id] = element.selectedIndex;

			} else if(element.tagName === 'INPUT' &&
				element.getAttribute('type').toUpperCase() === 'CHECKBOX')
			{
				gathered[section][id] = element.checked;
			}
		}
	});

	return gathered;
};

options.set = (setData, client) =>
{
	client = client || user.get();

	Object.keys(setData).forEach((key) =>
	{
		let isMain = (key === 'main');

		if(!isMain && !Object.prototype.hasOwnProperty.call(client, key))
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
					if(setData[key][option] <= (config.get('style.themes.pool').length - 1))
					{
						let selected = config.get(`style.themes.pool.${setData[key][option]}`);

						value = selected === 'default' ? false : selected;
					}
					break;
				default:
					value = setData[key][option];
					break;
			}

			let changed = (isMain ? (client[option] !== value) : (client[key][option] !== value));

			setData[key][option] = { value, changed };

			if(isMain)
			{
				client[option] = value;
			} else {
				client[key][option] = value;
			}

			if(changed)
			{
				/* Call the live update function (if any) for the changed settings */
				if(isMain && Object.prototype.hasOwnProperty.call(update, option))
				{
					update[option](value);
				} else if(checkNested(update, key, option))
				{
					update[key][option](value);
				}
			}
		});
	});

	pipe('Set settings', setData);

	user.set(client);

	return setData;
};

const theme = {};

/**
 * Sets a theme for the client
 * 
 * @param {string|null} theme
 * @param {boolean} setCookie
 */
theme.set = (theme = null, setCookie = true) =>
{
	let themesPath = config.get('style.themes.path');

	/* Get current stylesheets */
	let stylesheets = document.querySelectorAll('head > link[rel="stylesheet"]');

	if(stylesheets.length > 0)
	{
		stylesheets = Array.from(stylesheets);

		/* Filter sheets that are not themes */
		stylesheets = (stylesheets).filter((sheet) =>
		{
			return sheet.hasAttribute('href') && sheet.getAttribute('href').includes(themesPath);
		});
	}

	/* Set config theme */
	config.set('style.themes.set', theme);

	/* If null theme, then remove active sheets */
	if(theme === null || !theme)
	{
		if(stylesheets.length > 0)
		{
			stylesheets.forEach((sheet) =>
			{
				sheet.remove();
			});
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
		href : `${themesPath}/${theme}.css?bust=${config.data.bust}`.replace(/\/\//g, '/')
	});

	/* Apply to document */
	document.querySelector('head').append(sheet);

	/* Remove stylesheets that were active prior to change */
	if(stylesheets.length > 0)
	{
		stylesheets.forEach((sheet) =>
		{
			sheet.remove();
		});
	}
};

export default class componentSettings
{
	constructor()
	{
		return this;
	}

	available = () =>
	{
		if(config.exists('style.themes.pool') &&
			config.get('style.themes.pool').length > 0 ||
			config.get('gallery.enabled') === true)
		{
			return true;
		}

		return false;
	}

	/**
	 * Apply settings (gather and set settings, then close menu)
	 */
	apply = (element, client) =>
	{
		client = client || user.get();

		options.set(options.gather(element), client);

		data.components.settings.close();
		data.layer.main.update();
	}

	/**
	 * Close settings menu
	 */
	close = () =>
	{
		if(Array.isArray(this.events))
		{
			/* Remove events */
			(this.events).forEach((event) =>
			{
				let [selector, events, id] = event;

				eventHandler.removeListener(selector, events, id);
			});

			delete this.events;
		}

		document.body.querySelectorAll(':scope > div.focusOverlay, \
			:scope > div.settingsContainer').forEach((element) =>
		{
			element.remove();
		});
	}

	getSectionGallery = (section = create.section('gallery'), settings = 0) =>
	{
		if(!config.get('mobile'))
		{
			section.append(create.option(
				create.select(['right', 'left'].map((e) =>
				{
					return {
						value : ('align-' + e),
						text : e
					};
				}), {
					name : 'listAlignment'
				}, (option, index) =>
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

	getSectionMain = (section = create.section('main'), settings = 0) =>
	{
		if(config.exists('style.themes.pool') && config.get('style.themes.pool').length > 0)
		{
			let setTheme = config.get('style.themes.set');

			let themePool = config.get('style.themes.pool').map((theme) =>
			{
				return {
					value : theme,
					text : theme
				};
			});

			let selectTemplate = [themePool, {
				'name' : 'theme',
				'data-key' : 'style'
			}, (option, index) => (setTheme === null && index === 0) || (option.value == setTheme)];

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
		
		this.events = [];

		let sections = [];

		if(!document.body.querySelector(':scope > div.focusOverlay'))
		{
			let overlay = DOM.new('div', {
				class : 'focusOverlay'
			});

			document.body.appendChild(overlay);

			this.events.push([overlay, 'click', code.USE_ASSIGNED_DOM_ID]);

			eventHandler.addListener(overlay, 'click', code.USE_ASSIGNED_DOM_ID, () =>
			{
				data.components.settings.close();
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

		container.appendChild(wrapper);
		container.appendChild(bottom);

		[[applyButton, () => this.apply(container, this.client)],
			[cancelButton, () => this.close()]].forEach((buttonData) =>
		{
			let [element, f] = buttonData;

			bottom.appendChild(element);

			this.events.push([element, 'click', code.USE_ASSIGNED_DOM_ID]);

			eventHandler.addListener(element, 'click', code.USE_ASSIGNED_DOM_ID, () =>
			{
				f();
			});
		});

		document.body.appendChild(container);

		container.querySelectorAll('div.section > .option.interactable').forEach((option) =>
		{
			this.events.push([option, 'mouseup', code.USE_ASSIGNED_DOM_ID]);

			eventHandler.addListener(option, 'mouseup', code.USE_ASSIGNED_DOM_ID, (e) =>
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
			});
		});
	}
}