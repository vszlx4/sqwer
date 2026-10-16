import { describe, expect, it } from 'vitest';
import { TIERS, nextTier, tierFor, tierRange, verifyCompetitive } from './competitive.ts';
import { MAX_XP_PER_TEST, examXp, levelFor, xpForLevel } from './xp.ts';

describe('experience and levels', () => {
	it('rewards longer, faster and more accurate tests, and nothing for abandoned ones', () => {
		const base = { seconds: 60, wpm: 50, accuracy: 95, status: 'completed' as const };
		expect(examXp(base)).toBeGreaterThan(0);
		expect(examXp({ ...base, seconds: 120 })).toBeGreaterThan(examXp(base));
		expect(examXp({ ...base, wpm: 80 })).toBeGreaterThan(examXp(base));
		expect(examXp({ ...base, accuracy: 80 })).toBeLessThan(examXp(base));
		expect(examXp({ ...base, status: 'abandoned' })).toBe(0);
		expect(examXp({ ...base, seconds: 5 })).toBe(0);
		expect(examXp({ seconds: 3600, wpm: 300, accuracy: 100, status: 'completed' })).toBe(MAX_XP_PER_TEST);
	});

	it('maps XP to levels that need 100 more XP each time', () => {
		expect(xpForLevel(1)).toBe(0);
		expect(xpForLevel(2)).toBe(100);
		expect(xpForLevel(3)).toBe(300);
		expect(levelFor(0).level).toBe(1);
		expect(levelFor(99).level).toBe(1);
		expect(levelFor(100).level).toBe(2);
		expect(levelFor(299).level).toBe(2);
		expect(levelFor(300).level).toBe(3);
		for (const xp of [0, 57, 1000, 12345, 250000]) {
			const l = levelFor(xp);
			expect(xp).toBeGreaterThanOrEqual(l.floor);
			expect(xp).toBeLessThan(l.next);
			expect(l.progress).toBeGreaterThanOrEqual(0);
			expect(l.progress).toBeLessThan(1);
		}
	});
});

describe('competitive tiers', () => {
	it('follows the published table: fourteen ranks of three divisions, then Zenith at 300 WPM', () => {
		expect(TIERS).toHaveLength(43);
		const table: [number, string][] = [
			[49, ''],
			[50, 'Bronze III'],
			[52.9, 'Bronze III'],
			[53, 'Bronze II'],
			[57, 'Bronze I'],
			[59, 'Bronze I'],
			[60, 'Silver III'],
			[129, 'Champion I'],
			[130, 'Grandmaster III'],
			[133, 'Grandmaster III'],
			[134, 'Grandmaster II'],
			[140, 'Grandmaster I'],
			[141, 'Prodigy III'],
			[159, 'Prodigy I'],
			[160, 'Paragon III'],
			[179, 'Paragon I'],
			[180, 'Overlord III'],
			[209, 'Overlord I'],
			[210, 'Ascendant III'],
			[249, 'Ascendant I'],
			[250, 'Transcendent III'],
			[283, 'Transcendent I'],
			[299.9, 'Transcendent I'],
			[300, 'Zenith'],
			[360, 'Zenith']
		];
		for (const [wpm, name] of table) expect(tierFor(wpm)?.name ?? '', `${wpm} WPM`).toBe(name);
		// Each tier ends where the next begins.
		for (let i = 1; i < TIERS.length; i++) expect(TIERS[i - 1]!.to).toBe(TIERS[i]!.from - 1);
		expect(tierRange(tierFor(55)!)).toBe('53 to 56 WPM');
		expect(tierRange(tierFor(300)!)).toBe('300+ WPM');
		expect(nextTier(null)!.name).toBe('Bronze III');
		expect(nextTier(tierFor(300))).toBeNull();
	});

	it('accepts a plausible minute of typing and rejects implausible ones', () => {
		// 60 words of 4 letters, typed evenly over a minute: 60 × 5 / 5 = 60 WPM.
		const words = Array.from({ length: 60 }, () => ({ w: 'type', ok: true }));
		const replay: [number, string][] = Array.from({ length: 300 }, (_, i) => [i * 200, 'a']);
		const ok = { seconds: 60, wpm: 60, accuracy: 98, chars: { correct: 240 }, words, replay };
		expect(verifyCompetitive(ok)).toBe(true);
		expect(verifyCompetitive({ ...ok, wpm: 120 })).toBe(false);
		expect(verifyCompetitive({ ...ok, seconds: 30 })).toBe(false);
		expect(verifyCompetitive({ ...ok, accuracy: 85 })).toBe(false);
		expect(verifyCompetitive({ ...ok, replay: replay.map(([t, c]) => [t / 20, c] as [number, string]) })).toBe(false);
		expect(verifyCompetitive({ ...ok, replay: replay.slice(0, 50) })).toBe(false);
	});
});
