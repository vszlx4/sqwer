import { describe, expect, it } from 'vitest';
import { LESSONS } from './catalog.ts';
import { rankJourney, roughTime } from './journey.ts';
import { RANKS, THREE_STARS_AT } from './progression.ts';

describe('the rank journey', () => {
	const stops = rankJourney();

	it('has one stop per rank, in order, never going back in time or speed', () => {
		expect(stops.map((s) => s.rank.level)).toEqual(RANKS.map((r) => r.level));
		for (let i = 1; i < stops.length; i++) {
			expect(stops[i]!.lessons).toBeGreaterThanOrEqual(stops[i - 1]!.lessons);
			expect(stops[i]!.wpm!).toBeGreaterThanOrEqual(stops[i - 1]!.wpm ?? 0);
		}
	});

	it('starts at the first lesson and ends with the whole course at three-star accuracy', () => {
		expect(stops[0]).toMatchObject({ lessons: 0, wpm: null, accuracy: null });
		expect(stops.at(-1)).toMatchObject({ lessons: LESSONS.length, accuracy: THREE_STARS_AT });
		expect(stops.at(-2)!.lessons).toBeLessThanOrEqual(LESSONS.length);
	});

	it('rounds time to five minutes, then to hours', () => {
		expect(roughTime(13)).toBe('15 min');
		expect(roughTime(0)).toBe('5 min');
		expect(roughTime(812)).toBe('14 h');
	});
});
