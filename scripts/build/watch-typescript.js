import { resolve } from 'node:path';
import ts from 'typescript';

/** Type-only re-exports disappear from JavaScript, but must still invalidate the checker. */
export default class WatchTypeScriptPlugin
{
	apply(compiler) {
		const source = resolve(compiler.context, 'src/core');
		compiler.hooks.afterCompile.tap('WatchTypeScript', compilation => {
			compilation.contextDependencies.add(source);
			for(const file of ts.sys.readDirectory(source, ['.ts', '.tsx'])) compilation.fileDependencies.add(file);
		});
	}
}
