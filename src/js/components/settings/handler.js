/* import config */
import { data } from '../../config/data';
import { code } from '../../config/constants';
import { config, user } from '../../config/config';

/* import models */
import { eventHandler } from '../../modules/event-handler';

/* require helpers */
import {
	dom,
	capitalize,
	checkNested
} from '../../helpers/helpers';

const pipe = data.instances.pipe;

const create = new Object();

create.option = (element, text, options = new Object(), title = null) =>
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

	let wrapper = dom.wrap(
		dom.wrap(
			element, 'div'
		),
		'div',
		wrapperAttributes
	);

	wrapper.prepend(dom.new('div', textAttributes));

	return wrapper;
};

create.section = (id, header = null) =>
{
	let container = dom.new('div', {
		'class' : 'section',
		'data-key' : id
	});

	container.appendChild(dom.new('div', {
		class : 'header',
		text : header ? header : capitalize(id)
	}));

	return container;
}

/**
 * creates a select option
 * set options['data-key'] to override section key
 */
create.select = (values, options = new Object(), selected = null) =>
{
	let element = dom.new('select', options);

	element.append(...values.map((value, index) =>
	{
		value.text = capitalize(value.text);

		let option = dom.new('option', value);

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
 * creates a checkbox element
 */
create.check = (options = new Object(), selected = null) =>
{
	let checked = (selected !== null) ? selected() : false;

	if(checked)
	{
		options.checked = '';
	}

	let checkbox = dom.new('input', Object.assign(options, {
		type : 'checkbox'
	}));

	checkbox.checked = checked;

	return checkbox;
};

/**
 * update functions for settings which require live updating
 */
const update = {
	style : new Object(),
	gallery : new Object()
};

/**
 * style update
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
 * gallery update
 */

update.gallery.listAlignment = (alignment) =>
{
	if(data.instances.gallery)
	{
		let parent = document.body.querySelector(':scope > div.gallery-container > div.content-container');

		parent.classList[alignment === 0 ? 'remove' : 'add']('reversed');

		let detached = parent.querySelector(':scope > div.list');

		let media = parent.querySelector(':scope > div.media');

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

		let element = document.body.querySelector('div.gallery-container \
			> div.content-container > div.media > div.wrapper > div.cover .reverse');

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

		/* get gallery wrapper */
		let wrapper = document.body.querySelector('div.gallery-container \
			> div.content-container > div.media > div.wrapper');

		if(wrapper && value)
		{
			wrapper.classList.add('fill');

			/* force height recalculation */
			data.sets.refresh = true;
			data.sets.selected = null;

		} else if(wrapper)
		{
			wrapper.classList.remove('fill');

			/* reset dimensions of wrapper elements */
			(['.cover', '.cover img', 'video']).forEach((selector) =>
			{
				dom.css.set(wrapper.querySelector(selector), {
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

const options = new Object();

options.gather = (container) =>
{
	let _data = new Object();

	/* gather settings elements */
	let elements = container.querySelectorAll('select, input[type="checkbox"]');

	/* iterate over elements, get settings */
	elements.forEach((element) =>
	{
		if(element.hasAttribute('name'))
		{
			let id = element.getAttribute('name');

			let section = element.hasAttribute('data-key') ?
				element.getAttribute('data-key') :
				element.closest('.section').getAttribute('data-key');

			if(!Object.prototype.hasOwnProperty.call(_data, section))
			{
				_data[section] = new Object();
			}

			if(element.tagName === 'SELECT')
			{
				_data[section][id] = element.selectedIndex;

			} else if(element.tagName === 'INPUT' &&
				element.getAttribute('type').toUpperCase() === 'CHECKBOX')
			{
				_data[section][id] = element.checked;
			}
		}
	});

	return _data;
};

options.set = (_data, client) =>
{
	client = client || user.get();

	Object.keys(_data).forEach((key) =>
	{
		let isMain = (key === 'main');

		if(!isMain && !Object.prototype.hasOwnProperty.call(client, key))
		{
			client[key] = new Object();
		}

		Object.keys(_data[key]).forEach((option) =>
		{
			let value = null;

			config.get(`style.themes.pool.${_data[key][option]}`)

			switch(option)
			{
				case 'theme':
					if(_data[key][option] <= (config.get('style.themes.pool').length - 1))
					{
						let selected = config.get(`style.themes.pool.${_data[key][option]}`);

						value = selected === 'default' ? false : selected;
					}

					break;
				default:
					value = _data[key][option];

					break;
			}

			let changed = (isMain ? (client[option] !== value) : (client[key][option] !== value));

			_data[key][option] = { value, changed };

			if(isMain)
			{
				client[option] = value;
			} else {
				client[key][option] = value;
			}

			if(changed)
			{
				/* call the live update function (if any) for the changed settings */
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

	pipe('Set settings', _data);

	user.set(client);

	return _data;
};

const theme = new Object();

/**
 * sets a theme for the client
 * @param {string|null} theme  : theme to set (null resets themes)
 * @param {boolean} setCookie : save to client config
 */
theme.set = (theme = null, setCookie = true) =>
{
	let themesPath = config.get('style.themes.path');

	/* get current stylesheets */
	let stylesheets = document.querySelectorAll('head > link[rel="stylesheet"]');

	if(stylesheets.length > 0)
	{
		stylesheets = Array.from(stylesheets);

		/* filter sheets that are not themes */
		stylesheets = (stylesheets).filter((sheet) =>
		{
			return sheet.hasAttribute('href') && sheet.getAttribute('href').includes(themesPath);
		});
	}

	/* set config theme */
	config.set('style.themes.set', theme);

	/* if null theme, remove active sheets */
	if(theme === null || !theme)
	{
		if(stylesheets.length > 0)
		{
			stylesheets.forEach((sheet) =>
			{
				sheet.remove()
			});
		}

		return false;
	} else {
		if(setCookie)
		{
			/* save client */
			user.set(user.get().style.theme = theme);
		}
	}

	/* create stylesheet element */
	let sheet = dom.new('link', {
		rel : 'stylesheet',
		type : 'text/css',
		href : `${themesPath}/${theme}.css`.replace(/\/\//g, '/')
	});

	/* apply to document */
	document.querySelector('head').append(sheet);

	/* remove stylesheets that were active prior to change */
	if(stylesheets.length > 0)
	{
		stylesheets.forEach((sheet) =>
		{
			sheet.remove()
		});
	}
}

export class componentSettings
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
	 * apply settings (gather and set settings, then close menu)
	 */
	apply = (element, client) =>
	{
		client = client || user.get();

		options.set(options.gather(element), client);

		data.components.settings.close();

		data.layer.main.update();
	}

	/**
	 * close settings menu
	 */
	close = () =>
	{
		if(Array.isArray(this.events))
		{
			/* remove events */
			(this.events).forEach((event) =>
			{
				let [selector, events, id] = event;

				eventHandler.removeListener(selector, events, id);
			});

			delete this.events;
		}

		document.body.querySelectorAll(':scope > div.focus-overlay, \
			:scope > div.settings-container').forEach((element) =>
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

		let sets = new Array();

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
			let checkTemplate = new Array();

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
			})

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
	 * create and show the settings menu
	 */
	show = () =>
	{
		if(document.body.querySelector(':scope > div.settings-container'))
		{
			return;
		}

		this.client = user.get();
		
		this.events = new Array();

		let sections = new Array();

		if(!document.body.querySelector(':scope > div.focus-overlay'))
		{
			let overlay = dom.new('div', {
				class : 'focus-overlay'
			});

			document.body.appendChild(overlay);

			this.events.push([overlay, 'click', code.USE_ASSIGNED_DOM_ID]);

			eventHandler.addListener(overlay, 'click', code.USE_ASSIGNED_DOM_ID, (e) =>
			{
				data.components.settings.close();
			});
		}

		let container = dom.new('div', {
			class : 'settings-container'
		});

		sections.push(this.getSectionMain());

		if(config.get('gallery.enabled'))
		{
			sections.push(this.getSectionGallery());
		}

		let wrapper = dom.new('div', {
			class : 'wrapper'
		});

		wrapper.append(...sections.map((item) =>
		{
			return item.settings > 0 ? item.section : null;
		}).filter((item) =>
		{
			return item !== null;
		}));

		let bottom = dom.new('div', {
			class : 'bottom'
		});

		let applyButton = dom.new('div', {
			class : 'apply ns',
			text : 'Apply'
		});

		let cancelButton = dom.new('div', {
			class : 'cancel ns',
			text : 'Cancel'
		});

		container.appendChild(wrapper);
		container.appendChild(bottom);

		[[applyButton, () => this.apply(container, this.client)], [cancelButton, () => this.close()]].forEach((buttonData) =>
		{
			let [element, f] = buttonData;

			bottom.appendChild(element);

			this.events.push([element, 'click', code.USE_ASSIGNED_DOM_ID]);

			eventHandler.addListener(element, 'click', code.USE_ASSIGNED_DOM_ID, (e) =>
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