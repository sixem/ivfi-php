/** Import `config`, `user` */
import {
	config,
	user
} from '../config/config';

/** Import `data` */
import data from '../config/data';

/** Import `galleryClass` */
import galleryClass from '../classes/gallery';

/** Import `applyNested`, `checkNested` */
import {
	applyNested,
	checkNested
} from '../modules/helpers';

const pipe = data.instances.pipe;

export default class componentGallery
{
	constructor()
	{
		return this;
	}

	setOptions = (source, values) =>
	{
		values.forEach((data) =>
		{
			let key = data.shift();

			source[key] = config.get(...data);
		});

		return source;
	}

	load = (index = 0) =>
	{
		if(!config.get('gallery.enabled'))
		{
			return false;
		} else {
			pipe('gallery.load =>', index);
		}

		let video = {
			continue : new Object(),
			preview : document.body.querySelector(':scope > div.preview-container > video'),
		};

		video.source = video.preview ? video.preview.querySelector('source') : null;

		if(video.source)
		{
			video.continue.src = video.source.getAttribute('src');
			video.continue.time = video.preview.currentTime;
		} else {
			video.continue = null;
		}

		/* If a gallery instance is already active, then show it */
		if(data.instances.gallery)
		{
			(data.instances.gallery).options.continue.video = video.continue;

			data.sets.preview.video = null;

			let items = data.sets.refresh ? data.components.main.getTableItems() : null;

			data.sets.refresh = false;

			if(items !== null && items.length === 0)
			{
				return false;

			} else {
				data.components.main.unbind();

				data.instances.gallery.show(
					true, index === null ? data.instances.gallery.data.selected.index : index, items
				);
			}

			return;
		}

		/* Set gallery options and start a new instance */
		let client = user.get();

		let options = new Object();

		/* Check if list state is saved */
		let hasStoredListState = Object.prototype.hasOwnProperty.call(client.gallery, 'listState');

		/* Set list state */
		let listState = hasStoredListState ? client.gallery.listState : 1;

		/* Set start index */
		options.start = index === null ? 0 : index;

		/* Set options */
		options = this.setOptions(options, [
			['console', 'debug'],
			['mobile', 'mobile'],
			['encodeAll', 'encodeAll'],
			['performance', 'performance'],
			['blur', 'gallery.blur'],
			['sharpen', 'gallery.imageSharpen'],
			['scrollInterval', 'gallery.scrollInterval']
		]);

		/* Set defaults */
		let defaults = {
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
			show : (listState == null ? true : (listState ? true : false))
		};

		if(checkNested(client, 'gallery', 'listAlignment'))
		{
			options.list.reverse = (client.gallery.listAlignment === 0 ? false : true);
		} else {
			options.list.reverse = false;
		}

		options.continue = {
			video : video.continue
		};

		/* Get table items marked as media */
		let items = data.components.main.getTableItems();

		/* Unbind main listeners */
		data.components.main.unbind();

		/* Initiate new `galleryClass` */
		let instance = new galleryClass(items, Object.assign(options, {
			pipe : pipe
		}));

		/* Store instance to variable */
		data.instances.gallery = instance;

		if(instance)
		{
			/* Listen to gallery `volumeChange` event */
			instance.listen('volumeChange', (volume) =>
			{
				client = user.get();

				client.gallery.volume = volume;

				user.set(client);

			});

			/* Listen to gallery `unbound` event */
			instance.listen('unbound', () =>
			{
				data.components.main.bind();
			});
		}
	}
}