import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAME_IDS, loadRecords, roundSettings, startDifficulty } from './endless.ts';
import { ratingOf } from './levels.ts';

describe('endless mode', () => {
	it('makes every game harder at higher difficulty, and keeps going past Nightmare', () => {
		for (const game of GAME_IDS) {
			// Listen and type tightens past Nightmare through replays and longer words (round.ts, wordsForLevel).
			for (const [low, high] of game === 'listen' ? [[1, 12]] : [[1, 12], [12, 16]]) {
				const a = roundSettings(game, low);
				const b = roundSettings(game, high);
				const harder = (b.pacerWpm ?? 0) > (a.pacerWpm ?? 0) || (b.target ?? 0) > (a.target ?? 0) || (b.start ?? 0) > (a.start ?? 0) || (b.pace ?? 0) > (a.pace ?? 0);
				expect(harder, `${game} ${low} → ${high}`).toBe(true);
			}
		}
	});

	it('keeps settings whole and playable at any difficulty', () => {
		for (const game of GAME_IDS) {
			const s = roundSettings(game, 30.4);
			for (const n of [s.count, s.target, s.start, s.pacerWpm]) if (n !== undefined) expect(Number.isInteger(n), game).toBe(true);
			if (s.showMs !== undefined) expect(s.showMs).toBeGreaterThanOrEqual(160);
		}
	});
});

describe('saved records', () => {
	const store = new Map<string, string>();
	vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
	afterEach(() => store.clear());

	it('carry an old level 1-12 over as the rating at the same difficulty, and old level ids to the new names', () => {
		store.set('sqwer:endless', JSON.stringify({ listen: { best: 40, level: 8, difficulty: 'expert' }, race: { best: 2, level: 2, difficulty: 'gentle' } }));
		const r = loadRecords();
		expect(r.listen).toMatchObject({ best: 40, difficulty: 'insane' });
		expect(startDifficulty(r.listen)).toBeCloseTo(8);
		expect(r.race?.difficulty).toBe('easy');
		expect(r.race).not.toHaveProperty('level');
	});

	it('keep new records as saved', () => {
		store.set('sqwer:endless', JSON.stringify({ echo: { best: 9, rating: ratingOf(13), difficulty: 'expert' } }));
		const r = loadRecords();
		expect(r.echo?.difficulty).toBe('expert');
		expect(startDifficulty(r.echo)).toBeCloseTo(13);
	});

	it('start a first run in the middle of Easy', () => {
		expect(startDifficulty(undefined)).toBeCloseTo(2);
	});
});
