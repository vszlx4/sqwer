import type { WordListId } from '@sqwer/content';
import type { IconName } from '#lib/ui/Icon.svelte';
import { letterWords } from '#lib/wordlists.ts';

/*
 * Endless mode: course games in rounds, levels 1-12. Adaptive difficulty moves the level up on clears and
 * down on failures. Three failures end the run.
 */

export const GAME_IDS = ['race', 'falling-words', 'falling-letters', 'echo', 'listen', 'keyhunt'] as const;
export type GameId = (typeof GAME_IDS)[number];

export interface GameInfo {
	id: GameId;
	title: string;
	icon: IconName;
	summary: string;
}

export const GAMES: GameInfo[] = [
	{ id: 'race', title: 'Race', icon: 'flag', summary: 'Read a passage, then type it before the pacer reaches the line.' },
	{ id: 'falling-words', title: 'Falling words', icon: 'text', summary: 'Type each word before it lands. Words get longer as you climb.' },
	{ id: 'falling-letters', title: 'Falling letters', icon: 'keyboard', summary: 'Single keys fall from the top; press each before it lands.' },
	{ id: 'echo', title: 'Echo', icon: 'repeat', summary: 'Letters of a word light up one at a time and fade; type the word from memory.' },
	{ id: 'listen', title: 'Listen and type', icon: 'volume', summary: 'Hear a word, type what you heard. Longer words at higher levels.' },
	{ id: 'keyhunt', title: 'Key hunt', icon: 'target', summary: 'A key lights up somewhere on the keyboard; find it and press it.' }
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id) ?? null;

/** The difficulty chosen before a run: adaptive, or one fixed level. */
export const DIFFICULTIES = [
	{ id: 'adaptive', label: 'Adaptive', level: null, note: 'Starts where you left off, rises after each cleared round and eases after a failed one.' },
	{ id: 'gentle', label: 'Gentle', level: 2, note: 'Short, very common words and a relaxed pace.' },
	{ id: 'steady', label: 'Steady', level: 4, note: 'Everyday words at a comfortable speed.' },
	{ id: 'brisk', label: 'Brisk', level: 6, note: 'Longer everyday words and a quicker pace.' },
	{ id: 'fast', label: 'Fast', level: 8, note: 'Less common words and a fast pace.' },
	{ id: 'expert', label: 'Expert', level: 10, note: 'Long, less frequent words at full speed.' },
	{ id: 'master', label: 'Master', level: 12, note: 'Rare and technical words from the full dictionary, which includes mature words, at top speed.' }
] as const;
export type DifficultyId = (typeof DIFFICULTIES)[number]['id'];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 12;
/** Failed rounds that end a run. */
export const STRIKES = 3;

/** The level after a round, with adaptive difficulty. */
export const nextLevel = (level: number, passed: boolean) => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level + (passed ? 1 : -1)));

/** A short name for a level, for the round summary. */
export function levelName(level: number): string {
	return level <= 2 ? 'Gentle' : level <= 4 ? 'Steady' : level <= 6 ? 'Brisk' : level <= 8 ? 'Fast' : level <= 10 ? 'Expert' : 'Master';
}

/** Where a run's words come from: the levelled tiers, or one word list throughout. */
export type WordSource = 'levels' | WordListId;

/** Words per level from the frequency tiers, rarer and longer at higher levels. Tiers load at run start. */
export async function wordsForLevel(level: number, source: WordSource = 'levels'): Promise<string[]> {
	if (source !== 'levels') {
		// Shorter words first; the whole list once the level allows it or the short ones run thin.
		const all = await letterWords(source);
		const short = all.filter((w) => w.length <= 3 + level);
		return short.length >= 30 ? short : all;
	}
	if (level >= 12) return letterWords('english-450k', (w) => w.length >= 8 && w.length <= 14);
	if (level >= 11) return letterWords('english-25k', (w) => w.length >= 6 && w.length <= 12);
	const { STARTER_WORDS, EVERYDAY_WORDS, FLUENT_WORDS, ADVANCED_WORDS } = await import('@sqwer/content/sets');
	if (level <= 2) return [...STARTER_WORDS];
	if (level <= 4) return [...STARTER_WORDS.filter((w) => w.length >= 3), ...EVERYDAY_WORDS];
	if (level <= 6) return [...EVERYDAY_WORDS, ...FLUENT_WORDS.filter((w) => w.length <= 7)];
	if (level <= 8) return [...FLUENT_WORDS];
	return [...FLUENT_WORDS.filter((w) => w.length >= 6), ...ADVANCED_WORDS];
}

export const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

export interface RoundSettings {
	/** Race: pacer speed and passage length in words. */
	pacerWpm?: number;
	count?: number;
	/** Items to clear, keys to repeat or words to get right. */
	target?: number;
	/** Speed multiplier for falling and key hunt games. */
	pace?: number;
	/** Echo: length of the first sequence. */
	start?: number;
	/** Echo: how long each letter stays lit, in milliseconds. */
	showMs?: number;
}

/** Settings for one round of a game at a level. */
export function roundSettings(game: GameId, level: number): RoundSettings {
	const L = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
	switch (game) {
		case 'race':
			return { pacerWpm: 20 + 8 * L, count: 10 + L };
		case 'falling-words':
			return { target: 8 + L, pace: 0.75 + 0.06 * L };
		case 'falling-letters':
			return { target: 12 + 2 * L, pace: 0.75 + 0.07 * L };
		case 'echo': {
			// Only the word length, the word set and how long each letter is shown change.
			const start = 2 + Math.ceil(L / 2);
			return { start, target: start + 1, showMs: Math.round(1400 - (L - 1) * 90) };
		}
		case 'listen':
			return { count: 6, target: L <= 4 ? 4 : 5 };
		case 'keyhunt':
			return { target: 12 + 2 * L, pace: 0.75 + 0.06 * L };
	}
}

const KEY = 'sqwer:endless';

export interface EndlessRecord {
	/** Highest score of a run. */
	best: number;
	/** The level adaptive difficulty reached last time. */
	level: number;
	difficulty: DifficultyId;
	/** Word source of the last run; levelled when missing. */
	source?: WordSource;
}

export function loadRecords(): Partial<Record<GameId, EndlessRecord>> {
	try {
		return JSON.parse(localStorage.getItem(KEY) ?? '{}');
	} catch {
		return {};
	}
}

export function saveRecord(game: GameId, record: EndlessRecord) {
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...loadRecords(), [game]: record }));
	} catch {
		// Storage unavailable: records last for this visit only.
	}
}
