export interface HTMLElementEventHooks extends HTMLElement
{
	uniqueHookId: number;
	eventHooks: {
		events: object;
		hasCallback: boolean | object;
	}
};

export interface EventTargetEventHooks extends EventTarget
{
	uniqueHookId?: number;
	eventHooks?: {
		events: object;
		hasCallback: boolean | object;
	} | null,
	tagName?: string
};

export interface IEventHooks {
	events: object;
	subs: object;
	currentId: number;
	listenSetState?: Function;
	unlisten?: Function;
	listen?: Function;
	subscribe?: Function;
	unsubscribe?: Function;
	trigger?: Function;
};

export interface IListenOptions {
	onAdd?: Function;
	options?: object;
	destroy?: boolean;
};

export interface IEventItem {
	active: boolean;
	callbackHandler?: Function | null;
};