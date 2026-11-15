/* Spoken-word clips, shared by the page and the server (lib/server/voice.ts, routes/voice). */

export type Speed = 'normal' | 'slow';

/** Raised when the Standard voice, carrier or cut changes, so its clips are made again. */
export const CLIP_VERSION = 1;

/** Lowercase words, with inner apostrophes or hyphens, up to 24 letters. */
export function isSpeakable(word: string): boolean {
	return word.length <= 24 && /^[a-z]+(?:['-][a-z]+)*$/.test(word);
}

/** A word in the voice this copy uses. `version` names the voice settings, so a clip behind a URL never changes. */
export const clipUrl = (version: string, word: string, speed: Speed = 'normal') => `/voice/${version}/auto/${speed}/${encodeURIComponent(word)}`;

/** How soon a clip is wanted: the word in play, the words after it, or a slow clip that may never be played. */
export const NEEDS = ['now', 'soon', 'later'] as const;
export type Need = (typeof NEEDS)[number];
/** Sent with a clip request, so the server makes the word in play before the look-ahead. */
export const NEED_HEADER = 'X-Voice-Need';
export const needOf = (value: string | null | undefined): Need => (NEEDS.includes(value as Need) ? (value as Need) : 'soon');
/** Lower runs first. */
export const NEED_RANK: Readonly<Record<Need, number>> = { now: 0, soon: 1, later: 2 };
