/** Helpers */
import { isNumeric, DOM } from '../../helpers';
/** Modules */
import { log } from '../../modules/logger';

/** Types */
import {
	TPageObject,
	ITableRowMI,
	TOptimizeOptions,
	TOptimizeScope,
	TOptimizeRowItem,
	TOptimizeStructure,
	TOptimizeCachedRowItem
} from '../../types';

export default class optimizeClass
{
	private page: TPageObject;

	private table: HTMLElement;

	private scope: TOptimizeScope;

	private padding: number;

	private tableOffsetBegin: number;

	private rowHeight: number;

	private refreshId: number;

	private refreshing: boolean;

	private initiated: boolean;

	private activeHasChanged: boolean;

	public enabled: boolean;

	private structure: TOptimizeStructure;

	public rows: Array<TOptimizeRowItem>;

	private activeData: [Array<TOptimizeRowItem>, {
		[key: string]: number;
	}];

	private on: boolean | {
		rowChange?: (
			rows: Array<ITableRowMI> | NodeListOf<TOptimizeRowItem>
		) => boolean | void;
	};

	constructor(options: TOptimizeOptions)
	{
		this.init(options);

		return this;
	}

	private init = (options: TOptimizeOptions): void =>
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
	private setup = (): boolean =>
	{
		log('optimize', '->', 'optimize.setup');

		const table: HTMLElement = this.table;
		const rows: NodeListOf<TOptimizeRowItem> = table.querySelectorAll('tbody > tr');
		const rowHeight: number = (rows[0] as HTMLElement).offsetHeight;
		const tableHeight: number = table.offsetHeight;
		const structure: TOptimizeStructure = {};

		this.tableOffsetBegin = (rows[0] as HTMLElement).offsetTop;

		const measureStart = performance.now();

		/* Store table structure (offset + height + index) */
		for(let index = 0; index < rows.length; index++)
		{
			/* `this.padding` is to adjust for any table container paddings */
			rows[index]._offsetTop = rows[index].offsetTop + this.padding;
			rows[index]._offsetHeight = rows[index]._offsetHeight || rows[index].offsetHeight;
			rows[index]._isVisible = true;
		}

		if(typeof this.on === 'object'
			&& Object.prototype.hasOwnProperty.call(this.on, 'rowChange'))
		{
			this.on.rowChange(rows);
		}

		this.rows = Array.from(rows);

		log('optimize', `Calculated rows in ${performance.now() - measureStart} ms.`);

		/* Apply table height */
		DOM.style.set(table, {
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
		const tablePosTop = table.getBoundingClientRect().top;

		const origin: number = Math.ceil(
			this.page.scrolledY - (
				tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2
			)
		);

		const margin: number = Math.ceil(Math.ceil(this.page.windowHeight / rowHeight) * 2);

		this.getActiveData();

		index = this.scanForClosest(origin, 1E3, index);

		/* get visible range relative to origin index */
		const [start, limit] = this.calculateRange(index, margin);

		/* Use data from above to hide rows that are out of viewport before setting position */
		for(let i = 0; i < rows.length; i++)
		{
			const item: TOptimizeRowItem = rows[i];
			const itemClasses: Array<string> = ['rel-row'];

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
	public refactor = (): boolean =>
	{
		/* Start measuring execution time */
		const measureStart: number = performance.now();

		log('optimize', '->', 'optimize.refactor');

		/* Declare variables */
		const table: HTMLElement = this.table;

		/* `this.padding` is to adjust for any table container paddings */
		let combinedHeight: number = (this.tableOffsetBegin) + this.padding;

		/* Create new structure */
		const structure: TOptimizeStructure  = {};

		/* Store offsets */
		const rowOffsets: { [key: string]: number; } = {};

		/* Create updated structure */
		for(let index = 0; index < (this.rows).length; index++)
		{
			const item: TOptimizeRowItem = (this.rows[index]);

			if(item._isVisible)
			{
				/* Add visible item to structure */
				structure[combinedHeight] = {
					index: index
				};

				rowOffsets[index] = combinedHeight;
				combinedHeight += item._offsetHeight;
			}
		}

		combinedHeight += this.padding;

		/* Update optimize structure */
		this.structure = structure;

		this.activeHasChanged = true;
		this.page.scrolledY = (this.scope[0])[this.scope[1]];

		let index = 0;

		/* Get visible index range and margins */
		const tablePosTop: number = table.getBoundingClientRect().top;

		const origin: number = Math.ceil(
			this.page.scrolledY - (tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2)
		);

		const margin: number = Math.ceil(Math.ceil(this.page.windowHeight / this.rowHeight) * 2),
			[activeRows, activeIndexes] = this.getActiveData();

		/* Detect origin index */
		index = this.scanForClosest(origin, 1E3, index);

		/* Get relative index */
		index = this.getRelativeIndex(activeIndexes, index) || index;

		/* Find visible row range */
		const [start, limit] = this.calculateRange(index, margin);

		/* 
		 * Prior to setting positions, show all elements that WILL be visible
		 * in the viewport. This eliminates some flashing etc.
		 */
		for(let i = 0; i < activeRows.length; i++)
		{
			if(i >= start && i <= limit)
			{
				activeRows[i].style.display = 'flex';
			}
		}

		/* Iterate over stored rows, check status and arrange new table */
		for(let index = 0; index < (this.rows).length; index++)
		{
			const item: TOptimizeRowItem = this.rows[index];

			if(item._isVisible)
			{
				item.style.top = `${rowOffsets[index]}px`;
			} else {
				item.style.top = '-2500px';
			}
		}

		/* Call `onRowChange` function, if set */
		if(typeof this.on === 'object' &&
			Object.prototype.hasOwnProperty.call(this.on, 'rowChange'))
		{
			this.on.rowChange(activeRows);
		}

		/* Set table height */
		table.style.height = `${combinedHeight + 6}px`;

		log('optimize', `Ran refactor in ${performance.now() - measureStart} ms.`);

		/* Call a refresh after refactor */
		this.refresh();

		return true;
	}

	public setVisibleFlag = (item: TOptimizeRowItem, state: boolean): boolean =>
	{
		item._isVisible = state;
		this.activeHasChanged = true;

		return state;
	}

	private sortLogic = (sort: number, a: TOptimizeCachedRowItem, b: TOptimizeCachedRowItem): any =>
	{
		if(isNumeric(a.value) && isNumeric(b.value))
		{
			return sort ? (a.value - b.value) : (b.value - a.value);
		} else {
			return (sort ? a.value
				|| '' : b.value
				|| '').localeCompare(sort ? b.value || '' : a.value || '');
		}
	}

	public sortRows = (column = 0, order = 'asc'): Array<TOptimizeRowItem> =>
	{
		/* Convert sorting direction to an integer */
		const sort: 1 | 0 = (order.toLowerCase() === 'asc' ? 1 : 0);

		/* Cache arrays */
		const rows: Array<TOptimizeRowItem> = [],
			items: Array<TOptimizeCachedRowItem> = [],
			keepIntact: Array<TOptimizeCachedRowItem> = [];

		const measureStart = performance.now();

		for(let i = 0; i < this.rows.length; i++)
		{
			/* Skip parent directory as we'll unshift that in at the end instead */
			if(i === 0)
			{
				continue;
			}

			const item: TOptimizeRowItem = this.rows[i],
				value: string = item.children[column].getAttribute('data-raw'),
				separate: boolean = item.classList.contains('directory');

			((value && !separate) ? items : keepIntact).push({
				value: value,
				index: i,
			});
		}

		([items, keepIntact]).forEach((array: Array<TOptimizeCachedRowItem>) =>
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

		log('optimize', `Sorted items in ${performance.now() - measureStart} ms.`);

		return this.rows;
	}

	/**
	 * Calculates the active index range
	 */
	private calculateRange = (index: number, margin: number): [number, number] =>
	{
		let start = (index - margin);
		const negative: number = (start < 0 ? start : 0);

		start = (start < 0 ? 0 : start);

		const limit: number = (start + (margin * 2)) + negative;

		return [start, limit];
	}

	/**
	 * Gets the active rows and their indexes from stored rows
	 */
	public getActiveData = (): [Array<TOptimizeRowItem>, {
		[key: string]: number;
	}] =>
	{
		if(this.activeHasChanged || !this.activeData)
		{
			log('optimize', 'Updating active data ..');

			const activeRows: Array<TOptimizeRowItem> = [],
				activeIndexes: {
					[key: string]: number;
				} = {};

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
	private scanForClosest = (origin: number, range: number, fallback: any = null): number =>
	{
		let index: any = fallback;

		for(let i = 0; i < (range || 1E3); i++)
		{
			if(this.structure[origin + i])
			{
				index = this.structure[origin + i].index; break;
			}
		}

		return index;
	}

	/**
	 * Find index relative to the active rows
	 */
	private getRelativeIndex = (activeIndexes: {
		[key: string]: number;
	}, index: number): number | null =>
	{
		const indexes: Array<string> = Object.keys(activeIndexes);
		let relative: number | null = null;

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

	private setRows = (index: number, rows: Array<TOptimizeRowItem>, margin: number): {
		visible: number,
		hidden: number,
		updated: number
	} =>
	{
		let updated = 0, visible = 0, hidden = 0;

		const [start, limit] = this.calculateRange(index, margin);

		const items: {
			show: Array<TOptimizeRowItem>;
			hide: Array<TOptimizeRowItem>;
		} = {
			show: [],
			hide: []
		};

		/* Iterate over active rows, hide and show rows */
		for(let i = 0; i < rows.length; i++)
		{
			const item: TOptimizeRowItem = rows[i];

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

		requestAnimationFrame((): void =>
		{
			(items.show).forEach((item: TOptimizeRowItem): void =>
			{
				item.classList.remove('hid-row');
				item._isHidden = false;
			});

			(items.hide).forEach((item: TOptimizeRowItem): void =>
			{
				item.classList.add('hid-row');
				item._isHidden = true;
			});
		});

		log('optimize', { visible, hidden, updated });

		return { visible, hidden, updated };
	}

	/**
	 * Hides rows that are out of view - called on scroll, resize and so on
	 */
	private refresh = (refreshId = 0): Promise<number> =>
	{
		if(!this.initiated)
		{
			return new Promise((resolve, reject) => reject('Not initiated.'));
		}

		/* Start measuring execution time */
		const measureStart: number = performance.now();

		log('optimize', '->', 'optimize.refresh');

		/* Get scroll pos */
		this.page.scrolledY = (this.scope[0])[this.scope[1]];

		/* Get origin point */
		const tablePosTop: number = this.table.getBoundingClientRect().top;

		const origin: number = Math.ceil(this.page.scrolledY - (tablePosTop + this.page.scrolledY) + (this.page.windowHeight / 2));

		return new Promise((resolve, reject) =>
		{
			let index = 0;

			/* Calculate how many rows we need to show (-/+ viewport) */
			const margin: number = Math.ceil(Math.ceil(this.page.windowHeight / this.rowHeight) * 2);

			/* Get active rows and their respective indexes */
			const [activeRows, activeIndexes] = this.getActiveData();

			/* Scan for closest structure row */
			index = this.scanForClosest(origin, 1E3, index);

			/* Find relative index (active rows only) of the full scoped index */
			index = this.getRelativeIndex(activeIndexes, index) || index;

			if(index >= 0 && margin)
			{
				/* Push code execution block to separate queue */
				setTimeout((): void =>
				{
					/* Apply status to rows */
					this.setRows(index, activeRows, margin);

					/* Show execution time */
					log('optimize', `Ran refresh in ${performance.now() - measureStart} ms.`);

					/* Resolve the promise */
					resolve(refreshId);
				}, 0);
			} else {
				reject();
			}
		});
	}

	public attemptRefresh = (): void =>
	{
		this.refreshId = this.refreshId || 0;
		this.refreshId++;

		if(!this.refreshing)
		{
			this.refreshing = true;

			this.refresh(this.refreshId).then((): void =>
			{
				this.refreshing = false;

				/* log('optimize', 'Refreshed', refreshId); */
			}).catch(() =>
			{
				this.refreshing = false;
			});
		}
	}
}