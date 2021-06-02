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
	constructor(options)
	{
		this.overlay = options.overlay;

		this.menu = options.menu;

		this.optimize = options.optimize;

		this.components = options.components;

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
			if(e.shiftKey && e.keyCode === 70)
			{
				e.preventDefault();

				data.components.filter.toggle();

			} else if(e.keyCode === 27)
			{
				this.overlay.hide((state) =>
				{
					if(state === true)
					{
						e.preventDefault();
					}
				});
			} else if(e.keyCode === 71)
			{
				if(config.get('gallery.enabled') === true)
				{
					let container = document.body.querySelector(':scope > div.filter-container');

					if(container.style.display === 'none' ||
						!(document.activeElement === container.querySelector('input')))
					{
						this.components.gallery.load(null);

						this.menu.toggle(false);
					}
				}
			}
		});

		let debounceTimer = null;

		let onDebounce = () =>
		{
			events.scroll(this.components);

			if(this.optimize.enabled)
			{
				this.optimize.attemptRefresh();
			}
		};

		eventHandler.addListener(window, 'scroll', 'windowScroll', (e) =>
		{
			clearTimeout(debounceTimer);

			debounceTimer = setTimeout(() => onDebounce(), 100);

			if(this.optimize.enabled)
			{
				/* get scrolled position */
				let scrolled = window.scrollY;

				/* trigger optimization refresh if 175 px has been scrolled */
				if(Math.abs(scrolled - this.components.page.scrolledY) > 175)
				{
					this.optimize.attemptRefresh();
				}
			}
		});

		events.scroll(this.components);
	}
}