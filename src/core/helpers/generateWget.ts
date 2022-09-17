/**
 * Scans the table for available extensions, then
 * generates a `wget` command to download them specifically
 */
export const generateWget = (table: HTMLElement): string =>
{
	const url: string = window.location.href;
	const extensions: Array<string> = [];

	table.querySelectorAll('tr.file:not(.filtered) > td:first-child > a').forEach((element: HTMLElement): void =>
	{
		const extension = element.textContent.split('.').pop().toLowerCase().trim();
		if(!extensions.includes(extension)) extensions.push(extension);
	});

	return `wget -r -np -nH -nd -e robots=off --accept "${extensions.join(',')}" "${url}"`;
};