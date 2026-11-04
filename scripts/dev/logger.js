const palette = { dim: 2, bold: 1, cyan: 36, green: 32, yellow: 33, red: 31 };

/** Small, dependency-free terminal reporter. Redirected output stays plain text. */
export function createDevLogger({ stdout = process.stdout, stderr = process.stderr, env = process.env } = {})
{
	const supportsColor = stream => !('NO_COLOR' in env) && env.TERM !== 'dumb'
		&& (env.FORCE_COLOR !== undefined ? env.FORCE_COLOR !== '0' : !!stream.isTTY);
	const paint = (stream, color, text) => supportsColor(stream) ? `\x1b[${palette[color]}m${text}\x1b[0m` : text;
	const interactive = stdout.isTTY && env.TERM !== 'dumb';
	let pending = false, announced = false;
	const clear = () => {
		if(pending) stdout.write('\r\x1b[2K');
		pending = false;
	};
	const line = (stream, label, color, message) => {
		clear();
		const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
		stream.write(`  ${paint(stream, 'dim', time)}  ${paint(stream, color, label.padEnd(10))} ${message}\n`);
	};
	const duration = ms => ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
	return {
		colors: supportsColor(stderr),
		start({ version, port, files, poll }) {
			stdout.write(`\n  ${paint(stdout, 'cyan', 'IVFi')} ${paint(stdout, 'dim', `v${version} / development`)}\n\n`);
			stdout.write(`  ${paint(stdout, 'dim', 'Local')}    ${paint(stdout, 'bold', `http://localhost:${port}/`)}\n`);
			stdout.write(`  ${paint(stdout, 'dim', 'Files')}    ${files}\n`);
			stdout.write(`  ${paint(stdout, 'dim', 'Watch')}    ${poll ? 'Polling every 1 s' : 'Native file events'}\n`);
			stdout.write(`\n  ${paint(stdout, 'dim', 'CSS updates live. JS / PHP refresh the page. Ctrl+C to stop.')}\n\n`);
		},
		building() {
			if(pending) return;
			if(interactive) {
				stdout.write(`  ${paint(stdout, 'cyan', 'Building…')}`);
				pending = true;
			} else if(!announced) line(stdout, 'building', 'cyan', 'Preparing the first build');
			announced = true;
		},
		built(ms, change, initial, warnings = false) {
			const label = initial ? 'ready' : change?.type === 'css' ? 'styles' : change ? 'reload' : 'unchanged';
			const message = initial ? 'Watching for changes' : change?.type === 'css' ? 'Styles updated'
				: change ? 'Page refreshed' : 'No output changes';
			line(stdout, label, warnings ? 'yellow' : initial ? 'green' : change ? 'cyan' : 'dim',
				`${duration(ms).padStart(8)}  ${paint(stdout, 'dim', message)}`);
		},
		failed(details, hasBuild) {
			line(stderr, 'error', 'red', 'Build failed');
			stderr.write(`${details.trim()}\n\n`);
			stderr.write(`  ${paint(stderr, 'dim', hasBuild ? 'Keeping the last successful build. Waiting for changes.' : 'Waiting for changes to retry.')}\n\n`);
		},
		warnings(details) {
			line(stderr, 'warning', 'yellow', 'Build completed with warnings');
			stderr.write(`${details.trim()}\n\n`);
		},
		php(message) {
			line(stderr, 'php', 'yellow', message);
		},
		error(error) {
			line(stderr, 'error', 'red', error.message || String(error));
		},
		stop() { clear(); }
	};
}
