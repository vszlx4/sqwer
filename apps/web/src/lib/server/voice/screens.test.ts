import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, percent, timeLeft } from '#lib/voice/status.ts';
import { clipPath, fingerprint } from './clips.ts';
import { readState, runGenerator, writeState, type ClipMaker } from './generator.ts';
import { MAX_SECONDS, checkClips, clipProblem } from './health.ts';
import { isLocalHost, isLocalRequest, isLoopback } from './local.ts';
import { CORE_SETS, buildManifest, findListsDir, fullSet, type VoiceSet } from './manifest.ts';
import { encodeMp3 } from './mp3.ts';
import { readSettings, voiceDir, writeSettings } from './settings.ts';
import { CLIP_DISK_BYTES, firstId, forgetCounts, voiceBrief, voiceStatus } from './status.ts';

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
	it('keep a set to make first, and drop a malformed one', async () => {
		const data = tmp();
		expect((await writeSettings(data, { first: 'english-1k' })).first).toBe('english-1k');
		writeFileSync(path.join(voiceDir(data), 'settings.json'), JSON.stringify({ first: '../etc' }));
		expect(readSettings(data).first).toBeNull();
	});
});

describe('voice sets', () => {
	const listsDir = findListsDir();
	const manifest = buildManifest(listsDir);

	it('core sets are the lessons and the small lists', () => {
		expect(CORE_SETS.has('course')).toBe(true);
		expect(CORE_SETS.has('english-1k')).toBe(true);
		expect(CORE_SETS.has('english-25k')).toBe(false);
	});

	it('a set made first holds every word of its list, shared words included', () => {
		const share = manifest.find((s) => s.id === 'english-5k')!;
		const full = fullSet(listsDir, 'english-5k', manifest)!;
		expect(full.words.length).toBeGreaterThan(share.words.length);
		expect(fullSet(listsDir, 'course', manifest)).toBe(manifest[0]);
		expect(fullSet(listsDir, 'nope', manifest)).toBeNull();
		expect(firstId('legal')).toBe('first:legal');
	});
});

describe('voice health check', () => {
	it('tells a good clip from an empty, broken or implausible one', () => {
		const good = clip();
		expect(clipProblem(good.length, good)).toBeNull();
		expect(clipProblem(0, new Uint8Array(4))).toBe('empty');
		expect(clipProblem(3000, new TextEncoder().encode('RIFF'))).toBe('bad');
		expect(clipProblem(20, good)).toBe('length');
		expect(clipProblem(((MAX_SECONDS + 1) * 24000) / 8, good)).toBe('length');
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
		await writeState(dir, { running: false, made: 6, total: 6, sets: [], msPerClip: 300, word: null, error: null, all: true, updatedAt: new Date().toISOString() });
		await checkClips(dir, sets);
		expect(readState(dir)?.all).toBe(false);
	});
});

describe('voice status', () => {
	it('shows the cost of Supertonic before it is chosen', async () => {
		const data = tmp();
		const s = await voiceStatus(data);
		expect(s).toMatchObject({ local: true, voice: 'standard', chosen: 'standard', running: false, made: 0, first: null });
		expect(s.model.downloaded).toBe(false);
		expect(s.total).toBeGreaterThan(800_000);
		expect(s.cost.core.clips).toBeLessThan(s.cost.all.clips);
		expect(s.cost.all.disk).toBe(s.cost.all.clips * CLIP_DISK_BYTES);
		expect(s.cost.core.fastMs).toBeLessThan(s.cost.core.slowMs);
		expect(s.cost.core.hereMs).toBeNull();
	});

	it('counts clips per set and for one whole list, with the generator’s pace', async () => {
		const data = tmp();
		const dir = voiceDir(data);
		const words = ['the', 'of'];
		const made: ClipMaker = async () => clip();
		await runGenerator({ voiceDir: dir, sets: [{ id: firstId('english-200'), name: 'English 200', words }], make: made, keepGoing: () => true });
		forgetCounts(dir);
		const s = await voiceStatus(data, 'english-200');
		expect(s.made).toBe(4);
		expect(s.set).toMatchObject({ id: 'english-200', made: 4 });
		expect(s.set!.total).toBeGreaterThan(4);
		expect(s.msPerClip).not.toBeNull();
		expect(s.set!.leftMs).toBeGreaterThan(0);
		expect(s.cost.all.hereMs).not.toBeNull();
		expect(voiceBrief(data)).toMatchObject({ chosen: 'standard', running: false, made: 4, total: 4 });
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
		expect(timeLeft(4, 10, 500)).toBe(3000);
		expect(timeLeft(4, 10, null)).toBeNull();
	});
});
