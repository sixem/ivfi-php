import {
	IWindowGlobals,
	IDocumentGlobals
} from '../common';

export interface HTMLElementEventHooks extends HTMLElement
{
	uniqueHookId: number;
	eventHooks: {
		events: object;
		hasCallback: boolean | object;
	}
}

export interface EventTargetEventHooks extends EventTarget
{
	uniqueHookId?: number;
	eventHooks?: {
		events: object;
		hasCallback: boolean | object;
	} | null,
	tagName?: string
}

export interface IEventHooks {
	events: object;
	subs: object;
	currentId: number;

	listenSetState?: (
		selector: IWindowGlobals
			| IDocumentGlobals
			| HTMLElement
			| HTMLElementEventHooks
			| string,
		events: Array<string> | string,
		id: any,
		state: boolean
	) => void;

	unlisten?: (
		selector: IWindowGlobals
			| IDocumentGlobals
			| HTMLElement
			| HTMLElementEventHooks
			| string,
		events: Array<string> | string,
		id: string
	) => boolean | void;

	listen?: (
		selector: IWindowGlobals
			| IDocumentGlobals
			| HTMLElement
			| HTMLElementEventHooks
			| string,
		events: Array<string> | string,
		id: string,
		callback: (...args: any) => void,
		options?: IListenOptions
	) => void;

	subscribe?: (
		event: string,
		id: string,
		callback: (...args: any) => void
	) => void;

	unsubscribe?: (
		event: string,
		id: string
	) => void;

	trigger?: (
		event: string,
		...args: any[]
	) => void;
}

export interface IListenOptions {
	onAdd?: (...args: any) => any;

	options?: object;
	destroy?: boolean;
}

export interface IEventItem {
	active: boolean;
	callbackHandler?: (e: Event) => void | null;
}