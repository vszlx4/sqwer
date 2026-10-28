import { ENGLISH_WORDS } from './english.ts';

export interface WordOptions {
	punctuation?: boolean;
	numbers?: boolean;
	/** Words to draw from; the general English list when not given. */
	words?: readonly string[];
}

export type Random = () => number;

/** Small deterministic PRNG (mulberry32) so tests and replays can be reproduced. */
export function seededRandom(seed: number): Random {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const pick = <T>(list: readonly T[], rand: Random): T => list[Math.floor(rand() * list.length)]!;

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

/** Practice word stream; stateful so punctuated text continues across appends. */
export class WordGenerator {
	private rand: Random;
	private opts: WordOptions;
	private previous = '';
	private sentenceStart = true;

	constructor(opts: WordOptions = {}, rand: Random = Math.random) {
		this.opts = opts;
		this.rand = rand;
	}

	next(count: number): string[] {
		const out: string[] = [];
		for (let i = 0; i < count; i++) out.push(this.word());
		return out;
	}

	private word(): string {
		const rand = this.rand;
		let word: string;

		if (this.opts.numbers && rand() < 0.12) {
			const digits = 1 + Math.floor(rand() * 4);
			word = String(Math.floor(rand() * 10 ** digits));
		} else {
			do word = pick(this.opts.words ?? ENGLISH_WORDS, rand);
			while (word === this.previous);
		}
		this.previous = word;

		// Plain tests are lowercase; source casing shows only with punctuation.
		if (!this.opts.punctuation) return word.toLowerCase();

		if (this.sentenceStart) {
			word = capitalize(word);
			this.sentenceStart = false;
		}
		const r = rand();
		if (r < 0.1) {
			word += pick(['.', '.', '.', '?', '!'], rand);
			this.sentenceStart = true;
		} else if (r < 0.2) {
			word += pick([',', ',', ',', ';', ':'], rand);
		} else if (r < 0.23) {
			word = `"${word}"`;
		} else if (r < 0.26) {
			word = `(${word})`;
		} else if (r < 0.28 && /^[a-z]+$/i.test(word)) {
			word += pick(["'s", '-based'], rand);
		}
		return word;
	}
}
