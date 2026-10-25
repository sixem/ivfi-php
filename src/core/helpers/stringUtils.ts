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
export const shortenString = (input: string, cutoff = 28, separator = ' .. '): string =>
{
	const characters = Array.from(input);
	if(characters.length <= cutoff) return input;
	const edge = Math.max(1, Math.floor((cutoff - separator.length) / 2));
	return characters.slice(0, edge).join('') + separator + characters.slice(-edge).join('');
};

export const hasControlCharacters = (input: string): boolean =>
{
	return Array.from(input).some(character => character.charCodeAt(0) < 32);
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