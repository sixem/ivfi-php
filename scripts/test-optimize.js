import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = fs.readFileSync(new URL('../src/core/classes/optimize/index.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;

function fixture()
{
	let nextId = 1;
	const timers = new Map(), frames = new Map();
	const queue = (items, callback) => { const id = nextId++; items.set(id, callback); return id; };
	const module = { exports: {} };
	vm.runInNewContext(javascript, {
		module, exports: module.exports,
		require: name => name === '../../helpers'
			? { DOM: { style: { set: (element, styles) => Object.assign(element.style, styles) } } }
			: { log: { debug: () => {} } },
		document: { activeElement: null },
		performance: { now: () => 0 },
		setTimeout: callback => queue(timers, callback),
		clearTimeout: id => timers.delete(id),
		requestAnimationFrame: callback => queue(frames, callback),
		cancelAnimationFrame: id => frames.delete(id)
	});

	const rows = Array.from({ length: 500 }, (_, index) => {
		const classes = new Set();
		return {
			offsetTop: index * 20, offsetHeight: 20, style: {},
			classList: {
				add: (...names) => names.forEach(name => classes.add(name)),
				remove: (...names) => names.forEach(name => classes.delete(name)),
				contains: name => classes.has(name)
			}
		};
	});
	const table = {
		style: {}, offsetHeight: rows.length * 20,
		contains: () => false, querySelectorAll: () => rows,
		getBoundingClientRect: () => ({ top: 0 }),
		addEventListener: () => {}, removeEventListener: () => {}
	};
	const optimizer = new module.exports.default({
		page: { windowHeight: 200, scrolledY: 0 }, table, scope: [{ scrollY: 0 }, 'scrollY']
	});
	const flush = async () => {
		for(let pass = 0; pass < 10 && (timers.size || frames.size || optimizer.refreshing); pass++)
		{
			for(const [id, callback] of [...timers]) { timers.delete(id); callback(); }
			await Promise.resolve();
			for(const [id, callback] of [...frames]) { frames.delete(id); callback(); }
			await Promise.resolve();
		}
	};
	return { optimizer, rows, flush };
}

const assertHiddenState = rows => {
	for(const row of rows)
	{
		assert.equal(row._isHidden, row.classList.contains('hid-row'), 'hidden flag must match the row class');
	}
};

const assertViewportVisible = optimizer => {
	for(const row of optimizer.rows)
	{
		if(row._isVisible && row._offsetTop < 200 && row._offsetTop + row._offsetHeight > 0)
		{
			assert.equal(row.classList.contains('hid-row'), false, 'viewport rows must remain visible');
		}
	}
};

test('performance sorting keeps incoming rows visible without waiting for a refresh', async () => {
	const { optimizer, rows, flush } = fixture();
	assert.ok(rows.some(row => row.classList.contains('hid-row')), 'fixture must contain virtualized rows');
	assertHiddenState(rows);
	await flush();
	assertHiddenState(rows);

	optimizer.rows = [...optimizer.rows].reverse();
	optimizer.refactor();
	assertViewportVisible(optimizer);
	assertHiddenState(rows);

	await flush();
	assertViewportVisible(optimizer);
	assertHiddenState(rows);
	assert.ok(rows.some(row => row.classList.contains('hid-row')), 'refresh should still virtualize offscreen rows');
	optimizer.destroy();
});
