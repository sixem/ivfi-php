/** Helpers */
import { DOM } from '../../helpers';
/** Modules */
import { log } from '../../modules/logger';

/** Types */
import {
	TPageObject,
	ITableRowMI,
	TOptimizeOptions,
	TOptimizeScope,
	TOptimizeRowItem
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

	private structure: { [offset: string]: { index: number } };
	private rangeVersion = -1;
	private rangeTop = 0;
	private rangeBottom = 0;
	private rangeHeight = 0;

	private frame: number = null;
	private timer: ReturnType<typeof setTimeout> = null;
	private destroyed = false;
	private queued = false;
	private layoutVersion = 0;
	private focused: TOptimizeRowItem = null;
	private focusVersion = 0;

	public rows: Array<TOptimizeRowItem>;

	private activeData: [Array<TOptimizeRowItem>, { [key: string]: number }];

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
		this.focused = table.contains(document.activeElement)
			? document.activeElement.closest<TOptimizeRowItem>('tbody > tr') : null;
		const rows: NodeListOf<TOptimizeRowItem> = table.querySelectorAll('tbody > tr');
		const rowHeight: number = rows[0]?.offsetHeight || 1;
		const tableHeight: number = table.offsetHeight;
		const structure: { [offset: string]: { index: number } } = {};

		this.tableOffsetBegin = rows[0]?.offsetTop || 0;

		const measureStart = performance.now();

		/* Cache the initial row positions and heights. */
		for(let index = 0; index < rows.length; index++)
		{
			/* `this.padding` is to adjust for any table container paddings */
			rows[index]._offsetTop = rows[index].offsetTop + this.padding;
			rows[index]._offsetHeight = rows[index]._offsetHeight || rows[index].offsetHeight;
			rows[index]._isVisible = !rows[index].classList.contains('filtered');
		}

		if(this.on && typeof this.on === 'object'
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

		const margin: number = Math.ceil(Math.ceil(this.page.windowHeight / rowHeight) * 1.75);

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
			if(!(i >= start && i <= limit) && item !== this.focused)
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
		table.addEventListener('focusin', this.onFocus);
		table.addEventListener('focusout', this.onFocusOut);

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

		const structure: { [offset: string]: { index: number } } = {};
		/* Store offsets */
		const rowOffsets: { [key: string]: number; } = {};

		/* Position active rows in the current sort order. */
		for(let index = 0; index < (this.rows).length; index++)
		{
			const item: TOptimizeRowItem = (this.rows[index]);

			if(item._isVisible)
			{
				structure[combinedHeight] = { index };
				rowOffsets[index] = combinedHeight;
				item._offsetTop = combinedHeight;
				combinedHeight += item._offsetHeight;
			}
		}

		combinedHeight += this.padding;

		this.structure = structure;
		this.layoutVersion++;

		this.activeHasChanged = true;
		this.page.scrolledY = (this.scope[0])[this.scope[1]];

		const [activeRows] = this.getActiveData();

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
		if(this.on && typeof this.on === 'object' &&
			Object.prototype.hasOwnProperty.call(this.on, 'rowChange'))
		{
			this.on.rowChange(activeRows);
		}

		/* Set table height */
		table.style.height = `${combinedHeight + 6}px`;

		log('optimize', `Ran refactor in ${performance.now() - measureStart} ms.`);

		/* Call a refresh after refactor */
		this.attemptRefresh();

		return true;
	}

	public setVisibleFlag = (item: TOptimizeRowItem, state: boolean): boolean =>
	{
		item._isVisible = state;
		this.activeHasChanged = true;

		return state;
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
	 * Scans the structure for the closest element from origin
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

	private onFocusOut = (): void =>
	{
		this.focused = null;
		this.focusVersion++;
		this.rangeVersion = -1;
		this.attemptRefresh();
	}

	private onFocus = (event: FocusEvent): void =>
	{
		this.focused = (event.target as Element).closest<TOptimizeRowItem>('tbody > tr');
		this.focusVersion++;
		this.rangeVersion = -1;
		this.attemptRefresh();
	}

	private setRows = (index: number, rows: TOptimizeRowItem[], margin: number, applied: () => void): void =>
	{
		const [start, limit] = this.calculateRange(index, margin);
		const focused = this.focused;
		const focusVersion = this.focusVersion;
		const items: { show: TOptimizeRowItem[]; hide: TOptimizeRowItem[] } = { show: [], hide: [] };
		for(let i = 0; i < rows.length; i++)
		{
			const item = rows[i];
			if((i >= start && i <= limit) || item === focused)
			{
				if(item._isHidden) items.show.push(item);
			} else if(!item._isHidden) items.hide.push(item);
		}
		const version = this.layoutVersion;
		if(this.frame !== null) cancelAnimationFrame(this.frame);
		this.frame = requestAnimationFrame(() =>
		{
			this.frame = null;
			if(!this.destroyed && version === this.layoutVersion)
			{
				const currentFocus = this.focused;
				/* Show incoming rows before hiding the previous range. */
				for(const row of items.show)
				{
					row.classList.remove('hid-row');
					row._isHidden = false;
				}
				for(const row of items.hide)
				{
					if(row === currentFocus && row._isVisible) continue;
					row.classList.add('hid-row');
					row._isHidden = true;
				}
				this.rangeTop = start === 0 ? -Infinity : rows[start]?._offsetTop || 0;
				this.rangeBottom = limit >= rows.length - 1 ? Infinity
					: rows[limit]._offsetTop + rows[limit]._offsetHeight;
				this.rangeHeight = this.page.windowHeight;
				this.rangeVersion = focusVersion === this.focusVersion ? version : -1;
			}
		});
		applied();
	}

	/**
	 * Hides rows that are out of view - called on scroll, resize and so on
	 */
	private refresh = (refreshId = 0): Promise<number> =>
	{
		this.page.scrolledY = (this.scope[0])[this.scope[1]];
		const tablePosTop = this.table.getBoundingClientRect().top;
		const origin = Math.ceil(-tablePosTop + this.page.windowHeight / 2);
		/* Refresh before either side has less than three quarters of a viewport buffered. */
		if(this.rangeVersion === this.layoutVersion && this.rangeHeight === this.page.windowHeight
			&& origin - this.page.windowHeight * 1.25 >= this.rangeTop
			&& origin + this.page.windowHeight * 1.25 <= this.rangeBottom)
		{
			if(this.frame !== null) cancelAnimationFrame(this.frame);
			this.frame = null;
			return Promise.resolve(refreshId);
		}
		const margin = Math.ceil(Math.ceil(this.page.windowHeight / this.rowHeight) * 1.75);
		const [activeRows, activeIndexes] = this.getActiveData();
		const fullIndex = this.scanForClosest(origin, 1E3, 0);
		const index = this.getRelativeIndex(activeIndexes, fullIndex) ?? fullIndex;
		const version = this.layoutVersion;

		return new Promise(resolve =>
		{
			this.timer = setTimeout(() =>
			{
				this.timer = null;
				if(this.destroyed || version !== this.layoutVersion) return resolve(refreshId);
				this.setRows(index, activeRows, margin, () => resolve(refreshId));
			}, 0);
		});
	}

	public attemptRefresh = (): void =>
	{
		if(this.destroyed || !this.initiated) return;
		if(this.refreshing)
		{
			this.queued = true;
			return;
		}
		this.refreshing = true;
		this.refreshId = (this.refreshId || 0) + 1;
		this.refresh(this.refreshId).then(() =>
		{
			this.refreshing = false;
			if(this.queued)
			{
				this.queued = false;
				this.attemptRefresh();
			}
		});
	}

	public destroy = (): void =>
	{
		this.destroyed = true;
		this.enabled = false;
		if(this.frame !== null) cancelAnimationFrame(this.frame);
		if(this.timer !== null) clearTimeout(this.timer);
		this.table.removeEventListener('focusin', this.onFocus);
		this.table.removeEventListener('focusout', this.onFocusOut);
	}
}
