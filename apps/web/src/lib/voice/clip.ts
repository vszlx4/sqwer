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
