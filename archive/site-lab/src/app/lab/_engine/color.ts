// Colour maths for the lab: parsing, mixing, WCAG contrast, harmonies. Pure functions, no dependencies.

export type RGB = [number, number, number];
export type HSL = [number, number, number];

export const clamp = (n: number, a = 0, b = 1) => Math.min(b, Math.max(a, n));

export function hexToRgb(hex: string): RGB {
	let h = hex.replace('#', '');
	if (h.length === 3) h = [...h].map((c) => c + c).join('');
	const n = parseInt(h.slice(0, 6), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgbToHex = ([r, g, b]: RGB) =>
	'#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');

export function hexToHsl(hex: string): HSL {
	const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	let h = 0;
	let s = 0;
	if (d) {
		s = d / (1 - Math.abs(2 * l - 1));
		if (max === r) h = ((g - b) / d) % 6;
		else if (max === g) h = (b - r) / d + 2;
		else h = (r - g) / d + 4;
		h *= 60;
		if (h < 0) h += 360;
	}
	return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
	h = ((h % 360) + 360) % 360;
	s = clamp(s);
	l = clamp(l);
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

export function mix(a: string, b: string, t: number): string {
	const x = hexToRgb(a);
	const y = hexToRgb(b);
	return rgbToHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

export function luminance(hex: string): number {
	const f = (v: number) => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	const [r, g, b] = hexToRgb(hex);
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string): number {
	const la = luminance(a);
	const lb = luminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Near-black or white, whichever reads better on `bg`. */
export const readableOn = (bg: string) => (contrast(bg, '#0b0b0b') >= contrast(bg, '#ffffff') ? '#0b0b0b' : '#ffffff');

/** Moves `fg` lighter or darker until it reaches `min` contrast against `bg`. */
export function ensureContrast(fg: string, bg: string, min: number): string {
	if (contrast(fg, bg) >= min) return fg;
	const [h, s, l] = hexToHsl(fg);
	const dir = luminance(bg) > 0.5 ? -1 : 1;
	for (let i = 1; i <= 40; i++) {
		const c = hslToHex(h, s, l + dir * i * 0.025);
		if (contrast(c, bg) >= min) return c;
	}
	return dir < 0 ? '#000000' : '#ffffff';
}

export type Harmony = 'mono' | 'analogous' | 'complement' | 'split' | 'triad' | 'tetrad';
export const HARMONIES: { id: Harmony; name: string; offsets: number[] }[] = [
	{ id: 'mono', name: 'Monochrome', offsets: [0, 0] },
	{ id: 'analogous', name: 'Analogous', offsets: [0, 30] },
	{ id: 'complement', name: 'Complementary', offsets: [0, 180] },
	{ id: 'split', name: 'Split complementary', offsets: [0, 150] },
	{ id: 'triad', name: 'Triad', offsets: [0, 120] },
	{ id: 'tetrad', name: 'Tetrad', offsets: [0, 90] }
];

export type Scheme = {
	bg: string;
	surface: string;
	surface2: string;
	ink: string;
	ink2: string;
	line: string;
	accent: string;
	accent2: string;
	onAccent: string;
};

export type CustomColour = { hue: number; sat: number; light: number; harmony: Harmony; spread: number };

/** Builds a complete, contrast-checked scheme from one hue and a harmony rule. */
export function customScheme(c: CustomColour, mode: 'light' | 'dark'): Scheme {
	const h = HARMONIES.find((x) => x.id === c.harmony) ?? HARMONIES[0];
	const dark = mode === 'dark';
	const bg = hslToHex(c.hue, clamp(c.sat * 0.28), dark ? 0.075 : 0.955);
	const ink = hslToHex(c.hue, clamp(c.sat * 0.3), dark ? 0.93 : 0.08);
	let accent = hslToHex(c.hue, c.sat, c.light);
	let accent2 = hslToHex(c.hue + (h.offsets[1] + (c.harmony === 'mono' ? 0 : c.spread)) * (c.harmony === 'mono' ? 0 : 1), c.harmony === 'mono' ? c.sat * 0.5 : c.sat, c.harmony === 'mono' ? clamp(c.light + (dark ? 0.2 : -0.22)) : c.light);
	accent = ensureContrast(accent, bg, 3);
	accent2 = ensureContrast(accent2, bg, 3);
	const surface = mix(bg, ink, dark ? 0.07 : 0.0).replace(/^#/, '#');
	return {
		bg,
		surface: dark ? surface : mix(bg, '#ffffff', 0.65),
		surface2: mix(bg, ink, 0.07),
		ink,
		ink2: mix(ink, bg, 0.38),
		line: mix(bg, ink, 0.16),
		accent,
		accent2,
		onAccent: readableOn(accent)
	};
}
