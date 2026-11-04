import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, open, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { startServer } from './dev/server.js';
import { lintPhp } from './dev.js';

test('PHP development server: reload events, listings, streaming and shutdown', { timeout: 30000 }, async t => {
	const root = await mkdtemp(join(tmpdir(), 'ivfi-server-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const files = join(root, 'files with spaces'), buildDir = join(root, 'build');
	await mkdir(files);
	await mkdir(join(files, 'nested'));
	await mkdir(join(buildDir, 'custom', 'assets'), { recursive: true });
	await writeFile(join(buildDir, 'indexer.php'), '<?php header("Content-Type: text/html"); if(isset($_GET["diagnostic"])) error_log("IVFi: test diagnostic\\nDiagnostic continuation"); ?><!doctype html><html><body><?= htmlspecialchars($_SERVER["REQUEST_URI"]) ?></body></html>');
	await writeFile(join(buildDir, 'custom', 'assets', 'style.css'), 'body { color: white; }');
	await mkdir(join(files, 'custom', 'assets'), { recursive: true });
	await writeFile(join(files, 'custom', 'assets', 'style.css'), 'old build');
	await writeFile(join(files, 'page.html'), '<html><body>Untouched file</body></html>');
	await writeFile(join(files, 'empty.mp3'), '');
	await writeFile(join(files, '.secret'), 'private');
	await writeFile(join(files, 'code.php'), '<?php echo "must not execute";');
	const staticTypes = {
		jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
		ico: 'image/x-icon', svg: 'image/svg+xml', bmp: 'image/bmp', webp: 'image/webp', avif: 'image/avif',
		html: 'text/html', txt: 'text/plain', json: 'application/json',
		woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf'
	};
	// Deliberately unrecognizable contents: common MIME types must not depend on fileinfo sniffing.
	for(const extension of Object.keys(staticTypes)) await writeFile(join(files, `asset.${extension}`), 'fixture');
	const audio = Buffer.from(Array.from({ length: 65536 }, (_, i) => i % 256));
	await writeFile(join(files, 'sample audio.mp3'), audio);
	const unexpected = [], diagnostics = [];
	const server = await startServer({ files, buildDir, port: 0, php: process.env.PHP_BINARY || 'php',
		onExit: error => unexpected.push(error), onDiagnostic: message => diagnostics.push(message) });
	t.after(() => server.close());
	const origin = `http://127.0.0.1:${server.port}`;
	const get = (path, options = {}) => fetch(origin + path, { ...options, signal: AbortSignal.timeout(5000) });
	const starting = await get('/');
	assert.equal(starting.status, 503);
	assert.match(await starting.text(), /__ivfi_dev\/client.js/);
	const font = await get('/__ivfi_dev/font.woff2');
	assert.equal(font.headers.get('content-type'), 'font/woff2');
	assert.equal(Buffer.from(await font.arrayBuffer()).subarray(0, 4).toString(), 'wOF2', 'font is available before the first build');
	const abort = new AbortController();
	t.after(() => abort.abort());
	const events = await fetch(origin + '/__ivfi_dev/events', { signal: abort.signal });
	const reader = events.body.getReader();
	const initial = new TextDecoder().decode((await reader.read()).value);
	assert.match(initial, /event: ready/);
	server.update({ type: 'reload', paths: ['/indexer.php'] });
	assert.match(new TextDecoder().decode((await reader.read()).value), /event: update/);
	for(const path of ['/', '/nested/', '/nested/?sort=name'])
	{
		const response = await get(path);
		assert.equal(response.status, 200);
		assert.equal(response.headers.get('x-ivfi-dev-page'), null);
		assert.match(await response.text(), /<script src="\/__ivfi_dev\/client.js" data-revision="[^"]+" defer><\/script><\/body>/);
	}
	assert.equal(await (await get('/page.html')).text(), '<html><body>Untouched file</body></html>');
	for(const [extension, type] of Object.entries(staticTypes))
	{
		const response = await get(`/asset.${extension}`);
		assert.equal(response.headers.get('content-type').split(';')[0], type, extension);
		assert.equal(await response.text(), 'fixture');
	}
	await (await get('/?diagnostic=1')).text();
	assert.match(await (await get('/custom/assets/style.css')).text(), /color: white/);
	assert.match(await (await get('/__ivfi_dev/client.js')).text(), /EventSource/);
	for(const path of ['/.secret', '/%2esecret', '/code.php', '/code.php/extra', '/..%5c.secret'])
		assert.equal((await get(path)).status, 404, path);
	if(process.platform !== 'win32')
	{
		await symlink(root, join(files, 'outside'));
		assert.equal((await get('/outside/')).status, 404, 'directories cannot escape the chosen files root');
		await symlink(join(buildDir, 'indexer.php'), join(files, 'outside.txt'));
		assert.equal((await get('/outside.txt')).status, 404, 'files cannot escape the chosen files root');
		await symlink(join(files, 'code.php'), join(files, 'source.txt'));
		assert.equal((await get('/source.txt')).status, 404, 'PHP source aliases must not be streamed');
	}
	for(const [range, start, end] of [['bytes=120-511', 120, 512], ['bytes=-128', 65408, 65536], ['bytes=65530-', 65530, 65536]])
	{
		const response = await get('/sample%20audio.mp3', { headers: { Range: range } });
		assert.equal(response.status, 206);
		assert.equal(response.headers.get('content-range'), `bytes ${start}-${end - 1}/${audio.length}`);
		assert.equal(response.headers.get('content-type'), 'audio/mpeg');
		for(const header of ['x-ivfi-dev-file', 'x-ivfi-dev-offset', 'x-ivfi-dev-length'])
			assert.equal(response.headers.get(header), null, 'file handoff metadata stays internal');
		assert.deepEqual(Buffer.from(await response.arrayBuffer()), audio.subarray(start, end));
	}
	assert.equal((await get('/sample%20audio.mp3', { headers: { Range: 'bytes=65536-' } })).status, 416);
	const head = await get('/sample%20audio.mp3', { method: 'HEAD' });
	assert.equal(head.headers.get('content-length'), String(audio.length));
	assert.equal((await head.arrayBuffer()).byteLength, 0);
	for(const [ifRange, status, length] of [[head.headers.get('etag'), 206, 4], [head.headers.get('last-modified'), 206, 4], ['"outdated"', 200, audio.length]])
	{
		const response = await get('/sample%20audio.mp3', { headers: { Range: 'bytes=0-3', 'If-Range': ifRange } });
		assert.equal(response.status, status);
		assert.equal((await response.arrayBuffer()).byteLength, length);
	}
	const empty = await get('/empty.mp3');
	assert.equal(empty.status, 200);
	assert.equal(empty.headers.get('content-length'), '0');
	assert.equal((await empty.arrayBuffer()).byteLength, 0);
	assert.equal((await get('/empty.mp3', { headers: { Range: 'bytes=0-' } })).status, 416);
	const post = await get('/page.html', { method: 'POST' });
	assert.equal(post.status, 405);
	assert.equal(post.headers.get('allow'), 'GET, HEAD');
	// Sparse fixtures exceed socket buffers without allocating large buffers or writing megabytes.
	for(const name of ['large.mp4', 'download.bin'])
	{
		const file = await open(join(files, name), 'w');
		try { await file.truncate(128 * 1024 * 1024); } finally { await file.close(); }
		const stalled = await new Promise((resolve, reject) => {
			const request = http.get(origin + '/' + name, response => {
				response.once('readable', () => resolve({ request, response }));
			});
			request.on('error', reject);
			t.after(() => request.destroy());
		});
		try {
			assert.equal(stalled.response.statusCode, 200);
			assert.equal(stalled.response.complete, false, 'download remains open without a reader');
			const listing = await get('/nested/');
			assert.equal(listing.status, 200, 'a stalled download must not block PHP listings');
			assert.match(await listing.text(), /__ivfi_dev\/client.js/);
			assert.match(await (await get('/custom/assets/style.css')).text(), /color: white/);
			const seek = await get('/sample%20audio.mp3', { headers: { Range: 'bytes=12-15' } });
			assert.equal(seek.status, 206);
			assert.deepEqual(Buffer.from(await seek.arrayBuffer()), audio.subarray(12, 16));
		} finally {
			stalled.request.destroy();
		}
	}
	const rejectedHost = await new Promise((resolve, reject) => {
		const request = http.get(origin, { headers: { Host: 'unrelated.example' } }, response => { response.resume(); resolve(response.statusCode); });
		request.on('error', reject);
	});
	assert.equal(rejectedHost, 403);
	await assert.rejects(startServer({ files, buildDir, port: server.port, php: 'php' }), /already in use/);
	abort.abort();
	await server.close();
	assert.equal(unexpected.length, 0);
	assert.ok(diagnostics.includes('IVFi: test diagnostic'), 'application diagnostics must reach the terminal');
	assert.ok(diagnostics.includes('Diagnostic continuation'), 'multiline diagnostics must remain intact');
	assert.ok(!diagnostics.some(line => /Accepted|Closing|\[200\]/.test(line)), 'routine PHP traffic stays quiet');
	const reused = await startServer({ files, buildDir, port: server.port, php: 'php' });
	await reused.close();
});

test('relative PHP executable paths survive the media-directory cwd', { timeout: 15000 }, async t => {
	const { stdout } = await promisify(execFile)(process.env.PHP_BINARY || 'php', ['-r', 'echo PHP_BINARY;']);
	const php = relative(process.cwd(), stdout);
	if(isAbsolute(php)) return t.skip('PHP is on a different Windows drive and has no relative path');
	const root = await mkdtemp(join(tmpdir(), 'ivfi-relative-php-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const files = join(root, 'files'), buildDir = join(root, 'build');
	await mkdir(files);
	await mkdir(buildDir);
	await writeFile(join(buildDir, 'indexer.php'), '<html><body>Relative PHP works</body></html>');
	const server = await startServer({ files, buildDir, port: 0, php });
	t.after(() => server.close());
	server.update();
	const response = await fetch(`http://127.0.0.1:${server.port}/`, { signal: AbortSignal.timeout(5000) });
	assert.equal(response.status, 200);
	assert.match(await response.text(), /Relative PHP works/);
});

test('missing PHP produces an actionable error', async () => {
	await assert.rejects(startServer({ php: 'ivfi-missing-php-executable' }), /Install PHP 8\+ or use --php/);
});

test('PHP edits are syntax checked without executing the application', async () => {
	const php = process.env.PHP_BINARY || 'php';
	await lintPhp(php, '<?php throw new Exception("This must not execute"); ?>');
	await assert.rejects(lintPhp(php, '<?php if ( ?>'), /PHP syntax check failed/);
});
