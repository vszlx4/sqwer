import { browser } from '$app/env';
import { DEFAULT_WORD_LIST, isWordListId, type WordListId } from '@sqwer/content';
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
	/** Word list for adjustable tests. */
	wordList: WordListId;
	showKeyboard: boolean;
	showZones: boolean;
	liveWpm: boolean;
	platform: Platform | 'auto';
	/** Include the number row when mapping fingers. */
	mapExtended: boolean;
	/** Which live readouts the ranked test shows. */
	ranked: { time: boolean; speed: boolean };
	/** Listen and type voice volume, 0 to 1. */
	voiceVolume: number;
	/** Listen and type shows each word instead of saying it. */
	showWords: boolean;
	/** Listen and type fast mode: a right word moves on the moment it is typed; Enter plays it again. */
	fastMode: boolean;
}

const DEFAULTS: Settings = {
	theme: 'light',
	mode: 'time',
	time: 30,
	words: 25,
	punctuation: false,
	numbers: false,
	wordList: DEFAULT_WORD_LIST,
	showKeyboard: true,
	showZones: false,
	liveWpm: true,
	platform: 'auto',
	mapExtended: false,
	ranked: { time: true, speed: true },
	voiceVolume: 0.8,
	showWords: false,
	fastMode: false
};

const KEY = 'sqwer:settings';

function load(): Settings {
	if (!browser) return { ...DEFAULTS };
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		const ranked = { ...DEFAULTS.ranked };
		for (const key of Object.keys(ranked) as (keyof Settings['ranked'])[]) if (typeof saved.ranked?.[key] === 'boolean') ranked[key] = saved.ranked[key];
		const wordList = isWordListId(saved.wordList) ? saved.wordList : DEFAULTS.wordList;
		// Volume moved here from its own key.
		const old = Number(localStorage.getItem('sqwer:volume') ?? NaN);
		const volume = Number(saved.voiceVolume ?? (Number.isFinite(old) ? old : DEFAULTS.voiceVolume));
		const voiceVolume = Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : DEFAULTS.voiceVolume;
		return { ...DEFAULTS, ...saved, ranked, wordList, voiceVolume, showWords: saved.showWords === true, fastMode: saved.fastMode === true };
	} catch {
		return { ...DEFAULTS };
	}
}

export const settings = $state<Settings>(load());

/** Keeps the browser interface colour in line with the chosen theme rather than only the system setting. */
function syncThemeColor(theme: ThemePref) {
	for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
		const darkSlot = meta.media.includes('dark');
		meta.content = theme === 'dark' || (theme === 'system' && darkSlot) ? '#000000' : '#F8F8F6'; // --bg of each theme (app.css)
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
