import { handOf, type Finger } from './fingers.ts';
import { shiftCodeFor, type KeyboardLayout } from './keyboard.ts';

export interface Press {
	code: string;
	finger: Finger;
}

/**
 * The keys and fingers a touch typist uses to produce `char`.
 * Shift goes on the hand opposite the character; space uses the thumb
 * opposite the previous character so hands alternate.
 */
export function pressesFor(layout: KeyboardLayout, char: string, prevChar?: string): Press[] {
	const entry = layout.chars.get(char);
	if (!entry) return [];

	if (entry.code === 'Space') {
		const prev = prevChar ? layout.chars.get(prevChar) : undefined;
		const prevFinger = prev ? fingerFor(layout, prev.code) : undefined;
		const thumb: Finger = prevFinger && handOf(prevFinger) === 'right' ? 'lt' : 'rt';
		return [{ code: 'Space', finger: thumb }];
	}

	const finger = fingerFor(layout, entry.code);
	if (!finger) return [];
	const presses: Press[] = [{ code: entry.code, finger }];
	if (entry.shift) {
		const shiftHand = handOf(finger) === 'left' ? 'right' : 'left';
		presses.unshift({ code: shiftCodeFor(shiftHand), finger: shiftHand === 'left' ? 'lp' : 'rp' });
	}
	return presses;
}

export function fingerFor(layout: KeyboardLayout, code: string): Finger | undefined {
	return layout.keys.find((k) => k.code === code)?.finger;
}
