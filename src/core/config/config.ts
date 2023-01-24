/* Vendors */
import cookies from 'js-cookie';
import '../vendors/modernizr/modernizr-mq';
/* Modules */
import { setNestedPath, getNestedPath, checkNestedPath, } from '../helpers';

/* Constants */
import { CookieKey, ScriptDataId } from '../constant';

/* Types */
import { TConfigCapsule, TUserClient, TUserStorage } from '../types';

const config: TConfigCapsule = {};
const user: TUserClient = {};

config.init = (): void =>
{
	config.data = JSON.parse(document.getElementById(ScriptDataId).innerHTML);
	config.data.mobile = Modernizr.mq('(max-width: 768px)');
};

config.isMobile = (): boolean =>
{
	return config.data.mobile;
};

config.exists = (path): boolean =>
{
	return checkNestedPath(config.data, path);
};

config.set = (path, value): boolean =>
{
	return setNestedPath(config.data, path, value);
};

config.get = (path): any =>
{
	return getNestedPath(config.data, path, null);
};

user.set = (client, options = {}): void =>
{
	options = Object.assign({
		sameSite : 'lax',
		expires : 365
	}, options);

	cookies.set(CookieKey, JSON.stringify(client), options);
};

user.getDefaults = (): TUserStorage =>
{
	const defaults: TUserStorage = {};

	defaults.gallery = {
		reverseOptions: (config.data).gallery.reverseOptions,
		listAlignment: (config.data).gallery.listAlignment,
		fitContent: (config.data).gallery.fitContent,
		autoplay: true,
		volume: 0.25
	};

	defaults.style = {
		compact: (config.data).style.compact,
		theme: false
	};

	return defaults;
};

user.get = (): TUserStorage =>
{
	const required: Array<string> = ['gallery', 'sort', 'style'];
	const defaults: TUserStorage = user.getDefaults();

	let client: TUserStorage = {};
	let update = false;

	try
	{
		client = JSON.parse(cookies.get(CookieKey));

		(required).forEach((key: string) =>
		{
			if(!Object.prototype.hasOwnProperty.call(client, key))
			{
				client[key] = Object.prototype.hasOwnProperty.call(defaults, key) ? defaults[key] : {};
			}
		});

		Object.keys(defaults).forEach((key: string) =>
		{
			Object.keys(defaults[key]).forEach((option: string) =>
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
	} catch (e: unknown)
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

	return client;
};

config.init();
user.get();

export {
	config,
	user
};