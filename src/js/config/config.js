/** Import `cookies` */
import cookies from 'js-cookie';

/** Import `modernizr-mq` to `window` */
import '../vendors/modernizr/modernizr-mq';

/** Import `setNestedPath`, `getNestedPath`, `checkNestedPath` */
import {
	setNestedPath,
	getNestedPath,
	checkNestedPath,
} from '../modules/helpers';

/* Config object */
const config = {};

/* User (client) object */
const user = {};

config.init = () =>
{
	config.data = JSON.parse(document.getElementById('__INDEXER_DATA__').innerHTML);
	config.data.mobile = Modernizr.mq('(max-width: 640px)');
};

config.isMobile = () =>
{
	return config.data.mobile;
};

config.exists = (path) =>
{
	return checkNestedPath(config.data, path);
};

config.set = (path, value) =>
{
	return setNestedPath(config.data, path, value);
};

config.get = (path) =>
{
	return getNestedPath(config.data, path, null);
};

user.set = (client, options = {}) =>
{
	options = Object.assign({
		sameSite : 'lax',
		expires : 365
	}, options);

	cookies.set('ei-client', JSON.stringify(client), options);
};

user.getDefaults = () =>
{
	let defaults = {};

	defaults.gallery = {
		'reverseOptions' : (config.data).gallery.reverseOptions,
		'listAlignment' : (config.data).gallery.listAlignment,
		'fitContent' : (config.data).gallery.fitContent
	};

	defaults.gallery.autoplay = true;
	defaults.gallery.volume = 0.25;

	defaults.gallery.style = {
		compact : (config.data).style.compact,
		theme : false
	};

	return defaults;
};

user.get = () =>
{
	let required = ['gallery', 'sort', 'style'],
		defaults = user.getDefaults(),
		client = {},
		update = false;

	try
	{
		client = JSON.parse(cookies.get('ei-client'));

		(required).forEach((key) =>
		{
			if(!Object.prototype.hasOwnProperty.call(client, key))
			{
				client[key] = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : {};
			}
		});

		Object.keys(defaults).forEach((key) =>
		{
			Object.keys(defaults[key]).forEach((option) =>
			{
				if(!Object.prototype.hasOwnProperty.call(client[key], option))
				{
					client[key][option] = defaults[key][option];

					update = true;
				}
			});
		});

		if(update)
		{
			user.set(client);
		}
	} catch (e)
	{
		/* On error means that the client does not have a valid cookie, so we're creating it */
		client = {};

		/* Set default theme (if any) */
		if((config.data).style.themes.set)
		{
			if(!defaults.style)
			{
				defaults.style = {};
			}

			defaults.style.theme = (config.data).style.themes.set;
		}

		/* Create keys */
		(required).forEach((key) =>
		{
			client[key] = {};
		});

		/* Merge and set cookie */
		user.set(Object.assign(client, defaults));
	}

	/* Return client config */
	return client;
};

config.init();

user.get();

export {
	config,
	user
};