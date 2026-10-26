export function loadImage(src: string, signal?: AbortSignal): Promise<HTMLImageElement>
{
	return new Promise((resolve, reject) =>
	{
		const image = new Image();
		let settled = false;
		const cleanup = () =>
		{
			image.onload = null;
			image.onerror = null;
			signal?.removeEventListener('abort', abort);
		};
		const fail = (error: unknown) =>
		{
			if(settled) return;
			settled = true;
			cleanup();
			image.removeAttribute('src');
			reject(error);
		};
		const abort = () => fail(new DOMException('Image loading cancelled.', 'AbortError'));
		const ready = () =>
		{
			if(settled) return;
			settled = true;
			cleanup();
			resolve(image);
		};
		image.onload = () =>
		{
			if(typeof image.decode === 'function') image.decode().then(ready, fail);
			else ready();
		};
		image.onerror = () => fail(new Error(`Failed to load image URL: ${src}`));
		signal?.addEventListener('abort', abort, { once: true });
		if(signal?.aborted) abort();
		else image.src = src;
	});
}

export function releaseMedia(element: HTMLImageElement | HTMLVideoElement): void
{
	if(element instanceof HTMLVideoElement)
	{
		element.pause();
		element.removeAttribute('src');
		element.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
		element.load();
	} else element.removeAttribute('src');
	element.remove();
}

export async function playVideo(video: HTMLVideoElement, mutedFallback = false, isCurrent?: () => boolean): Promise<void>
{
	try
	{
		await video.play();
	} catch(error)
	{
		if(mutedFallback && (!isCurrent || isCurrent()) && error instanceof DOMException && error.name === 'NotAllowedError'
			&& !video.muted && video.isConnected && video.currentSrc)
		{
			video.muted = true;
			try { await video.play(); } catch { return; }
		}
	}
}
