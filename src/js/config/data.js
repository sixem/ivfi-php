/** Import `config` */
import {
	config
} from '../config/config';

/** Import `code` */
import {
	code
} from '../config/constants';

/** Import `selectorClass` */
import selectorClass from '../classes/selector';

/** Import `text` */
import text from '../data.json';

/** Import `logger` */
import {
	logger
} from '../modules/helpers';

/* Create main data object */
const data = {};

/* Declare local storage key */
data.storageKey = code.STORAGE_KEY;

/* Set data text object */
data.text = text;

/* Set data scrolllock object */
data.scrollLock = false;

/* Create data sets object */
data.sets = {};

/* Set data sets object */
data.sets.preview = {};
data.sets.defaults = {};
data.sets.selection = {};
data.sets.selected = null;
data.sets.refresh = false;

/* Create data components object */
data.components = {};

/* Create data layer object */
data.layer = {};

/* Create data instances object */
data.instances = {};

/* Create data optimize instances object */
data.instances.optimize = {
	main : {
		enabled : false
	},
	gallery : {
		enabled : false
	}
};

/* Create keys */
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

/* Create preview data */
data.preview = {};
data.preview.volume = 0;
data.preview.data = null;

/* Create preview volume */
if(config.get('mobile') === false &&
	config.get('preview.enabled') === true)
{
	data.preview.volume = localStorage.getItem(`${data.storageKey}.previewVolume`);

	if(data.preview.volume === null || !(data.preview.volume >= 0))
	{
		data.preview.volume = 10;
		localStorage.setItem(`${data.storageKey}.previewVolume`, 10);
	} else {
		data.preview.volume = parseInt(data.preview.volume);
	}
}

/* Initiate selector class */
data.instances.selector = new selectorClass();

/* Initiate logging class */
data.instances.pipe = new logger(config.get('debug')).pipe;

/* Export data */
export default data;