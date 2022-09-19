/** Classes */
import selectorClass from '../../classes/selector';
import optimizeClass from '../../classes/optimize';
import galleryClass from '../../classes/gallery';

/** Types */
import { TPageObject } from '../class-optimize';

type TDataText = {
	reverseSearch?: {
		[key: string]: string
	};
	settingsLabels?: {
		[key: string]: {
			text?: string;
			description?: string;
		}
	};
	menuLabels?: {
		[key: string]: {
			text?: string;
		}
	}
};

type TDataComponents = {
	filter?: any;
	main?: any;
	gallery?: any;
	settings?: any;
	bind?: {
		load?: () => void;
		unbind?: () => void;
	};
};

type TDataLayer = {
	gallery?: TPageObject;
	main?: TPageObject;
};

type TDataSets = {
	preview: {
		video?: null | object;
	};
	defaults: {
		topValues?: {
			size: string;
			files: string;
			directories: string;
		}
	};
	selection: object;
	selected: any,
	refresh?: boolean;
};

type TDataPreview = {
	volume?: number;
	isLoadable?: boolean;
	data?: any;
};

type TDataInstances = {
	selector?: selectorClass;
	gallery?: galleryClass;
	optimize?: {
		main?: {
			[key: string]: any;
		} | optimizeClass;
		gallery?: {
			[key: string]: any;
		} | optimizeClass;
	}
};

export type TDataCapsule = {
	text?: TDataText;
	components?: TDataComponents;
	layer?: TDataLayer;
	sets?: TDataSets;
	preview?: TDataPreview;
	instances?: TDataInstances;
	scrollLock?: boolean;
};