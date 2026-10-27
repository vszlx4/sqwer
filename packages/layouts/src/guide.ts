import { handOf, type Finger } from './fingers.ts';
import { shiftCodeFor, type KeyboardLayout } from './keyboard.ts';

export interface Press {
	code: string;
	finger: Finger;
}

/** Keys and fingers for `char`. Shift on the opposite hand; space thumb opposite the previous character. */
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
