/** Import `isString` */
import {
	isString
} from '../modules/helpers';

/**
 * Selector class
 */
export default class selectorClass
{
	constructor()
	{
		this.data = {};
		this.init();

		return this;
	}

	init = () =>
	{
		let definitions = {};

		definitions['FILTER_INPUT'] = (':scope > div.filterContainer > input[type="text"]');
		definitions['TOP_EXTEND'] = (':scope > div.topBar > div.extend');
		definitions['TABLE_CONTAINER'] = (':scope > div.tableContainer');
		definitions['TABLE'] = (':scope > div.tableContainer > table');
		definitions['PATH'] = (':scope > div.path');

		Object.keys(definitions).forEach((key) =>
		{
			this.define(definitions[key], key);
		});

		this.define('BODY', 'body', document);
	}

	define = (selector, id = null, scope = null) =>
	{
		let element = (scope ? scope : document.body).querySelector(selector),
			identifier = id ? id : selector;

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

		if(!Object.prototype.hasOwnProperty.call(this.data, identifier))
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