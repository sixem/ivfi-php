/** Formats bytes using the configured size units */
export const getReadableSize = (format: string[], bytes = 0, maximumFractionDigits = 2): string =>
{
	let unit = 0;
	while(bytes >= 1024 && unit < format.length - 1)
	{
		bytes /= 1024;
		unit++;
	}
	return bytes.toLocaleString(undefined, { maximumFractionDigits }) + format[unit];
};
