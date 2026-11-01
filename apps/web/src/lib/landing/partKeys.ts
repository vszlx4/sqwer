import { LESSONS, PARTS, type Part } from '#lib/courses/catalog.ts';

/* The keys each course part brings in, on a small US keyboard for the landing deck: new in this part, known from
   the parts before, or still to come. */

export const ROWS = [
	['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
	['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
	['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
	['shift-l', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift-r']
] as const;

export type KeyState = 'new' | 'known' | 'later';

// Shifted characters land on the key that types them.
const SHIFTED: Record<string, string> = {
	'~': '`', '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
	_: '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/'
};

/** Grid key for a lesson key (a character or a Shift code); null for keys off the grid, like Space. */
export function gridKey(k: string): string | null {
	if (k === 'ShiftLeft') return 'shift-l';
	if (k === 'ShiftRight') return 'shift-r';
	if (k.length !== 1 || k === ' ') return null;
	const c = SHIFTED[k] ?? k.toLowerCase();
	return ROWS.some((r) => (r as readonly string[]).includes(c)) ? c : null;
}

function keysOf(part: Part): Set<string> {
	const keys = LESSONS.filter((l) => (part.chapters as readonly number[]).includes(l.chapter)).flatMap((l) => l.newKeys);
	return new Set(keys.map(gridKey).filter((k): k is string => k !== null));
}

/** State of every grid key for the part at index i. */
export function partKeys(i: number): Map<string, KeyState> {
	const known = new Set(PARTS.slice(0, i).flatMap((p) => [...keysOf(p)]));
	const fresh = keysOf(PARTS[i]!);
	return new Map(ROWS.flat().map((k) => [k, fresh.has(k) && !known.has(k) ? 'new' : known.has(k) ? 'known' : 'later']));
}

/** Lessons in a part. */
export const partLessons = (part: Part) => LESSONS.filter((l) => (part.chapters as readonly number[]).includes(l.chapter)).length;
