import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { makeZip } from 'client-zip';

const ts = createRequire(import.meta.url)('typescript');
const source = fs.readFileSync(new URL('../src/core/components/main/archive.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(source, {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const deferred = () => {
	let resolve;
	const promise = new Promise(done => { resolve = done; });
	return { promise, resolve };
};

function fixture(t, { disk = false, delay = 0, fetchFile, cancelOnFinish = false } = {})
{
	const requested = [], downloaded = [], notices = [], logs = [];
	const waiting = deferred();
	let options, requestSignal, abortArchive, diskAborted = false, diskClosed = false;
	const destination = new WritableStream({
		abort: () => { diskAborted = true; },
		close: () => { diskClosed = true; }
	});
	const notify = (title, next) => {
		options = next;
		notices.push(title);
		if(cancelOnFinish && title === 'Finishing archive') next.onClose();
	};
	const dependencies = {
		'../../config/config': { config: { get: key => ({
			'selection.enabled': true, 'selection.archive.bufferLimitMib': disk ? 0 : 256,
			'selection.archive.requestDelayMs': delay
		})[key] } },
		'client-zip': { makeZip },
		'./archive-dialog': { confirmArchive: async files => ({
			files, filename: 'test.zip', needsDisk: disk, deselectOnStart: true,
			picker: disk ? Promise.resolve({ createWritable: async () => destination }) : null
		}) },
		'../../modules/toast': { createToast: () => ({ show: notify, update: notify, hide: () => {} }) },
		'../../modules/file-actions': { startDownload: (...args) => downloaded.push(args) },
		'../../modules/lifecycle': { onPageReplace: callback => { abortArchive = callback; return () => {}; } },
		'../../modules/logger': { log: { info: (...args) => logs.push(args) } },
		'./download': { getRowFile: row => row.file },
		'../../helpers/getReadableSize': { getReadableSize: () => '256 MiB' },
		'../../helpers/stringUtils': { hasControlCharacters: () => false }
	};
	const module = { exports: {} };
	vm.runInNewContext(javascript, {
		module, exports: module.exports,
		require: name => { assert.ok(name in dependencies, name); return dependencies[name]; },
		AbortController, DOMException, TextEncoder, Uint8Array, ReadableStream, TransformStream, Response, URL, Date, performance,
		clearTimeout,
		window: {
			location: { origin: 'https://example.test' }, addEventListener: () => {}, removeEventListener: () => {},
			clearTimeout,
			setTimeout: (callback, milliseconds) => {
				if(milliseconds === delay && delay) waiting.resolve();
				return setTimeout(callback, milliseconds).unref();
			}
		},
		fetch: (url, { signal }) => {
			requested.push(url);
			requestSignal = signal;
			return fetchFile ? fetchFile(signal) : Promise.resolve(new Response(new Uint8Array(4)));
		}
	});
	t.after(() => abortArchive?.());
	const rows = ['first.txt', 'second.txt'].map(name => ({
		file: { name, url: `https://example.test/${name}` },
		children: [null, { getAttribute: () => '1700000000' }, { getAttribute: () => '4' }]
	}));
	return {
		start: () => module.exports.archiveSelection(rows, () => {}),
		cancel: () => { assert.equal(options.closeLabel, 'Cancel archive'); options.onClose(); },
		waiting: waiting.promise, requested, downloaded, notices, logs,
		get busy() { return module.exports.archiveState.busy; },
		get aborted() { return requestSignal.aborted; },
		get diskAborted() { return diskAborted; },
		get diskClosed() { return diskClosed; },
		get options() { return options; }
	};
}

for(const disk of [false, true])
{
	test(`archive cancellation aborts an active response (${disk ? 'disk' : 'buffered'})`, { timeout: 3000 }, async t => {
		const read = deferred();
		const f = fixture(t, { disk, fetchFile: signal => Promise.resolve(new Response(new ReadableStream({
			start(controller) {
				controller.enqueue(new Uint8Array(1));
				signal.addEventListener('abort', () => controller.error(signal.reason), { once: true });
			},
			pull() { read.resolve(); }
		}))) });
		const running = f.start();
		await read.promise;
		f.cancel();
		await running;
		assert.equal(f.aborted, true);
		assert.equal(f.requested.length, 1, 'no later file is requested');
		assert.equal(f.downloaded.length, 0, 'no partial ZIP is downloaded');
		assert.equal(f.busy, false, 'another archive can start');
		assert.ok(!f.notices.includes('Archive failed'));
		assert.deepEqual(f.logs, [['archive', 'Archive cancelled']]);
		if(disk) {
			assert.equal(f.diskAborted, true);
			assert.equal(f.diskClosed, false, 'cancelled output is not committed');
		}
	});
}

test('archive cancellation interrupts the delay between files', { timeout: 3000 }, async t => {
	const f = fixture(t, { delay: 60000 });
	const running = f.start();
	await f.waiting;
	f.cancel();
	await running;
	assert.equal(f.requested.length, 1);
	assert.equal(f.downloaded.length, 0);
	assert.equal(f.busy, false);
});

test('archive cancellation during ZIP finalization prevents a download', { timeout: 3000 }, async t => {
	const f = fixture(t, { cancelOnFinish: true });
	await f.start();
	assert.ok(f.notices.includes('Finishing archive'));
	assert.equal(f.downloaded.length, 0);
	assert.equal(f.busy, false);
});

test('a completed archive returns the notification to ordinary dismissal', { timeout: 3000 }, async t => {
	const f = fixture(t);
	await f.start();
	assert.equal(f.downloaded.length, 1);
	assert.equal(f.downloaded[0][1], 'test.zip');
	assert.equal(f.options.onClose, undefined);
	assert.equal(f.options.closeLabel, undefined);
	assert.deepEqual(f.logs, []);
	assert.equal(f.busy, false);
	URL.revokeObjectURL(f.downloaded[0][0]);
});
