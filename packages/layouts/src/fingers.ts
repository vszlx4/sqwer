export const FINGERS = ['lp', 'lr', 'lm', 'li', 'lt', 'rt', 'ri', 'rm', 'rr', 'rp'] as const;

export type Finger = (typeof FINGERS)[number];
export type Hand = 'left' | 'right';
export type FingerKind = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';

const KIND: Record<string, FingerKind> = {
	p: 'pinky',
	r: 'ring',
	m: 'middle',
	i: 'index',
	t: 'thumb'
};

export function handOf(finger: Finger): Hand {
	return finger[0] === 'l' ? 'left' : 'right';
}

export function kindOf(finger: Finger): FingerKind {
	return KIND[finger[1]!]!;
}

export function fingerLabel(finger: Finger): string {
	return `${handOf(finger) === 'left' ? 'Left' : 'Right'} ${kindOf(finger)}`;
}

/** Digit shortcut used by the finger picker: 1–5 left pinky→thumb, 6–0 right thumb→pinky. */
export function fingerShortcut(finger: Finger): string {
	const i = FINGERS.indexOf(finger);
	return i === 9 ? '0' : String(i + 1);
}
