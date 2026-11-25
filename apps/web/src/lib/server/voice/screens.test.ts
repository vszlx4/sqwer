import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, percent, phaseLine } from '#lib/voice/status.ts';
import { clipPath, fingerprint } from './clips.ts';
import { readState, runGenerator, runKey, writeState, type ClipMaker } from './generator.ts';
import { MAX_SECONDS, checkClips, clipProblem } from './health.ts';
import { isLocalHost, isLocalRequest, isLoopback } from './local.ts';
import { buildManifest, catalog, chosenSets, findListsDir, type VoiceSet } from './manifest.ts';
import { linuxOnBattery, pmsetOnBattery } from './power.ts';
import { runCommand } from './background.ts';
import { MP3_KBPS, encodeMp3 } from './mp3.ts';
import { DEFAULT_SETTINGS, readSettings, voiceDir, writeSettings } from './settings.ts';
import { forgetCounts, phaseOf, voiceBrief, voiceStatus } from './status.ts';

const tmp = () => mkdtempSync(path.join(tmpdir(), 'sqwer-voice-screens-'));

/** A real MP3 of about half a second. */
const clip = () => encodeMp3(new Float32Array(11025).map((_, i) => 0.3 * Math.sin(i / 8)));

async function put(dir: string, fp: string, body: Uint8Array | string) {
	const file = clipPath(dir, fp);
	await mkdir(path.dirname(file), { recursive: true });
	writeFileSync(file, body);
	return file;
}

describe('who may change the voice', () => {
	it('only the machine running the copy, on a local host name', () => {
		for (const ip of ['127.0.0.1', '127.8.0.1', '::1', '::ffff:127.0.0.1']) expect(isLoopback(ip)).toBe(true);
		for (const ip of [undefined, '', '10.0.0.2', '192.168.1.5', '::ffff:10.0.0.2', '1127.0.0.1', 'fe80::1']) expect(isLoopback(ip)).toBe(false);
		for (const host of ['localhost', 'localhost:5173', 'sqwer.localhost:3000', '127.0.0.1:5173', '[::1]:5173']) expect(isLocalHost(host)).toBe(true);
		for (const host of [null, 'example.com', 'localhost.example.com', 'evil.test:5173', '[2001:db8::1]:80']) expect(isLocalHost(host)).toBe(false);
	});

	it('turns away a rebound host name even from this machine', () => {
		const event = (ip: string, host: string) => ({
			request: new Request(`http://${host}/api/voice`, { headers: { host } }),
			url: new URL(`http://${host}/api/voice`),
			getClientAddress: () => ip
		});
		expect(isLocalRequest(event('127.0.0.1', 'localhost:5173'))).toBe(true);
		expect(isLocalRequest(event('127.0.0.1', 'attacker.example:5173'))).toBe(false);
		expect(isLocalRequest(event('203.0.113.9', 'localhost:5173'))).toBe(false);
	});
});

describe('voice settings for the screens', () => {
	it('keep the chosen sets in order, drop malformed ones, and put an older set made first in front', async () => {
		const data = tmp();
		expect((await writeSettings(data, { sets: ['legal', 'course'] })).sets).toEqual(['legal', 'course']);
		writeFileSync(path.join(voiceDir(data), 'settings.json'), JSON.stringify({ sets: ['course', '../etc', 'course', 7] }));
		expect(readSettings(data).sets).toEqual(['course']);
		writeFileSync(path.join(voiceDir(data), 'settings.json'), JSON.stringify({ first: 'legal' }));
		expect(readSettings(data).sets).toEqual(['legal', 'course', 'english-200', 'english-1k']);
		expect(readSettings(data).battery).toBe(false);
	});

	it('tell battery from mains power', () => {
		expect(pmsetOnBattery("Now drawing from 'Battery Power'\n -InternalBattery-0 (id=1)	80%; discharging")).toBe(true);
		expect(pmsetOnBattery("Now drawing from 'AC Power'")).toBe(false);
		const root = tmp();
		const supply = async (name: string, type: string, online?: string) => {
			await mkdir(path.join(root, name), { recursive: true });
			writeFileSync(path.join(root, name, 'type'), type);
			if (online) writeFileSync(path.join(root, name, 'online'), online);
		};
		expect(linuxOnBattery(path.join(root, 'none'))).toBe(false);
		return (async () => {
			await supply('BAT0', 'Battery');
			expect(linuxOnBattery(root)).toBe(false);
			await supply('AC', 'Mains', '0');
			expect(linuxOnBattery(root)).toBe(true);
			writeFileSync(path.join(root, 'AC', 'online'), '1');
			expect(linuxOnBattery(root)).toBe(false);
		})();
	});

	it('run low mode at background priority on macOS only', () => {
		expect(runCommand('voice.ts', 'low', 'darwin', () => true)).toEqual(['/usr/sbin/taskpolicy', ['-b', process.execPath, 'voice.ts', 'run']]);
		expect(runCommand('voice.ts', 'active', 'darwin', () => true)).toEqual([process.execPath, ['voice.ts', 'run']]);
		expect(runCommand('voice.ts', 'low', 'linux', () => true)).toEqual([process.execPath, ['voice.ts', 'run']]);
		expect(runCommand('voice.ts', 'low', 'darwin', () => false)).toEqual([process.execPath, ['voice.ts', 'run']]);
	});
});

describe('voice sets', () => {
	const listsDir = findListsDir();
	const manifest = buildManifest(listsDir);

	it('a chosen set holds every word of its list, shared words included', () => {
		const all = catalog(listsDir);
		const share = manifest.find((s) => s.id === 'english-200')!;
		const full = all.find((s) => s.id === 'english-200')!;
		expect(full.words.length).toBe(200);
		expect(full.words.length).toBeGreaterThan(share.words.length);
		expect(new Set(full.words).size).toBe(full.words.length);
		expect(chosenSets(all, ['legal', 'nope', 'course']).map((s) => s.id)).toEqual(['legal', 'course']);
	});

	it('the defaults are a few hours of work, not every list', () => {
		const words = new Set(chosenSets(catalog(listsDir), DEFAULT_SETTINGS.sets).flatMap((s) => s.words));
		expect(words.size).toBeLessThan(15_000);
	});
});

describe('voice health check', () => {
	it('tells a good clip from an empty, broken or implausible one', () => {
		const good = clip();
		expect(clipProblem(good.length, good)).toBeNull();
		expect(clipProblem(0, new Uint8Array(4))).toBe('empty');
		expect(clipProblem(3000, new TextEncoder().encode('RIFF'))).toBe('bad');
		expect(clipProblem(20, good)).toBe('length');
		expect(clipProblem(((MAX_SECONDS + 1) * MP3_KBPS * 1000) / 8, good)).toBe('length');
		expect(clipProblem(3000, new TextEncoder().encode('ID3\u0004'))).toBeNull();
	});

	const sets: VoiceSet[] = [
		{ id: 'course', name: 'Lessons', words: ['one', 'two'] },
		{ id: 'english-200', name: 'English 200', words: ['three'] }
	];

	it('removes broken clips so they are made again, and orphans in the whole check', async () => {
		const dir = tmp();
		const good = await put(dir, fingerprint('one', 'normal'), clip());
		const empty = await put(dir, fingerprint('one', 'slow'), '');
		const broken = await put(dir, fingerprint('three', 'normal'), 'not an mp3 at all, just text in a file');
		const orphan = await put(dir, fingerprint('zebra', 'normal'), clip());
		const part = `${good}.42.part`;
		writeFileSync(part, 'half');

		// One set: only its clips; the broken clip in another set and the orphan stay.
		const lessons = await checkClips(dir, sets, sets[0]);
		expect(lessons).toMatchObject({ checked: 2, empty: 1, bad: 0, orphans: 0, parts: 1, removed: 1 });
		expect(existsSync(empty)).toBe(false);
		expect(existsSync(broken)).toBe(true);
		expect(existsSync(part)).toBe(false);

		const all = await checkClips(dir, sets);
		expect(all).toMatchObject({ checked: 2, bad: 1, orphans: 1, removed: 2 });
		expect(existsSync(good)).toBe(true);
		expect(existsSync(broken)).toBe(false);
		expect(existsSync(orphan)).toBe(false);
	});

	it('leaves temporary files alone while a generator runs, and reopens a finished run', async () => {
		const dir = tmp();
		const good = await put(dir, fingerprint('one', 'normal'), clip());
		writeFileSync(`${good}.42.part`, 'half');
		writeFileSync(path.join(dir, 'supertonic', 'generator.lock'), String(process.ppid));
		expect((await checkClips(dir, sets)).parts).toBe(0);
		expect(existsSync(`${good}.42.part`)).toBe(true);

		writeFileSync(path.join(dir, 'supertonic', 'generator.lock'), '999999');
		await put(dir, fingerprint('two', 'normal'), '');
		await writeState(dir, { running: false, ready: 3, words: 3, left: 0, sets: [], msPerClip: 300, word: null, making: null, error: null, complete: true, updatedAt: new Date().toISOString() });
		await checkClips(dir, sets);
		expect(readState(dir)?.complete).toBe(false);
	});
});

describe('voice status', () => {
	it('shows every set with its size before Enhanced is chosen', async () => {
		const data = tmp();
		const s = await voiceStatus(data);
		expect(s).toMatchObject({ local: true, voice: 'standard', chosen: 'standard', phase: 'off', ready: 0 });
		expect(s.model.downloaded).toBe(false);
		expect(s.sets.find((x) => x.id === 'course')).toMatchObject({ order: 0, ready: 0 });
		expect(s.sets.find((x) => x.id === 'english-450k')).toMatchObject({ order: null });
		expect(s.words).toBeLessThan(15_000);
	});

	it('counts words per set and over the chosen sets, live from the generator', async () => {
		const data = tmp();
		const dir = voiceDir(data);
		await writeSettings(data, { voice: 'supertonic', sets: ['english-200'] });
		forgetCounts();
		expect((await voiceStatus(data)).ready).toBe(0);
		await new Promise((r) => setTimeout(r, 5));
		const set: VoiceSet = { id: 'english-200', name: 'English 200', words: ['the', 'of'] };
		await runGenerator({ voiceDir: dir, sets: [set], make: async () => clip(), keepGoing: () => 'go', key: runKey(['english-200']) });
		const s = await voiceStatus(data);
		expect(s.ready).toBe(2);
		expect(s.sets.find((x) => x.id === 'english-200')).toMatchObject({ ready: 2, words: 200, order: 0 });
		expect(s.msPerClip).not.toBeNull();
		expect(voiceBrief(data)).toMatchObject({ chosen: 'supertonic', ready: 2, words: 2 });
		// A recount sees the whole list: 2 of its 200 words.
		forgetCounts();
		const again = await voiceStatus(data);
		expect(again.sets.find((x) => x.id === 'english-200')).toMatchObject({ ready: 2, words: 200 });
		expect(again.words).toBe(200);
		expect(again.leftMs).toBeGreaterThan(0);
	});

	it('names one phase, the most important first', () => {
		const base = { settings: { ...DEFAULT_SETTINGS, voice: 'supertonic' as const }, env: null, state: null, running: false, ready: 0, words: 10, battery: false };
		expect(phaseOf({ ...base, settings: DEFAULT_SETTINGS })).toBe('off');
		expect(phaseOf({ ...base, env: 'pause' })).toBe('held');
		expect(phaseOf({ ...base, settings: { ...base.settings, paused: true }, running: true })).toBe('paused');
		expect(phaseOf({ ...base, settings: { ...base.settings, sets: [] } })).toBe('empty');
		expect(phaseOf({ ...base, battery: true })).toBe('battery');
		expect(phaseOf({ ...base, battery: true, settings: { ...base.settings, battery: true } })).toBe('starting');
		expect(phaseOf({ ...base, ready: 10 })).toBe('ready');
		expect(phaseOf({ ...base, running: true })).toBe('making');
		expect(phaseLine({ phase: 'making', ready: 1, words: 4, leftMs: 0, downloading: null })).toBe('Making clips, 25%');
		expect(phaseLine({ phase: 'battery', ready: 1, words: 4, leftMs: null, downloading: null })).toBe('Waiting for the charger');
	});
});

describe('voice figures', () => {
	it('read as plain time, size and share', () => {
		expect(formatDuration(20_000)).toBe('under a minute');
		expect(formatDuration(25 * 60_000)).toBe('about 25 min');
		expect(formatDuration(200 * 60_000)).toBe('about 3 h 20 min');
		expect(formatDuration(30 * 3600_000)).toBe('about 30 h');
		expect(formatDuration(17 * 24 * 3600_000)).toBe('about 17 days');
		expect(formatBytes(128_774_318)).toBe('129 MB');
		expect(formatBytes(3_697_000_000)).toBe('3.7 GB');
		expect(formatBytes(2_048)).toBe('2 KB');
		expect(percent(1, 3)).toBe(33.3);
		expect(percent(0, 0)).toBe(0);
	});
});
