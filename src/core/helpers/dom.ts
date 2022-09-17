interface HTMLDOMElement extends HTMLElement
{
	domId?: number
}

type TDomStructure = {
	cache?: {
		id: number
	},
	new: (
		type: string,
		options?: {
			[key: string]: any
		}) => HTMLElement;
	wrap: (
		element: HTMLElement, 
		type?: string, 
		options?: {
			[key: string]: any
		}) => HTMLElement;
	style: {
		set: (
			element: HTMLElement,
			styling: {
				[key: string]: string
			}) => void;
	};
	attributes: {
		set: (
			element: HTMLElement,
			attributes: {
				[key: string]: string
			}
		) => void;
	};
	getIndex: (element: HTMLElement) => number;
}

/**
 * Manipulates the DOM
 */
export const DOM: TDomStructure = {
	cache: {
		id: 0
	},
	/**
	 * Creates a new DOM element
	 */
	new: (type: string, options: {
		[key: string]: any
	} = {}): HTMLElement =>
	{
		const element: HTMLDOMElement = document.createElement(type),
			attributes: Array<string> = Object.keys(options);

		element.domId = DOM.cache.id;

		attributes.forEach((attribute: string): void =>
		{
			if(attribute.toLowerCase() === 'text')
			{
				element.textContent = options[attribute];
			} else {
				element.setAttribute(attribute, options[attribute]);
			}
		});

		DOM.cache.id++;

		return element;
	},
	/**
	 * Wraps a DOM element
	 */
	wrap: (element: HTMLElement, type?: string, options?: {
		[key: string]: any
	}): HTMLElement =>
	{
		const container: HTMLDOMElement = DOM.new(type, options);

		container.appendChild(element);

		return container;
	},
	/**
	 * Element styling
	 */
	style: {
		/**
		 * Set CSS using objects
		 */
		set: (element: HTMLElement, styling: { [key: string]: string }): void =>
		{
			if(element)
			{
				const keys: Array<string> = Object.keys(styling);

				(keys).forEach((key: string): void =>
				{
					element.style[key] = styling[key];
				});
			}
		}
	},
	attributes: {
		set: (element: HTMLElement, attributes: { [key: string]: string }): void =>
		{
			if(element)
			{
				const keys: Array<string> = Object.keys(attributes);

				(keys).forEach((key: string): void =>
				{
					element.setAttribute(key, attributes[key]);
				});
			}
		}
	},
	getIndex: (element: HTMLElement): number =>
	{
		return Array.from(element.parentNode.children).indexOf(element);
	}
};