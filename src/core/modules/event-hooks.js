/** Import `isString` */
import {
	isString
} from '../modules/helpers';

const eventHooks = {
	events: {},
	currentId: 0
};

/**
 * Subscribes to an event
 * 
 * @param {string} event 
 * @param {string|integer} id 
 * @param {function} callback 
 */
eventHooks.subscribe = (selector, events, id, callback) =>
{
	if((!selector) || (!events) || (!callback))
	{
		throw new Error('Unset arguments.');
	}

	if(isString(selector))
	{
		selector = document.body.querySelector(selector);
	}

	events = Array.isArray(events) ? events : events.split();

	if(!selector._uniqueHookId)
	{
		selector._uniqueHookId = eventHooks.currentId;
		eventHooks.currentId++;
	}

	let uniqueId = `${selector.tagName}_${selector._uniqueHookId}`;

	(events).forEach((event) =>
	{
		if(!Object.prototype.hasOwnProperty.call(eventHooks.events, uniqueId))
		{
			eventHooks.events[uniqueId] = {};

			selector.addEventListener(event, (e) =>
			{
				(Object.keys(eventHooks.events[uniqueId])).forEach((key) =>
				{
					if(Array.isArray(eventHooks.events[uniqueId][key]) &&
						eventHooks.events[uniqueId][key].length > 0)
					{
						(eventHooks.events[uniqueId][key]).forEach((callback) =>
						{
							callback(e);
						});
					}
				});
			}, true);
		}
	
		eventHooks.events[uniqueId][id] = [callback];
	});

	return eventHooks;
};

/**
 * Unsubscribes from an event
 * 
 * @param {string} event 
 * @param {string|integer} id 
 */
eventHooks.unsubscribe = (event, id) =>
{
	if(Object.prototype.hasOwnProperty.call(eventHooks.events, event) &&
		Object.prototype.hasOwnProperty.call(eventHooks.events[event], id))
	{
		delete eventHooks.events[event][id];
	}

	return eventHooks;
};

export default eventHooks;