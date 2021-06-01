/**
 * listen/dispatch (events) class
 */
export class emitterClass
{
	constructor(items, options)
	{
		this.data = new Object();

		return this;
	}

	listen = (event, callback) =>
	{
		if(!this.data.hasOwnProperty(event))
		{
			this.data[event] = new Array();
		}

		this.data[event].push(callback);
	}

	dispute = (event) =>
	{
		if(this.data.hasOwnProperty(event))
		{
			this.data[event] = new Array();

			delete this.data[event];
		}
	}

	dispatch = (event, data = null) =>
	{
		if(this.data.hasOwnProperty(event))
		{
			this.data[event].forEach((e) =>
			{
				e(data);
			});

			return true;
		}

		return false;
	}
}