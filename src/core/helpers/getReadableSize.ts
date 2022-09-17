/**
 * Gets the readable size of a byte integer
 */
export const getReadableSize = (format: Array<string>, bytes = 0): string =>
{
	/* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

	if(bytes === 0) return `0.00${format[0]}`;

	let i = 0;

	do {
		bytes = bytes / 1024; i++;
	} while (bytes > 1024);

	return Math.max(bytes, 0.1).toFixed(i < 2 ? 0: 2) + format[i];
};