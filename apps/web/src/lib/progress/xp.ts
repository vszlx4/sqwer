/** XP and account level. XP from lesson points and exams. Level is uncapped and separate from course rank. */

export interface XpInput {
	seconds: number;
	wpm: number;
	accuracy: number;
	status: 'completed' | 'abandoned';
}

/** Most XP a single examination can give, so very long tests cannot be farmed. */
export const MAX_XP_PER_TEST = 300;

/** Exam XP: grows with length, speed and accuracy (weighted double). Abandoned or very short tests: 0. */
export function examXp(r: XpInput): number {
	if (r.status !== 'completed' || r.seconds < 10 || r.accuracy < 50) return 0;
	const minutes = Math.min(r.seconds, 300) / 60;
	const quality = (r.accuracy / 100) ** 2;
	return Math.min(MAX_XP_PER_TEST, Math.round(minutes * (20 + Math.min(r.wpm, 300) * 0.8) * quality));
}

/** Total XP for a level: 0, 100, 300, 600, 1000, … (+100 per level). */
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export interface LevelStatus {
	level: number;
	xp: number;
	/** XP at the start of this level and of the next. */
	floor: number;
	next: number;
	/** Progress through this level, from 0 to 1. */
	progress: number;
}

export function levelFor(xp: number): LevelStatus {
	const total = Math.max(0, Math.floor(xp));
	// Solve 50L(L-1) <= xp for L.
	let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + total / 12.5)) / 2));
	while (xpForLevel(level + 1) <= total) level++;
	while (level > 1 && xpForLevel(level) > total) level--;
	const floor = xpForLevel(level);
	const next = xpForLevel(level + 1);
	return { level, xp: total, floor, next, progress: (total - floor) / (next - floor) };
}
