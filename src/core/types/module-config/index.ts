/**
 * Configuration (user) object
 */
export type TUserClient = {
    set?: (
        client: TUserStorage | TUserClient,
        options?: TUserStorage
    ) => void;
    get?: () => TUserStorage;
    getDefaults?: () => TUserStorage;
    gallery?: {
        listAlignment?: number | boolean;
    };
    style?: {
        compact?: boolean;
    };
    timezoneOffset?: number | boolean;
    sort?: {
        ascending?: boolean | number;
        row?: number;
    }
};

/**
 * User storage (cookies)
 */
export type TUserStorage = {
    gallery?: {
        reverseOptions?: boolean;
        fitContent?: boolean;
        autoplay?: boolean;
        listAlignment?: number;
        listWidth?: number | boolean;
        listState?: number;
        volume?: number;
    };
    style?: {
        compact?: boolean;
        theme?: boolean | string;
    };
    readme?: {
		toggled?: boolean;
	};
};

/**
 * Configuration object (from backend)
 */
export interface IConfigData extends Omit<TUserStorage, 'style'> {
    mobile?: boolean;
    bust?: string;
    style?: {
        compact?: boolean;
        themes?: {
            set?: boolean | string;
        }
    };
}

/**
 * Outer configuration object
 */
export type TConfigCapsule = {
    init?: () => void;
    isMobile?: () => boolean;
    exists?: (
        path: string
    ) => boolean;
    set?: (
        path: string,
        value: any
    ) => boolean;
    get?: (path: string) => any;
    data?: IConfigData;
};