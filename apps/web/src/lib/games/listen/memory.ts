/*
 * What this device remembers about each Listen and type word: when it was last heard, how it went, and when it is due
 * again. A right answer rests the word for days, longer each time it stays right; a missed word comes back in
 * minutes, then a day, then days as it is learned. About LIMIT words are kept, the least recent dropped first.
 */

import { isRight, type Outcome } from './score.ts';

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

/** Rest after a right answer, by how many right answers in a row the word now has. */
const RIGHT = [DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
/** A missed word comes back after this, then follows RIGHT as it is answered right again. */
const MISSED = 10 * MINUTE;
/** A close answer: back the next day. */
const CLOSE = DAY;

export const LIMIT = 5000;
const KEY = 'sqwer:word-memory';

export interface WordRecord {
	/** Last heard, ms since the epoch. */
	seen: number;
	/** Due again from, ms since the epoch. */
	due: number;
	/** Right answers in a row. */
	right: number;
	/** Answers that missed, all time. */
	misses: number;
	last: Outcome;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>;

export class WordMemory {
	#words = new Map<string, WordRecord>();
	#store: Store | null;

	constructor(store: Store | null = typeof localStorage === 'undefined' ? null : localStorage) {
		this.#store = store;
		try {
			const saved = JSON.parse(store?.getItem(KEY) ?? '{}') as Record<string, WordRecord>;
			for (const [w, r] of Object.entries(saved).sort((a, b) => a[1].seen - b[1].seen)) {
				if (Number.isFinite(r?.seen) && Number.isFinite(r?.due)) this.#words.set(w, r);
			}
		} catch {
			// Unreadable or unavailable storage: start empty.
		}
	}

	get(word: string): WordRecord | undefined {
		return this.#words.get(word);
	}

	get size(): number {
		return this.#words.size;
	}

	/** Words heard since `since`, newest last. */
	heardSince(since: number): string[] {
		return [...this.#words].filter(([, r]) => r.seen >= since).map(([w]) => w);
	}

	/** Records an answer and when the word is due again. */
	record(word: string, outcome: Outcome, now = Date.now()): WordRecord {
		const before = this.#words.get(word);
		const right = isRight(outcome) ? (before?.right ?? 0) + 1 : 0;
		const misses = (before?.misses ?? 0) + (isRight(outcome) || outcome === 'close' ? 0 : 1);
		const rest = isRight(outcome) ? RIGHT[Math.min(right, RIGHT.length) - 1]! : outcome === 'close' ? CLOSE : MISSED;
		const rec: WordRecord = { seen: now, due: now + rest, right, misses, last: outcome };
		// Newest last, so the oldest are dropped first.
		this.#words.delete(word);
		this.#words.set(word, rec);
		for (const old of this.#words.keys()) {
			if (this.#words.size <= LIMIT) break;
			this.#words.delete(old);
		}
		this.#save();
		return rec;
	}

	#save() {
		try {
			this.#store?.setItem(KEY, JSON.stringify(Object.fromEntries(this.#words)));
		} catch {
			// Storage full or unavailable: the memory lasts this visit.
		}
	}
}
