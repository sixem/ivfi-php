import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { startServer } from './dev/server.js';
import { createDevLogger } from './dev/logger.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const help = `Usage: pnpm dev --files <directory> [options]

Run PHP, rebuild source changes, and update the browser at http://localhost:13131/.

  --files <directory>  Directory to browse (required unless saved locally)
  --port <number>      Local HTTP port (default: 13131)
  --php <executable>   PHP 8+ executable (default: php)
  --poll              Poll for changes on WSL/network filesystems
  --no-poll           Disable polling saved in local configuration
  --help, -h          Show this help

Optional defaults: dev.config.local.json in the repository root.
Keys: files, port, php, poll. Command-line options take precedence.
Relative file paths are resolved from the repository root.
`;

export async function readOptions(args, root = projectRoot)
{
	const { values } = parseArgs({ args, options: {
		files: { type: 'string' }, port: { type: 'string' }, php: { type: 'string' },
		poll: { type: 'boolean' }, 'no-poll': { type: 'boolean' }, help: { type: 'boolean', short: 'h' }
	} });
	if(values.help) return { help: true };
	if(values.poll && values['no-poll']) throw new Error('Choose either --poll or --no-poll.');
	if(values['no-poll']) values.poll = false;
	delete values['no-poll'];
	let local = {};
	try {
		local = JSON.parse(await readFile(resolve(root, 'dev.config.local.json'), 'utf8'));
	} catch(error) {
		if(error.code !== 'ENOENT') throw new Error(`Cannot read dev.config.local.json: ${error.message}`);
	}
	if(!local || Array.isArray(local) || typeof local !== 'object')
		throw new Error('dev.config.local.json must contain a JSON object.');
	for(const key of Object.keys(local))
		if(!['files', 'port', 'php', 'poll'].includes(key)) throw new Error(`Unknown dev configuration option: ${key}`);
	const options = { port: 13131, php: 'php', poll: false, ...local, ...values };
	if(typeof options.files !== 'string' || !options.files.trim())
		throw new Error('Choose a directory with --files <directory>, or set "files" in dev.config.local.json.');
	if(!/^\d+$/.test(String(options.port)) || Number(options.port) < 1 || Number(options.port) > 65535)
		throw new Error('--port must be an integer between 1 and 65535.');
	options.port = Number(options.port);
	if(typeof options.php !== 'string' || !options.php.trim()) throw new Error('--php must name a PHP executable.');
	if(typeof options.poll !== 'boolean') throw new Error('The poll option must be true or false.');
	try {
		options.files = await realpath(resolve(root, options.files));
		if(!(await stat(options.files)).isDirectory()) throw new Error('not a directory');
	} catch(error) {
		throw new Error(`Cannot use files directory ${options.files}: ${error.message}`);
	}
	return options;
}

/** Compare the bytes browsers use, excluding source maps. No-op builds do not refresh. */
export function changesSince(previous, current)
{
	const changed = [...new Set([...Object.keys(previous), ...Object.keys(current)])]
		.filter(name => !name.endsWith('.map') && previous[name] !== current[name]);
	if(!changed.length) return null;
	const cssOnly = changed.every(name => name.endsWith('.css') && previous[name] && current[name]);
	return { type: cssOnly ? 'css' : 'reload', paths: changed.map(name => '/' + name) };
}

/** Lint the generated PHP before publishing a build, without executing it. */
export function lintPhp(php, source)
{
	return new Promise((resolve, reject) => {
		const child = execFile(php, ['-l'], { timeout: 10000 }, (error, stdout, stderr) => {
			if(error) reject(new Error(`PHP syntax check failed:\n${stderr || stdout || error.message}`));
			else resolve();
		});
		child.stdin.on('error', () => { /* execFile reports early exits through its callback. */ });
		child.stdin.end(source);
	});
}

async function main(logger)
{
	const options = await readOptions(process.argv.slice(2));
	if(options.help) { console.log(help); return; }
	// Existing build helpers resolve their inputs against the project directory.
	process.chdir(projectRoot);
	const buildDir = resolve(projectRoot, '.ivfi-dev');
	let server, compiler, stopping = false;
	const shutdown = async (code = 0) => {
		if(stopping) return;
		stopping = true;
		logger.stop();
		process.exitCode = code;
		const timeout = setTimeout(() => process.exit(code), 5000).unref();
		await Promise.all([
			server?.close(),
			compiler && new Promise(done => compiler.close(done))
		]);
		clearTimeout(timeout);
	};
	for(const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => void shutdown());
	try {
		server = await startServer({ ...options, buildDir, onDiagnostic: logger.php, onExit: error => {
			logger.error(error);
			void shutdown(1);
		} });
		if(stopping) { await server.close(); return; }
		const { version } = JSON.parse(await readFile(resolve(projectRoot, 'package.json'), 'utf8'));
		logger.start({ ...options, version });
		logger.building();
		const [{ default: webpack }, { default: makeConfig }] = await Promise.all([
			import('webpack'), import('./build/webpack.config.js')
		]);
		if(stopping) return;
		const config = makeConfig({ devServer: true }, { mode: 'development' });
		config.output.path = buildDir;
		config.optimization.emitOnErrors = false;
		compiler = webpack(config);
		let previous = {}, current = {}, validPhp, hasBuild = false;
		compiler.hooks.watchRun.tap('DevStatus', () => logger.building());
		compiler.hooks.thisCompilation.tap('DevReload', compilation => {
			compilation.hooks.processAssets.tapPromise({ name: 'DevReload', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT }, async () => {
				current = Object.fromEntries(compilation.getAssets().filter(asset => !asset.name.endsWith('.map')).map(asset => [
					asset.name, createHash('sha256').update(asset.source.buffer()).digest('hex')
				]));
				if(current['indexer.php'] && current['indexer.php'] !== validPhp)
				{
					try {
						await lintPhp(options.php, compilation.getAsset('indexer.php').source.buffer());
						validPhp = current['indexer.php'];
					} catch(error) {
						compilation.errors.push(error);
					}
				}
			});
		});
		compiler.watch({ aggregateTimeout: 150, ...(options.poll ? { poll: 1000 } : {}) }, (error, stats) => {
			if(stopping) return;
			if(error || stats.hasErrors())
			{
				logger.failed(error ? error.stack || error.message : stats.toString({ all: false, errors: true, errorDetails: true, colors: logger.colors }), hasBuild);
				return;
			}
			const change = changesSince(previous, current);
			previous = current;
			server.update(change);
			if(stats.hasWarnings()) logger.warnings(stats.toString({ all: false, warnings: true, colors: logger.colors }));
			logger.built(stats.endTime - stats.startTime, change, !hasBuild, stats.hasWarnings());
			hasBuild = true;
		});
	} catch(error) {
		await shutdown(1);
		throw error;
	}
}

if(process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
{
	const logger = createDevLogger();
	main(logger).catch(error => { logger.error(error); process.exitCode = 1; });
}
