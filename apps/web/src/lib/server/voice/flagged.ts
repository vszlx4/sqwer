/*
 * Words rated unclear (one or two stars) in Listen and type on this machine, for the Voice page. Clips come from a
 * fixed seed, so making one again sounds the same: a word that reads wrong needs a respelling (RESPELL in clips.ts).
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { writeAtomic } from './supertonic.ts';

/** Kept small: the list is read by a person. */
export const FLAG_LIMIT = 200;

const flaggedFile = (voiceDir: string) => path.join(voiceDir, 'flagged.json');

/** Flagged words, newest first. */
export function readFlagged(voiceDir: string): string[] {
	try {
		const file = flaggedFile(voiceDir);
		const list: unknown = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
		return Array.isArray(list) ? list.filter((w): w is string => typeof w === 'string').slice(0, FLAG_LIMIT) : [];
	} catch {
		return [];
	}
}

/** Adds or removes a word; null clears the list. */
export async function setFlagged(voiceDir: string, word: string | null, on = true): Promise<string[]> {
	const rest = word === null ? [] : readFlagged(voiceDir).filter((w) => w !== word);
	const next = word !== null && on ? [word, ...rest].slice(0, FLAG_LIMIT) : rest;
	await writeAtomic(flaggedFile(voiceDir), new TextEncoder().encode(`${JSON.stringify(next)}\n`));
	return next;
}
