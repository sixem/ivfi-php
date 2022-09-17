/* Config */
import { config } from './config';
/* Data */
import text from '../data.json';
/* Classes */
import selectorClass from '../classes/selector';

/** Constants */
import { StorageKey } from '../constant';

/** Types */
import {
	TDataCapsule
} from '../types';

/* Create main data object */
const data: TDataCapsule = {};

/** Set data text object */
data.text = text;

/** Set data scrolllock object */
data.scrollLock = false;

/** Create data sets object */
data.sets = {
	preview: {},
	defaults: {},
	selection: {},
	selected: null,
	refresh: false
};

/** Create data components object */
data.components = {};

/** Create data layer object */
data.layer = {};

/** Create data instances object */
data.instances = {};

/** Create data optimize instances object */
data.instances.optimize = {
	main: {
		enabled: false
	},
	gallery: {
		enabled: false
	}
};

/* Create preview data */
data.preview = {
	volume: 0,
	isLoadable: true,
	data: null
};

/* Create preview volume */
if(config.get('mobile') === false &&
	config.get('preview.enabled') === true)
{
	const storedVolume: string = localStorage.getItem(`${StorageKey}.previewVolume`);

	data.preview.volume = parseInt(storedVolume) ? parseInt(storedVolume) : null;

	if(data.preview.volume === null || !(data.preview.volume >= 0))
	{
		data.preview.volume = 10;
		localStorage.setItem(`${StorageKey}.previewVolume`, '10');
	} else {
		data.preview.volume = parseInt(data.preview.volume.toString());
	}
}

/* Initiate selector class */
data.instances.selector = new selectorClass();

/* Export data */
export default data;