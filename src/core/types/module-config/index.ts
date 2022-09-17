/**
 * Configuration (user) object
 */
 export type TUserClient = {
    set?: Function;
    get?: Function;
    getDefaults?: Function;
    gallery?: {
        listAlignment?: number | boolean;
    };
    style?: {
        compact?: boolean;
    };
    timezone_offset?: number | boolean;
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
};

/**
 * Outer configuration object
 */
export type TConfigCapsule = {
    init?: Function;
    isMobile?: Function;
    exists?: Function;
    set?: Function;
    get?: Function;
    data?: IConfigData;
};