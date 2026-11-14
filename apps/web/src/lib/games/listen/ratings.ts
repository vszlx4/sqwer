/*
 * How clear each word's clip sounded, 1-5 stars, kept on this device. One or two stars also lists the word on the
 * Voice page of the computer running this copy (ListenType).
 */

const KEY = 'sqwer:clip-ratings';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const local = (): Store | null => (typeof localStorage === 'undefined' ? null : localStorage);

function all(store: Store | null): Record<string, number> {
	try {
		return JSON.parse(store?.getItem(KEY) ?? '{}') as Record<string, number>;
	} catch {
		return {};
	}
}

/** The word's rating, 0 when unrated. */
export const ratingOf = (word: string, store = local()): number => all(store)[word] ?? 0;

/** Sets the word's rating; 0 removes it. */
export function setRating(word: string, stars: number, store = local()) {
	const ratings = all(store);
	if (stars) ratings[word] = stars;
	else delete ratings[word];
	try {
		store?.setItem(KEY, JSON.stringify(ratings));
	} catch {
		// Storage unavailable: the rating is not kept.
	}
}

/** Forgets every rating on this device, when learning data is cleared. */
export function forgetRatings(store = local()) {
	try {
		store?.removeItem(KEY);
	} catch {
		// Storage unavailable: nothing was kept.
	}
}
