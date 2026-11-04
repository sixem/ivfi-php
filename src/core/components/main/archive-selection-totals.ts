/// <reference lib="es2020.bigint" />
import type { ArchiveFile } from '../../types/archive';

/* client-zip adds ZIP64 records once a size or local-file offset reaches this value. */
const ZIP64_LIMIT = BigInt(0xffffffff);

/** Incremental selection totals, including client-zip's order-dependent ZIP64 overhead. */
export class ArchiveSelectionTotals
{
	private selected: Uint8Array;
	private large: Uint8Array;
	private localBytes: bigint[];
	private entryBytes: bigint[];
	private localTree: bigint[];
	private smallTree: number[];
	private allLocalTree: bigint[];
	private allSmallTree: number[];
	private allBytes = 0;
	private allEntryBytes = BigInt(0);
	private allLocalBytes = BigInt(0);
	private allLargeCount = 0;
	private allSmallCount = 0;
	private localTotal = BigInt(0);
	private entryTotal = BigInt(0);
	private largeCount = 0;
	private smallCount = 0;
	private sizes: number[];
	public count = 0;
	public totalBytes = 0;

	constructor(files: ArchiveFile[])
	{
		const encoder = new TextEncoder();
		const length = files.length;
		this.selected = new Uint8Array(length);
		this.large = new Uint8Array(length);
		this.localBytes = new Array<bigint>(length);
		this.entryBytes = new Array<bigint>(length);
		this.sizes = new Array<number>(length);
		this.allLocalTree = Array<bigint>(length + 1).fill(BigInt(0));
		this.allSmallTree = Array<number>(length + 1).fill(0);
		for(let i = 0; i < length; i++)
		{
			const file = files[i];
			const size = BigInt(file.size);
			const nameBytes = encoder.encode(file.name).length;
			const large = size >= ZIP64_LIMIT;
			const local = size + BigInt(46 + nameBytes + (large ? 8 : 0));
			/* Local header + descriptor + central header + both copies of the name. */
			const entry = size + BigInt(92 + nameBytes * 2 + (large ? 36 : 0));
			this.large[i] = Number(large);
			this.localBytes[i] = local;
			this.entryBytes[i] = entry;
			this.sizes[i] = file.size;
			this.allLocalTree[i + 1] = local;
			this.allSmallTree[i + 1] = Number(!large);
			this.allLocalBytes += local;
			this.allEntryBytes += entry;
			this.allBytes += file.size;
			if(large) this.allLargeCount++;
			else this.allSmallCount++;
		}
		/* Build Fenwick trees in linear time. */
		for(let i = 1; i <= length; i++)
		{
			const parent = i + (i & -i);
			if(parent <= length)
			{
				this.allLocalTree[parent] += this.allLocalTree[i];
				this.allSmallTree[parent] += this.allSmallTree[i];
			}
		}
		this.setAll(true);
	}

	public setAll = (included: boolean): void =>
	{
		this.selected.fill(included ? 1 : 0);
		this.localTree = included ? this.allLocalTree.slice() : Array<bigint>(this.selected.length + 1).fill(BigInt(0));
		this.smallTree = included ? this.allSmallTree.slice() : Array<number>(this.selected.length + 1).fill(0);
		this.count = included ? this.selected.length : 0;
		this.totalBytes = included ? this.allBytes : 0;
		this.localTotal = included ? this.allLocalBytes : BigInt(0);
		this.entryTotal = included ? this.allEntryBytes : BigInt(0);
		this.largeCount = included ? this.allLargeCount : 0;
		this.smallCount = included ? this.allSmallCount : 0;
	}

	public setIncluded = (index: number, included: boolean): void =>
	{
		if(Boolean(this.selected[index]) === included) return;
		this.selected[index] = Number(included);
		const delta = included ? 1 : -1;
		const local = this.localBytes[index] * BigInt(delta);
		this.count += delta;
		this.totalBytes += this.sizes[index] * delta;
		this.localTotal += local;
		this.entryTotal += this.entryBytes[index] * BigInt(delta);
		if(this.large[index]) this.largeCount += delta;
		else this.smallCount += delta;
		for(let i = index + 1; i < this.localTree.length; i += i & -i)
		{
			this.localTree[i] += local;
			if(!this.large[index]) this.smallTree[i] += delta;
		}
	}

	public get zipBytes(): bigint
	{
		let size = BigInt(22) + this.entryTotal;
		if(this.localTotal >= ZIP64_LIMIT)
		{
			/* Find the first prefix reaching the limit; later small files need 12-byte offset records. */
			let index = 0;
			let sum = BigInt(0);
			let step = 1;
			while(step * 2 <= this.selected.length) step *= 2;
			for(; step > 0; step = Math.floor(step / 2))
			{
				const next = index + step;
				if(next <= this.selected.length && sum + this.localTree[next] < ZIP64_LIMIT)
				{
					index = next;
					sum += this.localTree[next];
				}
			}
			let prefix = index + 1;
			let smallBefore = 0;
			for(; prefix > 0; prefix -= prefix & -prefix) smallBefore += this.smallTree[prefix];
			size += BigInt(12) * BigInt(this.smallCount - smallBefore);
		}
		if(this.largeCount || this.localTotal >= ZIP64_LIMIT) size += BigInt(76);
		return size;
	}
}
