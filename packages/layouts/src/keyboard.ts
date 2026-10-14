import type { Finger, Hand } from './fingers.ts';

export type Platform = 'mac' | 'pc';

export interface KeyDef {
	/** KeyboardEvent.code */
	code: string;
	/** Position and size in key units (1u = one standard key). */
	x: number;
	y: number;
	w: number;
	h: number;
	/** Unshifted character, or the display name for modifier keys. */
	label: string;
	/** Character produced with Shift, if different from the uppercase label. */
	shiftLabel?: string;
	/** True for keys that type a character. */
	char: boolean;
	/** Finger a touch typist uses for this key. */
	finger: Finger;
	/** Where the label sits: centered for letters, corner for wide modifiers. */
	align?: 'center' | 'start' | 'end';
}

export interface KeyboardLayout {
	id: string;
	name: string;
	platform: Platform;
	width: number;
	height: number;
	keys: KeyDef[];
	/** Character -> key code plus whether Shift is needed. */
	chars: Map<string, { code: string; shift: boolean }>;
	/** Home-row key for each non-thumb finger. */
	home: Record<Exclude<Finger, 'lt' | 'rt'>, string>;
}

type Row = [code: string, w: number, label: string, shiftLabel: string | undefined, finger: Finger][];

// ANSI QWERTY, rows 0–3. Widths sum to 15u per row.
const ROWS: Row[] = [
	[
		['Backquote', 1, '`', '~', 'lp'],
		['Digit1', 1, '1', '!', 'lp'],
		['Digit2', 1, '2', '@', 'lr'],
		['Digit3', 1, '3', '#', 'lm'],
		['Digit4', 1, '4', '$', 'li'],
		['Digit5', 1, '5', '%', 'li'],
		['Digit6', 1, '6', '^', 'ri'],
		['Digit7', 1, '7', '&', 'ri'],
		['Digit8', 1, '8', '*', 'rm'],
		['Digit9', 1, '9', '(', 'rr'],
		['Digit0', 1, '0', ')', 'rp'],
		['Minus', 1, '-', '_', 'rp'],
		['Equal', 1, '=', '+', 'rp'],
		['Backspace', 2, 'Backspace', undefined, 'rp']
	],
	[
		['Tab', 1.5, 'Tab', undefined, 'lp'],
		['KeyQ', 1, 'q', undefined, 'lp'],
		['KeyW', 1, 'w', undefined, 'lr'],
		['KeyE', 1, 'e', undefined, 'lm'],
		['KeyR', 1, 'r', undefined, 'li'],
		['KeyT', 1, 't', undefined, 'li'],
		['KeyY', 1, 'y', undefined, 'ri'],
		['KeyU', 1, 'u', undefined, 'ri'],
		['KeyI', 1, 'i', undefined, 'rm'],
		['KeyO', 1, 'o', undefined, 'rr'],
		['KeyP', 1, 'p', undefined, 'rp'],
		['BracketLeft', 1, '[', '{', 'rp'],
		['BracketRight', 1, ']', '}', 'rp'],
		['Backslash', 1.5, '\\', '|', 'rp']
	],
	[
		['CapsLock', 1.75, 'Caps Lock', undefined, 'lp'],
		['KeyA', 1, 'a', undefined, 'lp'],
		['KeyS', 1, 's', undefined, 'lr'],
		['KeyD', 1, 'd', undefined, 'lm'],
		['KeyF', 1, 'f', undefined, 'li'],
		['KeyG', 1, 'g', undefined, 'li'],
		['KeyH', 1, 'h', undefined, 'ri'],
		['KeyJ', 1, 'j', undefined, 'ri'],
		['KeyK', 1, 'k', undefined, 'rm'],
		['KeyL', 1, 'l', undefined, 'rr'],
		['Semicolon', 1, ';', ':', 'rp'],
		['Quote', 1, "'", '"', 'rp'],
		['Enter', 2.25, 'Enter', undefined, 'rp']
	],
	[
		['ShiftLeft', 2.25, 'Shift', undefined, 'lp'],
		['KeyZ', 1, 'z', undefined, 'lp'],
		['KeyX', 1, 'x', undefined, 'lr'],
		['KeyC', 1, 'c', undefined, 'lm'],
		['KeyV', 1, 'v', undefined, 'li'],
		['KeyB', 1, 'b', undefined, 'li'],
		['KeyN', 1, 'n', undefined, 'ri'],
		['KeyM', 1, 'm', undefined, 'ri'],
		['Comma', 1, ',', '<', 'rm'],
		['Period', 1, '.', '>', 'rr'],
		['Slash', 1, '/', '?', 'rp'],
		['ShiftRight', 2.75, 'Shift', undefined, 'rp']
	]
];

const BOTTOM: Record<Platform, Row> = {
	pc: [
		['ControlLeft', 1.25, 'Ctrl', undefined, 'lp'],
		['MetaLeft', 1.25, 'Win', undefined, 'lt'],
		['AltLeft', 1.25, 'Alt', undefined, 'lt'],
		['Space', 6.25, '', undefined, 'rt'],
		['AltRight', 1.25, 'Alt', undefined, 'rt'],
		['MetaRight', 1.25, 'Win', undefined, 'rt'],
		['ContextMenu', 1.25, 'Menu', undefined, 'rp'],
		['ControlRight', 1.25, 'Ctrl', undefined, 'rp']
	],
	mac: [
		['Fn', 1, 'fn', undefined, 'lp'],
		['ControlLeft', 1, 'control', undefined, 'lp'],
		['AltLeft', 1, 'option', undefined, 'lt'],
		['MetaLeft', 1.25, 'command', undefined, 'lt'],
		['Space', 5.5, '', undefined, 'rt'],
		['MetaRight', 1.25, 'command', undefined, 'rt'],
		['AltRight', 1, 'option', undefined, 'rt']
	]
};

const MAC_NAMES: Record<string, string> = {
	Backspace: 'delete',
	Tab: 'tab',
	CapsLock: 'caps lock',
	Enter: 'return',
	ShiftLeft: 'shift',
	ShiftRight: 'shift'
};

const MODIFIER_ALIGN: Record<string, KeyDef['align']> = {
	Backspace: 'end',
	Enter: 'end',
	ShiftRight: 'end',
	Backslash: 'center'
};

function buildRow(row: Row, y: number, platform: Platform, keys: KeyDef[]) {
	let x = 0;
	for (const [code, w, rawLabel, shiftLabel, finger] of row) {
		const isChar = rawLabel.length === 1 || code === 'Space';
		const label = platform === 'mac' ? (MAC_NAMES[code] ?? rawLabel) : rawLabel;
		keys.push({
			code,
			x,
			y,
			w,
			h: 1,
			label,
			shiftLabel,
			char: isChar,
			finger,
			align: isChar ? 'center' : (MODIFIER_ALIGN[code] ?? 'start')
		});
		x += w;
	}
}

function macArrows(keys: KeyDef[]) {
	// MacBook-style inverted-T: full-height left/right, half-height up/down.
	const y = 4;
	keys.push(
		{ code: 'ArrowLeft', x: 12, y: y + 0.5, w: 1, h: 0.5, label: '◂', char: false, finger: 'rp', align: 'center' },
		{ code: 'ArrowUp', x: 13, y, w: 1, h: 0.5, label: '▴', char: false, finger: 'rp', align: 'center' },
		{ code: 'ArrowDown', x: 13, y: y + 0.5, w: 1, h: 0.5, label: '▾', char: false, finger: 'rp', align: 'center' },
		{ code: 'ArrowRight', x: 14, y: y + 0.5, w: 1, h: 0.5, label: '▸', char: false, finger: 'rp', align: 'center' }
	);
}

export function qwertyAnsi(platform: Platform): KeyboardLayout {
	const keys: KeyDef[] = [];
	ROWS.forEach((row, y) => buildRow(row, y, platform, keys));
	buildRow(BOTTOM[platform], 4, platform, keys);
	if (platform === 'mac') macArrows(keys);

	const chars = new Map<string, { code: string; shift: boolean }>();
	for (const k of keys) {
		if (!k.char) continue;
		if (k.code === 'Space') {
			chars.set(' ', { code: k.code, shift: false });
			continue;
		}
		chars.set(k.label, { code: k.code, shift: false });
		const shifted = k.shiftLabel ?? k.label.toUpperCase();
		if (shifted !== k.label) chars.set(shifted, { code: k.code, shift: true });
	}

	return {
		id: `qwerty-ansi-${platform}`,
		name: 'QWERTY (ANSI)',
		platform,
		width: 15,
		height: 5,
		keys,
		chars,
		home: { lp: 'KeyA', lr: 'KeyS', lm: 'KeyD', li: 'KeyF', ri: 'KeyJ', rm: 'KeyK', rr: 'KeyL', rp: 'Semicolon' }
	};
}

export function shiftCodeFor(hand: Hand): string {
	return hand === 'left' ? 'ShiftLeft' : 'ShiftRight';
}
