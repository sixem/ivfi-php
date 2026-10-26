/**
 * Gets the value of a table cell
 */
const getCellValue = (row: HTMLElement, index: number): string =>
{
	const cell = row.children.item(index);
	return cell?.getAttribute('data-raw') ?? cell?.textContent ?? '';
};

/**
 * Compares cell values (table sort)
 */
export const comparer = (index: number) =>
{
	/* Cache values for this sort so comparisons do not repeatedly query the DOM. */
	const values = new Map<HTMLElement, string>();
	const value = (row: HTMLElement): string =>
	{
		if(!values.has(row)) values.set(row, getCellValue(row, index));
		return values.get(row);
	};

	return (a: HTMLElement, b: HTMLElement): number =>
	{
		const valA = value(a),
			valB = value(b);

		return !isNaN(parseFloat(valA)) && Number.isFinite(Number(valA)) &&
			!isNaN(parseFloat(valB)) && Number.isFinite(Number(valB))
			? Number(valA) - Number(valB)
			: valA.localeCompare(valB);
	};
};