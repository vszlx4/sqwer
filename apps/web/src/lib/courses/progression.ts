import { CHAPTERS, LESSONS } from './catalog.ts';
import type { LessonProgress, StepResult } from './types.ts';

/*
 * Stars, points and ranks. Points come only from completed lessons and their best
 * stars, so they reflect what has been learned and cannot be inflated by repetition.
 */

/** Stars for a lesson: none unless every step passed, then by the average accuracy of graded steps. */
export function lessonStars(results: StepResult[]): number {
	if (!results.length || results.some((r) => !r.passed)) return 0;
	const graded = results.filter((r) => r.graded !== false);
	if (!graded.length) return 3;
	const accuracy = graded.reduce((sum, r) => sum + r.accuracy, 0) / graded.length;
	return accuracy >= 98 ? 3 : accuracy >= 94 ? 2 : 1;
}

export const POINTS_PER_LESSON = 50;
export const POINTS_PER_STAR = 25;

export const lessonPoints = (stars: number) => (stars > 0 ? POINTS_PER_LESSON + POINTS_PER_STAR * stars : 0);

export function totalPoints(progress: Record<string, LessonProgress>): number {
	return Object.values(progress).reduce((sum, p) => sum + lessonPoints(p.stars), 0);
}

export interface Rank {
	level: number;
	name: string;
	/** Points needed to reach this rank. */
	min: number;
	/** A short description of what the rank represents. */
	note: string;
	hue: number;
}

export const RANKS: Rank[] = [
	{ level: 1, name: 'Fresh Fingers', min: 0, note: 'Every typist starts here.', hue: 200 },
	{ level: 2, name: 'Key Finder', min: 100, note: 'Your first keys are found.', hue: 170 },
	{ level: 3, name: 'Home-Row Hero', min: 350, note: 'All eight fingers know their home.', hue: 140 },
	{ level: 4, name: 'Top-Row Ranger', min: 800, note: 'Reaching up without looking.', hue: 95 },
	{ level: 5, name: 'Word Weaver', min: 1400, note: 'Letters have become words.', hue: 50 },
	{ level: 6, name: 'Rhythm Rider', min: 2200, note: 'An even, steady beat.', hue: 25 },
	{ level: 7, name: 'Swift Fingers', min: 3200, note: 'Speed that holds its accuracy.', hue: 350 },
	{ level: 8, name: 'Flow Keeper', min: 4400, note: 'Whole sentences without a pause.', hue: 300 },
	{ level: 9, name: 'Keyboard Captain', min: 5800, note: 'Every key, every symbol.', hue: 265 },
	{ level: 10, name: 'Keyboard Legend', min: 7400, note: 'The whole road, travelled.', hue: 230 }
];

export interface RankStatus {
	rank: Rank;
	next: Rank | null;
	points: number;
	/** Progress from this rank to the next, from 0 to 1. */
	progress: number;
}

export function rankFor(points: number): RankStatus {
	const index = RANKS.findLastIndex((r) => points >= r.min);
	const rank = RANKS[Math.max(0, index)]!;
	const next = RANKS[index + 1] ?? null;
	return { rank, next, points, progress: next ? (points - rank.min) / (next.min - rank.min) : 1 };
}

/** The highest number of points the course can award. */
export const MAX_POINTS = LESSONS.length * lessonPoints(3);

/** Consecutive days with practice, ending today or yesterday. Days are `YYYY-MM-DD`. */
export function streak(days: readonly string[], today: string): number {
	const set = new Set(days);
	const step = (d: string, by: number) => {
		const t = new Date(`${d}T12:00:00Z`);
		t.setUTCDate(t.getUTCDate() + by);
		return t.toISOString().slice(0, 10);
	};
	let day = set.has(today) ? today : step(today, -1);
	let count = 0;
	while (set.has(day)) {
		count++;
		day = step(day, -1);
	}
	return count;
}

/** Local calendar date as `YYYY-MM-DD`. */
export function localDay(t = Date.now()): string {
	const d = new Date(t);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The chapter to start in, from a placement test. Speed shows how far a typist has come;
 * accuracy below 90% suggests weak foundations, so the recommendation moves back one chapter.
 */
export function recommendedChapter(wpm: number, accuracy: number): number {
	const ladder: [number, number][] = [
		[12, 1],
		[20, 2],
		[26, 3],
		[32, 4],
		[38, 7],
		[48, 9],
		[Infinity, 10]
	];
	const tier = ladder.findIndex(([below]) => wpm < below);
	const adjusted = accuracy < 90 ? Math.max(0, tier - 1) : tier;
	return ladder[adjusted]![1];
}

/** Completed lessons in a chapter, for the roadmap. */
export function chapterProgress(chapter: number, progress: Record<string, LessonProgress>) {
	const lessons = CHAPTERS.find((c) => c.number === chapter)?.lessons ?? [];
	const done = lessons.filter((l) => (progress[l.id]?.stars ?? 0) > 0).length;
	const stars = lessons.reduce((s, l) => s + (progress[l.id]?.stars ?? 0), 0);
	return { done, total: lessons.length, stars, maxStars: lessons.length * 3 };
}

/**
 * The lesson to take next: the first unfinished lesson from the chosen starting point,
 * then any earlier unfinished lesson. Null once the whole course is complete.
 */
export function nextLessonId(progress: Record<string, LessonProgress>, startId: string | null): string | null {
	const start = Math.max(0, startId ? LESSONS.findIndex((l) => l.id === startId) : 0);
	const ordered = [...LESSONS.slice(start), ...LESSONS.slice(0, start)];
	return ordered.find((l) => (progress[l.id]?.stars ?? 0) === 0)?.id ?? null;
}
