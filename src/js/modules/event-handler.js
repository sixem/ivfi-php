/* require helpers */
import {
	isString
} from '../modules/helpers';

/* import config */
import {
	code
} from '../config/constants';

/**
 * handles event listeners
 */
export const eventHandler = {
	data : new Object,
	/**
	 * adds event listener data
	 */
	insert : (id, unique) =>
	{
		if(!Object.prototype.hasOwnProperty.call(eventHandler.data, id))
		{
			eventHandler.data[id] = new Object();

			eventHandler.data[id][unique] = new Object;
		} else if(!Object.prototype.hasOwnProperty.call(eventHandler.data[id], unique))
		{
			eventHandler.data[id][unique] = new Object;
		}

		return eventHandler.data[id];
	},
	assignId : (selector, events, id) =>
	{
		if(id === code.USE_ASSIGNED_DOM_ID)
		{
			if(Number.isInteger(selector.domId))
			{
				id = selector.domId;
			} else {
				throw new Error('No assigned ID was found.');
			}
		} else {
			id = id || (Array.isArray(events) ? events[0] : events);
		}

		return id;
	},
	/**
	 * listens to an event
	 */
	addListener : (selector, events, id, callback, unique = 0) =>
	{
		if((!selector) || (!events) || (!callback))
		{
			throw new Error('Unset arguments.');
		}

		if(isString(selector))
		{
			selector = document.body.querySelector(selector);
		}

		id = eventHandler.assignId(selector, events, id);

		events = Array.isArray(events) ? events : events.split();

		let entry = eventHandler.insert(id, unique);

		if(entry[unique].callback)
		{
			events.forEach((event) =>
			{
				selector.removeEventListener(event, entry[unique].callback, true);
			});

			delete entry[unique].callback;
		}

		entry[unique].callback = callback;

		events.forEach((event) =>
		{
			selector.addEventListener(event, entry[unique].callback, true);
		});

		return entry;
	},
	/**
	 * removes a listener from an event
	 */
	removeListener : (selector, events, id, unique = 0) =>
	{
		if((!selector) || (!events))
		{
			throw new Error('Unset arguments.');
		}

		if(isString(selector))
		{
			selector = document.body.querySelector(selector);
		}

		id = eventHandler.assignId(selector, events, id);

		if(!Object.prototype.hasOwnProperty.call(eventHandler.data, id))
		{
			return false;
		}

		let removed = 0;

		let entry = eventHandler.data[id];

		if(entry[unique].callback)
		{
			(Array.isArray(events) ? events : events.split('.')).forEach((event) =>
			{
				selector.removeEventListener(event, entry[unique].callback, true);

				removed++;
			});

			entry[unique].callback = null;
		}

		delete eventHandler.data[id];

		return removed;
	}
};