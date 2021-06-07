/* import vendors */
import cookies from 'js-cookie';

/* import helpers */
import {
	setNestedPath,
	getNestedPath,
	checkNestedPath,
} from '../modules/helpers';

/* config object */
const config = new Object();

/* user/client object */
const user = new Object();

config.init = () =>
{
	config.data = JSON.parse(document.getElementById('__INDEXER_DATA__').innerHTML);

	config.data.mobile = Modernizr.mq('(max-width: 640px)');
}

config.isMobile = () =>
{
	return config.data.mobile;
}

config.exists = (path) =>
{
	return checkNestedPath(config.data, path);
}

config.set = (path, value) =>
{
	return setNestedPath(config.data, path, value);
}

config.get = (path) =>
{
	return getNestedPath(config.data, path, null);
}

user.set = (client, options = new Object()) =>
{
	options = Object.assign({
		sameSite : 'lax',
		expires : 365
	}, options);

	cookies.set('ei-client', JSON.stringify(client), options);
}

user.getDefaults = () =>
{
	let defaults = new Object();

	defaults.gallery = {
		'reverseOptions' : (config.data).gallery.reverse_options,
		'listAlignment' : (config.data).gallery.listAlignment,
		'fitContent' : (config.data).gallery.fit_content
	};

	defaults.gallery.extensions = {
		'image' : (config.data).extensions.image,
		'video' : (config.data).extensions.video
	};

	defaults.gallery.autoplay = true;
	defaults.gallery.volume = 0.25;

	defaults.gallery.style = {
		compact : (config.data).style.compact,
		theme : false
	};

	return defaults;
}

user.get = () =>
{
	let required = ['gallery', 'sort', 'style'];

	let defaults = user.getDefaults();

	let client = new Object();

	let update = false;

	try
	{
		client = JSON.parse(cookies.get('ei-client'));

		(required).forEach((key) =>
		{
			if(!Object.prototype.hasOwnProperty.call(client, key))
			{
				client[key] = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : new Object();
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
		/* on error means that the client does not have a valid cookie, so we're creating it */
		client = new Object();

		/* set default theme (if any) */
		if((config.data).style.themes.set)
		{
			if(!defaults.style)
			{
				defaults.style = new Object();
			}

			defaults.style.theme = (config.data).style.themes.set;
		}

		/* create keys */
		(required).forEach((key) =>
		{
			client[key] = new Object();
		});

		/* merge and set cookie */
		user.set(Object.assign(client, defaults));
	}

	/* return client config */
	return client;
}

config.init();

user.get();

export {
	config,
	user
}
