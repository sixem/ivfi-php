type TKeyReferences = {
	[key: string]: string
};

const Keys: TKeyReferences = {
	escape: 'Escape',
	pageUp: 'PageUp',
	pageDown: 'PageDown',
	arrowLeft: 'ArrowLeft',
	arrowUp: 'ArrowUp',
	arrowRight: 'ArrowRight',
	arrowDown: 'ArrowDown',
	f: 'KeyF',
	g: 'KeyG',
	l: 'KeyL'
};

const StorageKey = 'IVFi';
const CookieKey = 'IVFi';
const ScriptDataId = '__IFVI_DATA__';

export {
	Keys,
	StorageKey,
	CookieKey,
	ScriptDataId
};