/**
 * Checks if a value is numeric
 */
export const isNumeric = (n: any): boolean =>
{
	return !isNaN(parseFloat(n)) && isFinite(n);
};