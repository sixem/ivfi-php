import { createIcon } from '../../icons';
import { releaseMedia } from '../../helpers/media';
import { downloadFile } from '../../modules/file-actions';
import '../../../css/audio.scss';

type AudioOptions = {
	src: string;
	name: string;
	volume: number;
	startTime?: number;
	bytes?: number;
	onExpand?: () => void;
};

export const formatAudioTime = (seconds: number): string =>
{
	if(!Number.isFinite(seconds) || seconds < 0) return '–:––';
	const whole = Math.floor(seconds);
	const minutes = Math.floor(whole / 60);
	return `${minutes >= 60 ? `${Math.floor(minutes / 60)}:` : ''}${minutes >= 60 ? String(minutes % 60).padStart(2, '0') : minutes}:${String(whole % 60).padStart(2, '0')}`;
};

/** One media element and audio graph survive the move from preview to gallery. */
export class AudioCard
{
	public readonly element = document.createElement('section');
	public readonly media = document.createElement('audio');
	public onVolumeChange: (volume: number) => void;
	public onError: () => void;
	private readonly listeners = new AbortController();
	private readonly canvas: HTMLCanvasElement;
	private readonly context: CanvasRenderingContext2D;
	private readonly playButton: HTMLButtonElement;
	private readonly muteButton: HTMLButtonElement;
	private readonly seekInput: HTMLInputElement;
	private readonly volumeInput: HTMLInputElement;
	private readonly elapsed: HTMLElement;
	private readonly duration: HTMLElement;
	private readonly status: HTMLElement;
	private readonly download: HTMLButtonElement;
	private readonly expand: HTMLButtonElement;
	private readonly bitrate: HTMLElement;
	private readonly resize: ResizeObserver;
	private audioContext: AudioContext = null;
	private source: MediaElementAudioSourceNode = null;
	private analyser: AnalyserNode = null;
	private frequencies: Uint8Array = null;
	private bins: number[] = [];
	private readonly levels = new Float32Array(64);
	private readonly magnitudes = new Float32Array(64);
	private peak = 0;
	private stroke: CanvasGradient = null;
	private frame = 0;
	private lastFrame = 0;
	private width = 0;
	private height = 0;
	private scrubbing = false;
	private disposed = false;
	private waiting = false;
	private playRequest = 0;
	private autoplayMuted = false;
	private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

	constructor(private readonly options: AudioOptions)
	{
		const root = this.element;
		root.className = 'audioCard';
		root.setAttribute('aria-label', options.name);
		root.innerHTML = `<header class="audioHeading"><span class="audioName"></span><span class="audioBitrate" hidden></span><button type="button" class="audioExpand" aria-label="Open in gallery" hidden></button></header>
			<canvas class="audioSpectrum" aria-hidden="true"></canvas>
			<input class="audioSeek" type="range" min="0" max="1" step="0.01" value="0" aria-label="Seek audio" disabled>
			<div class="audioControls"><button type="button" class="audioPlay" aria-label="Play audio"></button><div class="audioTimes"><span class="audioElapsed">0:00</span><span class="audioTimeSeparator" aria-hidden="true">/</span><span class="audioDuration">–:––</span></div><span class="audioStatus" role="status">Loading audio…</span><button type="button" class="audioDownload" hidden>Download</button><button type="button" class="audioMute" aria-label="Mute audio"></button><input class="audioVolume" type="range" min="0" max="1" step="0.01" aria-label="Audio volume"></div>`;
		root.querySelector('.audioName').textContent = options.name;
		this.canvas = root.querySelector('canvas');
		this.context = this.canvas.getContext('2d');
		this.playButton = root.querySelector('.audioPlay');
		this.muteButton = root.querySelector('.audioMute');
		this.seekInput = root.querySelector('.audioSeek');
		this.volumeInput = root.querySelector('.audioVolume');
		this.elapsed = root.querySelector('.audioElapsed');
		this.duration = root.querySelector('.audioDuration');
		this.status = root.querySelector('.audioStatus');
		this.download = root.querySelector('.audioDownload');
		this.expand = root.querySelector('.audioExpand');
		this.bitrate = root.querySelector('.audioBitrate');
		this.playButton.append(createIcon('play'));
		this.muteButton.append(createIcon('volume'));
		this.expand.append(createIcon('expand'));
		this.expand.hidden = !options.onExpand;
		this.media.preload = 'metadata';
		this.media.hidden = true;
		this.media.volume = Math.max(0, Math.min(1, options.volume));
		root.append(this.media);
		const listen = (target: EventTarget, type: string, listener: (event: Event) => void) =>
			target.addEventListener(type, listener, { signal: this.listeners.signal });
		listen(this.playButton, 'click', () => this.toggle());
		listen(this.expand, 'click', () => this.options.onExpand?.());
		listen(this.download, 'click', () => downloadFile(options.src, options.name));
		listen(this.muteButton, 'click', () =>
		{
			this.autoplayMuted = false;
			if(!this.media.paused) this.resumeAnalysis();
			if(this.media.volume === 0) { this.media.volume = 0.25; this.media.muted = false; }
			else this.media.muted = !this.media.muted;
		});
		listen(this.volumeInput, 'input', () =>
		{
			const blocked = this.autoplayMuted;
			this.autoplayMuted = false;
			if(!this.media.paused) this.resumeAnalysis();
			this.media.volume = Number(this.volumeInput.value);
			this.media.muted = this.media.volume === 0;
			if(blocked) void this.play();
		});
		listen(this.seekInput, 'input', () =>
		{
			this.scrubbing = true;
			this.updateTime(Number(this.seekInput.value));
		});
		listen(this.seekInput, 'change', () =>
		{
			this.seek(Number(this.seekInput.value));
			this.scrubbing = false;
			this.updateTime();
		});
		listen(this.seekInput, 'blur', () => { this.scrubbing = false; this.updateTime(); });
		for(const type of ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'])
			listen(this.media, type, () => this.updateTime());
		for(const type of ['loadedmetadata', 'durationchange']) listen(this.media, type, () => this.updateBitrate());
		this.media.addEventListener('loadedmetadata', () =>
		{
			if(options.startTime > 0) this.seek(options.startTime);
			this.updateState();
		}, { once: true, signal: this.listeners.signal });
		listen(this.media, 'play', () => { this.updateState(); this.startFrames(); });
		listen(this.media, 'playing', () => { this.waiting = false; this.updateState(); this.startFrames(); });
		listen(this.media, 'waiting', () => { this.waiting = true; this.updateState(); this.stopFrames(); });
		for(const type of ['pause', 'ended']) listen(this.media, type, () =>
		{
			this.playRequest++;
			this.waiting = false;
			this.stopFrames();
			this.updateTime();
			this.updateState();
			void this.audioContext?.suspend().catch(() => {});
		});
		listen(this.media, 'error', () =>
		{
			this.stopFrames();
			this.status.textContent = 'Audio unavailable';
			root.classList.add('audioError');
			this.bitrate.hidden = true;
			this.onError?.();
			this.download.hidden = false;
			this.playButton.disabled = true;
			this.seekInput.disabled = true;
		});
		listen(this.media, 'volumechange', () =>
		{
			this.updateVolume();
			this.updateState();
			/* Browser autoplay fallback must not overwrite the saved volume. */
			this.onVolumeChange?.(this.media.muted && !this.autoplayMuted ? 0 : this.media.volume);
		});
		listen(document, 'visibilitychange', () => document.hidden ? this.stopFrames() : this.startFrames());
		listen(window, 'pagehide', () => this.pause());
		listen(this.reducedMotion, 'change', () => { this.stopFrames(); this.startFrames(); this.draw(); });
		/* Native range/button keys must not seek or navigate the gallery as well. */
		for(const type of ['keydown', 'keyup']) listen(root, type, (event: KeyboardEvent) =>
		{
			if(event.key !== 'Escape') event.stopPropagation();
		});
		listen(root, 'swiped', event => event.stopPropagation());
		listen(root, 'wheel', event =>
		{
			if(root.classList.contains('audioCardGallery')) event.stopPropagation();
		});
		this.resize = new ResizeObserver(() => this.measure());
		this.resize.observe(this.canvas);
		this.updateVolume();
		this.media.src = options.src;
	}

	public setGallery = (): void =>
	{
		// Opening a preview is an explicit activation, including while its autoplay is pending.
		this.playRequest++;
		this.restoreAutoplayVolume();
		this.element.classList.add('audioCardGallery');
		this.expand.hidden = true;
		this.options.onExpand = undefined;
		this.updateBitrate();
	}

	private restoreAutoplayVolume = (): void =>
	{
		if(!this.autoplayMuted) return;
		this.autoplayMuted = false;
		this.media.muted = false;
		this.updateVolume();
		this.updateState();
	}

	private resumeAnalysis = (): void =>
	{
		/* The graph is optional; cross-origin files still play without CORS analysis. */
		if(!this.audioContext && typeof AudioContext !== 'undefined'
			&& new URL(this.options.src, document.baseURI).origin === location.origin)
		{
			try
			{
				this.audioContext = new AudioContext();
				this.analyser = this.audioContext.createAnalyser();
				this.analyser.fftSize = 2048;
				this.analyser.minDecibels = -88;
				this.analyser.maxDecibels = -20;
				this.analyser.smoothingTimeConstant = 0.6;
				this.frequencies = new Uint8Array(this.analyser.frequencyBinCount);
				this.bins = Array.from({ length: this.levels.length + 1 }, (_, i) => Math.min(this.frequencies.length - 1,
					Math.max(1, Math.round(50 * Math.pow(12000 / 50, i / this.levels.length)
						* this.analyser.fftSize / this.audioContext.sampleRate))));
				this.source = this.audioContext.createMediaElementSource(this.media);
				this.source.connect(this.analyser);
				this.analyser.connect(this.audioContext.destination);
			} catch {
				if(this.source) this.source.connect(this.audioContext.destination);
				this.analyser = null;
			}
		}
		void this.audioContext?.resume().catch(() => {});
	}

	public play = async (autoplay = false): Promise<void> =>
	{
		if(this.disposed || this.media.error) return;
		const request = ++this.playRequest;
		if(!autoplay) this.restoreAutoplayVolume();
		/* Do not route hover audio through a graph the browser has not unlocked. */
		const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
		if(!autoplay || activation?.hasBeenActive) this.resumeAnalysis();
		try
		{
			await this.media.play();
			if(!this.disposed && request === this.playRequest) this.startFrames();
		} catch(error) {
			if(this.disposed || request !== this.playRequest || (error instanceof DOMException && error.name === 'AbortError')) return;
			if(autoplay && error instanceof DOMException && error.name === 'NotAllowedError' && !this.media.muted)
			{
				this.autoplayMuted = true;
				this.media.muted = true;
				try { await this.media.play(); return; } catch { /* Keep the manual play control available. */ }
			}
			if(this.disposed || request !== this.playRequest) return;
			this.status.textContent = this.media.error ? 'Audio unavailable' : 'Press Play to start';
			this.updatePlayButton();
		}
	}

	public pause = (): void =>
	{
		this.playRequest++;
		this.media.pause();
		this.stopFrames();
	}

	public toggle = (): void => { if(this.media.paused) void this.play(); else this.pause(); }

	public setVolume = (volume: number): void =>
	{
		this.autoplayMuted = false;
		this.media.volume = Math.max(0, Math.min(1, volume));
		this.media.muted = this.media.volume === 0;
	}

	public seek = (seconds: number): void =>
	{
		if(!Number.isFinite(this.media.duration) || this.media.duration <= 0 || !Number.isFinite(seconds)) return;
		this.media.currentTime = Math.max(0, Math.min(this.media.duration, seconds));
	}

	private updatePlayButton = (): void =>
	{
		const paused = this.media.paused;
		this.playButton.setAttribute('aria-label', paused ? 'Play audio' : 'Pause audio');
		this.playButton.replaceChildren(createIcon(paused ? 'play' : 'pause'));
	}

	private updateState = (): void =>
	{
		if(this.media.error) return;
		this.updatePlayButton();
		this.status.textContent = this.waiting ? 'Buffering…' : !this.media.paused ? (this.autoplayMuted ? 'Muted' : 'Playing')
			: this.media.ended ? 'Finished' : this.media.readyState === 0 ? 'Loading audio…'
				: this.media.currentTime > 0 ? 'Paused' : 'Ready to play';
	}

	private updateVolume = (): void =>
	{
		const volume = this.media.muted && !this.autoplayMuted ? 0 : this.media.volume;
		this.volumeInput.value = String(volume);
		this.volumeInput.style.setProperty('--audio-progress', `${volume * 100}%`);
		const muted = this.media.muted || this.media.volume === 0;
		this.muteButton.replaceChildren(createIcon(muted ? 'volume-off' : 'volume'));
		this.muteButton.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
		this.muteButton.setAttribute('aria-pressed', String(muted));
	}

	private updateTime = (time = this.media.currentTime): void =>
	{
		const duration = this.media.duration;
		const available = Number.isFinite(duration) && duration > 0;
		this.seekInput.disabled = !available || !!this.media.error;
		if(available && this.seekInput.max !== String(duration)) this.seekInput.max = String(duration);
		const durationLabel = duration === Infinity ? 'Live' : formatAudioTime(duration);
		if(this.duration.textContent !== durationLabel) this.duration.textContent = durationLabel;
		if(this.scrubbing) time = Number(this.seekInput.value);
		else this.seekInput.value = String(time);
		const label = formatAudioTime(time);
		if(this.elapsed.textContent !== label) this.elapsed.textContent = label;
		const valueText = `${label} of ${durationLabel}`;
		if(this.seekInput.getAttribute('aria-valuetext') !== valueText) this.seekInput.setAttribute('aria-valuetext', valueText);
		this.seekInput.style.setProperty('--audio-progress', `${available ? time / duration * 100 : 0}%`);
	}

	private updateBitrate = (): void =>
	{
		// Reuse the listing's byte count; container overhead makes this an approximation.
		const kbps = Math.round(this.options.bytes * 8 / this.media.duration / 1000);
		const available = this.element.classList.contains('audioCardGallery') && !this.media.error
			&& Number.isFinite(kbps) && kbps > 0;
		this.bitrate.hidden = !available;
		this.bitrate.textContent = available ? `≈${kbps} kbps` : '';
		if(available) this.bitrate.setAttribute('aria-label', `Approximate average bitrate: ${kbps} kilobits per second`);
	}

	private measure = (): void =>
	{
		const bounds = { width: this.canvas.clientWidth, height: this.canvas.clientHeight };
		if(!bounds.width || !bounds.height) return;
		const ratio = Math.min(window.devicePixelRatio || 1, 2);
		this.width = bounds.width;
		this.height = bounds.height;
		this.canvas.width = Math.round(bounds.width * ratio);
		this.canvas.height = Math.round(bounds.height * ratio);
		this.context?.setTransform(ratio, 0, 0, ratio, 0, 0);
		if(this.context)
		{
			this.stroke = this.context.createLinearGradient(0, 0, this.width, 0);
			this.stroke.addColorStop(0, '#a584d600');
			this.stroke.addColorStop(0.15, '#a584d68c');
			this.stroke.addColorStop(0.6, '#887fe9b3');
			this.stroke.addColorStop(0.86, '#628ca58c');
			this.stroke.addColorStop(1, '#628ca500');
		}
		this.draw();
	}

	/** Fine, centered bars with quick attacks and a gentler release. */
	private draw = (): void =>
	{
		if(!this.context || !this.width) return;
		const context = this.context;
		if(this.analyser && !this.media.paused)
		{
			this.analyser.getByteFrequencyData(this.frequencies);
			let peak = 0;
			for(let i = 0; i < this.levels.length; i++)
			{
				const start = this.bins[i], end = Math.max(start + 1, this.bins[i + 1]);
				let total = 0;
				for(let bin = start; bin < end; bin++) total += this.frequencies[bin];
				const magnitude = total / (end - start) / 255;
				this.magnitudes[i] = magnitude;
				peak = Math.max(peak, magnitude);
			}
			/* Visual gain lifts quieter recordings without changing the listening volume.
			 * A slowly falling peak keeps the scale steady between beats; silence stays flat. */
			this.peak = Math.max(peak, this.peak * 0.98, 0.05);
			const gain = Math.min(8, 0.9 / this.peak);
			for(let i = 0; i < this.levels.length; i++)
			{
				const value = Math.min(1, Math.pow(this.magnitudes[i] * gain, 0.85));
				this.levels[i] += (value - this.levels[i]) * (value > this.levels[i] ? 0.55 : 0.24);
			}
		}
		context.clearRect(0, 0, this.width, this.height);
		const baseline = this.height / 2;
		const amplitude = this.height * 0.44;
		const barWidth = 3;
		const bars = Math.max(2, Math.round(this.width / 6));
		context.beginPath();
		for(let i = 0; i < bars; i++)
		{
			// Interpolate bands so the bars keep the same fine spacing at either card size.
			const position = i / (bars - 1) * (this.levels.length - 1);
			const band = Math.floor(position), next = Math.min(band + 1, this.levels.length - 1);
			const level = this.levels[band] + (this.levels[next] - this.levels[band]) * (position - band);
			const x = barWidth / 2 + i / (bars - 1) * (this.width - barWidth);
			const halfHeight = Math.max(0.01, level * amplitude);
			context.moveTo(x, baseline - halfHeight);
			context.lineTo(x, baseline + halfHeight);
		}
		context.strokeStyle = this.stroke;
		context.lineWidth = barWidth;
		context.lineCap = 'round';
		context.stroke();
	}

	private startFrames = (): void =>
	{
		if(this.frame || this.disposed || this.media.paused || this.waiting || document.hidden || this.reducedMotion.matches) return;
		const tick = (now: number) =>
		{
			const interval = 1000 / 30;
			if(now - this.lastFrame >= interval)
			{
				this.lastFrame = now - (now - this.lastFrame) % interval;
				this.draw();
				this.updateTime();
			}
			this.frame = requestAnimationFrame(tick);
		};
		this.frame = requestAnimationFrame(tick);
	}

	private stopFrames = (): void => { cancelAnimationFrame(this.frame); this.frame = 0; }

	public dispose = (): void =>
	{
		if(this.disposed) return;
		this.disposed = true;
		this.pause();
		this.listeners.abort();
		this.resize.disconnect();
		this.source?.disconnect();
		this.analyser?.disconnect();
		void this.audioContext?.close().catch(() => {});
		releaseMedia(this.media);
		this.element.remove();
	}
}
