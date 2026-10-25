const cleanups = new Set<() => void>();

export function onPageReplace(cleanup: () => void): () => void
{
	const dispose = () =>
	{
		if(cleanups.delete(dispose)) cleanup();
	};
	cleanups.add(dispose);
	return dispose;
}

export function disposePage(): void
{
	for(const cleanup of cleanups) cleanup();
}
