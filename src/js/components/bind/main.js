/* import models */
import { eventHandler } from '../../modules/event-handler';

/* import config */
import { config } from '../../config/config';
import { data } from '../../config/data';

/* import helpers */
import { dom, getScrollTop } from '../../helpers/helpers';

const events = new Object();

const selector = data.instances.selector;

/**
 * called onscroll - shows/hides current path in the top bar
 */
events.scroll = () =>
{
	let path = selector.use('PATH');

	let	top = document.body.querySelector(':scope > div.top-bar > div.directory-info > div.quick-path');

	let	visible = getScrollTop() < (path.offsetTop + path.offsetHeight);

	if(!visible)
	{
		if(!top)
		{
			top = dom.new('div', {
				'class' : 'quick-path',
				'data-view' : 'desktop'
			});

			top.innerHTML = path.innerHTML;

			document.body.querySelector(':scope > div.top-bar > div.directory-info').append(top);
		}

		if(!top._isVisible)
		{
			if(top._isVisible !== false)
			{
				requestAnimationFrame(() =>
				{
					top.classList.add('visible')
				});
			} else {
				top.classList.add('visible');
			}

			top._isVisible = true;
		}
	} else {
		if(top && top._isVisible)
		{
			top.classList.remove('visible');

			top._isVisible = false;
		}
	}
}

export class componentBind
{
	constructor()
	{
		return this;
	}

    /**
	 * unbind events - recalled on gallery show
	 */
	unbind = () =>
	{
		eventHandler.removeListener(document, 'keydown', 'mainKeyDown');
		eventHandler.removeListener(window, 'scroll', 'windowScroll');
	}

    /**
     * bind events - recalled on gallery close
     */
	load = () =>
	{
		eventHandler.addListener(document, 'keydown', 'mainKeyDown', (e) =>
		{
			if(e.shiftKey && e.keyCode === data.keys.f)
			{
				e.preventDefault();

				data.components.filter.toggle();

			} else if(e.keyCode === data.keys.escape)
			{
				data.components.main.overlay.hide((state) =>
				{
					if(state === true)
					{
						e.preventDefault();
					}
				});
			} else if(e.keyCode === data.keys.g)
			{
				if(config.get('gallery.enabled') === true)
				{
					let container = document.body.querySelector(':scope > div.filter-container');

					if(container.style.display === 'none' ||
						!(document.activeElement === container.querySelector('input')))
					{
						data.components.gallery.load(null);

						data.components.main.menu.toggle(false);
					}
				}
			}
		});

		let debounceTimer = null;

		let onDebounce = () =>
		{
			events.scroll();

			if(data.instances.optimize.main.enabled)
			{
				data.instances.optimize.main.attemptRefresh();
			}
		};

		eventHandler.addListener(window, 'scroll', 'windowScroll', (e) =>
		{
			clearTimeout(debounceTimer);

			debounceTimer = setTimeout(() => onDebounce(), 100);

			if(data.instances.optimize.main.enabled)
			{
				/* get scrolled position */
				let scrolled = window.scrollY;

				/* trigger optimization refresh if 175 px has been scrolled */
				if(Math.abs(scrolled - data.layer.main.scrolledY) > 175)
				{
					data.instances.optimize.main.attemptRefresh();
				}
			}
		});

		events.scroll();
	}
}