// Finger notation for the "Fingering" direction: each finger has a number in the piano convention, counted
// per hand from the thumb (1) to the little finger (5), a colour and a name. Key-to-finger data comes from
// @sqwer/layouts, the same source the course uses.

import { FINGERS, handOf, kindOf, qwertyAnsi, type Finger, type FingerKind } from '@sqwer/layouts';

export const NUMBER: Record<FingerKind, number> = { thumb: 1, index: 2, middle: 3, ring: 4, pinky: 5 };

export const COLOUR_VAR: Record<FingerKind, string> = {
	thumb: 'var(--f-thumb)',
	index: 'var(--f-index)',
	middle: 'var(--f-middle)',
	ring: 'var(--f-ring)',
	pinky: 'var(--f-pinky)'
};

const KIND_NAME: Record<FingerKind, string> = { thumb: 'thumb', index: 'index finger', middle: 'middle finger', ring: 'ring finger', pinky: 'little finger' };

export const fingerNumber = (f: Finger) => NUMBER[kindOf(f)];
export const fingerColour = (f: Finger) => COLOUR_VAR[kindOf(f)];
export const fingerName = (f: Finger) => `${handOf(f) === 'left' ? 'Left' : 'Right'} ${KIND_NAME[kindOf(f)]}`;

export const LAYOUT = qwertyAnsi('mac');

const BY_CHAR = new Map<string, Finger>();
for (const key of LAYOUT.keys) {
	if (!key.char) continue;
	if (key.code === 'Space') BY_CHAR.set(' ', key.finger);
	else {
		BY_CHAR.set(key.label, key.finger);
		if (key.shiftLabel) BY_CHAR.set(key.shiftLabel, key.finger);
	}
}

/** The finger a touch typist uses for a character, or null for characters off the layout. */
export function fingerFor(char: string): Finger | null {
	return BY_CHAR.get(char) ?? BY_CHAR.get(char.toLowerCase()) ?? null;
}

export { FINGERS, handOf, kindOf, type Finger, type FingerKind };
