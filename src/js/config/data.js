/* import config */
import { config } from '../config/config';

/* import classes */
import { selectorClass } from '../classes/selector';

/* import text data */
import text from '../text/data.json';

/* import helpers */
import {
	logger
} from '../helpers/helpers';

/* create main data object */
const data = new Object();

/* set data text object */
data.text = text;

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

/* initiate selector class */
data.instances.selector = new selectorClass();

/* initiate logging class */
data.instances.pipe = new logger(config.get('debug')).pipe;

/* export data */
export {
	data
};