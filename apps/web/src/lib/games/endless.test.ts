import { describe, expect, it } from 'vitest';
import { GAME_IDS, MAX_LEVEL, MIN_LEVEL, nextLevel, roundSettings } from './endless.ts';

describe('endless mode', () => {
	it('rises after a cleared round and eases after a failed one, within the limits', () => {
		expect(nextLevel(3, true)).toBe(4);
		expect(nextLevel(3, false)).toBe(2);
		expect(nextLevel(MAX_LEVEL, true)).toBe(MAX_LEVEL);
		expect(nextLevel(MIN_LEVEL, false)).toBe(MIN_LEVEL);
	});

	it('makes every game harder at higher levels', () => {
		for (const game of GAME_IDS) {
			const low = roundSettings(game, 1);
			const high = roundSettings(game, MAX_LEVEL);
			const harder = (high.pacerWpm ?? 0) > (low.pacerWpm ?? 0) || (high.target ?? 0) > (low.target ?? 0) || (high.bpm ?? 0) > (low.bpm ?? 0) || (high.start ?? 0) > (low.start ?? 0);
			expect(harder, game).toBe(true);
		}
	});
});
