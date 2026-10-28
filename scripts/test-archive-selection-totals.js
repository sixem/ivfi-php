import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { predictLength } from 'client-zip';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/core/components/main/archive-selection-totals.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const module = { exports: {} };
vm.runInNewContext(javascript, { module, exports: module.exports, TextEncoder, Uint8Array });
const { ArchiveSelectionTotals } = module.exports;

const file = (name, size) => ({ name, size });
const check = (totals, files, included) => {
	const selected = files.filter((_, i) => included[i]);
	assert.equal(totals.count, selected.length);
	assert.equal(totals.totalBytes, selected.reduce((sum, item) => sum + item.size, 0));
	assert.equal(totals.zipBytes, predictLength(selected));
};

test('selection totals match client-zip around ZIP64 boundaries', () => {
	const limit = 0xffffffff;
	const files = [
		file('a', limit - 47), file('b', 0), file('café', 9),
		file('large', limit), file('日本語', limit + 1), file('empty', 0)
	];
	const totals = new ArchiveSelectionTotals(files);
	const included = files.map(() => true);
	check(totals, files, included);
	for(let mask = 0; mask < 1 << files.length; mask++)
	{
		for(let i = 0; i < files.length; i++)
		{
			included[i] = Boolean(mask & (1 << i));
			totals.setIncluded(i, included[i]);
		}
		check(totals, files, included);
	}
	totals.setAll(true);
	included.fill(true);
	check(totals, files, included);
	totals.setAll(false);
	included.fill(false);
	check(totals, files, included);
});

test('incremental selection totals match client-zip after repeated toggles', () => {
	const files = Array.from({ length: 150 }, (_, i) => file(`file-${i}-é`, i % 31 === 0 ? 0xffffffff : i * 131));
	const totals = new ArchiveSelectionTotals(files);
	const included = files.map(() => true);
	let seed = 513;
	for(let step = 0; step < 600; step++)
	{
		seed = (seed * 1664525 + 1013904223) >>> 0;
		const index = seed % files.length;
		included[index] = !included[index];
		totals.setIncluded(index, included[index]);
		check(totals, files, included);
	}
});
