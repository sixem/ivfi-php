/**
 * Checks an object for the existance nested path
 */
export const checkNestedPath = (obj: object, path: string | Array<string>): boolean =>
{
	path = Array.isArray(path) ? path: path.split('.');

	for(let i = 0; i < path.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, path[i]))
		{
			return false;
		}

		obj = obj[path[i]];
	}

	return true;
};

/**
 * Checks an object for a nested value
 */
export const checkNested = (obj: object, ...args: Array<string>): boolean =>
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
};

/**
 * Sets an object value using a path
 */
export const setNestedPath = (obj: object, path: string | Array<string>, value: any): boolean =>
{
	path = Array.isArray(path) ? path: path.split('.');

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
 * Retrieves an object value using path
 */
export const getNestedPath = (obj: object, path: string | Array<string>, fallback: any): any =>
{
	path = Array.isArray(path) ? path: path.split('.');

	for(let i = 0; i < path.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, path[i]))
		{
			return fallback;
		}

		obj = obj[path[i]];
	}

	return obj;
};

/**
 * Retrieves an object value using path
 */
export const getNested = function (obj: object, fallback: any, ...args: Array<string>): any
{
	for(let i = 0; i < args.length; i++)
	{
		if(!obj || !Object.prototype.hasOwnProperty.call(obj, args[i]))
		{
			return fallback;
		}

		obj = obj[args[i]];
	}

	return obj;
};

/**
 * Applies a nested value to an object key
 */
export const applyNested = (
	dest: object,
	key: string,
	origin: object,
	fallback: any,
	...nested: Array<string>
): any =>
{
	if(dest)
	{
		const exists = checkNested(origin, ...nested);

		dest[key] = exists ? getNested(origin, fallback, ...nested): fallback;

		return dest[key];
	}

	return null;
};

/**
 * Tests the existance of a path within an object
 */
export const objHas = (obj: object, path: string) =>
{
	let level: string = null;
	let rest: Array<string> = [];

	if(!path.includes('.'))
	{
		level = path;
	} else {
		rest = path.split('.');
		level = rest.shift();
	}

	if(obj === undefined)
	{
		return false;
	}

	if (rest.length === 0 &&
		Object.prototype.hasOwnProperty.call(obj, level))
	{
		return true;
	}

	return objHas(obj[level], rest.join('.'));
};