import { describe, expect, it } from 'vitest';
import {
	echo,
	ECHO_LOOP,
	fallingLetters,
	fallingWords,
	HUNT_LOOP,
	HUNT_ROUNDS,
	keyHunt,
	LETTERS_LOOP,
	listen,
	LISTEN_LOOP,
	PASSAGE,
	race,
	RACE_LOOP,
	since,
	WORDS_LOOP,
	type Loop
} from './scenes';

const SCENES: [string, Loop, (t: number) => unknown][] = [
	['falling letters', LETTERS_LOOP, fallingLetters],
	['falling words', WORDS_LOOP, fallingWords],
	['listen', LISTEN_LOOP, listen],
	['key hunt', HUNT_LOOP, keyHunt],
	['race', RACE_LOOP, race],
	['echo', ECHO_LOOP, echo]
];

/** Numbers within tolerance, everything else equal. */
function close(a: unknown, b: unknown, path = ''): string | null {
	if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-3 ? null : `${path}: ${a} vs ${b}`;
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		for (const k of Object.keys(a)) {
			const d = close((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`);
			if (d) return d;
		}
		return null;
	}
	return a === b ? null : `${path}: ${String(a)} vs ${String(b)}`;
}

describe('landing game previews', () => {
	it.each(SCENES)('%s runs its last frame into its first', (_, loop, scene) => {
		expect(close(scene(loop.period - 1e-7), scene(0))).toBeNull();
	});

	it.each(SCENES)('%s keeps its still frame inside the loop', (_, loop) => {
		expect(loop.still).toBeGreaterThan(0);
		expect(loop.still).toBeLessThan(loop.period);
	});

	it('wraps event time into the loop', () => {
		expect(since(0.5, 6, 6.4)).toBeCloseTo(0.9);
		expect(since(7, 6, 6.4)).toBeCloseTo(1);
	});

	it('pops letters where they are typed and lets one land', () => {
		const frames = Array.from({ length: 640 }, (_, i) => fallingLetters(i / 100));
		// Each popped drop leaves a burst; the landed one flashes the floor and shakes the field.
		expect(frames.some((f) => f.bursts.some((b) => b.opacity > 0.5))).toBe(true);
		expect(frames.some((f) => f.floor > 0.5)).toBe(true);
		expect(frames.some((f) => Math.abs(f.shake) > 1)).toBe(true);
		// Never more than five caps on screen at once.
		for (const f of frames) expect(f.drops.filter((d) => d.opacity > 0 && d.y > -30 && d.y < 170).length).toBeLessThanOrEqual(5);
	});

	it('types words as prefixes, in order, one word at a time', () => {
		for (let t = 0; t < WORDS_LOOP.period; t += 0.01) {
			const words = fallingWords(t);
			const partly = words.filter((w) => w.chars.some((c) => c.typed) && w.chars.some((c) => !c.typed));
			expect(partly.length).toBeLessThanOrEqual(1);
			for (const w of words) {
				const typed = w.chars.map((c) => c.typed);
				expect(typed.indexOf(false) === -1 || !typed.slice(typed.indexOf(false)).includes(true)).toBe(true);
			}
		}
	});

	it('lights one hunt key at a time and times one out', () => {
		for (let t = 0; t < HUNT_LOOP.period; t += 0.01) {
			const s = keyHunt(t);
			expect(s.keys.filter((k) => k.lit > 0.5).length).toBeLessThanOrEqual(1);
			expect(s.fuse).toBeGreaterThanOrEqual(0);
			expect(s.fuse).toBeLessThanOrEqual(1);
		}
		expect(HUNT_ROUNDS.some((r) => r.hit === null)).toBe(true);
	});

	it('finishes the race ahead of the pacer and types the whole passage', () => {
		const end = Array.from({ length: 800 }, (_, i) => race(i / 100)).find((s) => s.typed === PASSAGE.length);
		expect(end).toBeDefined();
		expect(end!.me).toBeGreaterThan(end!.pacer);
	});

	it('shows echo letters before asking for them back', () => {
		const shown = echo(0.7).slots[0]!;
		expect(shown.lit).toBeGreaterThan(0.5);
		expect(echo(0.7).watch).toBe(1);
		const typed = echo(5.5);
		expect(typed.watch).toBe(0);
		expect(typed.slots.every((s) => s.ok > 0.9 && s.lit === 0)).toBe(true);
	});
});
