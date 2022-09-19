import {
	EventTargetEventHooks
} from '../module-event-hooks';

/**
 * Extension for preview anchors
 */
export interface IPreviewAnchor extends HTMLElement {
	itemIndex?: number;
}

/**
 * Extension for media indexing
 */
export interface ITableRowMI extends HTMLElement {
	_mediaIndex?: number;
}

/**
 * On preview load types
 */
export type TOnPreviewLoad = {
	loaded: boolean;
	type: string;
	audible: boolean;
	element: HTMLVideoElement | HTMLImageElement;
	src: string;
	timestamp?: number;
};

/**
 * Preview options
 */
export type TPreviewOptions = {
	delay?: number;
	cursor?: boolean;
	encodeAll?: boolean;
	force?: {
		extension?: string | number;
		type?: string | number;
	};
	on?: {
		onLoaded: (data: TOnPreviewLoad) => void;
	};
};

export type TExtensionArray = {
	image: Array<string>;
	video: Array<string>;
};

/**
 * `galleryItemChanged` event data
 */
export type TPayloadgalleryItemChanged = {
	source: string;
	index: number;
};

/**
 * Global `window` extensions
 */
export interface IWindowGlobals extends Window {
	eventHooks?: EventTargetEventHooks['eventHooks'];
}

/**
 * Global `document` extensions
 */
export interface IDocumentGlobals extends Document {
	eventHooks?: EventTargetEventHooks['eventHooks'];
}