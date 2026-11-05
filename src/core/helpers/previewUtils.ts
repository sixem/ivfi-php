import { isAutoplayMuted } from './media';
import { addOverlayItem } from '../modules/overlay-stack';
import { onPageReplace } from '../modules/lifecycle';

let blockedVideo: HTMLVideoElement = null;
let showSoundPrompt: (visible: boolean) => void = null;

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
		const prompt = document.createElement('div');
		prompt.id = 'indicatorPreviewSound';
		prompt.setAttribute('role', 'status');
		prompt.textContent = 'Click to enable sound';
		showSoundPrompt = addOverlayItem(prompt);
		onPageReplace(() =>
		{
			clearTimeout(timerVolumeIndicator);
			volumeIndicator = null;
			showVolume = null;
			showSoundPrompt = null;
			blockedVideo = null;
		});
	}
	volumeIndicator.textContent = volume === 0 ? 'Muted' : `Volume: ${volume}%`;
	showVolume(true);
	showSoundPrompt(blocked && volume > 0);
	if(!blocked || volume === 0) blockedVideo = null;
	timerVolumeIndicator = window.setTimeout(() => {
		showVolume(false);
		showSoundPrompt(false);
		blockedVideo = null;
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
	// Wheel events do not grant user activation. Keep muted playback moving until a real gesture.
	const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
	const blocked = isAutoplayMuted(video) && activation?.hasBeenActive === false;
	video.muted = video.volume === 0 || blocked;
	if(indicator)
	{
		blockedVideo = blocked && video.volume > 0 ? video : null;
		showVolumeIndicator(Math.round(video.volume * 100), blocked);
	}
};

export function hasPreviewSoundPrompt(video: HTMLVideoElement): boolean
{
	return !!video && blockedVideo === video && video.isConnected;
}

/** Consume only an ordinary click on the preview whose sound prompt is active. */
export function enablePreviewSound(event: MouseEvent, video: HTMLVideoElement): boolean
{
	if(!hasPreviewSoundPrompt(video) || event.button !== 0
		|| event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return false;
	event.preventDefault();
	event.stopImmediatePropagation();
	video.muted = false;
	void video.play().then(() =>
	{
		if(blockedVideo === video) showVolumeIndicator(Math.round(video.volume * 100));
	}).catch(() =>
	{
		if(!hasPreviewSoundPrompt(video)) return;
		video.muted = true;
		if(blockedVideo === video) showVolumeIndicator(Math.round(video.volume * 100), true);
		void video.play().catch(() => {});
	});
	return true;
}
