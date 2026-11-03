/* Spoken-word clips, shared by the page and the server (lib/server/voice.ts). */

/** Raised when the voice, carrier or cut changes, so browsers and the server cache fetch new clips. */
export const CLIP_VERSION = 1;

/** Lowercase words, with inner apostrophes or hyphens, up to 24 letters. */
export function isSpeakable(word: string): boolean {
	return word.length <= 24 && /^[a-z]+(?:['-][a-z]+)*$/.test(word);
}

export const clipUrl = (word: string) => `/voice/${CLIP_VERSION}/${encodeURIComponent(word)}`;
