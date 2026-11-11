import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RESPELL, SPEEDS, clipPath, fingerprint, seedOf, spoken } from './clips.ts';
import { countMade, isLocked, readState, runGenerator, takeLock, type ClipMaker } from './generator.ts';
import { buildManifest, SET_ORDER, type VoiceSet } from './manifest.ts';
import { encodeMp3, halveRate } from './mp3.ts';
import { DEFAULT_SETTINGS, activeVoice, readSettings, shouldGenerate, voiceDir, writeSettings } from './settings.ts';
import { gaussian, hasModel, prepareText, readStyle, untar } from './supertonic.ts';

const tmp = () => mkdtempSync(path.join(tmpdir(), 'sqwer-voice-'));

describe('voice settings', () => {
	it('start on the Standard voice, with nothing to generate', () => {
		const data = tmp();
		expect(readSettings(data)).toEqual(DEFAULT_SETTINGS);
		expect(activeVoice(readSettings(data), undefined)).toBe('standard');
		expect(shouldGenerate(readSettings(data), undefined)).toBe(false);
		expect(existsSync(voiceDir(data))).toBe(false);
		expect(hasModel(voiceDir(data))).toBe(false);
	});

	it('fall back to the defaults when the file is broken', async () => {
		const data = tmp();
		await mkdir(voiceDir(data), { recursive: true });
		writeFileSync(path.join(voiceDir(data), 'settings.json'), '{ not json');
		expect(readSettings(data)).toEqual(DEFAULT_SETTINGS);
		writeFileSync(path.join(voiceDir(data), 'settings.json'), JSON.stringify({ voice: 'robot', mode: 'turbo', paused: 'yes' }));
		expect(readSettings(data)).toEqual(DEFAULT_SETTINGS);
	});

	it('generate only with Supertonic chosen, not paused and no SQWER_VOICE', async () => {
		const data = tmp();
		const s = await writeSettings(data, { voice: 'supertonic' });
		expect(shouldGenerate(s, undefined)).toBe(true);
		expect(shouldGenerate(s, 'pause')).toBe(false);
		expect(shouldGenerate(s, 'skip')).toBe(false);
		expect(activeVoice(s, 'skip')).toBe('standard');
		expect(shouldGenerate(await writeSettings(data, { paused: true }), undefined)).toBe(false);
		expect(readSettings(data)).toEqual({ voice: 'supertonic', mode: 'low', paused: true, first: null });
	});
});

describe('clip names', () => {
	it('depend on the spoken text and speed, and nothing else', () => {
		expect(fingerprint('water', 'normal')).toBe(fingerprint('water', 'normal'));
		expect(fingerprint('water', 'normal')).not.toBe(fingerprint('water', 'slow'));
		expect(fingerprint('water', 'normal')).not.toBe(fingerprint('waiter', 'normal'));
		expect(fingerprint('water', 'normal')).toMatch(/^[0-9a-f]{32}$/);
	});

	it('use respellings for words Supertonic says wrong', () => {
		expect(spoken('niche')).toBe('neesh');
		expect(spoken('receipt')).toBe('reseet');
		expect(spoken('water')).toBe('water');
		for (const [word, say] of Object.entries(RESPELL)) expect(say).not.toBe(word);
	});

	it('take their seed from the name', () => {
		const fp = fingerprint('water', 'normal');
		expect(seedOf(fp)).toBe(parseInt(fp.slice(0, 8), 16));
	});
});

describe('voice manifest', () => {
	const fake = (id: string) => (id === 'english-200' ? ['the', 'water', 'Water', 'x9'] : id === 'english-1k' ? ['water', 'zygote', "don't"] : []);
	const sets = buildManifest('', fake);

	it('starts with the lesson words, then the lists in making order', () => {
		expect(sets[0]!.id).toBe('course');
		expect(sets.slice(1).map((s) => s.id)).toEqual([...SET_ORDER]);
	});

	it('holds each word once, only speakable lowercase words', () => {
		const all = sets.flatMap((s) => s.words);
		expect(new Set(all).size).toBe(all.length);
		expect(all).not.toContain('x9');
		expect(all).not.toContain('Water');
		expect(sets.find((s) => s.id === 'english-1k')!.words).toEqual(expect.arrayContaining(['zygote', "don't"]));
	});
});

describe('voice generator', () => {
	const sets: VoiceSet[] = [
		{ id: 'course', name: 'Lessons', words: ['one', 'two'] },
		{ id: 'english-200', name: 'English 200', words: ['three'] }
	];
	const fakeMaker = (made: string[]): ClipMaker => async (word, speed) => {
		made.push(`${word}/${speed}`);
		return new TextEncoder().encode(`${word} ${speed}`);
	};

	it('makes every missing clip, normal then slow, and records progress', async () => {
		const dir = tmp();
		const made: string[] = [];
		expect(await runGenerator({ voiceDir: dir, sets, make: fakeMaker(made), keepGoing: () => true })).toBe('done');
		expect(made).toEqual(['one/normal', 'one/slow', 'two/normal', 'two/slow', 'three/normal', 'three/slow']);
		expect(readFileSync(clipPath(dir, fingerprint('two', 'slow')), 'utf8')).toBe('two slow');
		const state = readState(dir)!;
		expect(state).toMatchObject({ running: false, made: 6, total: 6, error: null });
		expect(countMade(dir, sets).map((s) => s.made)).toEqual([4, 2]);
	});

	it('makes only what is missing', async () => {
		const dir = tmp();
		await runGenerator({ voiceDir: dir, sets, make: fakeMaker([]), keepGoing: () => true });
		const again: string[] = [];
		await runGenerator({ voiceDir: dir, sets, make: fakeMaker(again), keepGoing: () => true });
		expect(again).toEqual([]);
	});

	it('stops when told and carries on where it stopped', async () => {
		const dir = tmp();
		const made: string[] = [];
		let budget = 3;
		expect(await runGenerator({ voiceDir: dir, sets, make: fakeMaker(made), keepGoing: () => budget-- > 0 })).toBe('stopped');
		expect(made).toHaveLength(3);
		const rest: string[] = [];
		expect(await runGenerator({ voiceDir: dir, sets, make: fakeMaker(rest), keepGoing: () => true })).toBe('done');
		expect(rest).toEqual(['two/slow', 'three/normal', 'three/slow']);
	});

	it('makes a chosen set first', async () => {
		const dir = tmp();
		const made: string[] = [];
		await runGenerator({ voiceDir: dir, sets, make: fakeMaker(made), keepGoing: () => true, first: ['english-200'] });
		expect(made.slice(0, 2)).toEqual(['three/normal', 'three/slow']);
	});

	it('runs one at a time, and takes over a lock left by a dead process', async () => {
		const dir = tmp();
		expect(await takeLock(dir, process.pid)).toBe(true);
		expect(await runGenerator({ voiceDir: dir, sets, make: fakeMaker([]), keepGoing: () => true })).toBe('done');
		expect(await takeLock(dir, process.ppid)).toBe(true);
		expect(await runGenerator({ voiceDir: dir, sets, make: fakeMaker([]), keepGoing: () => true })).toBe('locked');
		expect(isLocked(dir)).toBe(true);
		writeFileSync(path.join(dir, 'supertonic', 'generator.lock'), '999999');
		expect(isLocked(dir)).toBe(false);
		expect(await takeLock(dir)).toBe(true);
		expect(isLocked(dir)).toBe(false);
	});

	it('clears half-written files left by a crash', async () => {
		const dir = tmp();
		const part = `${clipPath(dir, fingerprint('one', 'normal'))}.123.part`;
		await mkdir(path.dirname(part), { recursive: true });
		writeFileSync(part, 'half');
		await runGenerator({ voiceDir: dir, sets, make: fakeMaker([]), keepGoing: () => true });
		expect(existsSync(part)).toBe(false);
	});

	it('records an engine error and lets go of the lock', async () => {
		const dir = tmp();
		const broken: ClipMaker = async () => {
			throw new Error('engine down');
		};
		await expect(runGenerator({ voiceDir: dir, sets, make: broken, keepGoing: () => true })).rejects.toThrow('engine down');
		expect(readState(dir)?.error).toBe('engine down');
		expect(await takeLock(dir, process.ppid)).toBe(true);
	});
});

describe('Supertonic helpers', () => {
	it('draw the same noise for the same seed', () => {
		expect(gaussian(7, 1000)).toEqual(gaussian(7, 1000));
		expect(gaussian(7, 1000)).not.toEqual(gaussian(8, 1000));
		const g = gaussian(1, 20000);
		const mean = g.reduce((a, b) => a + b, 0) / g.length;
		const sd = Math.sqrt(g.reduce((a, b) => a + (b - mean) ** 2, 0) / g.length);
		expect(Math.abs(mean)).toBeLessThan(0.05);
		expect(Math.abs(sd - 1)).toBeLessThan(0.05);
	});

	it('wrap text the way the model reads it', () => {
		expect(prepareText('water')).toBe('<en>water.</en>');
		expect(prepareText(' hello  there! ')).toBe('<en>hello there!</en>');
	});

	it('read one style row from voice.bin', () => {
		const rows = 2;
		const head = new BigInt64Array([2n, 1n, 2n, 2n, 1n, 1n]);
		const ttl = new Float32Array([1, 2, 3, 4]);
		const dp = new Float32Array([5, 6]);
		const bin = new Uint8Array(48 + (ttl.length + dp.length) * 4);
		bin.set(new Uint8Array(head.buffer), 0);
		bin.set(new Uint8Array(ttl.buffer), 48);
		bin.set(new Uint8Array(dp.buffer), 48 + ttl.length * 4);
		const s = readStyle(bin, 1);
		expect(Array.from(s.ttl.data)).toEqual([3, 4]);
		expect(Array.from(s.dp.data)).toEqual([6]);
		expect(s.ttl.dims).toEqual([1, 1, 2]);
		expect(() => readStyle(bin, rows)).toThrow();
	});

	it('read files out of a tar archive', () => {
		const header = (name: string, size: number) => {
			const h = new Uint8Array(512);
			h.set(new TextEncoder().encode(name), 0);
			h.set(new TextEncoder().encode(size.toString(8).padStart(11, '0')), 124);
			h[156] = '0'.charCodeAt(0);
			return h;
		};
		const body = new TextEncoder().encode('hello');
		const tar = new Uint8Array(512 * 4);
		tar.set(header('model/tts.json', body.length), 0);
		tar.set(body, 512);
		const files = untar(tar);
		expect([...files.keys()]).toEqual(['tts.json']);
		expect(new TextDecoder().decode(files.get('tts.json'))).toBe('hello');
	});
});

describe('MP3 clips', () => {
	it('halve the rate and encode valid MP3 frames', () => {
		const tone = Float32Array.from({ length: 44100 }, (_, i) => 0.3 * Math.sin((2 * Math.PI * 440 * i) / 44100));
		const half = halveRate(tone);
		expect(half.length).toBe(22050);
		const mp3 = encodeMp3(half);
		expect(mp3[0]).toBe(0xff);
		expect(mp3[1]! & 0xe0).toBe(0xe0);
		expect(mp3.length).toBeGreaterThan(1000);
		expect(mp3.length).toBeLessThan(6000);
	});

	it('cover both speeds', () => {
		expect(Object.keys(SPEEDS)).toEqual(['normal', 'slow']);
	});
});
