/** Import `data` */
import data from '../config/data';

/** Import `isNumeric`, `DOM` */
import {
	isNumeric,
	DOM
} from '../modules/helpers';

const pipe = data.instances.pipe;

export default class optimizeClass
{
	constructor(options)
	{
		this.init(options);

		return this;
	}

	init = (options) =>
	{
		this.page = options.page;
		this.table = options.table;
		this.scope = options.scope;
		this.padding = options.padding || 0;

		if(Object.prototype.hasOwnProperty.call(options, 'on'))
		{
			this.on = options.on;
		} else {
			this.on = false;
		}

		this.enabled = false;

		this.setup();
	}

	/**
	 * Initiate the variables and set required data
	 */
	setup = () =>
	{
		pipe('->', 'optimize.setup');

		let table = this.table;

		let tableHeight = table.offsetHeight;

		let rows = table.querySelectorAll('tbody > tr');

		let rowHeight = rows[0].offsetHeight;

		let structure = new Object();

		this.tableOffsetBegin = rows[0].offsetTop;

		let measureStart = performance.now();

		/* Store table structure (offset + height + index) */
		for(let index = 0; index < rows.length; index++)
		{
			/* `this.padding` is to adjust for any table container paddings */
			rows[index]._offsetTop = rows[index].offsetTop + this.padding;
			rows[index]._offsetHeight = rows[index]._offsetHeight || rows[index].offsetHeight;
			rows[index]._isVisible = true;
		}

		if(this.on && Object.prototype.hasOwnProperty.call(this.on, 'rowChange'))
		{
			this.on.rowChange(rows);
		}

		this.rows = Array.from(rows);

		pipe(`Calculated rows in ${performance.now() - measureStart} ms.`);

		/* Apply table height */
		DOM.css.set(table, {
			'height' : `${tableHeight}px`
		});

		/* Iterate rows, create structure object */
		for(let i = 0; i < rows.length; i++)
		{
			structure[rows[i]._offsetTop] = {
				index : i
			};
		}

		this.structure = structure;

		let index = 0;

		/* Get current positioning and decide what rows can be hidden on page load */
		let tablePosTop = table.getBoundingClientRect().top;

		let origin = Math.ceil(this.page.scrolledY - (tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2));

		let margin = Math.ceil(Math.ceil(this.page.windowHeight / rowHeight) * 2);

		this.getActiveData();

		index = this.scanForClosest(origin, 1E3, index);

		/* get visible range relative to origin index */
		let [start, limit] = this.calculateRange(index, margin);

		/* Use data from above to hide rows that are out of viewport before setting position */
		for(let i = 0; i < rows.length; i++)
		{
			let item = rows[i];

			let itemClasses = ['rel-row'];

			/* Out of viewport? hide it here - speeds up page load */
			if(!(i >= start && i <= limit))
			{
				itemClasses.push('hid-row');
			}

			/* Instead of calling .add() twice, add as array - should be faster */
			item.classList.add(...itemClasses);

			item.style.top = `${item._offsetTop}px`;
		}

		this.table = table;

		this.rowHeight = rowHeight;

		this.initiated = true;

		this.enabled = true;

		this.activeHasChanged = true;

		/* Call a refresh after initiated */
		this.attemptRefresh();

		return this.initiated;
	}

	/**
	 * Called after table manipulation
	 * This recreates the table using only active rows
	 */
	refactor = () =>
	{
		/* Start measuring execution time */
		let measureStart = performance.now();

		pipe('->', 'optimize.refactor');

		/* Declare variables */
		let table = this.table;

		/* `this.padding` is to adjust for any table container paddings */
		let combinedHeight = (this.tableOffsetBegin) + this.padding;

		/* Create new structure */
		let structure = new Object();

		/* Store offsets */
		let rowOffsets = new Object();

		let recentHeight = 0;

		/* Create updated structure */
		for(let index = 0; index < (this.rows).length; index++)
		{
			let item = (this.rows[index]);

			if(item._isVisible)
			{
				/* Add visible item to structure */
				structure[combinedHeight] = {
					index : index
				};

				rowOffsets[index] = combinedHeight;

				combinedHeight += item._offsetHeight;

				recentHeight = item._offsetHeight;
			}
		}

		if(recentHeight > 0)
		{
			combinedHeight = (combinedHeight - recentHeight);
		}

		combinedHeight += this.padding;

		/* Update optimize structure */
		this.structure = structure;

		this.activeHasChanged = true;

		this.page.scrolledY = (this.scope[0])[this.scope[1]];

		let index = 0;

		/* Get visible index range and margins */

		let tablePosTop = table.getBoundingClientRect().top;

		let origin = Math.ceil(this.page.scrolledY - (tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2));

		let margin = Math.ceil(Math.ceil(this.page.windowHeight / this.rowHeight) * 2);

		let [activeRows, activeIndexes] = this.getActiveData();

		/* Detect origin index */
		index = this.scanForClosest(origin, 1E3, index);

		index = this.getRelativeIndex(activeIndexes, index) || index;

		/* Find visible row range */
		let [start, limit] = this.calculateRange(index, margin);

		/* 
		 * Prior to setting positions, show all elements that WILL be visible
		 * in the viewport. This eliminates some flashing etc.
		 */
		for(let i = 0; i < activeRows.length; i++)
		{
			if(i >= start && i <= limit)
			{
				activeRows[i].style.display = 'block';
			}
		}

		/* Iterate over stored rows, check status and arrange new table */
		for(let index = 0; index < (this.rows).length; index++)
		{
			let item = this.rows[index];

			if(item._isVisible)
			{
				item.style.top = `${rowOffsets[index]}px`;
			} else {
				item.style.top = '-2500px';
			}
		}

		/* Call `onRowChange` function, if set */
		if(this.on && Object.prototype.hasOwnProperty.call(this.on, 'rowChange'))
		{
			this.on.rowChange(activeRows);
		}

		/* Set table height */
		table.style.height = `${combinedHeight + 6}px`;

		pipe(`Ran refactor in ${performance.now() - measureStart} ms.`);

		/* Call a refresh after refactor */
		this.refresh();

		return true;
	}

	setVisibleFlag = (item, state) =>
	{
		item._isVisible = state;

		this.activeHasChanged = true;

		return state;
	}

	sortLogic = (sort, a, b) =>
	{
		if(isNumeric(a.value) && isNumeric(b.value))
		{
			return sort ? (a.value - b.value) : (b.value - a.value);
		} else {
			return (sort ? a.value || '' : b.value || '').localeCompare(sort ? b.value || '' : a.value || '');
		}
	}

	sortRows = (column = 0, sort = 'asc') =>
	{
		/* Convert sorting direction to an integer */
		sort = (sort.toLowerCase() === 'asc' ? 1 : 0);

		/* Cache arrays */
		let rows = new Array();
		let items = new Array();
		let keepIntact = new Array();

		let measureStart = performance.now();

		for(let i = 0; i < this.rows.length; i++)
		{
			/* Skip parent directory as we'll unshift that in at the end instead */
			if(i === 0)
			{
				continue;
			}

			let item = this.rows[i];

			let value = item.children[column].getAttribute('data-raw');

			let separate = item.classList.contains('directory');

			(value && !separate ? items : keepIntact).push({
				value : value,
				index : i,
			});
		}

		([items, keepIntact]).forEach((array) =>
		{
			return array.sort((a, b) => this.sortLogic(sort, a, b));
		});

		items.unshift(...keepIntact);

		for(let i = 0; i < items.length; i++)
		{
			rows.push(this.rows[items[i].index]);
		}

		rows.unshift(this.rows[0]);

		this.rows = rows;

		this.refactor();

		pipe(`Sorted items in ${performance.now() - measureStart} ms.`);

		return this.rows;
	}

	/**
	 * Calculates the active index range
	 */
	calculateRange = (index, margin) =>
	{
		let start = (index - margin);

		let negative = (start < 0 ? start : 0);

		start = (start < 0 ? 0 : start);

		let limit = (start + (margin * 2)) + negative;

		return [start, limit];
	}

	/**
	 * Gets the active rows and their indexes from stored rows
	 */
	getActiveData = () =>
	{
		if(this.activeHasChanged || !this.activeData)
		{
			pipe('Updating active data ..');

			let activeRows = new Array();

			let activeIndexes = new Object();

			for(let i = 0; i < this.rows.length; i++)
			{
				if(this.rows[i]._isVisible)
				{
					activeRows.push(this.rows[i]);

					activeIndexes[i] = i;
				}
			}

			this.activeData = [activeRows, activeIndexes];

			this.activeHasChanged = false;
		}

		return this.activeData;
	}

	/**
	 * Scans the strcture for the closest element from origin
	 */
	scanForClosest = (origin, range, fallback = null) =>
	{
		let index = fallback;

		for(let i = 0; i < (range || 1E3); i++)
		{
			if(this.structure[origin + i])
			{
				index = this.structure[origin + i].index;

				break;
			}
		}

		return index;
	}

	/**
	 * Find index relative to the active rows
	 */
	getRelativeIndex = (activeIndexes, index) =>
	{
		let indexes = Object.keys(activeIndexes);

		let relative = null;

		/* Find index relative to the active rows */
		for(let i = 0; i < indexes.length; i++)
		{
			if(parseInt(indexes[i]) === index)
			{
				relative = i;
			}
		}

		return relative;
	}

	setRows = (index, rows, margin) =>
	{
		let updated = 0;
		let visible = 0;
		let hidden = 0;

		let [start, limit] = this.calculateRange(index, margin);

		let items = {
			show : new Array(),
			hide : new Array()
		};

		/* Iterate over active rows, hide and show rows */
		for(let i = 0; i < rows.length; i++)
		{
			let item = rows[i];

			if(i >= start && i <= limit)
			{
				/* Only trigger class change if required */
				if(item._isHidden)
				{
					updated++;
					items.show.push(item);
				}

				visible++;
			} else {
				/* Only trigger class change if required */
				if(!item._isHidden)
				{
					updated++;
					items.hide.push(item);
				}

				hidden++;
			}
		}

		requestAnimationFrame(() =>
		{
			(items.show).forEach((item) =>
			{
				item.classList.remove('hid-row');
				item._isHidden = false;
			});

			(items.hide).forEach((item) =>
			{
				item.classList.add('hid-row');
				item._isHidden = true;
			});
		});

		pipe({
			visible,
			hidden,
			updated
		});

		return {
			visible,
			hidden,
			updated
		};
	}

	/**
	 * Hides rows that are out of view - called on scroll, resize and so on
	 */
	refresh = (refreshId = 0) =>
	{
		if(!this.initiated)
		{
			return new Promise((resolve, reject) => reject('Not initiated.'));
		}

		/* Start measuring execution time */
		let measureStart = performance.now();

		pipe('->', 'optimize.refresh');

		/* Get scroll pos */
		this.page.scrolledY = (this.scope[0])[this.scope[1]];

		/* Get origin point */
		let tablePosTop = this.table.getBoundingClientRect().top;

		let origin = Math.ceil(this.page.scrolledY - (tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2));

		return new Promise((resolve, reject) =>
		{
			let index = 0;

			/* Calculate how many rows we need to show (-/+ viewport) */
			let margin = Math.ceil(Math.ceil(this.page.windowHeight / this.rowHeight) * 2);

			/* Get active rows and their respective indexes */
			let [activeRows, activeIndexes] = this.getActiveData();

			/* Scan for closest structure row */
			index = this.scanForClosest(origin, 1E3, index);

			/* Find relative index (active rows only) of the full scoped index */
			index = this.getRelativeIndex(activeIndexes, index) || index;

			if(index >= 0 && margin)
			{
				/* Push code execution block to separate queue */
				setTimeout(() =>
				{
					/* Apply status to rows */
					this.setRows(index, activeRows, margin);

					/* Show execution time */
					pipe(`Ran refresh in ${performance.now() - measureStart} ms.`);

					/* Resolve the promise */
					resolve(refreshId);
				}, 0);
			} else {
				reject();
			}
		});
	}

	attemptRefresh = () =>
	{
		this.refreshId = this.refreshId || 0;

		this.refreshId++;

		if(!this.refreshing)
		{
			this.refreshing = true;

			this.refresh(this.refreshId).then(() =>
			{
				this.refreshing = false;

				/* pipe('Refreshed', refreshId); */
			}).catch(() =>
			{
				this.refreshing = false;
			});
		}
	}
};