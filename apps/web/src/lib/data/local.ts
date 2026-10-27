import { pace } from '#lib/courses/pace.svelte.ts';
import { courses } from '#lib/courses/store.svelte.ts';
import { fingerMap } from '#lib/fingermap/store.svelte.ts';
import { results } from '#lib/results/store.svelte.ts';
import { usage } from '#lib/usage/store.svelte.ts';
import { categoryOfExam, type DataCategory, type DataResets } from './categories.ts';

/*
 * Local side of clearing data: drop browser copies of a cleared category so they aren't re-uploaded.
 * Other devices compare clear times on their next visit.
 */

const SEEN_KEY = 'sqwer:resets';

function seen(): DataResets {
	try {
		return JSON.parse(localStorage.getItem(SEEN_KEY) ?? '{}') as DataResets;
	} catch {
		return {};
	}
}

function markSeen(category: DataCategory, at: number) {
	try {
		localStorage.setItem(SEEN_KEY, JSON.stringify({ ...seen(), [category]: at }));
	} catch {
		// Storage unavailable: the copy is discarded again on the next visit, which is harmless.
	}
}

/** Discards this browser's copy of one category. */
export async function forgetLocal(category: DataCategory, at = Date.now()) {
	switch (category) {
		case 'learning':
			pace.reset();
			await courses.forget();
			break;
		case 'practice':
		case 'ranked':
			await results.forget((r) => categoryOfExam(r.exam) === category && r.at <= at);
			break;
		case 'fingermap':
			await fingerMap.forget();
			break;
		case 'usage':
			await usage.forget();
			break;
	}
	markSeen(category, at);
}

/** Applies clearings made on another device that this browser has not applied yet. */
export async function applyResets(resets: DataResets | undefined) {
	if (!resets) return;
	const done = seen();
	for (const [category, at] of Object.entries(resets) as [DataCategory, number][]) {
		if (at > (done[category] ?? 0)) await forgetLocal(category, at);
	}
}
