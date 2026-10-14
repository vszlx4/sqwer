import type { KeyboardLayout } from '@sqwer/layouts';
import { keyNeed, type FingerProfile } from './profile.ts';

export interface PromptOptions {
	/** Also cover the number row and remaining symbols. */
	extended?: boolean;
	words?: number;
}

type Random = () => number;

const SHIFT_TARGET = 10;

function codesOf(layout: KeyboardLayout, text: string): string[] {
	const out: string[] = [];
	for (const ch of text) {
		const c = layout.chars.get(ch);
		if (c) out.push(c.code);
	}
	return out;
}

/** Score a word by how much unmapped ground it covers; never-seen keys count extra. */
function scoreWord(word: string, profile: FingerProfile, layout: KeyboardLayout, known: Set<string>): number {
	const codes = codesOf(layout, word);
	if (!codes.length) return 0;
	let score = 0;
	const unique = new Set(codes);
	for (const code of unique) {
		score += keyNeed(profile, code);
		if (!known.has(code)) score += 0.5;
	}
	return score / Math.sqrt(codes.length);
}

const DIGITS = '1234567890';

/** Tokens that exercise symbol keys which rarely appear in words. */
const SYMBOL_TOKENS: Record<string, (w: string) => string> = {
	Comma: (w) => `${w},`,
	Period: (w) => `${w}.`,
	Semicolon: (w) => `${w};`,
	Quote: (w) => `${w}'s`,
	Slash: (w) => `${w}/or`,
	Minus: (w) => `${w}-free`,
	Equal: (w) => `${w}=1`,
	BracketLeft: (w) => `[${w}]`,
	BracketRight: (w) => `[${w}]`,
	Backslash: (w) => `${w}\\n`,
	Backquote: (w) => `\`${w}\``
};

/**
 * Build a short prompt (a few words) that covers keys the profile still needs.
 */
export function pickPrompt(
	profile: FingerProfile,
	layout: KeyboardLayout,
	vocabulary: readonly string[],
	rand: Random = Math.random,
	opts: PromptOptions = {}
): string {
	const count = opts.words ?? 3;
	const known = new Set(Object.keys(profile.keys));
	const words: string[] = [];

	for (let i = 0; i < count; i++) {
		const sample: { w: string; s: number }[] = [];
		for (let j = 0; j < 160; j++) {
			const w = vocabulary[Math.floor(rand() * vocabulary.length)]!;
			if (words.includes(w)) continue;
			sample.push({ w, s: scoreWord(w, profile, layout, known) });
		}
		sample.sort((a, b) => b.s - a.s);
		// Pick among the best few so prompts don't repeat.
		const pool = sample.slice(0, 6);
		words.push(pool[Math.floor(rand() * pool.length)]?.w ?? vocabulary[0]!);
	}

	// Symbol keys that still need samples.
	const symbolKeys = ['Comma', 'Period', 'Semicolon', 'Quote', 'Slash'];
	if (opts.extended) symbolKeys.push('Minus', 'Equal', 'BracketLeft', 'BracketRight', 'Backslash', 'Backquote');
	const neededSymbols = symbolKeys.filter((c) => keyNeed(profile, c) > 0);
	if (neededSymbols.length) {
		const code = neededSymbols[Math.floor(rand() * neededSymbols.length)]!;
		const at = Math.floor(rand() * words.length);
		words[at] = SYMBOL_TOKENS[code]!(words[at]!);
	}

	if (opts.extended) {
		const neededDigits = DIGITS.split('').filter((d) => keyNeed(profile, `Digit${d}`) > 0);
		if (neededDigits.length) {
			let token = '';
			for (let i = 0; i < 3; i++) token += neededDigits[Math.floor(rand() * neededDigits.length)];
			words.splice(Math.floor(rand() * (words.length + 1)), 0, token);
		}
	}

	// Capitals tell us which Shift and finger the user reaches for.
	if (profile.shift.samples < SHIFT_TARGET && rand() < 0.6) {
		const at = Math.floor(rand() * words.length);
		const w = words[at]!;
		const i = w.search(/[a-z]/);
		if (i >= 0) words[at] = w.slice(0, i) + w[i]!.toUpperCase() + w.slice(i + 1);
	}

	return words.join(' ');
}
