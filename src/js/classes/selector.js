/* require helpers */
import {
	isString
} from '../modules/helpers';

/**
 * selector class
 */
export class selectorClass
{
	constructor()
	{
		this.data = new Object();

		this.init();

		return this;
	}

	init = () =>
	{
		let definitions = new Object();

		definitions['FILTER_INPUT'] = (':scope > div.filter-container > input[type="text"]');
		definitions['TOP_EXTEND'] = (':scope > div.top-bar > div.extend');
		definitions['TABLE_CONTAINER'] = (':scope > div.table-container');
		definitions['TABLE'] = (':scope > div.table-container > table');
		definitions['PATH'] = (':scope > div.path');

		Object.keys(definitions).forEach((key) =>
		{
			this.define(definitions[key], key);
		});

		this.define('BODY', 'body', document);
	}

	define = (selector, id = null, scope = null) =>
	{
		let element = (scope ? scope : document.body).querySelector(selector);

		let identifier = id ? id : selector;

		if(isString(identifier))
		{
			identifier = identifier.toUpperCase();
		}

		this.data[identifier] = element;
	}

	use = (identifier) =>
	{
		if(isString(identifier))
		{
			identifier = identifier.toUpperCase();
		}

		if(!this.data.hasOwnProperty(identifier))
		{
			let selected = document.body.querySelector(identifier);

			if(selected)
			{
				this.data[identifier] = selected;
			} else {
				return false;
			}
		}

		return this.data[identifier];
	}
}