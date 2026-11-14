import { kindOf, qwertyAnsi, type FingerKind } from '@sqwer/layouts';
import { bezier, EASES, type EaseName } from '#lib/motion/tokens.ts';

/*
 * Landing game previews. Each scene is a pure function of loop time in [0, period): every element is computed
 * from the clock, never accumulated, so the last frame runs into the first. Distances are px in the 170 px preview,
 * x positions are % of its width.
 */

export interface Loop {
	/** Loop length in seconds. */
	period: number;
	/** Frame shown before motion starts, without scripts and with reduced motion. */
	still: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Seconds since an event at `at` that repeats every `period`; in [0, period). */
export const since = (t: number, at: number, period: number) => (((t - at) % period) + period) % period;
/** Progress through a span: 0 before `start`, 1 after `start + dur`. */
export const span = (t: number, start: number, dur: number) => clamp01((t - start) / dur);
export const ease = (name: EaseName, p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : bezier(EASES[name], p));
/** 0 to 1 and back over p in [0, 1]. */
const bump = (p: number) => Math.sin(clamp01(p) * Math.PI);
/** Damped side-to-side offset over p in [0, 1]. */
const wobble = (p: number, px: number, turns = 2) => (p > 0 && p < 1 ? Math.sin(p * Math.PI * 2 * turns) * px * (1 - p) : 0);
/** Caret blink, smooth so it never pops at a loop point; periods are whole seconds. */
const blink = (t: number) => clamp01(0.5 + 1.5 * Math.cos(t * Math.PI * 2));

const FINGERS = new Map(
	qwertyAnsi('mac')
		.keys.filter((k) => /^[a-z]$/.test(k.label))
		.map((k) => [k.label, kindOf(k.finger)])
);
export const fingerOf = (key: string): FingerKind => FINGERS.get(key) ?? 'index';
/** Legend on a key filled with its finger's hue: dark on the light hues, white on blue and purple. */
export const label = (finger: FingerKind) => (finger === 'index' || finger === 'thumb' ? 'var(--white)' : 'var(--zone-label)');

/* ---------- Falling letters: keycaps drop; the typed one pops, a missed one lands and shakes the field ---------- */

export const LETTERS_LOOP: Loop = { period: 6.4, still: 1.3 };
const L_SPEED = 52;
const L_TOP = -34;
/** Cap top when its base meets the floor (170 - 16 floor - 30 cap). */
const L_LAND = 124;
const L_LIFE = (L_LAND - L_TOP) / L_SPEED;

/** `hit`: age when its key is pressed; null lands. Same speed, so earlier drops are always lower. */
const LETTER_DROPS = [
	{ key: 'f', x: 18, at: 0.1, hit: 2.1 },
	{ key: 'j', x: 62, at: 0.9, hit: 1.9 },
	{ key: 'd', x: 38, at: 1.7, hit: 2.4 },
	{ key: 'k', x: 84, at: 2.5, hit: null },
	{ key: 's', x: 26, at: 3.3, hit: 2.0 },
	{ key: 'l', x: 62, at: 4.1, hit: 2.2 },
	{ key: 'a', x: 12, at: 4.9, hit: 1.8 },
	{ key: 'g', x: 46, at: 5.7, hit: 2.3 }
] as const;

export function fallingLetters(t: number) {
	const P = LETTERS_LOOP.period;
	let shake = 0;
	let floor = 0;
	let press = { key: '', finger: 'index' as FingerKind, glow: 0 };
	const drops = LETTER_DROPS.map((d) => {
		const age = since(t, d.at, P);
		const finger = fingerOf(d.key);
		const y = L_TOP + L_SPEED * Math.min(age, d.hit ?? L_LIFE);
		if (d.hit === null) {
			// Lands: squashes on the floor, which flashes, and the field shakes.
			const p = span(age, L_LIFE, 0.3);
			floor = Math.max(floor, p > 0 ? 1 - span(age, L_LIFE, 0.6) : 0);
			shake += wobble(span(age, L_LIFE, 0.32), 4);
			return { key: d.key, finger, x: d.x, y, scale: 1, squash: 1 - 0.35 * ease('out-soft', Math.min(1, p * 3)), opacity: 1 - p };
		}
		const p = span(age, d.hit, 0.14);
		const k = span(age, d.hit, 0.4);
		if (k > 0 && k < 1) press = { key: d.key, finger, glow: 1 - k };
		return { key: d.key, finger, x: d.x, y, scale: 1 + 0.3 * ease('out-soft', p), squash: 1, opacity: 1 - p };
	});
	const bursts = LETTER_DROPS.filter((d) => d.hit !== null).map((d) => {
		const b = span(since(t, d.at, P), d.hit!, 0.5);
		return {
			finger: fingerOf(d.key),
			x: d.x,
			y: L_TOP + L_SPEED * d.hit! + 15,
			scale: 0.4 + 1.2 * ease('out-expo', b),
			rotate: 45 * ease('out-soft', b),
			opacity: b > 0 && b < 1 ? 1 - b : 0
		};
	});
	return { drops, bursts, shake, floor, press };
}

/* ---------- Falling words: tags drift down slower; letters fill as typed, a wrong key jolts the tag ---------- */

export const WORDS_LOOP: Loop = { period: 8, still: 3.0 };
const W_SPEED = 26;
const W_TOP = -30;
/** Seconds per typed letter, and the pause a wrong key costs. */
const W_CHAR = 0.13;
const W_SLIP = 0.24;

/** `type`: age when typing starts; `slip`: a wrong key before that letter. Hues from the area set. */
const WORD_DROPS = [
	{ word: 'steady', x: 28, at: 0.2, type: 2.6, hue: 'amber' },
	{ word: 'river', x: 70, at: 1.8, type: 2.7, hue: 'cyan' },
	{ word: 'quiet', x: 32, at: 3.4, type: 2.4, slip: 2, hue: 'lime' },
	{ word: 'hand', x: 72, at: 5.0, type: 2.8, hue: 'violet' },
	{ word: 'calm', x: 50, at: 6.6, type: 2.6, hue: 'orange' }
] as const;

export function fallingWords(t: number) {
	const P = WORDS_LOOP.period;
	return WORD_DROPS.map((d) => {
		const age = since(t, d.at, P);
		const slip = 'slip' in d ? d.slip : Infinity;
		const charAt = (i: number) => d.type + i * W_CHAR + (i >= slip ? W_SLIP : 0);
		const done = charAt(d.word.length - 1);
		const s = span(age, d.type + slip * W_CHAR - W_CHAR / 2, 0.3);
		return {
			hue: d.hue,
			x: d.x,
			y: W_TOP + W_SPEED * Math.min(age, done),
			// Targeted just before the first letter, released as it completes.
			focus: span(age, d.type - 0.35, 0.2) * (1 - span(age, done, 0.12)),
			fill: 1 - span(age, done, 0.2),
			slip: s > 0 && s < 1 ? 1 - s : 0,
			shake: wobble(s, 3, 2.5),
			chars: [...d.word].map((c, i) => {
				const p = span(age, done + 0.02 + i * 0.035, 0.34);
				return { c, typed: age >= charAt(i), y: -16 * ease('out-soft', p), opacity: 1 - p };
			})
		};
	});
}

/* ---------- Listen and type: a word is spoken, then typed from memory and checked; two rounds per loop ---------- */

export const LISTEN_LOOP: Loop = { period: 10, still: 2.2 };
const LISTEN_WORDS = ['river', 'quiet'];
const LISTEN_ROUND = LISTEN_LOOP.period / LISTEN_WORDS.length;
const LISTEN_TYPE = 1.6;
const LISTEN_CHAR = 0.15;
const LISTEN_BARS = 14;
/** The clip's outline per word, as the game's waveform draws it: fixed, lit from the left while it plays. */
const LISTEN_SHAPE = (word: string) => Array.from({ length: LISTEN_BARS }, (_, n) => 0.22 + 0.72 * Math.abs(Math.sin(n * 0.55 + word.length) * Math.sin(n * 0.21 + 0.4)));

export function listen(t: number) {
	const word = LISTEN_WORDS[Math.floor(t / LISTEN_ROUND) % LISTEN_WORDS.length]!;
	const r = t % LISTEN_ROUND;
	const voice = span(r, 0.15, 0.12) * (1 - span(r, 1.2, 0.18));
	const done = LISTEN_TYPE + (word.length - 1) * LISTEN_CHAR;
	// Cleared once faded, so the field is empty and opaque again before the next word.
	const cleared = r >= 4.2;
	const typed = cleared ? 0 : Math.min(word.length, Math.max(0, Math.floor((r - LISTEN_TYPE) / LISTEN_CHAR) + 1));
	const ok = cleared ? 0 : ease('out-pop', span(r, done + 0.15, 0.25));
	return {
		bars: LISTEN_SHAPE(word),
		// Bars lit so far: sweeps while the word plays, stays lit, clears with the answer.
		lit: cleared ? 0 : span(r, 0.15, 1.05),
		voice,
		text: word.slice(0, typed),
		ok,
		opacity: cleared ? 1 : 1 - span(r, 3.8, 0.3),
		caret: typed > 0 && typed < word.length ? 1 : (1 - ok) * blink(r)
	};
}

/* ---------- Key hunt: a key lights in its finger's hue, the fuse burns; a hit presses it, one times out ---------- */

const HUNT_WINDOW = 2.2;
const HUNT_GAP = 0.45;
/** `hit`: seconds to find it; null runs out. */
export const HUNT_ROUNDS = [
	{ key: 'j', hit: 1.1 },
	{ key: 'e', hit: 1.5 },
	{ key: 'p', hit: null },
	{ key: 'v', hit: 0.8 },
	{ key: 'w', hit: 1.3 }
] as const;
const HUNT_STARTS = HUNT_ROUNDS.reduce<number[]>((a, r, i) => [...a, i ? a[i - 1]! + (HUNT_ROUNDS[i - 1]!.hit ?? HUNT_WINDOW) + HUNT_GAP : 0], []);
export const HUNT_LOOP: Loop = { period: HUNT_STARTS.at(-1)! + (HUNT_ROUNDS.at(-1)!.hit ?? HUNT_WINDOW) + HUNT_GAP, still: 0.7 };

export function keyHunt(t: number) {
	let fuse = 1;
	const keys = HUNT_ROUNDS.map((r, i) => {
		const local = t - HUNT_STARTS[i]!;
		const end = r.hit ?? HUNT_WINDOW;
		const live = local >= 0 && local < end + HUNT_GAP;
		if (live) {
			const left = 1 - Math.min(local, end) / HUNT_WINDOW;
			// Burns down, then refills for the next key.
			fuse = left + (1 - left) * ease('out-soft', span(local, end + 0.1, HUNT_GAP - 0.15));
		}
		const after = span(local, end, HUNT_GAP);
		return {
			key: r.key,
			finger: fingerOf(r.key),
			// Fades in as it lights and out before the next one, so hand-overs never jump.
			lit: live ? span(local, 0, 0.12) * (1 - span(local, end + HUNT_GAP - 0.14, 0.14)) : 0,
			ok: live && r.hit !== null && after > 0 ? 1 - after : 0,
			miss: live && r.hit === null && after > 0 ? 1 - after : 0,
			press: live && r.hit !== null ? bump(span(local, end, 0.16)) : 0
		};
	});
	return { keys, fuse };
}

/* ---------- Race: the passage is typed against a pacer; first to the flag wins, then both reset ---------- */

export const RACE_LOOP: Loop = { period: 8, still: 2.4 };
export const PASSAGE = 'steady hands win';
const RACE_START = 0.6;
const RACE_CHAR = 0.21;
const RACE_PACER = 4.4;
const RACE_OUT = 6.4;

export function race(t: number) {
	const out = t >= RACE_OUT;
	// Uneven rhythm, as real typing is.
	const charAt = (i: number) => RACE_START + i * RACE_CHAR + 0.05 * Math.sin(i * 2.3);
	const finish = charAt(PASSAGE.length - 1) + RACE_CHAR;
	const typed = out ? 0 : [...PASSAGE].filter((_, i) => t >= charAt(i)).length;
	return {
		typed,
		me: out ? 0 : ease('out-soft', span(t, RACE_START, finish - RACE_START)) * 0.4 + span(t, RACE_START, finish - RACE_START) * 0.6,
		pacer: out ? 0 : span(t, RACE_START, RACE_PACER),
		win: out ? 0 : span(t, finish, 0.2) * (1 - span(t, 5.8, 0.4)),
		opacity: out ? span(t, RACE_OUT + 0.15, 0.35) : 1 - span(t, 6.0, 0.35),
		caret: typed > 0 && typed < PASSAGE.length ? 1 : blink(t)
	};
}

/* ---------- Echo: the letters light one by one in their finger hues and fade; then typed back from memory ---------- */

export const ECHO_LOOP: Loop = { period: 8, still: 4.1 };
export const ECHO_WORD = 'spin';

export function echo(t: number) {
	const watch = 1 - span(t, 2.8, 0.2) + span(t, 6.5, 0.2);
	return {
		watch,
		slots: [...ECHO_WORD].map((c, i) => {
			const show = 0.5 + i * 0.55;
			const typedAt = 3.3 + i * 0.38;
			const lit = span(t, show, 0.08) * (1 - span(t, show + 0.35, 0.25));
			const ok = span(t, typedAt, 0.1) * (1 - span(t, 5.9, 0.35));
			return { c, finger: fingerOf(c), lit, ok, scale: 1 + 0.12 * bump(span(t, typedAt, 0.24)) + 0.06 * bump(span(t, show, 0.3)) };
		})
	};
}
