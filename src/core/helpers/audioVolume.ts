import { StorageKey } from '../constant';

const key = `${StorageKey}.audioVolume`;

/** Audio has one saved volume across previews and the gallery, independent of video. */
export function getAudioVolume(): number
{
	let stored = localStorage.getItem(key);
	if(stored === null)
	{
		stored = localStorage.getItem(`${StorageKey}.previewVolume`) ?? '10';
		localStorage.setItem(key, stored);
	}
	const volume = Number(stored);
	return Number.isFinite(volume) && volume >= 0 && volume <= 100 ? volume / 100 : 0.1;
}

export function saveAudioVolume(volume: number): void
{
	localStorage.setItem(key, String(Math.round(volume * 100)));
}
