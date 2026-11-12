/*
 * Supertonic clips on disk. A clip's name is a fingerprint of everything that shapes its sound: model, style, steps,
 * speed, format and the spoken text. A word in six lists is one file; changing any setting names new clips, and the
 * old ones become orphans for the health check. The seed comes from the same fingerprint.
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { MP3_KBPS, MP3_RATE } from './mp3.ts';
import { STEPS, STYLE, SUPERTONIC_MODEL } from './supertonic.ts';

export const SPEEDS = { normal: 1, slow: 0.75 } as const;
export type Speed = keyof typeof SPEEDS;
export const isSpeed = (s: string): s is Speed => s === 'normal' || s === 'slow';

/**
 * Supertonic reads letters, not sounds: words it says wrong are given to it respelled. The learner still sees and
 * types the real word. Add words here as they are found; each change remakes only that word's clips.
 */
export const RESPELL: Readonly<Record<string, string>> = {
	niche: 'neesh',
	receipt: 'reseet'
};

/** What the model is asked to say for a word. Own keys only: "constructor" would read Object's. */
export const spoken = (word: string) => (Object.hasOwn(RESPELL, word) ? RESPELL[word]! : word);

/** Raised when trimming or encoding changes, so every clip is remade. */
const FORMAT = `mp3-${MP3_RATE}-${MP3_KBPS}-trim1`;

export function fingerprint(word: string, speed: Speed): string {
	const key = JSON.stringify([SUPERTONIC_MODEL.sha256, STYLE, STEPS, SPEEDS[speed], FORMAT, spoken(word)]);
	return createHash('sha256').update(key).digest('hex').slice(0, 32);
}

/** Seed for a clip's noise: the first 32 bits of its fingerprint. */
export const seedOf = (fp: string) => parseInt(fp.slice(0, 8), 16);

export const clipsDir = (voiceDir: string) => path.join(voiceDir, 'supertonic');
export const clipPath = (voiceDir: string, fp: string) => path.join(clipsDir(voiceDir), fp.slice(0, 2), `${fp}.mp3`);
export const hasClip = (voiceDir: string, word: string, speed: Speed) => existsSync(clipPath(voiceDir, fingerprint(word, speed)));
