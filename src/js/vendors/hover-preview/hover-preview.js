'use strict';

import {
	getMove
} from './utils';

import {
	mouseenter,
	mouseleave,
	mousemove
} from './events';

const defaults = {
	delay : 75,
	encodeAll : false,
	cursor : true,
	force : null
};

class hoverPreview
{
	constructor(element, options = {})
	{
		if(!element)
		{
			throw Error('No element were passed.');
		}

		this.element = element;
		this.options = options;

		setup.call(this);
	}

	reload()
	{
		this.destroy();
		setup.call(this);
	}

	destroy()
	{
		const events = this.events;

		this.handle.removeEventListener('mouseenter', events.mouseenter, false);
		this.handle.removeEventListener('mouseleave', events.mouseleave, false);
		this.handle.removeEventListener('mousemove', events.mousemove, false);
	}
}

function setup()
{
	// set options and data
	this.options = {...defaults, ...this.options};

	this.data = {
		cursor : null,
		left : null,
		src : null,
		type : null,
		offset : null,
		dimensions : null,
		force : null
	};

	if(this.options.force)
	{
		this.data.force = this.options.force;
	}

	this.timers = {
		load : null,
		delay : null
	}

	// set handle
	this.handle = this.element;

	// move function
	this.updater = getMove();

	this.events = {
		mouseenter : mouseenter.bind(this),
		mouseleave : mouseleave.bind(this),
		mousemove : mousemove.bind(this)
	};

	// add events
	this.handle.addEventListener('mouseenter', this.events.mouseenter, false);
	this.handle.addEventListener('mouseleave', this.events.mouseleave, false);
	this.handle.addEventListener('mousemove', this.events.mousemove, false);
}

// export default
export default (element, options) => new hoverPreview(element, options)