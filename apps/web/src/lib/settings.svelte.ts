import { browser } from '$app/env';
import type { Platform } from '@sqwer/layouts';

export type ThemePref = 'system' | 'light' | 'dark';

export const TIME_OPTIONS = [15, 30, 60, 120] as const;
export const WORD_OPTIONS = [10, 25, 50, 100] as const;

export interface Settings {
	theme: ThemePref;
	mode: 'time' | 'words';
	time: (typeof TIME_OPTIONS)[number];
	words: (typeof WORD_OPTIONS)[number];
	punctuation: boolean;
	numbers: boolean;
	showKeyboard: boolean;
	showZones: boolean;
	liveWpm: boolean;
	platform: Platform | 'auto';
	/** Include the number row when mapping fingers. */
	mapExtended: boolean;
	/** Which live readouts the ranked test shows. */
	ranked: { time: boolean; speed: boolean };
}

const DEFAULTS: Settings = {
	theme: 'light',
	mode: 'time',
	time: 30,
	words: 25,
	punctuation: false,
	numbers: false,
	showKeyboard: true,
	showZones: false,
	liveWpm: true,
	platform: 'auto',
	mapExtended: false,
	ranked: { time: true, speed: true }
};

const KEY = 'sqwer:settings';

function load(): Settings {
	if (!browser) return { ...DEFAULTS };
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		const ranked = { ...DEFAULTS.ranked };
		for (const key of Object.keys(ranked) as (keyof Settings['ranked'])[]) if (typeof saved.ranked?.[key] === 'boolean') ranked[key] = saved.ranked[key];
		return { ...DEFAULTS, ...saved, ranked };
	} catch {
		return { ...DEFAULTS };
	}
}

export const settings = $state<Settings>(load());

/** Keeps the browser interface colour in line with the chosen theme rather than only the system setting. */
function syncThemeColor(theme: ThemePref) {
	for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
		const darkSlot = meta.media.includes('dark');
		meta.content = theme === 'dark' || (theme === 'system' && darkSlot) ? '#000000' : '#FBFAF4';
	}
}

export function saveSettings() {
	if (!browser) return;
	try {
		localStorage.setItem(KEY, JSON.stringify(settings));
		localStorage.setItem('sqwer:theme', settings.theme);
		if (settings.theme === 'system') delete document.documentElement.dataset.theme;
		else document.documentElement.dataset.theme = settings.theme;
		syncThemeColor(settings.theme);
	} catch {
		// Storage can be unavailable (private mode); settings still apply for this visit.
	}
}

export function detectPlatform(): Platform {
	if (!browser) return 'pc';
	const ua = navigator.userAgent;
	return /Mac|iPhone|iPad/.test(ua) ? 'mac' : 'pc';
}

export function resolvedPlatform(): Platform {
	return settings.platform === 'auto' ? detectPlatform() : settings.platform;
}
