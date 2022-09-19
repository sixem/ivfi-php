
/** Types */
import {
	HTMLElementEventHooks,
	EventTargetEventHooks,
	IEventHooks,
	IEventItem
} from '../types';

const getEvents = (events: Array<string> | string) =>
{
	return Array.isArray(events) ? events : [events];
};

/**
 * Tests the existance of a path within an object
 */
const objHas = (obj: undefined | object, path: string): boolean =>
{
	let level: Array<string> | string | null | undefined = null,
		rest: Array<string> = [];

	if(!path.includes('.'))
	{
		level = path;
	} else {
		rest = path.split('.');
		level = rest.shift();
	}

	if(obj === undefined)
	{
		return false;
	}

	if(rest.length === 0 &&
		Object.prototype.hasOwnProperty.call(obj, level))
	{
		return true;
	}

	return level !== undefined ? objHas(obj[level], rest.join('.')) : false;
};

const eventHooks: IEventHooks = {
	events: {},
	subs: {},
	currentId: 0
};

const currentId = (): number =>
{
	const id = eventHooks.currentId;

	eventHooks.currentId++;

	return id;
};

/**
 * Event handler for `listen`
 */
const eventCallback = (event: Event): void =>
{
	/* Get current selector and event type */
	const [eventType, eventTarget] = [event.type, event.currentTarget];

	const element: EventTargetEventHooks | null | undefined = eventTarget;

	/* See if element has `eventHooks` property */
	if(element && element.eventHooks &&
		element.eventHooks.events[eventType])
	{
		/* Iterate over attached listeners */
		Object.keys(element.eventHooks.events[eventType]).forEach((id) =>
		{
			/* Get current item */
			const item = element.eventHooks.events[eventType][id];

			if(item.active)
			{
				const uniqueId = `${element.tagName}_${element.uniqueHookId}`;

				/* Check if element has events matching the current IDs */
				if(objHas(eventHooks.events, `${id}.${uniqueId}.${eventType}.callbacks`))
				{
					/* Get callbacks */
					const callbacks: Array<(...args: any) => void> = eventHooks.events[id][uniqueId][eventType].callbacks;

					/* Call callbacks */
					callbacks.forEach((callback) => callback(event));
				}
			}
		});
	}
};

/**
 * Actives or deactivates the activation of listener callbacks
 */
eventHooks.listenSetState = (selector, events, id, state = true): void =>
{
	let element: HTMLElementEventHooks;

	if(typeof selector === 'string')
	{
		element = document.querySelector(selector);
	} else {
		element = selector as HTMLElementEventHooks;
	}

	/* Create an array of the event(s) */
	events = getEvents(events);

	if(element && element.eventHooks)
	{
		/* Iterate over events, set `active` to passed `state` */
		(events).forEach((event: string) =>
		{
			if(objHas(element?.eventHooks, `events.${event}.${id}.active`))
			{
				element.eventHooks.events[event][id].active = state;
			}
		});
	}
};

eventHooks.unlisten = (selector, events, id): void | boolean =>
{
	/* Check if the ID isn't present */
	if(!eventHooks.events[id])
	{
		return false;
	}

	/* Create an array of the event(s) */
	events = getEvents(events);

	let element: HTMLElementEventHooks;

	if(typeof selector === 'string')
	{
		element = document.querySelector(selector);
	} else {
		element = selector as HTMLElementEventHooks;
	}

	if(eventHooks.events[id] &&
		element.eventHooks &&
		element.eventHooks.events &&
		element.eventHooks.hasCallback &&
		element.uniqueHookId >= 0)
	{
		/* Create a unique ID for the listener */
		const uniqueId = `${element.tagName}_${element.uniqueHookId}`;

		(events).forEach((event: string) =>
		{
			/* Remove callbacks */
			if(eventHooks.events[id][uniqueId][event])
			{
				delete eventHooks.events[id][uniqueId][event];
			}

			if(element.eventHooks.events[event] &&
				element.eventHooks.events[event][id])
			{
				/* Gets the unique callback function for the ID */
				const uniqueCallback = element.eventHooks.events[event][id].callbackHandler;

				/* Remove event listener */
				if(element.eventHooks &&
					element.eventHooks.hasCallback[event] &&
					uniqueCallback
				){
					/* Removes the callback (listener) */
					element.removeEventListener(event, uniqueCallback, {
						capture: true
					});

					delete element.eventHooks.hasCallback[event];
					delete element.eventHooks.events[event][id];
				}
			}
		});
	}

	if(element.eventHooks &&
		element.eventHooks.events)
	{
		(events).forEach((event: string) =>
		{
			/* Remove listener related properties from DOM element */
			if(Object.prototype.hasOwnProperty.call(
				element.eventHooks.events, event
			) && Object.prototype.hasOwnProperty.call(
				element.eventHooks.events[event], id
			))
			{
				delete element.eventHooks.events[event][id];
			}
		});
	} else if(!element.eventHooks)
	{
		throw new Error('Unlisten was attempted on an uninitialized item.');
	}
};

/**
 * Listens to the events of a element
 */
eventHooks.listen = (selector, events, id, callback, options = {}): void =>
{
	/* Create an array of the event(s) */
	events = getEvents(events);

	let element: HTMLElementEventHooks;

	if(typeof selector === 'string')
	{
		element = document.querySelector(selector);
	} else {
		element = selector as HTMLElementEventHooks;
	}

	/* Attach a unique ID to the DOM element */
	if(!element.uniqueHookId)
	{
		element.uniqueHookId = currentId();
	}

	/* Create a unique ID for the listener */
	const uniqueId = `${element.tagName}_${element.uniqueHookId}`;

	/* Check if ID does not exist in `_events` */
	if(!Object.prototype.hasOwnProperty.call(eventHooks.events, id))
	{
		eventHooks.events[id] = {};
	}

	if(!Object.prototype.hasOwnProperty.call(eventHooks.events[id], uniqueId))
	{
		eventHooks.events[id][uniqueId] = {};
	}

	/* Add `eventHooks` if it doesn't exist */
	if(!element.eventHooks)
	{
		element.eventHooks = {
			events: {},
			hasCallback: {}
		};
	}

	(events).forEach((event: string) =>
	{
		if(!Object.prototype.hasOwnProperty.call(eventHooks.events[id][uniqueId], event))
		{
			eventHooks.events[id][uniqueId][event] = {
				callbacks: []
			};
		}

		/* Add event callback if it doesn't already exist */
		if(!eventHooks.events[id][uniqueId][event].callbacks.includes(callback))
		{
			eventHooks.events[id][uniqueId][event].callbacks.push(callback);
		}

		/* Set up event data */
		if(!Object.prototype.hasOwnProperty.call(element.eventHooks.events, event))
		{
			element.eventHooks.events[event] = {};
		}

		const eventItem: IEventItem = {
			active: true,
			callbackHandler: null
		};

		element.eventHooks.events[event][id] = eventItem;

		/** Add callback handler if not already added */
		if(!element.eventHooks.hasCallback[event])
		{
			/**
			 * Create a unique callback function for the ID!
			 * 
			 * This provides us with the ability to remove event listeners
			 * on elements without removing every other callback that may
			 * belong to other IDs in the process.
			 */
			const uniqueCallback = (e: Event) =>
			{
				eventCallback(e);

				if(options.destroy === true)
				{
					eventHooks.unlisten(selector, event, id);
				}
			};

			/* Add event listener */
			element.addEventListener(event, uniqueCallback, {
				capture: true,
				...options.options || {}
			});

			element.eventHooks.events[event][id].callbackHandler = uniqueCallback;
			element.eventHooks.hasCallback[event] = true;
		}
	});

	/* Call `onAdd` callback if present */
	if(options.onAdd)
	{
		options.onAdd(element, events, id);
	}
};

/**
 * Subscribes to a self-defined event
 */
eventHooks.subscribe = (event, id, callback): void =>
{
	if(!Object.prototype.hasOwnProperty.call(eventHooks.subs, event))
	{
		eventHooks.subs[event] = {};
	}

	eventHooks.subs[event][id] = callback;
};

/**
 * Unscribes from a self-defined event
 */
eventHooks.unsubscribe = (event, id): void =>
{
	if(Object.prototype.hasOwnProperty.call(eventHooks.subs, event) &&
		Object.prototype.hasOwnProperty.call(eventHooks.subs[event], id))
	{
		delete eventHooks.subs[event][id];
	}
};

/**
 * Triggers a self-defined event
 */
eventHooks.trigger = (event, ...args): void =>
{
	if(Object.prototype.hasOwnProperty.call(eventHooks.subs, event))
	{
		Object.keys(eventHooks.subs[event]).forEach((id: string) =>
		{
			if(typeof eventHooks.subs[event][id] === 'function')
			{
				eventHooks.subs[event][id](...args);
			}
		});
	}
};

export {
	eventHooks
};