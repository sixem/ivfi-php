/* import config */
import { config } from '../config/config';

/* import classes */
import { selectorClass } from '../classes/selector';

/* import text data */
import text from '../data.json';

/* import helpers */
import {
	logger
} from '../modules/helpers';

/* create main data object */
const data = new Object();

/* declare local storage key */
data.storageKey = 'eyyIndexer';

/* set data text object */
data.text = text;

/* set data scrolllock object */
data.scrollLock = false;

/* create data sets object */
data.sets = new Object();

/* set data sets object */
data.sets.preview = new Object();
data.sets.defaults = new Object();
data.sets.selection = new Object();
data.sets.selected = null;
data.sets.refresh = false;

/* create data components object */
data.components = new Object();

/* create data layer object */
data.layer = new Object();

/* create data instances object */
data.instances = new Object();

/* create data optimize instances object */
data.instances.optimize = {
	main : {
		enabled : false
	},
	gallery : {
		enabled : false
	}
}

/* create keys */
data.keys = {
	escape : 27,
	pageUp : 33,
	pageDown : 34,
	arrowLeft : 37,
	arrowUp : 38,
	arrowRight : 39,
	arrowDown : 40,
	f : 70,
	g : 71,
	l : 76
};

/* create preview data */
data.preview = new Object();

data.preview.volume = 0;
data.preview.data = null;

/* create preview volume */
if(config.get('mobile') === false && config.get('preview.enabled') === true)
{
	data.preview.volume = localStorage.getItem(`${data.storageKey}.previewVolume`);

	if(data.preview.volume === null || !(data.preview.volume >= 0))
	{
		data.preview.volume = 10;

		localStorage.setItem(`${data.storageKey}.previewVolume`, 10);
	} else {
		data.preview.volume = parseInt(data.preview.volume);
	}

	console.log('-> data.previewVolume', data.preview.volume);
}

/* initiate selector class */
data.instances.selector = new selectorClass();

/* initiate logging class */
data.instances.pipe = new logger(config.get('debug')).pipe;

/* export data */
export {
	data
};