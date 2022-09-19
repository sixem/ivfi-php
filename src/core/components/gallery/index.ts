/** Config */
import { config, user } from '../../config/config';
import data from '../../config/data';
/** Classes */
import galleryClass from '../../classes/gallery';
/** Helpers */
import { applyNested, checkNested } from '../../helpers';
/** Modules */
import { eventHooks } from '../../modules/event-hooks';
import { log } from '../../modules/logger';

/** Types */
import {
	MComponentGallery
} from '../../types';

export class componentGallery
{
	constructor()
	{
		return this;
	}

	private setOptions = (
		source: MComponentGallery.TOptions,
		values: Array<any>): MComponentGallery.TOptions =>
	{
		values.forEach((data: [string, string]) =>
		{
			const key = data.shift();

			source[key] = config.get(data[0]);
		});

		return source;
	}

	public load = (index = 0): void | boolean =>
	{
		if(!config.get('gallery.enabled'))
		{
			return false;
		} else {
			log('gallery', 'loadIndex', index);
		}

		/* Create video data (from preview) */
		const video: MComponentGallery.TVideoPreviewData = {
			continue: {},
			preview: document.body.querySelector(
				':scope > div.preview-container > video'
			),
		};

		/* Get video source */
		video.source = video.preview ? video.preview.querySelector('source') : null;

		if(video.source)
		{
			/* If source is present, get source and current time */
			video.continue.src = video.source.getAttribute('src');
			video.continue.time = video.preview.currentTime;
		} else {
			video.continue = null;
		}

		/* If a gallery instance is already active, then show it */
		if(data.instances.gallery)
		{
			/* Pass continue timestamp from preview to gallery instance */
			(data.instances.gallery).options.continue.video = video.continue;

			/* Get table items */
			const items = data.sets.refresh
				? data.components.main.getTableItems()
				: null;

			data.sets.refresh = false;
			data.sets.preview.video = null;

			if(items !== null && items.length === 0)
			{
				return false;
			} else {
				data.instances.gallery.show(
					true, index === null
						? data.instances.gallery.data.selected.index
						: index, items
				);
			}

			return;
		}

		/* Set gallery options and start a new instance */
		let client = user.get();

		let options: MComponentGallery.TOptions = {};

		/* Check if list state is saved */
		const hasStoredListState = Object.prototype.hasOwnProperty.call(client.gallery, 'listState');

		/* Set list state */
		const listState = hasStoredListState ? client.gallery.listState : 1;

		/* Set start index */
		options.start = index === null ? 0 : index;

		/* Set options */
		options = this.setOptions(options, [
			['console', 'debug'],
			['mobile', 'mobile'],
			['encodeAll', 'encodeAll'],
			['performance', 'performance'],
			['sharpen', 'gallery.imageSharpen'],
			['scrollInterval', 'gallery.scrollInterval']
		]);

		/* Set defaults */
		const defaults = {
			reverseOptions : ['gallery', 'reverseOptions'],
			fitContent : ['gallery', 'fitContent'],
			autoplay : ['gallery', 'autoplay'],
			volume : ['gallery', 'volume']
		};

		Object.keys(defaults).forEach((key) =>
		{
			applyNested(
				options,
				key,
				client,
				(config.data).gallery[defaults[key][1]],
				defaults[key][0],
				defaults[key][1]
			);
		});

		options.list = {
			show: (listState == null ? true : (listState ? true : false))
		};

		/* Get list alignment */
		if(checkNested(client, 'gallery', 'listAlignment'))
		{
			options.list.reverse = (client.gallery.listAlignment === 0 ? false : true);
		} else {
			options.list.reverse = false;
		}

		options.continue = {
			video: video.continue
		};

		/* Get table items marked as media */
		const items = data.components.main.getTableItems();

		/* Initiate new `galleryClass` */
		const instance = new galleryClass(items, Object.assign(options));

		/* Store instance to variable */
		data.instances.gallery = instance;

		if(instance)
		{
			/* Listen to gallery `volumeChange` event */
			eventHooks.subscribe('galleryVolumeChange', 'volumeWatcher', (volume: number) =>
			{
				client = user.get();
				client.gallery.volume = volume;

				user.set(client);

			});
		}
	}
}