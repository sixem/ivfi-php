import { THTMLElement } from '../class-gallery';

/**
 * Optimization page object
 */
 export type TPageObject = {
	update: Function;
	windowHeight?: number;
	windowWidth?: number;
	scrolledY?: number;
	scope?: THTMLElement;
	tableWidth?: number;
};

/**
 * Optimization scope
 */
export type TOptimizeScope = [HTMLElement | Window, string];

/**
 * Optimization options
 */
export type TOptimizeOptions = {
	page: TPageObject;
	table: HTMLElement;
	scope: TOptimizeScope;
	padding?: number;
	on?: boolean | null | {
		rowChange?: Function;
	};
};

/**
 * Optimization inner structure
 */
export type TOptimizeStructure = {
	[key: string]: {
		index?: number;
	}
};

/**
 * Optimization table row item
 */
export interface TOptimizeRowItem extends HTMLElement {
	_offsetTop?: number;
	_offsetHeight?: number;
	_isVisible?: boolean;
	_isHidden?: boolean;
};

/**
 * Optimization cached item (sort)
 */
export interface TOptimizeCachedRowItem {
	value?: any;
	index?: number;
};