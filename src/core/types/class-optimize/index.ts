import {
	THTMLElement
} from '../class-gallery';

import {
	ITableRowMI
} from '../common';

/**
 * Optimization page object
 */
export type TPageObject = {
	update: () => boolean;
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
		rowChange?: (
			rows: Array<ITableRowMI>
		) => boolean | void;
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
}

/**
 * Optimization cached item (sort)
 */
export interface TOptimizeCachedRowItem {
	value?: any;
	index?: number;
}