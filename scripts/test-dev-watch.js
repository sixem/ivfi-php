import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import webpack from 'webpack';
import WatchTypeScriptPlugin from './build/watch-typescript.js';

const require = createRequire(import.meta.url);

test('watch mode recovers when a type-only re-export fixes a compiler error', { timeout: 60000 }, async t => {
	const root = await mkdtemp(join(tmpdir(), 'ivfi-watch-types-'));
	await mkdir(join(root, 'src/core/types'), { recursive: true });
	const entry = join(root, 'src/core/main.ts'), definition = join(root, 'src/core/types/media.ts');
	await writeFile(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2018', module: 'ESNext', types: [] } }));
	await writeFile(join(root, 'src/core/types/index.ts'), 'export * from "./media";');
	await writeFile(definition, 'export type Media = { name: string };');
	await writeFile(entry, 'import { Media } from "./types"; export const media: Media = { name: "track" };');
	const compiler = webpack({
		context: root, mode: 'development', entry, devtool: false,
		output: { path: join(root, 'build'), filename: 'main.js' },
		resolve: { extensions: ['.ts', '.js'] },
		optimization: { emitOnErrors: false },
		module: { rules: [{ test: /\.ts$/, loader: require.resolve('ts-loader') }] },
		plugins: [new WatchTypeScriptPlugin()]
	});
	const builds = [];
	let waiting;
	const nextBuild = () => builds.length ? Promise.resolve(builds.shift()) : new Promise(resolve => { waiting = resolve; });
	compiler.watch({ aggregateTimeout: 50, poll: 100 }, (error, stats) => {
		const result = { error, stats };
		if(waiting) { const resolve = waiting; waiting = null; resolve(result); }
		else builds.push(result);
	});
	t.after(async () => {
		await new Promise(resolve => compiler.close(resolve));
		await rm(root, { recursive: true, force: true });
	});
	const check = async errors => {
		const { error, stats } = await nextBuild();
		assert.ifError(error);
		assert.equal(stats.hasErrors(), errors, stats.toString({ all: false, errors: true }));
	};
	await check(false);
	const original = await readFile(join(root, 'build/main.js'), 'utf8');
	await writeFile(entry, 'import { Media } from "./types"; export const media: Media = { name: "track", bytes: 123 };');
	await check(true);
	assert.equal(await readFile(join(root, 'build/main.js'), 'utf8'), original, 'a failed build preserves the working bundle');
	await writeFile(definition, 'export type Media = { name: string; bytes?: number };');
	await check(false);
	assert.match(await readFile(join(root, 'build/main.js'), 'utf8'), /bytes: 123/);
});
