/**
 * Listen and dispatch events class
 */
export default class emitterClass
{
	constructor()
	{
		this.data = new Object();

		return this;
	}

	listen = (event, callback) =>
	{
		if(!Object.prototype.hasOwnProperty.call(this.data, event))
		{
			this.data[event] = new Array();
		}

		this.data[event].push(callback);
	}

	dispute = (event) =>
	{
		if(Object.prototype.hasOwnProperty.call(this.data, event))
		{
			this.data[event] = new Array();

			delete this.data[event];
		}
	}

	dispatch = (event, data = null) =>
	{
		if(Object.prototype.hasOwnProperty.call(this.data, event))
		{
			this.data[event].forEach((e) =>
			{
				e(data);
			});

			return true;
		}

		return false;
	}
};