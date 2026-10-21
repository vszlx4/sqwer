// Theme preference, shared with the current site: localStorage['sqwer:theme'] is 'light', 'dark' or 'system'.
// Light is the default. 'system' leaves data-theme off so CSS follows prefers-color-scheme.

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'sqwer:theme';

const THEME_COLOR = { light: '#FBFAF4', dark: '#000000' };

/** Runs inline in <head> before first paint, so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='system'){var d=t==='dark'?'dark':'light';document.documentElement.dataset.theme=d;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.content=d==='dark'?'${THEME_COLOR.dark}':'${THEME_COLOR.light}'})}}catch(e){document.documentElement.dataset.theme='light'}})()`;

export function readTheme(): ThemePreference {
	try {
		const t = localStorage.getItem(THEME_KEY);
		return t === 'dark' || t === 'system' ? t : 'light';
	} catch {
		return fallback ?? 'light';
	}
}

const listeners = new Set<() => void>();
let fallback: ThemePreference | null = null;

/** For useSyncExternalStore: notified on a change here or in another tab. */
export function subscribeTheme(listener: () => void) {
	listeners.add(listener);
	addEventListener('storage', listener);
	return () => {
		listeners.delete(listener);
		removeEventListener('storage', listener);
	};
}

export function applyTheme(theme: ThemePreference) {
	try {
		localStorage.setItem(THEME_KEY, theme);
	} catch {
		// Private mode: the choice applies for this visit only.
		fallback = theme;
	}
	listeners.forEach((l) => l());
	const root = document.documentElement;
	if (theme === 'system') delete root.dataset.theme;
	else root.dataset.theme = theme;
	const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
	for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
		m.content = dark ? THEME_COLOR.dark : THEME_COLOR.light;
	}
}
