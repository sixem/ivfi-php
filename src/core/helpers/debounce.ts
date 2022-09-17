/**
 * Debounce function for quick-firing events like window resize
 */
export const debounce = (f: () => void): ((e: Event) => void) =>
{
	let timer: number | null = null;

	return (e: Event) =>
	{
		if(timer)
		{
			clearTimeout(timer);
		}

		timer = window.setTimeout(f, 100, e);
	};
};