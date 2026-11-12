import { describe, expect, it } from 'vitest';
import { DAY, LIMIT, MINUTE, WordMemory } from './memory.ts';
import { confusable, difficulty, pick } from './pick.ts';
import { answer, canReplay, countsAsReplay, finish, newRound, next, replayLimit, result, start, swap } from './round.ts';
import { accuracyOf, grade, passed, pointsOf, type Answer } from './score.ts';

/** Seeded random numbers (mulberry32), so draws repeat. */
function seeded(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const memStore = () => {
	const data = new Map<string, string>();
	return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};
const ans = (word: string, typed: string): Answer => {
	const r = grade(word, typed);
	return { word, typed: r.typed, outcome: r.kind, points: r.points, level: 0, plays: 1, ms: 1500 };
};

describe('score', () => {
	it('gives exact and accepted a point, close half, misheard and wrong nothing', () => {
		const list = [ans('house', 'house'), ans('color', 'colour'), ans('house', 'hosue'), ans('house', 'zzzz')];
		expect(list.map((a) => a.points)).toEqual([1, 1, 0.5, 0]);
		expect(pointsOf(list)).toBe(2.5);
		expect(accuracyOf(list)).toBe(63);
		expect(passed(list, 2.5)).toBe(true);
		expect(passed(list, 3)).toBe(false);
	});
});

describe('round', () => {
	it('runs intro → listening → answered → review → done and passes by points', () => {
		let r = newRound(['house', 'phone', 'color'], 2);
		expect(r.phase).toBe('intro');
		r = start(r);
		expect(r.phase).toBe('listening');
		r = next(answer(r, ans('house', 'house')));
		r = next(answer(r, ans('phone', 'fone')));
		r = answer(r, ans('color', 'colour'));
		expect(r.phase).toBe('answered');
		r = next(r);
		expect(r.phase).toBe('review');
		expect(result(r)).toMatchObject({ passed: true, points: 2.5, accuracy: 83, missed: ['phone'] });
		expect(finish(r).phase).toBe('done');
	});

	it('fails a round short of its points, and never fails a practice round', () => {
		let r = start(newRound(['house'], 1));
		r = next(answer(r, ans('house', 'hosue')));
		expect(result(r).passed).toBe(false);
		let p = start(newRound(['house'], 0));
		p = next(answer(p, ans('house', 'zzzz')));
		expect(result(p).passed).toBe(true);
	});

	it('ignores steps out of order', () => {
		const r = newRound(['house'], 1);
		expect(next(r)).toBe(r);
		expect(answer(r, ans('house', 'house'))).toBe(r);
	});

	it('swaps only words not yet answered', () => {
		let r = start(newRound(['one', 'two', 'three'], 2));
		r = swap(r, 1, 'four');
		expect(r.words).toEqual(['one', 'four', 'three']);
		r = answer(r, ans('one', 'one'));
		expect(swap(r, 0, 'five').words[0]).toBe('one');
	});

	it('limits replays by level, and counts slow plays from level 5', () => {
		expect([null, 1, 4, 5, 8, 9, 12].map(replayLimit)).toEqual([Infinity, Infinity, Infinity, 3, 3, 1, 1]);
		expect(canReplay(9, 0, 'normal')).toBe(true);
		expect(canReplay(9, 1, 'normal')).toBe(false);
		expect(canReplay(3, 99, 'slow')).toBe(true);
		expect(canReplay(9, 1, 'slow')).toBe(false);
		expect(canReplay(null, 50, 'normal')).toBe(true);
		expect(countsAsReplay(9, true, 'normal')).toBe(false);
		expect(countsAsReplay(4, false, 'slow')).toBe(false);
		expect(countsAsReplay(5, false, 'slow')).toBe(true);
	});
});

describe('word memory', () => {
	it('rests right words for days, longer each time, and brings missed words back in minutes', () => {
		const m = new WordMemory(memStore());
		const t = 1_000_000;
		expect(m.record('house', 'exact', t).due).toBe(t + DAY);
		expect(m.record('house', 'accepted', t).due).toBe(t + 3 * DAY);
		expect(m.record('house', 'exact', t).due).toBe(t + 7 * DAY);
		const miss = m.record('house', 'wrong', t);
		expect(miss).toMatchObject({ due: t + 10 * MINUTE, right: 0, misses: 1 });
		expect(m.record('house', 'exact', t).due).toBe(t + DAY);
		expect(m.record('phone', 'close', t)).toMatchObject({ due: t + DAY, misses: 0 });
	});

	it('is kept on the device and drops the least recent words past its limit', () => {
		const store = memStore();
		const m = new WordMemory(store);
		for (let i = 0; i <= LIMIT; i++) m.record(`w${i}`, 'exact', i);
		expect(m.size).toBe(LIMIT);
		expect(m.get('w0')).toBeUndefined();
		const again = new WordMemory(store);
		expect(again.get(`w${LIMIT}`)?.seen).toBe(LIMIT);
		expect(again.heardSince(LIMIT - 1)).toEqual([`w${LIMIT - 1}`, `w${LIMIT}`]);
	});

	it('starts empty when storage is unreadable', () => {
		expect(new WordMemory({ getItem: () => '{oops', setItem: () => {} }).size).toBe(0);
	});
});

describe('confusable', () => {
	it('finds sound-alikes, look-alikes and forms of one word', () => {
		for (const [a, b] of [
			['their', 'there'],
			['form', 'from'],
			['quiet', 'quite'],
			['angel', 'angle'],
			['walk', 'walked'],
			['walking', 'walks'],
			['city', 'cities']
		])
			expect(confusable(a!, b!), `${a} / ${b}`).toBe(true);
		for (const [a, b] of [
			['house', 'phone'],
			['cat', 'cut'],
			['garden', 'window']
		])
			expect(confusable(a!, b!), `${a} / ${b}`).toBe(false);
	});
});

describe('pick', () => {
	const pool = ['house', 'phone', 'garden', 'window', 'river', 'table', 'pencil', 'orange', 'yellow', 'basket'];

	it('repeats for the same seed and never picks a word twice', () => {
		const a = pick(pool, { n: 6, rand: seeded(7) });
		expect(pick(pool, { n: 6, rand: seeded(7) })).toEqual(a);
		expect(new Set(a).size).toBe(6);
	});

	it('picks only voiced, speakable words', () => {
		const out = pick([...pool, 'Not a word', 'x1'], { n: 20, rand: seeded(1), voiced: (w) => w !== 'house' });
		expect(out).not.toContain('house');
		expect(out.every((w) => /^[a-z]+$/.test(w))).toBe(true);
	});

	it('keeps confusable words out of one round', () => {
		const out = pick(['form', 'from', 'their', 'there', 'walk', 'walked', 'garden', 'window'], { n: 4, rand: seeded(3) });
		for (const a of out) for (const b of out) if (a !== b) expect(confusable(a, b), `${a} / ${b}`).toBe(false);
	});

	it('keeps words confusable with ones heard in the last minutes apart, while others remain', () => {
		const m = new WordMemory(memStore());
		const now = 10 * DAY;
		m.record('form', 'exact', now - MINUTE);
		for (let s = 0; s < 20; s++) expect(pick(['from', 'garden', 'window'], { n: 1, rand: seeded(s), memory: m, now })).not.toContain('from');
	});

	it('leaves resting words for unseen and due ones, and favors missed words', () => {
		const m = new WordMemory(memStore());
		const now = 10 * DAY;
		m.record('house', 'exact', now - 1000 * MINUTE);
		m.record('phone', 'wrong', now - 60 * MINUTE);
		m.record('phone', 'wrong', now - 30 * MINUTE);
		const counts = new Map<string, number>();
		for (let s = 0; s < 400; s++) {
			const [w] = pick(['house', 'phone', 'garden'], { n: 1, rand: seeded(s), memory: m, now });
			counts.set(w!, (counts.get(w!) ?? 0) + 1);
		}
		expect(counts.get('house') ?? 0).toBe(0);
		expect(counts.get('phone')!).toBeGreaterThan(counts.get('garden')!);
	});

	it('relaxes its rules so a small pool still fills the round', () => {
		const m = new WordMemory(memStore());
		const now = 10 * DAY;
		for (const w of ['form', 'from', 'walk']) m.record(w, 'exact', now - MINUTE);
		const out = pick(['form', 'from', 'walk'], { n: 5, rand: seeded(2), memory: m, now });
		expect(out).toHaveLength(5);
		expect(new Set(out.slice(0, 3)).size).toBe(3);
	});

	it('fits the level by difficulty, not only length', () => {
		expect(difficulty('though')).toBeGreaterThan(difficulty('things'));
		expect(difficulty('cat', 1)).toBeGreaterThan(difficulty('cat', 0));
		const words = ['cat', 'dog', 'sun', 'pen', 'cup', 'rhythm', 'knowledge', 'psychology', 'thoroughly', 'necessary'];
		const tally = (level: number) => {
			let hard = 0;
			for (let s = 0; s < 200; s++) hard += pick(words, { n: 1, rand: seeded(s), level }).filter((w) => w.length > 5).length;
			return hard;
		};
		expect(tally(12)).toBeGreaterThan(150);
		expect(tally(1)).toBeLessThan(50);
	});
});
