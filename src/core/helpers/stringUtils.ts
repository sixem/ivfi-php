import {
	TExtensionArray
} from '../types';

/**
 * Capitalizes an input
 */
export const capitalize = (input: string): string =>
{
	return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * Shortens a string
 */
export const shortenString = (input: string, cutoff: number): string =>
{
	cutoff = cutoff || 28;

	if(input.length > cutoff)
	{
		return [
			input.substring(0, Math.floor((cutoff / 2) - 2)),
			input.substring(input.length - (Math.floor((cutoff / 2) - 2)), input.length)
		].join(' .. ');
	} else {
		return input;
	}
};

/**
* Identifies extension
*/
export const identifyExtension = (
	url: string,
	extensions: TExtensionArray = {
		image: [],
		video: []
	}
): Array<string | number> | null =>
{
	const extension = (url).split('.').pop().toLowerCase();

	if(extensions.image.includes(extension))
	{
		return [extension, 0];

	} else if(extensions.video.includes(extension))
	{
		return [extension, 1];
	}

	return null;
};

/**
 * Strips `?` and anything that follows from a URL
 */
export const stripUrl = (url: string): string =>
{
	return !url.includes('?') ? url: url.split('?')[0];
};