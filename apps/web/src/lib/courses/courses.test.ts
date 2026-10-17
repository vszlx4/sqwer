import { describe, expect, it } from 'vitest';
import { qwertyAnsi } from '@sqwer/layouts';
import { CHAPTERS, FIRST_LESSON, LESSONS, keyList } from './catalog.ts';
import { drillTokens, patternGroups, seeded } from './generate.ts';
import {
	MAX_POINTS,
	RANKS,
	lessonPoints,
	lessonStars,
	nextLessonId,
	rankFor,
	recommendedChapter,
	streak,
	totalPoints
} from './progression.ts';
import type { LessonProgress } from './types.ts';

const done = (stars: number): LessonProgress => ({ stars, bestAccuracy: 95, bestWpm: 20, attempts: 1, completedAt: 1 });

describe('the course catalog', () => {
	it('is a long road of twelve chapters that begins with F and J', () => {
		expect(CHAPTERS).toHaveLength(12);
		expect(LESSONS.length).toBeGreaterThanOrEqual(60);
		expect(FIRST_LESSON.title).toBe('F and J');
		expect(FIRST_LESSON.newKeys).toEqual(['f', 'j']);
	});

	it('gives every lesson a unique id, a sequential order and at least one step', () => {
		expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
		LESSONS.forEach((l, i) => {
			expect(l.order).toBe(i + 1);
			expect(l.steps.length).toBeGreaterThan(0);
		});
	});

	it('ends every chapter with a checkpoint, apart from the word chapters', () => {
		for (const c of CHAPTERS.filter((c) => ![7, 8].includes(c.number))) {
			expect(c.lessons.at(-1)!.steps.some((s) => s.kind === 'checkpoint')).toBe(true);
		}
	});

	it('only practises keys that earlier lessons have introduced, in the alphabet chapters', () => {
		let known = '';
		for (const lesson of LESSONS.filter((l) => l.chapter <= 3)) {
			known += lesson.newKeys.join('');
			for (const step of lesson.steps) {
				if (step.kind !== 'drill' || step.source.type !== 'patterns') continue;
				for (const ch of step.source.pool) expect(known).toContain(ch);
			}
		}
	});

	it('uses only keys present on the keyboard layout', () => {
		const layout = qwertyAnsi('pc');
		for (const l of LESSONS) {
			for (const k of l.newKeys) expect(k.length > 1 || layout.chars.has(k)).toBe(true);
		}
	});

	it('reads key names naturally', () => {
		expect(keyList(['f', 'j'])).toBe('F and J');
		expect(keyList(['a', ';'])).toBe('A and semicolon');
		expect(keyList(['4', '5', '6'])).toBe('4, 5 and 6');
	});
});

describe('drill generation', () => {
	it('starts by repeating each new key, then mixes mostly new keys', () => {
		const groups = patternGroups('fjdk', 'dk', 20, seeded(1));
		expect(groups.slice(0, 4)).toEqual(['ddd', 'kkk', 'ddd', 'kkk']);
		const later = groups.slice(4).join('');
		const share = [...later].filter((c) => 'dk'.includes(c)).length / later.length;
		expect(share).toBeGreaterThan(0.5);
	});

	it('repeats each chosen word in a row so it can be memorised', () => {
		const tokens = drillTokens({ type: 'words', pool: 'fjdksla', focus: 'a', count: 4, repeat: 3 }, seeded(2));
		expect(tokens).toHaveLength(12);
		for (let i = 0; i < 12; i += 3) expect(new Set(tokens.slice(i, i + 3)).size).toBe(1);
		expect(tokens.every((w) => /^[fjdksla]+$/.test(w))).toBe(true);
	});

	it('is reproducible for a given seed', () => {
		const source = { type: 'patterns', pool: 'fjdk', focus: 'dk', groups: 10 } as const;
		expect(drillTokens(source, seeded(7))).toEqual(drillTokens(source, seeded(7)));
	});

	it('never gives a word with a space in it, so Space always moves to the next word', () => {
		for (const lesson of LESSONS) {
			for (const step of lesson.steps) {
				if (step.kind !== 'drill' && step.kind !== 'checkpoint') continue;
				for (const token of drillTokens(step.source, seeded(3))) expect(token, `${lesson.id}: "${token}"`).not.toMatch(/\s/);
			}
		}
	});

	it('keeps the words of a phrase together and in order', () => {
		const tokens = drillTokens({ type: 'list', words: ['50%', 'you & me', 'A&B'], repeat: 1 }, seeded(5));
		expect(tokens).toHaveLength(5);
		const at = tokens.indexOf('you');
		expect(tokens.slice(at, at + 3)).toEqual(['you', '&', 'me']);
	});
});

describe('stars, points and ranks', () => {
	it('awards no stars unless every step passed', () => {
		expect(lessonStars([{ passed: true, accuracy: 99, summary: '' }, { passed: false, accuracy: 99, summary: '' }])).toBe(0);
	});

	it('awards stars by average accuracy', () => {
		const r = (accuracy: number) => [{ passed: true, accuracy, summary: '' }];
		expect(lessonStars(r(91))).toBe(1);
		expect(lessonStars(r(95))).toBe(2);
		expect(lessonStars(r(98.5))).toBe(3);
	});

	it('counts points from best stars only', () => {
		expect(lessonPoints(0)).toBe(0);
		expect(totalPoints({ a: done(3), b: done(1), c: done(0) })).toBe(lessonPoints(3) + lessonPoints(1));
	});

	it('moves through ranks in order and reaches the last before the maximum', () => {
		expect(rankFor(0).rank.name).toBe('Novice');
		expect(rankFor(RANKS[1]!.min).rank.name).toBe('Learner');
		expect(RANKS.at(-1)!.min).toBeLessThan(MAX_POINTS);
		// Points alone stop at Virtuoso; Legend needs three stars in 95% of the lessons.
		expect(rankFor(MAX_POINTS).rank.level).toBe(9);
		const all = (stars: number) => LESSONS.map(() => stars);
		expect(rankFor(MAX_POINTS, all(3)).rank.level).toBe(10);
		expect(rankFor(MAX_POINTS, all(3)).next).toBeNull();
		// Finishing every lesson with 75% of the stars guarantees Virtuoso, whatever the points.
		const mixed = LESSONS.map((_, i) => (i % 4 === 0 ? 0 : 3));
		expect(rankFor(0, mixed).rank.level).toBeLessThan(9);
		const finished = LESSONS.map((_, i) => (i % 4 === 0 ? 1 : 3));
		expect(rankFor(0, finished).rank.level).toBe(9);
	});
});

describe('streaks', () => {
	it('counts consecutive days ending today or yesterday', () => {
		expect(streak(['2026-10-12', '2026-10-13', '2026-10-14'], '2026-10-14')).toBe(3);
		expect(streak(['2026-10-12', '2026-10-13'], '2026-10-14')).toBe(2);
		expect(streak(['2026-10-10', '2026-10-13'], '2026-10-14')).toBe(1);
		expect(streak(['2026-10-01'], '2026-10-14')).toBe(0);
	});
});

describe('placement and the next lesson', () => {
	it('recommends a chapter from speed, one earlier when accuracy is low', () => {
		expect(recommendedChapter(8, 97)).toBe(1);
		expect(recommendedChapter(22, 97)).toBe(3);
		expect(recommendedChapter(22, 85)).toBe(2);
		expect(recommendedChapter(70, 99)).toBe(10);
	});

	it('continues from the chosen start, then returns to earlier gaps', () => {
		const ch3 = CHAPTERS[2]!.lessons[0]!.id;
		expect(nextLessonId({}, null)).toBe(FIRST_LESSON.id);
		expect(nextLessonId({}, ch3)).toBe(ch3);
		expect(nextLessonId({ [ch3]: done(2) }, ch3)).toBe(CHAPTERS[2]!.lessons[1]!.id);
		const all = Object.fromEntries(LESSONS.map((l) => [l.id, done(1)]));
		expect(nextLessonId(all, null)).toBeNull();
	});
});

describe('the learner path', () => {
	const base = { level: null, placement: null, progress: {}, startLesson: null } as const;

	it('welcomes a new visitor, then leads beginners straight to the first lesson', async () => {
		const { nextStep } = await import('./path.ts');
		expect(nextStep(base).stage).toBe('welcome');
		const step = nextStep({ ...base, level: 'new' });
		expect(step.stage).toBe('course');
		expect(step.lesson?.id).toBe(FIRST_LESSON.id);
		expect(step.action).toBe('Start lesson 1: F and J');
	});

	it('asks typists for a placement test, then starts them at the recommended chapter', async () => {
		const { nextStep } = await import('./path.ts');
		expect(nextStep({ ...base, level: 'some' }).stage).toBe('placement');
		const step = nextStep({ ...base, level: 'some', placement: { wpm: 22, accuracy: 96 } });
		expect(step.lesson?.chapter).toBe(3);
	});

	it('treats choosing a chapter or completing a lesson as having started', async () => {
		const { nextStep } = await import('./path.ts');
		const chosen = CHAPTERS[3]!.lessons[0]!.id;
		expect(nextStep({ ...base, startLesson: chosen }).lesson?.id).toBe(chosen);
		expect(nextStep({ ...base, progress: { [FIRST_LESSON.id]: done(2) } }).stage).toBe('course');
	});

	it('respects a chosen starting lesson and says when the course is complete', async () => {
		const { nextStep } = await import('./path.ts');
		const chosen = CHAPTERS[6]!.lessons[0]!.id;
		expect(nextStep({ ...base, level: 'new', startLesson: chosen }).lesson?.id).toBe(chosen);
		const all = Object.fromEntries(LESSONS.map((l) => [l.id, done(2)]));
		expect(nextStep({ ...base, level: 'new', progress: all }).stage).toBe('complete');
	});
});

describe('course variety', () => {
	it('never repeats words within a drill', () => {
		for (const lesson of LESSONS)
			for (const step of lesson.steps)
				if ((step.kind === 'drill' || step.kind === 'checkpoint') && 'repeat' in step.source) expect(step.source.repeat).toBe(1);
	});

	it('uses every game, and no two lessons in a row share the same set of steps', () => {
		const kinds = new Set(LESSONS.flatMap((l) => l.steps.map((s) => s.kind)));
		for (const k of ['falling', 'keyhunt', 'race', 'echo', 'listen']) expect(kinds.has(k as never)).toBe(true);
		const shape = (i: number) => LESSONS[i]!.steps.map((s) => s.kind).join(',');
		const same: string[] = [];
		for (let i = 1; i < LESSONS.length; i++) {
			if (LESSONS[i]!.steps.some((s) => s.kind === 'checkpoint') || LESSONS[i]!.newKeys.length) continue;
			if (shape(i) === shape(i - 1)) same.push(`${LESSONS[i - 1]!.title} / ${LESSONS[i]!.title}`);
		}
		expect(same).toEqual([]);
	});

	it('gives every game a target instead of a time limit', () => {
		for (const lesson of LESSONS)
			for (const step of lesson.steps) {
				if (step.kind === 'falling' || step.kind === 'keyhunt') expect(step.target).toBeGreaterThan(0);
				expect('seconds' in step && step.kind !== 'checkpoint').toBe(false);
			}
	});
});
