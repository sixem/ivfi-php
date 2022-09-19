/** Types */
import { IGalleryOptions } from '../class-gallery';
import { TUserClient } from '../module-config';

/**
 * Filter component
 */
export type TComponentFilter = {
	apply?: (query: string) => void;
	toggle?: () => void;
	getMatch?: (input: string, query: string) => {
		valid?: boolean;
		reason?: unknown;
		data?: Array<any> | null;
	};
};

/**
 * Gallery component
 */
export namespace MComponentGallery
{
	export type TVideoPreviewData = {
		continue?: Partial<IGalleryOptions['continue']['video']>;
		preview?: HTMLVideoElement;
		source?: HTMLSourceElement;
	};

	export type TOptions = {
		start?: number | null;
		list?: {
			show?: boolean | null;
			reverse?: boolean;
		};
		continue?: {
			video?: TVideoPreviewData['continue'];
		}
	};
}

/**
 * Settings component
 */
export namespace MComponentSettings
{
	export type TGathered = {
		[key: string]: {
			[key: string]: boolean | string | number;
		}
	};

	export interface TIndexElement extends HTMLInputElement {
		selectedIndex?: number;
	}

	export type TCreateCapsule = {
		option?: (
			element: HTMLElement,
			text: string,
			options?: {
				[key: string]: any;
			},
			title?: string
		) => HTMLElement;
		
		section?: (
			id: string,
			header?: string
		) => HTMLElement;

		select?: (
			values: Array<{
				value: string;
				text: string;
			}>,
			options?: object,
			selected?: (...args: any) => boolean | null
		) => HTMLInputElement;

		check?: (
			options?: {
				[key: string]: any;
			},
			selected?: (...args: any) => boolean | null
		) => HTMLInputElement;
	};

	export type TUpdateCapsule = {
		style: {
			theme?: (
				value: string
			) => void;
			compact?: (
				value: boolean
			) => void;
		};
		gallery: {
			listAlignment?: (
				alignment: number
			) => void;

			reverseOptions?: (
				value: boolean
			) => void;

			fitContent?: (
				value: boolean
			) => void;

			autoplay?: (
				value: boolean
			) => void;
		};
	};

	export type TThemeCapsule = {
		set?: (
			theme: string | null,
			setCookie: boolean
		) => void | boolean;
	};

	export type TOptionsCapsule = {
		gather?: (
			container: HTMLElement
		) => TGathered;

		set?: (
			setData: object,
			client: TUserClient
		) => object;
	};
}

/**
 * Main component
 */
export namespace MComponentMain
{
	type TMenu = {
		create?: () => HTMLElement;
		toggle?: (
			state?: null | boolean
		) => boolean;
	};

	type TDates = {
		offsetGet?: () => number;
		formatSince?: (
			seconds: number
		) => string | boolean;
		apply?: (
			offset: TDateOffset,
			format: boolean
		) => void;
		load?: () => void;
	};

	type TSort = {
		load?: () => void;
	};

	type TOverlay = {
		hide?: (
			callback?: (...args: any) => void
		) => void;
	};

	export type TDateOffset = {
		seconds?: number;
		minutes?: number;
		hours?: number;
	};

	export interface ISortRow extends HTMLTableCellElement {
		asc?: boolean;
	}

	export type TCapsule = {
		menu: TMenu;
		dates: TDates;
		sort: TSort;
		overlay: TOverlay;

		getTableItems?: () => Array<{
			url?: string;
			name?: string;
			size?: string;
		}>;

		sortTableColumn?: (
			target: HTMLElement
		) => void;
	};
}