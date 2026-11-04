import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';

const execute = promisify(execFile);
const router = fileURLToPath(new URL('../dev-router.php', import.meta.url));
const [clientSource, loadingPage, loadingFont] = await Promise.all([
	readFile(new URL('./client.js', import.meta.url)),
	readFile(new URL('./loading.html', import.meta.url), 'utf8'),
	readFile(new URL('../../src/assets/fonts/Inter-Regular-Latin.woff2', import.meta.url))
]);
const listen = (server, port) => new Promise((resolve, reject) => {
	server.once('error', reject);
	server.listen(port, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
});

export async function startServer({ port, files, php, buildDir, onExit = () => {}, onDiagnostic = message => console.error(`[php] ${message}`) })
{
	try {
		const { stdout } = await execute(php, ['-r', 'echo PHP_VERSION_ID;'], { timeout: 10000 });
		if(Number(stdout) < 80000 || !/^\d+$/.test(stdout)) throw new Error('PHP 8.0 or newer is required.');
	} catch(error) {
		throw new Error(`Cannot run PHP (${php}): ${error.message} Install PHP 8+ or use --php <executable>.`);
	}
	let backend, backendPort, ready = false, closing = false, revision = randomUUID();
	const clients = new Set();
	const clientTag = current => `<script src="/__ivfi_dev/client.js" data-revision="${current}" defer></script>`;
	const send = (response, event, data) => response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
	const server = http.createServer((request, response) => {
		const host = request.headers.host;
		const actualPort = server.address().port;
		const suffix = actualPort === 80 ? '' : `:${actualPort}`;
		if(![`localhost${suffix}`, `127.0.0.1${suffix}`, `localhost:${actualPort}`, `127.0.0.1:${actualPort}`].includes(host))
		{
			response.writeHead(403).end('Use the localhost URL printed by pnpm dev.');
			return;
		}
		response.setHeader('Cache-Control', 'no-store');
		const path = request.url.split('?')[0];
		if(path.startsWith('/__ivfi_dev/'))
		{
			if(request.method !== 'GET') { response.writeHead(405, { Allow: 'GET' }).end(); return; }
			if(path === '/__ivfi_dev/client.js')
			{
				response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }).end(clientSource);
			} else if(path === '/__ivfi_dev/font.woff2') {
				response.writeHead(200, { 'Content-Type': 'font/woff2' }).end(loadingFont);
			} else if(path === '/__ivfi_dev/events') {
				response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Connection': 'keep-alive' });
				response.write('retry: 1000\n\n');
				send(response, 'ready', { revision });
				clients.add(response);
				response.once('close', () => clients.delete(response));
			} else response.writeHead(404).end();
			return;
		}
		if(!ready)
		{
			response.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '1' });
			response.end(loadingPage.replace('<!--dev-client-->', clientTag(revision)));
			return;
		}
		const currentRevision = revision;
		const headers = { ...request.headers, connection: 'close', 'accept-encoding': 'identity' };
		delete headers['if-none-match'];
		delete headers['if-modified-since'];
		const upstream = http.request({ hostname: '127.0.0.1', port: backendPort, path: request.url, method: request.method, headers, agent: false }, incoming => {
			const headers = { ...incoming.headers, 'cache-control': 'no-store' };
			const inject = headers['x-ivfi-dev-page'] === '1' && incoming.statusCode === 200 && request.method === 'GET';
			delete headers['x-ivfi-dev-page'];
			incoming.on('error', () => response.destroy());
			if(inject)
			{
				const chunks = [];
				incoming.on('data', chunk => chunks.push(chunk));
				incoming.on('end', () => {
					const body = Buffer.concat(chunks).toString('utf8').replace(/<\/body>/i, clientTag(currentRevision) + '</body>');
					delete headers['content-length'];
					delete headers['transfer-encoding'];
					response.writeHead(incoming.statusCode, headers).end(body);
				});
			} else {
				// Preserve byte ranges and stream files with backpressure; only listings are buffered.
				response.writeHead(incoming.statusCode, headers);
				incoming.pipe(response);
			}
		});
		upstream.on('error', () => {
			if(response.headersSent) response.destroy();
			else response.writeHead(502).end('PHP is unavailable. Check the development terminal.');
		});
		request.on('error', () => upstream.destroy());
		response.on('close', () => upstream.destroy());
		request.pipe(upstream);
	});
	const heartbeat = setInterval(() => {
		for(const client of clients) if(!client.write(': keepalive\n\n')) client.destroy();
	}, 15000).unref();
	const close = async () => {
		if(closing) return;
		closing = true;
		clearInterval(heartbeat);
		for(const client of clients) client.end();
		const stopped = backend?.pid && backend.exitCode === null && backend.signalCode === null
			? once(backend, 'exit').catch(() => {}) : Promise.resolve();
		backend?.kill();
		const timeout = setTimeout(() => backend?.kill('SIGKILL'), 2000).unref();
		await Promise.all([stopped, new Promise(done => { server.close(done); server.closeAllConnections(); })]);
		clearTimeout(timeout);
	};
	try {
		await listen(server, port);
		// PHP cannot inherit a listening socket. Reserve a free loopback port, then hand it over.
		const reservation = http.createServer();
		await listen(reservation, 0);
		backendPort = reservation.address().port;
		await new Promise(done => reservation.close(done));
		const environment = { ...process.env, IVFI_DEV_BUILD_DIR: buildDir };
		delete environment.PHP_CLI_SERVER_WORKERS;
		backend = spawn(php, ['-d', 'output_buffering=0', '-d', 'zlib.output_compression=0', '-d', 'opcache.enable_cli=0',
			'-S', `127.0.0.1:${backendPort}`, '-t', files, router], {
			cwd: files, env: environment,
			stdio: ['ignore', 'ignore', 'pipe']
		});
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(() => reject(new Error('PHP did not start within 10 seconds.')), 10000);
			let output = '', started = false;
			backend.once('error', error => { clearTimeout(timeout); reject(error); });
			backend.once('exit', code => {
				clearTimeout(timeout);
				const error = new Error(`PHP exited (${code ?? 'signal'}). ${output.trim()}`);
				if(!started) reject(error);
				else if(!closing) onExit(error);
			});
			createInterface({ input: backend.stderr }).on('line', line => {
				const message = line.replace(/^\[[^\]]+\]\s*/, '');
				output = (output + message + '\n').slice(-4000);
				if(!started && output.includes('Development Server') && output.includes('started'))
				{
					started = true;
					clearTimeout(timeout);
					resolve();
					return;
				}
				// Hide routine requests, but preserve PHP diagnostics and application error_log output.
				if(message && !/^127\.0\.0\.1:\d+ (?:Accepted|Closing|Closed without sending a request.*|\[[23]\d\d\]:.*)$/.test(message))
					onDiagnostic(message);
			});
		});
	} catch(error) {
		await close();
		if(error.code === 'EADDRINUSE') throw new Error(`Port ${port} is already in use. Stop the other server or choose --port <number>.`);
		throw error;
	}
	return {
		port: server.address().port,
		close,
		update(change) {
			ready = true;
			if(!change) return;
			const previous = revision;
			revision = randomUUID();
			for(const client of clients) send(client, 'update', { ...change, previous, revision });
		}
	};
}
