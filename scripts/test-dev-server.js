import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
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
	await writeFile(join(files, 'page.html'), '<html><body>Untouched file</body></html>');
	await writeFile(join(files, '.secret'), 'private');
	await writeFile(join(files, 'code.php'), '<?php echo "must not execute";');
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
	await (await get('/?diagnostic=1')).text();
	assert.match(await (await get('/custom/assets/style.css')).text(), /color: white/);
	assert.match(await (await get('/__ivfi_dev/client.js')).text(), /EventSource/);
	for(const path of ['/.secret', '/%2esecret', '/code.php', '/code.php/extra', '/..%5c.secret'])
		assert.equal((await get(path)).status, 404, path);
	if(process.platform !== 'win32')
	{
		await symlink(root, join(files, 'outside'));
		assert.equal((await get('/outside/')).status, 404, 'directories cannot escape the chosen files root');
	}
	for(const [range, start, end] of [['bytes=120-511', 120, 512], ['bytes=-128', 65408, 65536], ['bytes=65530-', 65530, 65536]])
	{
		const response = await get('/sample%20audio.mp3', { headers: { Range: range } });
		assert.equal(response.status, 206);
		assert.equal(response.headers.get('content-range'), `bytes ${start}-${end - 1}/${audio.length}`);
		assert.deepEqual(Buffer.from(await response.arrayBuffer()), audio.subarray(start, end));
	}
	assert.equal((await get('/sample%20audio.mp3', { headers: { Range: 'bytes=65536-' } })).status, 416);
	const head = await get('/sample%20audio.mp3', { method: 'HEAD' });
	assert.equal(head.headers.get('content-length'), String(audio.length));
	assert.equal((await head.arrayBuffer()).byteLength, 0);
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

test('missing PHP produces an actionable error', async () => {
	await assert.rejects(startServer({ php: 'ivfi-missing-php-executable' }), /Install PHP 8\+ or use --php/);
});

test('PHP edits are syntax checked without executing the application', async () => {
	const php = process.env.PHP_BINARY || 'php';
	await lintPhp(php, '<?php throw new Exception("This must not execute"); ?>');
	await assert.rejects(lintPhp(php, '<?php if ( ?>'), /PHP syntax check failed/);
});
