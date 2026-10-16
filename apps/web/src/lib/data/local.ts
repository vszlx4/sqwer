import { pace } from '#lib/courses/pace.svelte.ts';
import { courses } from '#lib/courses/store.svelte.ts';
import { fingerMap } from '#lib/fingermap/store.svelte.ts';
import { results } from '#lib/results/store.svelte.ts';
import { usage } from '#lib/usage/store.svelte.ts';
import { categoryOfExam, type DataCategory, type DataResets } from './categories.ts';

/*
 * The browser's side of clearing data. Results, the finger map, usage statistics and some course
 * choices are also kept in this browser; when a category is cleared from the account, this copy is
 * discarded so that it is not uploaded again. Other devices do the same on their next visit, by
 * comparing the account's clearing times with the ones this browser has already applied.
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
