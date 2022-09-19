import {
	TExtensionArray
} from '../common';

/**
 * Gallery constructor options
 */
export interface IGalleryOptions extends TGalleryDefaults {
	filter?: string;
	continue?: {
		video: {
			src?: string;
			time?: number;
		}
	}
}

/**
 * Default gallery options
 */
export type TGalleryDefaults = {
	extensions?: TExtensionArray;

	video?: object;
	list?: {
		show: boolean;
		reverse: boolean;
	};

	performance?: boolean;
	autoplay?: boolean;
	console?: boolean;
	reverseOptions?: boolean;
	sharpen?: boolean;
	mobile?: boolean;
	fitContent?: boolean;
	encodeAll?: boolean;

	volume?: number;
	scrollInterval?: number;
	start?: number;
	listAlignment?: number;
};

/**
 * Active gallery data object
 */
export type TGalleryDataActive = {
	keyPrevent?: Array<string>;

	listDragged?: boolean;
	scrollbreak?: boolean;
	busy?: boolean;

	boundEvents?: object;
	body?: object;

	selected?: {
		src: null | string;
		ext: null | string;
		index: null | number;
		type: null | number;
	};

	listDrag?: HTMLElement;
	list?: HTMLElement;
};

/**
 * Gallery list item
 */
export type TGalleryTableItem = {
	name: string;
    url?: string;
	size?: number;
	dimensions?: {
		height: number;
		width: number;
	}
};

/**
 * Extended gallery `HTMLElement`
 */
export interface HTMLElementExtend extends HTMLElement
{
	_offsetTop?: number
}

/**
 * HTMLElement definition
 */
export type THTMLElement = null | HTMLElement | undefined;