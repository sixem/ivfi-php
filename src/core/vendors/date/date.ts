/* https://github.com/kvz/locutus/blob/master/src/php/datetime/date.js
 * Copyright (c) 2007-2016 Kevin van Zonneveld (https://kvz.io) ) */

export const formatDate = (format: string, timestamp: number): string =>
{
	let jsdate, f, txtWords = [
		'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	], formatChr = /\\?(.?)/gi;

	let formatChrCb = (t, s) => f[t] ? f[t]() : s;

	let _pad = (n: string | number, c: number) =>
	{
		n = String(n);
		while(n.length < c) n = '0' + n;
		return n;
	};

	f = {
		d: () => _pad(f.j(), 2),
		D: () => f.l().slice(0, 3),
		j: () => jsdate.getDate(),
		l: () => txtWords[f.w()] + 'day',
		N: () => f.w() || 7,
		S: () =>
		{
			let j = f.j();
			let	i = j % 10;

			if(i <= 3 && parseInt(((j % 100) / 10).toString(), 10) === 1) i = 0;

			return ['st', 'nd', 'rd'][i - 1] || 'th';
		},
		w: () => jsdate.getDay(),
		z: () =>
		{
			let a: any = new Date(f.Y(), f.n() - 1, f.j());
			let	b: any = new Date(f.Y(), 0, 1);

			return Math.round((a - b) / 864e5);
		},
		W: () =>
		{
			let a: any = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
			let	b: any = new Date(a.getFullYear(), 0, 4);

			return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
		},
		F: () => txtWords[6 + f.n()],
		m: () => _pad(f.n(), 2),
		M: () => f.F().slice(0, 3),
		n: () => jsdate.getMonth() + 1,
		t: () => (new Date(f.Y(), f.n(), 0)).getDate(),
		L: () =>
		{
			let j = f.Y();

			return j % 4 === 0 && j % 100 !== 0 || j % 400 === 0;
		},
		o: () =>
		{
			let n = f.n();
			let	W = f.W();
			let	Y = f.Y();

			return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
		},
		Y: () => jsdate.getFullYear(),
		y: () => f.Y().toString().slice(-2),
		a: () => jsdate.getHours() > 11 ? 'pm' : 'am',
		A: () => f.a().toUpperCase(),
		B: () =>
		{
			let H = jsdate.getUTCHours() * 36e2;
			let	i = jsdate.getUTCMinutes() * 60;
			let	s = jsdate.getUTCSeconds();

			return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
		},
		g: () => f.G() % 12 || 12,
		G: () => jsdate.getHours(),
		h: () => _pad(f.g(), 2),
		H: () => _pad(f.G(), 2),
		i: () => _pad(jsdate.getMinutes(), 2),
		s: () => _pad(jsdate.getSeconds(), 2),
		u: () => _pad(jsdate.getMilliseconds() * 1000, 6),
		e: () =>
		{
			let msg = 'Not supported (see source code of date() for timezone on how to add support)'
			throw new Error(msg)
		},
		I: () =>
		{
			let a: any = new Date(f.Y(), 0);
			let	c: any = Date.UTC(f.Y(), 0);
			let	b: any = new Date(f.Y(), 6);
			let	d: any = Date.UTC(f.Y(), 6);

			return ((a - c) !== (b - d)) ? 1 : 0;
		},
		O: () =>
		{
			let tzo = jsdate.getTimezoneOffset(),
				a = Math.abs(tzo);

			return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
		},
		P: () =>
		{
			let O = f.O();

			return (O.substr(0, 3) + ':' + O.substr(3, 2));
		},
		T: () => 'UTC',
		Z: () => -jsdate.getTimezoneOffset() * 60,
		c: () => 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb),
		r: () => 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb),
		U: () => jsdate / 1000 | 0
	};

	let _date = (format: any, timestamp: any): string =>
	{
		jsdate = (timestamp === undefined ? new Date()
			: (timestamp instanceof Date) ? new Date(timestamp)
			: new Date(timestamp * 1000)
		);

		return format.replace(formatChr, formatChrCb);
	};

	return _date(format, timestamp);
};