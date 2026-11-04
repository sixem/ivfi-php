import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { changesSince, readOptions } from './dev.js';

test('dev options use portable paths, local defaults and CLI overrides', async t => {
	const root = await mkdtemp(join(tmpdir(), 'ivfi-options-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, 'files with spaces'));
	await writeFile(join(root, 'dev.config.local.json'), JSON.stringify({ files: 'files with spaces', port: 13140, poll: true }));
	const options = await readOptions(['--port', '13141', '--php', 'custom php'], root);
	assert.equal(options.files, join(root, 'files with spaces'));
	assert.equal(options.port, 13141);
	assert.equal(options.php, 'custom php');
	assert.equal(options.poll, true);
	assert.equal((await readOptions(['--no-poll'], root)).poll, false);
	await assert.rejects(readOptions(['--port', '0'], root), /between 1 and 65535/);
	await assert.rejects(readOptions(['--port', '1.5'], root), /between 1 and 65535/);
	await assert.rejects(readOptions(['--port', '65536'], root), /between 1 and 65535/);
	await assert.rejects(readOptions(['--files', 'missing'], root), /Cannot use files directory/);
	await assert.rejects(readOptions(['--files', 'dev.config.local.json'], root), /not a directory/);
	await assert.rejects(readOptions(['--file', 'anything'], root), /Unknown option/);
	await writeFile(join(root, 'dev.config.local.json'), '{');
	await assert.rejects(readOptions([], root), /Cannot read dev.config.local.json/);
	assert.deepEqual(await readOptions(['--help'], root), { help: true });
	await writeFile(join(root, 'dev.config.local.json'), '{"unknown":true}');
	await assert.rejects(readOptions([], root), /Unknown dev configuration option/);
	await rm(join(root, 'dev.config.local.json'));
	await assert.rejects(readOptions([], root), /--files/);
});

test('reload decisions ignore maps/no-ops and only swap existing CSS assets', () => {
	const previous = { 'main.js': 'js', 'style.css': 'css', 'indexer.php': 'php', 'style.css.map': 'map' };
	assert.equal(changesSince(previous, { ...previous }), null);
	assert.equal(changesSince(previous, { ...previous, 'style.css.map': 'new' }), null);
	assert.deepEqual(changesSince(previous, { ...previous, 'style.css': 'new' }), { type: 'css', paths: ['/style.css'] });
	assert.equal(changesSince(previous, { ...previous, 'main.js': 'new' }).type, 'reload');
	assert.equal(changesSince(previous, { ...previous, 'indexer.php': 'new' }).type, 'reload');
	assert.equal(changesSince(previous, { ...previous, 'extra.css': 'new' }).type, 'reload');
	const removed = { ...previous };
	delete removed['style.css'];
	assert.equal(changesSince(previous, removed).type, 'reload');
});

test('browser keeps existing styles until CSS loads and handles missed updates', async () => {
	const source = await readFile(new URL('./dev/client.js', import.meta.url), 'utf8');
	const links = [], streams = [], windowEvents = {};
	let reloads = 0;
	const link = href => ({
		href,
		cloneNode() { return link(this.href); },
		after(replacement) { links.splice(links.indexOf(this) + 1, 0, replacement); },
		remove() { links.splice(links.indexOf(this), 1); }
	});
	const original = link('http://localhost:13131/indexer/css/style.css?existing=1');
	links.push(original);
	class EventSource {
		listeners = {};
		constructor() { streams.push(this); }
		addEventListener(event, callback) { this.listeners[event] = callback; }
		close() { this.closed = true; }
		send(event, data) { this.listeners[event]({ data: JSON.stringify(data) }); }
	}
	vm.runInNewContext(source, {
		URL, Promise, setTimeout, clearTimeout, EventSource,
		document: { currentScript: { dataset: { revision: 'one' } }, querySelectorAll: () => links },
		window: { location: { origin: 'http://localhost:13131', reload: () => reloads++ },
			addEventListener: (event, callback) => { windowEvents[event] = callback; } }
	});
	const flush = () => new Promise(resolve => setImmediate(resolve));
	streams[0].send('ready', { revision: 'one' });
	streams[0].send('update', { previous: 'one', revision: 'two', type: 'css', paths: ['/indexer/css/style.css'] });
	await flush();
	assert.equal(links.length, 2, 'old styles remain until the new stylesheet is ready');
	assert.equal(reloads, 0, 'CSS updates must preserve the page and playback');
	assert.equal(new URL(links[1].href).searchParams.get('existing'), '1');
	links[1].onload();
	await flush();
	assert.equal(links.length, 1);
	assert.notEqual(links[0], original);
	streams[0].send('ready', { revision: 'two' });
	await flush();
	assert.equal(reloads, 0, 'reconnecting to the same build does not reload');
	windowEvents.pagehide();
	assert.equal(streams[0].closed, true);
	windowEvents.pageshow({ persisted: true });
	assert.equal(streams.length, 2, 'a restored browser history entry reconnects');
	streams[1].send('ready', { revision: 'missed-build' });
	await flush();
	assert.equal(reloads, 1, 'a missed build refreshes stale content');
	streams[1].send('update', { type: 'reload' });
	await flush();
	assert.equal(reloads, 1, 'only one refresh may be pending');
});
