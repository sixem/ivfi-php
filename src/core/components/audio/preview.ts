import { AudioCard } from './card';
import { identifyExtension, stripUrl } from '../../helpers/stringUtils';
import type { TExtensionArray } from '../../types';

type PreviewOptions = {
	extensions: TExtensionArray;
	delay: number;
	volume: () => number;
	available: () => boolean;
	onVolumeChange: (volume: number) => void;
	onActive: (card: AudioCard | null) => void;
	onExpand?: (anchor: HTMLAnchorElement) => void;
};

/** An anchored, interactive preview with one delegated listener per table. */
export class AudioPreview
{
	private readonly listeners = new AbortController();
	private card: AudioCard = null;
	private anchor: HTMLAnchorElement = null;
	private overlay: HTMLDivElement = null;
	private showTimer = 0;
	private hideTimer = 0;
	private readonly visibility: MutationObserver;

	constructor(table: HTMLElement, private readonly options: PreviewOptions)
	{
		const signal = this.listeners.signal;
		table.addEventListener('pointerover', event =>
		{
			const anchor = (event.target as Element).closest<HTMLAnchorElement>('a.preview');
			if(anchor && anchor === this.anchor)
			{
				clearTimeout(this.hideTimer);
				if(!this.card)
				{
					clearTimeout(this.showTimer);
					this.showTimer = window.setTimeout(() => this.show(anchor), Math.max(0, options.delay || 0));
				}
				return;
			}
			if(!anchor || identifyExtension(stripUrl(anchor.getAttribute('href')), options.extensions)?.[1] !== 2)
			{
				if(anchor && this.anchor) this.hide();
				return;
			}
			this.hide();
			if(!options.available()) return;
			this.anchor = anchor;
			this.showTimer = window.setTimeout(() => this.show(anchor), Math.max(0, options.delay || 0));
		}, { signal });
		table.addEventListener('pointerout', event =>
		{
			if(!this.anchor?.contains(event.target as Node) || this.anchor.contains(event.relatedTarget as Node)) return;
			if(this.overlay?.contains(event.relatedTarget as Node)) return;
			this.scheduleHide();
		}, { signal });
		window.addEventListener('scroll', event =>
		{
			if(!this.overlay?.contains(event.target as Node)) this.hide();
		}, { signal, capture: true, passive: true });
		window.addEventListener('resize', () => this.hide(), { signal, passive: true });
		document.addEventListener('keydown', event =>
		{
			if(event.key === 'Escape' && this.card)
			{
				if(this.overlay.contains(document.activeElement)) this.anchor?.focus();
				this.hide();
			}
		}, { signal });
		this.visibility = new MutationObserver(() => { if(!options.available()) this.hide(); });
		this.visibility.observe(document.documentElement, { attributes: true, attributeFilter: ['gallery-is-visible', 'dialog-is-visible', 'context-menu-is-visible'] });
	}

	private show = (anchor: HTMLAnchorElement): void =>
	{
		if(this.anchor !== anchor || !anchor.isConnected || !this.options.available()) return;
		this.card = new AudioCard({
			src: anchor.href,
			name: anchor.closest('td')?.getAttribute('data-raw') || anchor.textContent.trim(),
			volume: this.options.volume(),
			bytes: Number(anchor.closest('tr')?.children[2]?.getAttribute('data-raw')),
			onExpand: this.options.onExpand ? () => this.options.onExpand(anchor) : undefined
		});
		this.card.onVolumeChange = this.options.onVolumeChange;
		this.card.onError = () => this.options.onActive(null);
		this.options.onActive(this.card);
		const overlay = this.overlay = document.createElement('div');
		overlay.className = 'audioPreview';
		overlay.append(this.card.element);
		overlay.addEventListener('pointerenter', () => clearTimeout(this.hideTimer));
		overlay.addEventListener('pointerleave', event =>
		{
			if(!anchor.contains(event.relatedTarget as Node)) this.scheduleHide();
		});
		overlay.addEventListener('focusin', () => clearTimeout(this.hideTimer));
		overlay.addEventListener('focusout', event =>
		{
			if(!overlay.contains(event.relatedTarget as Node)) this.scheduleHide();
		});
		document.body.append(overlay);
		const row = anchor.getBoundingClientRect();
		const bounds = overlay.getBoundingClientRect();
		const left = row.right + 12 + bounds.width <= innerWidth - 12 ? row.right + 12 : row.left - bounds.width - 12;
		overlay.style.left = `${Math.max(12, Math.min(left, innerWidth - bounds.width - 12))}px`;
		overlay.style.top = `${Math.max(12, Math.min(row.top, innerHeight - bounds.height - 12))}px`;
		void this.card.play(true);
	}

	private scheduleHide = (): void =>
	{
		clearTimeout(this.showTimer);
		clearTimeout(this.hideTimer);
		this.hideTimer = window.setTimeout(() =>
		{
			if(!this.overlay?.contains(document.activeElement) || !document.activeElement.matches(':focus-visible')) this.hide();
		}, 240);
	}

	public has = (src: string): boolean =>
		!!this.card && !!src && this.anchor?.href === new URL(src, document.baseURI).href;

	public take = (src: string, parent: HTMLElement): AudioCard =>
	{
		if(!this.has(src)) return null;
		const card = this.card;
		const playing = !card.media.paused;
		card.onError = null;
		this.card = null;
		/* Move the live element before removing its old parent. */
		parent.append(card.element);
		this.hide();
		if(playing) void card.play();
		return card;
	}

	public hide = (): void =>
	{
		clearTimeout(this.showTimer);
		clearTimeout(this.hideTimer);
		this.options.onActive(null);
		this.card?.dispose();
		this.card = null;
		this.anchor = null;
		this.overlay?.remove();
		this.overlay = null;
	}

	public destroy = (): void =>
	{
		this.hide();
		this.listeners.abort();
		this.visibility.disconnect();
	}
}
