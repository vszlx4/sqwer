// Theme and palette preferences.
// Theme is shared with the current site: localStorage['sqwer:theme'] is 'light', 'dark' or 'system'. Light is
// the default; 'system' leaves data-theme off so CSS follows prefers-color-scheme.
// Palette (new site only): localStorage['sqwer:palette'], applied as data-palette; see lib/palettes.ts.

import { DEFAULT_PALETTE, PALETTE_BG, PALETTE_KEY, PALETTES, type PaletteId } from './palettes';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'sqwer:theme';

/** Runs inline in <head> before first paint, so the page never flashes the wrong theme or palette. */
export const themeScript = `(function(){var r=document.documentElement,bg=${JSON.stringify(PALETTE_BG)},t='light',p='${DEFAULT_PALETTE}';try{t=localStorage.getItem('${THEME_KEY}')||'light';p=localStorage.getItem('${PALETTE_KEY}')||p}catch(e){}if(!bg[p])p='${DEFAULT_PALETTE}';if(p!=='${DEFAULT_PALETTE}')r.dataset.palette=p;if(t!=='system')r.dataset.theme=t==='dark'?'dark':'light';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=bg[p][d?'dark':'light']})})()`;

const listeners = new Set<() => void>();
const fallback: { theme: ThemePreference | null; palette: PaletteId | null } = { theme: null, palette: null };

/** For useSyncExternalStore: notified on a change here or in another tab. */
export function subscribeTheme(listener: () => void) {
	listeners.add(listener);
	addEventListener('storage', listener);
	return () => {
		listeners.delete(listener);
		removeEventListener('storage', listener);
	};
}

export function readTheme(): ThemePreference {
	try {
		const t = localStorage.getItem(THEME_KEY);
		return t === 'dark' || t === 'system' ? t : 'light';
	} catch {
		return fallback.theme ?? 'light';
	}
}

export function readPalette(): PaletteId {
	try {
		const p = localStorage.getItem(PALETTE_KEY);
		return PALETTES.some((x) => x.id === p) ? (p as PaletteId) : DEFAULT_PALETTE;
	} catch {
		return fallback.palette ?? DEFAULT_PALETTE;
	}
}

function store(key: string, value: string) {
	try {
		localStorage.setItem(key, value);
		return true;
	} catch {
		// Private mode: the choice applies for this visit only.
		return false;
	}
}

function syncThemeColor() {
	const root = document.documentElement;
	const theme = readTheme();
	const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
	const bg = PALETTE_BG[readPalette()] ?? PALETTE_BG[DEFAULT_PALETTE];
	for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) m.content = dark ? bg.dark : bg.light;
	root.style.colorScheme = dark ? 'dark' : 'light';
}

export function applyTheme(theme: ThemePreference) {
	if (!store(THEME_KEY, theme)) fallback.theme = theme;
	const root = document.documentElement;
	if (theme === 'system') delete root.dataset.theme;
	else root.dataset.theme = theme;
	syncThemeColor();
	listeners.forEach((l) => l());
}

export function applyPalette(palette: PaletteId) {
	if (!store(PALETTE_KEY, palette)) fallback.palette = palette;
	const root = document.documentElement;
	if (palette === DEFAULT_PALETTE) delete root.dataset.palette;
	else root.dataset.palette = palette;
	syncThemeColor();
	listeners.forEach((l) => l());
}
