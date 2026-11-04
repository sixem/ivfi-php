/* eslint-env browser */
(() => {
	let revision = document.currentScript.dataset.revision;
	let events, reloading = false, updates = Promise.resolve();
	const reload = () => {
		if(reloading) return;
		reloading = true;
		events.close();
		window.location.reload();
	};
	const swapStyles = async (paths, nextRevision) => {
		const links = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => {
			const url = new URL(link.href);
			return url.origin === window.location.origin && paths.includes(url.pathname);
		});
		if(!links.length) { reload(); return; }
		await Promise.all(links.map(link => new Promise((resolve, reject) => {
			const replacement = link.cloneNode();
			replacement.disabled = link.disabled;
			const url = new URL(link.href);
			url.searchParams.set('ivfi-dev', nextRevision);
			replacement.href = url.href;
			// Keep the old styles until the replacement has loaded, avoiding a flash.
			const timeout = setTimeout(() => { replacement.remove(); reject(); }, 10000);
			replacement.onload = () => { clearTimeout(timeout); link.remove(); resolve(); };
			replacement.onerror = () => { clearTimeout(timeout); replacement.remove(); reject(); };
			link.after(replacement);
		})));
	};
	const connect = () => {
		events = new EventSource('/__ivfi_dev/events');
		events.addEventListener('ready', event => {
			updates = updates.then(() => { if(JSON.parse(event.data).revision !== revision) reload(); });
		});
		events.addEventListener('update', event => {
			updates = updates.then(async () => {
				if(reloading) return;
				const update = JSON.parse(event.data);
				if(update.previous !== revision || update.type !== 'css') { reload(); return; }
				await swapStyles(update.paths, update.revision);
				revision = update.revision;
			}).catch(reload);
		});
	};
	connect();
	window.addEventListener('pagehide', () => events.close());
	window.addEventListener('pageshow', event => { if(event.persisted) connect(); });
})();
