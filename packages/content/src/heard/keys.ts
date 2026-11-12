/*
 * Slips of the finger, read from the keyboard layout: a neighboring key, two letters swapped, a letter doubled, one
 * left out or one added.
 */

import { qwertyAnsi, type KeyboardLayout } from '@sqwer/layouts';
import type { Letter } from './compare.ts';

export type Slip = 'neighbor' | 'swap' | 'double' | 'missing' | 'extra' | 'changed';

/** Keys whose centers sit within this many key widths count as neighbors (row stagger included). */
const REACH = 1.3;

const near = new WeakMap<KeyboardLayout, Map<string, Set<string>>>();
let fallback: KeyboardLayout | null = null;

/** Letter → letters on the keys around it. */
export function neighbors(layout: KeyboardLayout): Map<string, Set<string>> {
	let map = near.get(layout);
	if (map) return map;
	map = new Map();
	const letters = layout.keys.filter((k) => k.char && /^[a-z]$/.test(k.label));
	for (const k of letters) {
		const set = new Set<string>();
		for (const o of letters) {
			if (o === k) continue;
			const dx = o.x + o.w / 2 - (k.x + k.w / 2);
			const dy = o.y + o.h / 2 - (k.y + k.h / 2);
			if (Math.hypot(dx, dy) <= REACH) set.add(o.label);
		}
		map.set(k.label, set);
	}
	near.set(layout, map);
	return map;
}

/** What kind of slip a one-edit comparison shows. */
export function slipOf(letters: readonly Letter[], layout: KeyboardLayout = (fallback ??= qwertyAnsi('mac'))): Slip {
	const i = letters.findIndex((l) => l.mark !== 'right');
	const l = letters[i]!;
	const keys = neighbors(layout);
	switch (l.mark) {
		case 'swapped':
			return 'swap';
		case 'changed':
			return keys.get(l.word)?.has(l.typed) ? 'neighbor' : 'changed';
		case 'missing':
			return 'missing';
		default: {
			// An added letter beside the same letter is a double; beside a neighboring key, a brushed key.
			const around = [letters[i - 1]?.typed, letters[i + 1]?.typed].filter(Boolean) as string[];
			if (around.includes(l.typed)) return 'double';
			return around.some((c) => keys.get(c)?.has(l.typed)) ? 'neighbor' : 'extra';
		}
	}
}
