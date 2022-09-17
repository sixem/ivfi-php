/**
 * Gets the value of a table cell
 */
const getCellValue = (row: HTMLElement, index: number): any =>
{
	const attribute = row.querySelector(
		`td:nth-child(${index + 1})`
	).getAttribute('data-raw');

	return attribute !== undefined ? attribute: row.querySelector(
		`td:nth-child(${index + 1})`
	).textContent;
};

/**
 * Compares cell values (table sort)
 */
export const comparer = (index: number) =>
{
	return (a: HTMLElement, b: HTMLElement): any =>
	{
		const valA = getCellValue(a, index),
			valB = getCellValue(b, index);

		return !isNaN(parseFloat(valA)) && isFinite(valA) &&
			!isNaN(parseFloat(valB)) && isFinite(valB)
			? valA - valB
			: valA.localeCompare(valB);
	};
};