import { describe, expect, it } from 'vitest';
import { qwertyAnsi, type Finger } from '@sqwer/layouts';
import {
	buildProfile,
	CORE_KEYS,
	parseProfileFile,
	pickPrompt,
	predictFinger,
	ProfileFileError,
	serializeProfile,
	type FingerObservation
} from './index.ts';

const layout = qwertyAnsi('mac');

let t = 0;
const obs = (code: string, finger: Finger, prev: string | null = null, next: string | null = null): FingerObservation => ({
	code,
	finger,
	prev,
	next,
	at: ++t
});

function seeded(seed: number) {
	let a = seed;
	return () => {
		a = (a * 16807) % 2147483647;
		return a / 2147483647;
	};
}

describe('buildProfile', () => {
	it('picks the most used finger and marks a key mapped after enough samples', () => {
		const p = buildProfile([obs('KeyE', 'lm'), obs('KeyE', 'lm'), obs('KeyE', 'li')], layout);
		const e = p.keys.KeyE!;
		expect(e.finger).toBe('lm');
		expect(e.share).toBeCloseTo(2 / 3);
		expect(e.mapped).toBe(true);
		expect(e.differs).toBe(false);
		expect(p.core).toEqual({ mapped: 1, total: CORE_KEYS.length });
	});

	it('flags keys typed with a non-standard finger', () => {
		const p = buildProfile([obs('KeyC', 'li'), obs('KeyC', 'li'), obs('KeyC', 'li')], layout);
		expect(p.keys.KeyC!.differs).toBe(true);
		expect(p.keys.KeyC!.standard).toBe('lm');
		expect(p.load.li).toBe(1);
	});

	it('learns context habits that differ from the usual finger', () => {
		const p = buildProfile(
			[
				obs('KeyE', 'lm', 'KeyT'),
				obs('KeyE', 'lm', 'KeyH'),
				obs('KeyE', 'lm', 'KeyS'),
				obs('KeyE', 'li', 'KeyR'),
				obs('KeyE', 'li', 'KeyR')
			],
			layout
		);
		expect(p.rules).toContainEqual({ code: 'KeyE', when: 'after', other: 'KeyR', finger: 'li', count: 2, total: 2 });
		expect(predictFinger(p, 'KeyE', 'KeyR')).toBe('li');
		expect(predictFinger(p, 'KeyE', 'KeyT')).toBe('lm');
		expect(predictFinger(p, 'KeyQ')).toBeUndefined();
	});

	it('summarises the shift habit', () => {
		const p = buildProfile(
			[obs('ShiftRight', 'rp', null, 'KeyA'), obs('ShiftRight', 'rp', null, 'KeyS'), obs('ShiftLeft', 'lp', null, 'KeyD')],
			layout
		);
		expect(p.shift.samples).toBe(3);
		expect(p.shift.right).toBe(2);
		// Left shift with a left-hand letter is the same hand.
		expect(p.shift.opposite).toBeCloseTo(2 / 3);
	});
});

describe('pickPrompt', () => {
	const vocab = ['the', 'and', 'quiz', 'jazz', 'box', 'kind', 'very', 'yes', 'pick'];

	it('prefers words with unmapped keys', () => {
		const known: FingerObservation[] = [];
		for (const c of 'theand') for (let i = 0; i < 3; i++) known.push(obs(`Key${c.toUpperCase()}`, 'li'));
		const p = buildProfile(known, layout);
		const prompt = pickPrompt(p, layout, vocab, seeded(4));
		expect(prompt).not.toMatch(/\b(the|and)\b/);
		expect(prompt.split(' ').length).toBeGreaterThanOrEqual(3);
	});

	it('adds symbol keys that still need samples', () => {
		const prompt = pickPrompt(buildProfile([], layout), layout, vocab, seeded(2));
		expect(prompt).toMatch(/[,.;'/]/);
	});

	it('only uses characters the layout can type', () => {
		const p = buildProfile([], layout);
		for (let s = 1; s < 30; s++) {
			for (const ch of pickPrompt(p, layout, vocab, seeded(s), { extended: true })) {
				expect(layout.chars.has(ch), ch).toBe(true);
			}
		}
	});
});

describe('profile file', () => {
	it('round-trips observations', () => {
		const data = [obs('KeyA', 'lp', null, 'KeyS'), obs('KeyS', 'lr', 'KeyA', null)];
		const text = serializeProfile(data, layout, new Date('2026-01-01'));
		const parsed = parseProfileFile(text);
		expect(parsed.observations).toEqual(data);
		expect(parsed.layout).toBe(layout.id);
		expect(JSON.parse(text).summary.keys.KeyA).toEqual({ finger: 'lp', share: 1, samples: 1 });
	});

	it('rejects foreign or damaged files', () => {
		expect(() => parseProfileFile('nope')).toThrow(ProfileFileError);
		expect(() => parseProfileFile('{"format":"other"}')).toThrow(/not a sqwer/);
		const bad = JSON.stringify({ format: 'sqwer-fingers', version: 1, observations: [{ code: 'KeyA', finger: 'xx', prev: null, next: null, at: 1 }] });
		expect(() => parseProfileFile(bad)).toThrow(/invalid entries/);
		const injected = JSON.stringify({ format: 'sqwer-fingers', version: 1, observations: [{ code: '<script>', finger: 'lp', prev: null, next: null, at: 1 }] });
		expect(() => parseProfileFile(injected)).toThrow(/invalid entries/);
	});
});
