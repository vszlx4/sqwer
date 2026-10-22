// WCAG 2.x contrast ratio between two '#RRGGBB' colours.

function luminance(hex: string) {
	const n = parseInt(hex.replace('#', ''), 16);
	const lin = (c: number) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}

export function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

/** AA for body text is 4.5; for large text and UI parts 3. */
export function grade(ratio: number): 'AAA' | 'AA' | 'AA large' | 'Fails' {
	if (ratio >= 7) return 'AAA';
	if (ratio >= 4.5) return 'AA';
	if (ratio >= 3) return 'AA large';
	return 'Fails';
}
