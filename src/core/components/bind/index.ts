/** Config */
import { config } from '../../config/config';
import data from '../../config/data';
/** Modules */
import { eventHooks } from '../../modules/event-hooks';
import { DOM, setVideoVolume } from '../../helpers';
import { playVideo } from '../../helpers/media';
import { log } from '../../modules/logger';

/** Constants */
import { Keys, StorageKey } from '../../constant';

const events: {
	handleTopBarVisibility?: () => void;
	handleBaseScroll?: () => void;
	handlePreviewScroll?: (event: WheelEvent) => void
} = {};

const selector = data.instances.selector;

const scrollData: {
	break: boolean;
	save: null | number;
} = {
	break: false,
	save: null
};

let debounceTimer = null;

/* Scroll events to listen to */
const scrollEvents: Array<string> = ['DOMMouseScroll', 'mousewheel', 'wheel'];

/* Called `onScroll` — Shows or hides the current path in the top bar */
events.handleTopBarVisibility = (): void =>
{
	const path = selector.use('PATH') as HTMLElement;
	const topBar = document.body.querySelector(':scope > div.topBar') as HTMLElement;
	let top = topBar.querySelector<HTMLElement>(':scope > div.directoryInfo > div.quickPath');

	/* Reuse the path element for visibility transitions */
	if(!top)
	{
		top = DOM.new('div', {
			'class': 'quickPath',
			'data-view': 'desktop'
		});
		top.innerHTML = path.innerHTML;
		topBar.querySelector(':scope > div.directoryInfo').append(top);
	}

	const visible = path.getBoundingClientRect().bottom <= topBar.getBoundingClientRect().bottom;
	top.classList.toggle('visible', visible);
	top.setAttribute('aria-hidden', String(!visible));
	top.toggleAttribute('inert', !visible);
};

events.handlePreviewScroll = (event: WheelEvent): void =>
{
	if(data.scrollLock && !scrollData.break)
	{
		if(event.deltaY && Math.abs(event.deltaY) !== 0)
		{
			const step: 5 | 2 | 1 = data.preview.volume >= 50 ? 5 : (data.preview.volume > 5 ? 2 : 1);
			
			if(event.deltaY < 0)
			{
				/* Scroll up - increase volume */
				data.preview.volume = data.preview.volume + step;

				if(data.preview.volume > 100)
				{
					data.preview.volume = 100;
				}
			} else if(event.deltaY > 0)
			{
				/* Scroll down - lower volume */
				data.preview.volume = data.preview.volume + -Math.abs(step);

				if(data.preview.volume < 0)
				{
					data.preview.volume = 0;
				}
			}

			clearTimeout(scrollData.save);

			scrollData.save = window.setTimeout((): void =>
			{
				localStorage.setItem(`${StorageKey}.previewVolume`, data.preview.volume.toString());
			}, 100);

			log('main', 'data.previewVolume', data.preview.volume, data.preview.data);

			if(data.preview.data &&
				data.preview.data.element &&
				data.preview.data.audible &&
				data.preview.data.type === 'VIDEO')
			{
				const video = data.preview.data.element as HTMLVideoElement;
				setVideoVolume(video, data.preview.volume / 100);
				void playVideo(video, true, () => data.preview.data?.element === video);
			}
		}

		scrollData.break = true;

		setTimeout(() => scrollData.break = false, 25);
	}

	if(data.scrollLock)
	{
		event.preventDefault();
	}
};

const onDebounce = (): void =>
{
	events.handleTopBarVisibility();

	if(data.instances.optimize.main.enabled)
	{
		data.instances.optimize.main.attemptRefresh();
	}
};

/**
 * Handles scroll events
 */
events.handleBaseScroll = (): void =>
{
	clearTimeout(debounceTimer);

	debounceTimer = setTimeout(() => onDebounce(), 100);

	if(data.instances.optimize.main.enabled)
	{
		/* Get scrolled position */
		const scrolled = window.scrollY;

		/* Trigger optimization refresh if `175px` has been scrolled */
		if(Math.abs(scrolled - data.layer.main.scrolledY) > 175)
		{
			data.instances.optimize.main.attemptRefresh();
		}
	}
};

export class componentBind
{
	constructor()
	{
		return this;
	}

	/**
	 * Unbind events — Recalled on gallery show
	 */
	unbind = () =>
	{
		eventHooks.unlisten(window, 'keydown', 'mainKeyDown');
	}

	/**
	 * Bind events — Recalled on gallery close
	 */
	load = () =>
	{
		eventHooks.listen(window, 'keydown', 'mainKeyDown', (event: KeyboardEvent) =>
		{
			if(document.documentElement.hasAttribute('dialog-is-visible')
				|| document.documentElement.hasAttribute('context-menu-is-visible')
				|| document.documentElement.hasAttribute('gallery-is-visible')) return;

			if(config.get('selection.enabled') !== false
				&& (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey
				&& event.key.toLowerCase() === 'a')
			{
				const target = event.target;
				if(event.defaultPrevented || event.isComposing || (target instanceof HTMLElement
					&& (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]')))) return;
				event.preventDefault();
				window.getSelection()?.removeAllRanges();
				data.components.main.selection.selectAll();
				return;
			}

			/* Show filter */
			if(event.shiftKey && event.code === Keys.f)
			{
				event.preventDefault();
				data.components.filter.toggle();

			/* Dismiss overlays before clearing selection */
			} else if(event.code === Keys.escape)
			{
				data.components.main.overlay.hide((state: boolean) =>
				{
					if(state === true) event.preventDefault();
				});
			/* Show gallery */
			} else if(event.code === Keys.g)
			{
				if(config.get('gallery.enabled') === true)
				{
					const container: HTMLElement = document.body.querySelector(':scope > div.filterContainer');

					if(container.style.display === 'none'
						|| !(document.activeElement === container.querySelector('input')))
					{
						data.components.gallery.load(null);
					}
				}
			}
		});

		/* Create non-passive scrolling listeners directly */
		(scrollEvents).forEach((event) =>
		{
			eventHooks.listen(window, event, 'handlePreviewScroll', events.handlePreviewScroll, {
				options: {
					passive: false
				}
			});
		});

		/* Create non-passive `scroll` listener directly */
		eventHooks.listen(window, 'scroll', 'handleBaseScroll', events.handleBaseScroll, {
			options: {
				passive: false
			}
		});

		events.handleTopBarVisibility();
	}
}
