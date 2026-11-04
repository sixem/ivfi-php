import { isAutoplayMuted } from './media';
import { addOverlayItem } from '../modules/overlay-stack';
import { onPageReplace } from '../modules/lifecycle';

let timerVolumeIndicator: number = null;
let volumeIndicator: HTMLDivElement = null;
let showVolume: (visible: boolean) => void = null;

/** Show the chosen video volume alongside other page indicators. */
export const showVolumeIndicator = (volume: number, blocked = false): void =>
{
	clearTimeout(timerVolumeIndicator);
	if(!volumeIndicator)
	{
		volumeIndicator = document.createElement('div');
		volumeIndicator.id = 'indicatorPreviewVolume';
		volumeIndicator.setAttribute('role', 'status');
		showVolume = addOverlayItem(volumeIndicator);
		onPageReplace(() =>
		{
			clearTimeout(timerVolumeIndicator);
			volumeIndicator = null;
			showVolume = null;
		});
	}
	volumeIndicator.textContent = volume === 0 ? 'Muted' : `Volume: ${volume}%${blocked ? ' · Click to enable sound' : ''}`;
	showVolume(true);
	timerVolumeIndicator = window.setTimeout(() => showVolume(false), 2500);
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
	// Wheel events do not grant user activation. Keep muted playback moving until a real gesture.
	const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
	const blocked = isAutoplayMuted(video) && activation?.hasBeenActive === false;
	video.muted = video.volume === 0 || blocked;
	if(indicator) showVolumeIndicator(Math.round(video.volume * 100), blocked);
};
