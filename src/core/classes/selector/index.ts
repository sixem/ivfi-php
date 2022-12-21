/** Helpers */
import { isString } from '../../helpers';

/**
 * Selector class
 */
export default class selectorClass
{
	/* Default definitions for common elements */
	readonly defaultDefinitions = {
		FILTER_INPUT: ':scope > div.filterContainer > input[type="text"]',
		TOP_EXTEND: ':scope > div.topBar > div.extend',
		TABLE_CONTAINER: ':scope > div.tableContainer',
		README_CONTAINER: ':scope > .readmeContainer',
		TABLE: ':scope > div.tableContainer > table',
		PATH: ':scope > div.path'
	};

	private data: {
		[key: string]: HTMLElement
	};

	constructor()
	{
		this.data = {};
		this.init();

		return this;
	}

	private init = (): void =>
	{
		Object.keys(this.defaultDefinitions).forEach((key) =>
		{
			this.define(this.defaultDefinitions[key], key);
		});

		this.define('BODY', 'body', document);
	}

	public define = (selector: string, id: any = null, scope: any = null): void =>
	{
		const element = (scope ? scope : document.body).querySelector(selector);
		let identifier = id ? id : selector;

		if(isString(identifier))
		{
			identifier = identifier.toUpperCase();
		}

		this.data[identifier] = element;
	}

	public use = (identifier: any): HTMLElement | boolean =>
	{
		if(typeof identifier === 'string')
		{
			identifier = identifier.toUpperCase();
		}

		if(!Object.prototype.hasOwnProperty.call(this.data, identifier))
		{
			const selected = document.body.querySelector(identifier);

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