/**
 * console logging class
 */
class logger
{
	constructor(condition)
	{
		this.condition = condition;

		return this;
	}

	pipe = (...message) =>
	{
		if(this.condition)
		{
			console.log(...message);
		}
	}
}

/**
 * capitalizes an input
 */
exports.capitalize = (input) =>
{
	return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * debounce function for quick-firing events like window resize
 */
exports.debounce = (f) =>
{
	let timer;

	return (e) =>
	{
		if(timer)
		{
			clearTimeout(timer);
		}

		timer = setTimeout(f, 100, e);
	};
};

/**
 * checks if a value is numeric
 */
exports.isNumeric = (n) =>
{
	return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * checks if a value is a string
 */
exports.isString = (s) =>
{
	return (typeof s === 'string');
}

/**
 * get window scrolltop in vanilla js
 */
exports.getScrollTop = () =>
{
	return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

/**
 * checks an object for the existance nested path
 */
exports.checkNestedPath = (obj, path) =>
{
 	path = Array.isArray(path) ? path : path.split('.');

	for(let i = 0; i < path.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, path[i]))
		{
			return false;
		}

		obj = obj[path[i]];
	}

	return true;
}

/**
 * checks an object for a nested value
 */
exports.checkNested = (obj, ...args) =>
{
	for(let i = 0; i < args.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, args[i]))
		{
			return false;
		}

		obj = obj[args[i]];
	}

	return true;
}

/**
 * sets an obj value using path
 */
exports.setNestedPath = function (obj, path, value)
 {
 	path = Array.isArray(path) ? path : path.split('.');

 	let wasSet = false;

	for(let i = 0; i < path.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, path[i]))
		{
			continue;
		}

		if(i === (path.length - 1))
		{
			obj[path[i]] = value;

			wasSet = true;
		}

		obj = obj[path[i]];
	}

	return wasSet;
 };

/**
 * retrieves an obj value using path
 */
exports.getNestedPath = function (obj, path, def)
 {
 	path = Array.isArray(path) ? path : path.split('.');

	for(let i = 0; i < path.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, path[i]))
		{
			return def;
		}

		obj = obj[path[i]];
	}

	return obj;
 };

/**
 * retrieves a obj value using path
 */
exports.getNested = function (obj, def, ...args)
 {
	for(let i = 0; i < args.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, args[i]))
		{
			return def;
		}

		obj = obj[args[i]];
	}

	return obj;
 };

/**
 * applies a nested value to an object key
 */
exports.applyNested = (dest, key, origin, def, ...nested) =>
{
	if(dest)
	{
		let exists = module.exports.checkNested(origin, ...nested);

		dest[key] = exists ? module.exports.getNested(origin, def, ...nested) : def;

		return dest[key];
	}

	return null;
};

/**
 * gets the value of a table cell
 */
const getCellValue = (row, index) =>
{
	let attribute = row.querySelector(`td:nth-child(${index + 1})`).getAttribute('data-raw');

	return attribute !== undefined ? attribute : row.querySelector(`td:nth-child(${index + 1})`).textContent;
};

/**
 * compares cell values (table sort)
 */
exports.comparer = (index) =>
{
	return (a, b) =>
	{
		let valA = getCellValue(a, index);

		let valB = getCellValue(b, index);

		return module.exports.isNumeric(valA) &&
			module.exports.isNumeric(valB) ? valA - valB :
			valA.localeCompare(valB);
	};
};

/**
 * gets the readable size of a byte integer
 * @param {integer} bytes : bytecount
 */
exports.getReadableSize = (format, bytes = 0) =>
{
	/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

	if(bytes === 0)
	{
		return `0.00${format[0]}`;
	}

	let i = 0;

	do {
		bytes = bytes / 1024;
		i++;
	} while (bytes > 1024);

	return Math.max(bytes, 0.1).toFixed(i < 2 ? 0 : 2) + format[i];
};

exports.setVideoVolume = (video, volume) =>
{
	if(!video)
	{
		return;
	}
	
	let muted = !(volume > 0);

	video.muted = muted;

	video.volume = muted ? 0 : volume <= 100 ? volume : 100;

	/* catch errors (uninteracted with DOM) and mute on error */
	video.play().catch((error) =>
	{
		video.muted = true;
		
		video.volume = 0;

		video.play();
	});
};

/**
 * scans the table for available extensions, then generates a wget command to download them specifically.
 */
exports.generateWget = (table) =>
{
	let url = window.location.href;

	let extensions = new Array();

	table.querySelectorAll('tr.file:not(.filtered) > td:first-child > a').forEach((element, index) =>
	{
		let extension = element.textContent.split('.').pop().toLowerCase().trim();

		if(!extensions.includes(extension))
		{
			extensions.push(extension);
		}
	});

	return `wget -r -np -nH -nd -e robots=off --accept "${extensions.join(',')}" "${url}"`;
};

/**
 * strips ? and anything that follows from a URL
 */
exports.stripUrl = (url) =>
{
	return !url.includes('?') ? url : url.split('?')[0];
};

/**
* pops a string, identifies extension
*/
exports.identifyExtension = (url, extensions = new Object()) =>
{
	let extension = (url).split('.').pop().toLowerCase();

	if(extensions.image.includes(extension))
	{
		return [extension, 0];

	} else if(extensions.video.includes(extension))
	{
		return [extension, 1];
	}

	return null;
};

exports.clipboard = {
	/**
 	* copies text to clipboard
 	* @param {string} text : text to copy
 	*/
	copy : (text) =>
	{
		/* https://stackoverflow.com/a/30810322 */

		if(!navigator.clipboard)
		{
			clipboard.copyFallback(text);

			return;
		}

		navigator.clipboard.writeText(text);
	},
	/**
 	* copies text to clipboard
 	* @param {string} text : text to copy
 	*/
	copyFallback : (text) =>
	{
		/* https://stackoverflow.com/a/30810322 */

		let area = document.createElement('textarea');

		area.value = text;
		area.style.position = 'fixed';

		document.body.appendChild(area);

		area.focus(); area.select();

		try
		{
			let successful = document.execCommand('copy');
		} catch (error)
		{
			console.error(error);
		}

		document.body.removeChild(area);
	}
}

/**
 * manipulates the DOM
 */
exports.dom = {
	cache : {
		id : 0
	},
	/**
	 * creates a new DOM element
	 */
	new : (type, options = new Object()) =>
	{
		let element = document.createElement(type);

		element.domId = module.exports.dom.cache.id;

		let attributes = Object.keys(options);

		attributes.forEach((attribute) =>
		{
			if(attribute.toLowerCase() === 'text')
			{
				element.textContent = options[attribute];
			} else {
				element.setAttribute(attribute, options[attribute]);
			}
		});

		module.exports.dom.cache.id++;

		return element;
	},
	wrap : (element, type, options) =>
	{
		let container = module.exports.dom.new('div', options);

		container.appendChild(element);

		return container;
	},
	css : {
		/**
		 * set css using objects
		 */
		set : (element, styling) =>
		{
			if(element)
			{
				let keys = Object.keys(styling);

				(keys).forEach((key) =>
				{
					element.style[key] = styling[key];
				});
			}
		}
	},
	attributes : {
		set : (element, attributes) =>
		{
			if(element)
			{
				let keys = Object.keys(attributes);

				(keys).forEach((key) =>
				{
					element.setAttribute(key, attributes[key]);
				});
			}
		}
	},
	getIndex : (element) =>
	{
		return Array.from(element.parentNode.children).indexOf(element);
	}
}

exports.logger = logger;