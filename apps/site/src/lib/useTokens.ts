'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE, getPalette, type CoreTokens, type PaletteId } from './palettes';
import { readPalette, readTheme, subscribeTheme } from './theme';
import { contrast } from './contrast';

export type Mode = 'light' | 'dark';
export type ResolvedTokens = { palette: PaletteId; mode: Mode; t: CoreTokens };

const DARK = '(prefers-color-scheme: dark)';

function subscribe(listener: () => void) {
	const media = matchMedia(DARK);
	media.addEventListener('change', listener);
	const off = subscribeTheme(listener);
	return () => {
		media.removeEventListener('change', listener);
		off();
	};
}

function snapshot(): string {
	const theme = readTheme();
	const mode: Mode = theme === 'dark' || (theme === 'system' && matchMedia(DARK).matches) ? 'dark' : 'light';
	return `${readPalette()}|${mode}`;
}

/**
 * The active palette's colours as hex values, for components that cannot read CSS variables
 * (WebGL shaders, canvas). Re-renders when the palette, the theme or the system setting changes.
 */
export function useTokens(): ResolvedTokens {
	const key = useSyncExternalStore(subscribe, snapshot, () => `${DEFAULT_PALETTE}|light`);
	const [palette, mode] = key.split('|') as [PaletteId, Mode];
	return { palette, mode, t: getPalette(palette)[mode] };
}

/**
 * The accent as a colour that reads on the page background: unchanged when it already has 3:1 contrast,
 * otherwise mixed toward the ink until it does (lime on cream, for example).
 */
export function accentInk(t: CoreTokens): string {
	if (contrast(t.accent, t.bg) >= 3) return t.accent;
	for (let k = 0.1; k <= 1; k += 0.05) {
		const c = mixHex(t.accent, t.ink, k);
		if (contrast(c, t.bg) >= 3) return c;
	}
	return t.ink;
}

/** '#RRGGBB' to [r, g, b] in 0..1, for shader uniforms. */
export function hexToRgb01(hex: string): [number, number, number] {
	const n = parseInt(hex.replace('#', ''), 16);
	return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** '#RRGGBB' to 'h s l' (degrees and percentages without units), for components that take HSL parts. */
export function hexToHslParts(hex: string): string {
	const [r, g, b] = hexToRgb01(hex);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return `0 0 ${Math.round(l * 100)}`;
	const s = d / (1 - Math.abs(2 * l - 1));
	const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return `${Math.round(((h * 60) + 360) % 360)} ${Math.round(s * 100)} ${Math.round(l * 100)}`;
}

/** Mix two hex colours; amount 0 returns a, 1 returns b. */
export function mixHex(a: string, b: string, amount: number): string {
	const [ar, ag, ab] = hexToRgb01(a);
	const [br, bg, bb] = hexToRgb01(b);
	const to = (x: number, y: number) => Math.round((x + (y - x) * amount) * 255).toString(16).padStart(2, '0');
	return `#${to(ar, br)}${to(ag, bg)}${to(ab, bb)}`;
}
