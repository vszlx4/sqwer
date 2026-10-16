/**
 * Experience (XP) and account level. XP comes from two places: course lessons (their points)
 * and examinations. The level is incremental and has no ceiling; it is separate from the course
 * rank, which only measures the learning path.
 */

export interface XpInput {
	seconds: number;
	wpm: number;
	accuracy: number;
	status: 'completed' | 'abandoned';
}

/** Most XP a single examination can give, so very long tests cannot be farmed. */
export const MAX_XP_PER_TEST = 300;

/**
 * XP for one examination: longer, faster and more accurate tests earn more. Accuracy counts
 * twice over, so careless speed is not rewarded. Abandoned or very short tests earn nothing.
 */
export function examXp(r: XpInput): number {
	if (r.status !== 'completed' || r.seconds < 10 || r.accuracy < 50) return 0;
	const minutes = Math.min(r.seconds, 300) / 60;
	const quality = (r.accuracy / 100) ** 2;
	return Math.min(MAX_XP_PER_TEST, Math.round(minutes * (20 + Math.min(r.wpm, 300) * 0.8) * quality));
}

/** Total XP needed to reach a level: 0, 100, 300, 600, 1,000, ... (each level needs 100 more than the last). */
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
