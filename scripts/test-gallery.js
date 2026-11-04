/* eslint-env browser */
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { chromium } from 'playwright-core';
import { startServer } from './dev/server.js';

// Generate real, seekable media without checking binary fixtures into the repository.
function audioFixture()
{
	const sampleRate = 8000, samples = sampleRate * 40;
	const wav = Buffer.alloc(44 + samples * 2);
	wav.write('RIFF', 0);
	wav.writeUInt32LE(wav.length - 8, 4);
	wav.write('WAVEfmt ', 8);
	wav.writeUInt32LE(16, 16);
	wav.writeUInt16LE(1, 20);
	wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(sampleRate, 24);
	wav.writeUInt32LE(sampleRate * 2, 28);
	wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34);
	wav.write('data', 36);
	wav.writeUInt32LE(samples * 2, 40);
	for(let i = 0; i < samples; i++) wav.writeInt16LE(Math.round(1000 * Math.sin(i * 2 * Math.PI * 220 / sampleRate)), 44 + i * 2);
	return wav;
}

test('gallery: audio controls, preview handoff and responsive sidebar', { timeout: 90000 }, async t => {
	const files = await mkdtemp(join(tmpdir(), 'ivfi-gallery-'));
	t.after(() => rm(files, { recursive: true, force: true }));
	const wav = audioFixture();
	await Promise.all(['a-track.wav', 'b-track.wav'].map(name => writeFile(join(files, name), wav)));
	const server = await startServer({ files, port: 0, php: process.env.PHP_BINARY || 'php',
		buildDir: fileURLToPath(new URL('../build', import.meta.url)) });
	t.after(() => server.close());
	server.update();
	const origin = `http://127.0.0.1:${server.port}`;
	const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
	t.after(() => browser.close());

	const openPage = async (t, gallery = {}, viewport = { width: 1280, height: 800 }) => {
		const context = await browser.newContext({ viewport });
		t.after(() => context.close());
		await context.addCookies([{ name: 'IVFi', url: origin, value: encodeURIComponent(JSON.stringify({
			gallery: { autoplay: false, volume: 0.25, ...gallery }
		})) }]);
		const page = await context.newPage();
		page.setDefaultTimeout(5000);
		const errors = [];
		page.on('pageerror', error => errors.push(error.message));
		t.after(() => assert.deepEqual(errors, [], 'no browser errors'));
		await page.addInitScript(() => localStorage.setItem('IVFi.previewVolume', '37'));
		return page;
	};
	const visit = async page => {
		await page.goto(origin);
		await page.waitForSelector('body:not([is-loading])');
	};
	const ready = page => page.waitForFunction(() => document.querySelector('.rootGallery audio')?.readyState >= 2);
	const state = page => page.locator('.rootGallery audio').evaluate(media => ({
		time: media.currentTime, volume: media.volume, muted: media.muted, paused: media.paused
	}));
	const seek = async (page, time) => {
		await page.locator('.rootGallery .audioSeek').fill(String(time));
		await page.locator('.rootGallery .audioSeek').dispatchEvent('change');
		await page.waitForFunction(value => Math.abs(document.querySelector('.rootGallery audio').currentTime - value) < 0.001, time);
	};

	await t.test('video wheel volume keeps blocked autoplay moving and unlocks on interaction', async t => {
		const recording = await browser.newPage();
		await recording.setContent('<button>Record fixture</button>');
		await recording.locator('button').click();
		const bytes = await recording.evaluate(async () => {
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = 64;
			const context = canvas.getContext('2d');
			const stream = canvas.captureStream(10);
			const audio = new AudioContext();
			await audio.resume();
			const tone = audio.createOscillator(), output = audio.createMediaStreamDestination();
			tone.connect(output);
			tone.start();
			stream.addTrack(output.stream.getAudioTracks()[0]);
			const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
			const chunks = [];
			recorder.ondataavailable = event => chunks.push(event.data);
			const done = new Promise(resolve => { recorder.onstop = resolve; });
			const timer = setInterval(() => { context.fillStyle = 'purple'; context.fillRect(0, 0, 64, 64); }, 50);
			recorder.start();
			await new Promise(resolve => setTimeout(resolve, 1200));
			recorder.stop();
			await done;
			clearInterval(timer);
			stream.getTracks().forEach(track => track.stop());
			await audio.close();
			return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
		});
		await recording.close();
		await writeFile(join(files, 'c-video.webm'), Buffer.from(bytes));
		t.after(() => rm(join(files, 'c-video.webm'), { force: true }));
		const page = await openPage(t);
		await page.addInitScript(() => {
			// Browser automation evaluations can grant activation; model real pointer/key gestures explicitly.
			let activated = false;
			Object.defineProperty(navigator, 'userActivation', { value: { get hasBeenActive() { return activated; } } });
			for(const type of ['pointerdown', 'keydown']) window.addEventListener(type, event => { if(event.isTrusted) activated = true; }, true);
			const play = HTMLMediaElement.prototype.play;
			HTMLMediaElement.prototype.play = function() {
				if(!this.muted && !navigator.userActivation.hasBeenActive)
					return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
				return play.call(this);
			};
			localStorage.setItem('IVFi.audioVolume', '61');
		});
		await visit(page);
		await page.locator('a.preview[href="/c-video.webm"]').hover();
		await page.waitForFunction(() => {
			const video = document.querySelector('.preview-container video');
			return video?.muted && !video.paused && video.readyState >= 2;
		});
		await page.mouse.wheel(0, -100);
		await page.waitForFunction(() => document.querySelector('#indicatorPreviewVolume')?.textContent.includes('39%'));
		assert.match(await page.locator('#indicatorPreviewVolume').textContent(), /Click to enable sound/);
		assert.equal(await page.locator('.preview-container video').evaluate(video => video.paused), false);
		assert.equal(await page.evaluate(() => localStorage.getItem('IVFi.audioVolume')), '61');
		await page.keyboard.press('a');
		await page.waitForFunction(() => {
			const video = document.querySelector('.preview-container video');
			return !video.muted && !video.paused && video.volume === 0.39;
		});
		const activatedHint = await page.locator('#indicatorPreviewVolume').textContent();
		const cell = page.locator('tr.file').filter({ has: page.locator('a[href="/a-track.wav"]') }).locator('td').nth(1);
		await cell.dispatchEvent('click', { button: 0 });
		await page.waitForFunction(() => document.querySelectorAll('.overlayItem.is-visible').length === 2);
		await page.waitForFunction(() => {
			const volume = document.querySelector('#indicatorPreviewVolume').getBoundingClientRect();
			const selected = document.querySelector('.selectionSummary').getBoundingClientRect();
			return selected.top >= volume.bottom && selected.height < 34;
		});
		assert.equal(await page.locator('.overlayItem.is-visible').first().locator('#indicatorPreviewVolume').count(), 1);
		await page.locator('.selectionSummary').click();
		await page.locator('.contextMenu:not([hidden])').waitFor();
		await page.waitForFunction(() => !document.querySelector('#indicatorPreviewVolume').closest('.overlayItem').classList.contains('is-visible'));
		assert.equal(await page.locator('#indicatorPreviewVolume').evaluate(e => e.closest('.overlayItem').getAnimations().length > 0), true, 'exit animates the collapsing row');
		await page.waitForFunction(() => Math.abs(document.querySelector('.selectionSummary').getBoundingClientRect().top
			- document.querySelector('.overlayStack').getBoundingClientRect().top) < 1);
		assert.equal(await page.evaluate(() => {
			const toast = document.querySelector('.selectionSummary').getBoundingClientRect();
			const menu = document.querySelector('.contextMenu').getBoundingClientRect();
			return Math.abs(menu.top - toast.bottom - 4) < 1;
		}), true, 'open menu follows the toast as the preceding notice collapses');
		assert.doesNotMatch(activatedHint, /Click to enable sound/, 'activation clears the obsolete mute hint');
		await page.keyboard.press('Escape');
		await page.locator('a.preview[href="/c-video.webm"]').hover();
		await page.waitForFunction(() => document.querySelector('.preview-container video')?.readyState >= 2);
		await page.mouse.wheel(0, -100);
		await page.waitForFunction(() => document.querySelectorAll('.overlayItem.is-visible').length === 2);
		assert.equal(await page.locator('.overlayItem.is-visible').first().locator('.selectionSummary').count(), 1, 'new notices join below the existing one');
		await page.locator('.selectionSummary').click();
		await page.locator('.contextMenu:not([hidden])').waitFor();
		assert.equal(await page.evaluate(() => {
			const toast = document.querySelector('.selectionSummary').getBoundingClientRect();
			const menu = document.querySelector('.contextMenu').getBoundingClientRect();
			return Math.abs(toast.left + toast.width / 2 - menu.left - menu.width / 2) < 1;
		}), true, 'selection menu centers under the toast');
		await page.keyboard.press('Escape');
		await cell.dispatchEvent('click', { button: 0 });
		await page.waitForFunction(() => Math.abs(document.querySelector('#indicatorPreviewVolume').getBoundingClientRect().top
			- document.querySelector('.overlayStack').getBoundingClientRect().top) < 1);
	});

	await t.test('audio volume is independent, survives reload, and ignores wheel before activation', async t => {
		const page = await openPage(t);
		await page.addInitScript(() => {
			// Browser automation evaluations can grant activation; model real pointer/key gestures explicitly.
			let activated = false;
			Object.defineProperty(navigator, 'userActivation', { value: { get hasBeenActive() { return activated; } } });
			for(const type of ['pointerdown', 'keydown']) window.addEventListener(type, event => { if(event.isTrusted) activated = true; }, true);
			const play = HTMLMediaElement.prototype.play;
			HTMLMediaElement.prototype.play = function() {
				if(!this.muted && !navigator.userActivation.hasBeenActive)
					return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
				return play.call(this);
			};
		});
		await visit(page);
		await page.locator('a.preview[href="/a-track.wav"]').hover();
		await page.waitForFunction(() => document.querySelector('.audioPreview audio')?.muted);
		assert.equal(await page.locator('.audioVolume').inputValue(), '0.37', 'fallback mute still shows the chosen volume');
		await page.locator('.audioVolume').dispatchEvent('wheel', { deltaY: -100 });
		assert.equal(await page.locator('.audioVolume').inputValue(), '0.37');
		assert.equal(await page.locator('#indicatorPreviewVolume').count(), 0);
		await page.locator('.audioVolume').click();
		await page.locator('.audioVolume').fill('0.62');
		await page.waitForFunction(() => {
			const audio = document.querySelector('.audioPreview audio');
			return audio.volume === 0.62 && !audio.muted && !audio.paused;
		});
		await page.locator('.audioExpand').click();
		await ready(page);
		assert.equal((await state(page)).volume, 0.62);
		await page.locator('.audioVolume').fill('0.41');
		await page.waitForFunction(() => localStorage.getItem('IVFi.audioVolume') === '41');
		assert.equal(await page.evaluate(() => localStorage.getItem('IVFi.previewVolume')), '37');
		assert.equal(await page.evaluate(() => JSON.parse(decodeURIComponent(document.cookie.split('; ').find(c => c.startsWith('IVFi=')).slice(5))).gallery.volume), 0.25);
		await page.reload();
		await page.locator('a.preview[href="/a-track.wav"]').click();
		await ready(page);
		assert.equal((await state(page)).volume, 0.41);
	});

	for(const handoff of [false, true]) await t.test(`focused audio controls keep native keys (${handoff ? 'preview handoff' : 'direct entry'})`, async t => {
		const page = await openPage(t);
		await visit(page);
		const anchor = page.locator('a.preview[href="/a-track.wav"]');
		if(handoff)
		{
			await anchor.hover();
			await page.waitForFunction(() => document.querySelector('.audioPreview audio')?.readyState >= 2);
		}
		await anchor.click();
		await ready(page);
		await seek(page, 10);
		await page.locator('.audioSeek').focus();
		await page.keyboard.press('ArrowRight');
		await page.waitForFunction(() => Math.abs(document.querySelector('.rootGallery audio').currentTime - 10.01) < 0.001);
		await page.keyboard.press('ArrowLeft');
		await page.waitForFunction(() => Math.abs(document.querySelector('.rootGallery audio').currentTime - 10) < 0.001);

		await page.locator('.audioVolume').focus();
		const before = await state(page);
		await page.keyboard.press('ArrowRight');
		await page.waitForFunction(volume => Math.abs(document.querySelector('.rootGallery audio').volume - volume) < 0.001, before.volume + 0.01);
		assert.equal((await state(page)).time, before.time, 'volume keys must not seek playback');
		await page.keyboard.press('ArrowLeft');
		assert.equal((await state(page)).volume, before.volume);
		await page.keyboard.press('Home');
		assert.equal((await state(page)).volume, 0);
		await page.keyboard.press('End');
		assert.equal((await state(page)).volume, 1);

		await page.locator('.audioPlay').focus();
		await page.keyboard.press('Space');
		await page.waitForFunction(() => !document.querySelector('.rootGallery audio').paused);
		await page.keyboard.press('Space');
		await page.waitForFunction(() => document.querySelector('.rootGallery audio').paused);
		await seek(page, 10);
		await page.evaluate(() => document.activeElement.blur());
		await page.keyboard.press('ArrowRight');
		await page.waitForFunction(() => document.querySelector('.rootGallery audio').currentTime === 15);
		await page.keyboard.press('ArrowLeft');
		await page.waitForFunction(() => document.querySelector('.rootGallery audio').currentTime === 10);
		await page.locator('.audioVolume').focus();
		await page.keyboard.press('Escape');
		await page.waitForFunction(() => !document.documentElement.hasAttribute('gallery-is-visible'));
	});

	for(const autoplay of [false, true]) await t.test(`gallery restores autoplay fallback volume (autoplay ${autoplay})`, async t => {
		const page = await openPage(t, { autoplay });
		await page.addInitScript(() => {
			const play = HTMLMediaElement.prototype.play;
			let blocked = false;
			HTMLMediaElement.prototype.play = function() {
				if(this.tagName === 'AUDIO' && !this.muted && !blocked)
				{
					blocked = true;
					return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
				}
				return play.call(this);
			};
		});
		await visit(page);
		await page.locator('a.preview[href="/a-track.wav"]').hover();
		await page.waitForFunction(() => {
			const media = document.querySelector('.audioPreview audio');
			return media?.muted && !media.paused && media.readyState >= 2;
		});
		const preview = await page.locator('.audioPreview audio').elementHandle();
		await preview.evaluate(media => { media.currentTime = 10; });
		await page.locator('.audioExpand').click();
		await ready(page);
		assert.equal(await preview.evaluate(media => media === document.querySelector('.rootGallery audio')), true, 'reuse the preview media element');
		const current = await state(page);
		assert.equal(current.muted, false);
		assert.equal(current.volume, 0.37);
		assert.equal(current.paused, !autoplay);
		assert.ok(current.time >= 10, 'handoff retains the preview timestamp');
		assert.equal(await page.locator('.audioVolume').inputValue(), '0.37');
		await page.locator('.galleryBar [data-action="next"]').click();
		await ready(page);
		assert.equal((await state(page)).volume, 0.37, 'temporary fallback must not mute following tracks');
	});

	await t.test('gallery preserves intentional preview mute', async t => {
		const page = await openPage(t, { autoplay: true });
		await visit(page);
		await page.locator('a.preview[href="/a-track.wav"]').hover();
		await page.waitForFunction(() => document.querySelector('.audioPreview audio')?.readyState >= 2);
		// A volume gesture explicitly selects mute, independent of the browser autoplay policy.
		await page.locator('.audioPreview .audioVolume').fill('0');
		await page.locator('.audioExpand').click();
		await ready(page);
		assert.equal((await state(page)).volume, 0);
		assert.equal((await state(page)).muted, true);
		await page.locator('.galleryBar [data-action="next"]').click();
		await ready(page);
		assert.equal((await state(page)).volume, 0, 'explicit mute carries to subsequent tracks');
	});

	for(const listState of [0, 1]) await t.test(`sidebar restores desktop preference ${listState} after mobile resize`, async t => {
		const page = await openPage(t, { listState });
		await visit(page);
		await page.locator('a.preview[href="/a-track.wav"]').click();
		await ready(page);
		await page.locator('.galleryListToggle').focus();
		await page.setViewportSize({ width: 390, height: 800 });
		await page.waitForFunction(() => {
			const list = document.querySelector('.galleryContent > .list');
			return list.inert && list.getAttribute('aria-hidden') === 'true'
				&& document.querySelector('.galleryListToggle').hidden
				&& document.querySelector('.galleryContent > .media').getBoundingClientRect().width >= 389;
		});
		assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-action')), 'close', 'focus moves out of hidden controls');
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.waitForFunction(visible => {
			const toggle = document.querySelector('.galleryListToggle');
			return !toggle.hidden && toggle.getAttribute('aria-expanded') === String(visible)
				&& document.querySelector('.galleryContent > .list').inert === !visible;
		}, !!listState);
	});

	await t.test('mobile-first gallery gains a usable desktop sidebar toggle', async t => {
		const page = await openPage(t, { listState: 1 }, { width: 390, height: 800 });
		await visit(page);
		await page.locator('a.preview[href="/a-track.wav"]').click();
		await ready(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.waitForFunction(() => {
			const toggle = document.querySelector('.galleryListToggle');
			return toggle && !toggle.hidden && toggle.getAttribute('aria-expanded') === 'true';
		});
		await page.locator('.galleryListToggle').click();
		assert.equal(await page.locator('.galleryListToggle').getAttribute('aria-expanded'), 'false');
		await page.locator('.galleryListToggle').click();
		assert.equal(await page.locator('.galleryListToggle').getAttribute('aria-expanded'), 'true');
	});
});
