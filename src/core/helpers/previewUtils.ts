import { DOM } from './dom';

let timerVolumeIndicator: number | null = null;

/**
 * Shows the volume indicator when scrolling on a video preview
 */
export const showVolumeIndicator = (volume: number): void =>
{
	clearTimeout(timerVolumeIndicator);

	let container: HTMLElement = document.body.querySelector(':scope > div#indicatorPreviewVolume');

	/* Create text */
	const volumeText: string = (volume === 0 ? 'Muted': `Volume: ${volume}%`);

	if(!container)
	{
		/* Create element if non-existant */
		container = DOM.new('div', {
			id: 'indicatorPreviewVolume',
			text: volumeText
		});

		document.body.prepend(container);
	} else {
		container.textContent = volumeText;
	}

	/* Show element */
	setTimeout(() =>
	{
		DOM.style.set(container, {
			opacity: '1'
		});
	});

	/* Hide element */
	timerVolumeIndicator = window.setTimeout(() =>
	{
		DOM.style.set(container, {
			opacity: '0'
		});
	}, 2500);
};

/**
 * Sets the volume of a video preview
 */
export const setVideoVolume = (
	video: HTMLVideoElement,
	volume: number,
	indicator = true
): void =>
{
	if(!video) return;
	
	video.volume = Math.max(0, Math.min(1, volume));
	video.muted = video.volume === 0;
	if(indicator) showVolumeIndicator(Math.round(video.volume * 100));
};
