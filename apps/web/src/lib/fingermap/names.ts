import type { KeyboardLayout } from '@sqwer/layouts';

const NAMES: Record<string, string> = {
	Space: 'Space',
	ShiftLeft: 'left Shift',
	ShiftRight: 'right Shift'
};

/** Short display name for a key, e.g. "E", ";", "Space". */
export function keyName(layout: KeyboardLayout, code: string): string {
	if (NAMES[code]) return NAMES[code];
	const k = layout.keys.find((k) => k.code === code);
	if (!k) return code;
	return /^[a-z]$/.test(k.label) ? k.label.toUpperCase() : k.label;
}
