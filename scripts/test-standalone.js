import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const project = fileURLToPath(new URL('../', import.meta.url));
const generator = path.join(project, 'scripts/make-standalone.js');

const fixture = (t, assetDir = 'indexer') =>
{
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ivfi-standalone-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const assets = path.join(root, 'build', assetDir);
	fs.mkdirSync(assets, { recursive: true });
	fs.cpSync(path.join(project, 'build/indexer'), assets, { recursive: true });
	for(const [source, target] of [
		['build/indexer.php', 'build/indexer.php'],
		['build/indexer/css/style.css', `build/${assetDir}/css/style.css`]
	])
	{
		const contents = fs.readFileSync(path.join(project, source), 'utf8');
		fs.writeFileSync(path.join(root, target), contents.replaceAll('/indexer/', `/${assetDir}/`));
	}
	return root;
};

const run = (root) =>
{
	const result = spawnSync(process.execPath, [generator], { cwd: root, encoding: 'utf8' });
	assert.ifError(result.error);
	return result;
};

for(const assetDir of ['indexer', 'media', 'assets/indexer'])
{
	test(`embeds assets from ${assetDir}`, (t) =>
	{
		const root = fixture(t, assetDir);
		const result = run(root);
		assert.equal(result.status, 0, result.stdout + result.stderr);
		const output = fs.readFileSync(path.join(root, 'build/standalone.php'), 'utf8');
		assert.ok(!output.includes(`/${assetDir}/main.js?bust`));
		assert.ok(!output.includes(`/${assetDir}/css/style.css?bust`));
		assert.equal((output.match(/data:application\/font-woff2/g) || []).length, 7);
		assert.ok(output.includes('<script type="text/javascript">'));
		assert.ok(output.includes(fs.readFileSync(path.join(root, 'build', assetDir, 'main.js'), 'binary')));
	});
}

test('rejects missing font references', (t) =>
{
	const root = fixture(t);
	fs.writeFileSync(path.join(root, 'build/indexer/css/style.css'), 'body { color: black; }');
	const result = run(root);
	assert.equal(result.status, 1);
	assert.ok((result.stdout + result.stderr).includes('Could not locate font assets'));
	assert.ok(!fs.existsSync(path.join(root, 'build/standalone.php')));
});

for(const [needle, replacement, message] of [
	['main.js?bust', 'unknown.js?bust', 'Could not locate the main.js reference'],
	['style.css?bust', 'unknown.css?bust', 'Could not locate the style.css reference'],
	['</body>', '</missing-body>', 'Could not locate </body>']
])
{
	test(`rejects missing ${needle}`, (t) =>
	{
		const root = fixture(t);
		const index = path.join(root, 'build/indexer.php');
		fs.writeFileSync(index, fs.readFileSync(index, 'utf8').replaceAll(needle, replacement));
		const result = run(root);
		assert.equal(result.status, 1);
		assert.ok((result.stdout + result.stderr).includes(message));
		assert.ok(!fs.existsSync(path.join(root, 'build/standalone.php')));
	});
}
