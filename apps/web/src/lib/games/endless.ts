import type { WordListId } from '@sqwer/content';
import type { IconName } from '#lib/ui/Icon.svelte';
import { letterWords } from '#lib/wordlists.ts';
import { difficultyOf, migrateChoice, ratingOf, START, step, TIERS, type TierId } from './levels.ts';

/*
 * Endless mode: course games in rounds at a difficulty from levels.ts, fixed or adaptive (no cap). Three failures
 * end the run. "level" below is that difficulty: 1 and up, fixed levels at 2, 4 … 12.
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
	{ id: 'listen', title: 'Listen and type', icon: 'volume', summary: 'Hear a word, type what you heard. Higher levels pick harder words and allow fewer replays.' },
	{ id: 'keyhunt', title: 'Key hunt', icon: 'target', summary: 'A key lights up somewhere on the keyboard; find it and press it.' }
];

export const gameById = (id: string) => GAMES.find((g) => g.id === id) ?? null;

/** The difficulty chosen before a run: adaptive, or one of the fixed levels (levels.ts). */
export const DIFFICULTIES = [
	{ id: 'adaptive', label: 'Adaptive', level: null, icon: 'gauge', note: 'Starts where you left off, climbs as you play well and eases when you miss. It has no top.' },
	...TIERS.map((t) => ({ id: t.id, label: t.name, level: t.difficulty, icon: t.icon, note: t.note }))
] as const satisfies readonly { id: string; label: string; level: number | null; icon: IconName; note: string }[];
export type DifficultyId = 'adaptive' | TierId;

/** Failed rounds that end a run. */
export const STRIKES = 3;

/** Where a run's words come from: the levelled tiers, or one word list throughout. */
export type WordSource = 'levels' | WordListId;

/** Words per difficulty step from the frequency tiers, rarer and longer higher up. Tiers load at run start. */
export async function wordsForLevel(difficulty: number, source: WordSource = 'levels'): Promise<string[]> {
	const level = step(difficulty);
	if (source !== 'levels') {
		// Shorter words first; the whole list once the level allows it or the short ones run thin.
		const all = await letterWords(source);
		const short = all.filter((w) => w.length <= 3 + level);
		return short.length >= 30 ? short : all;
	}
	// Past Nightmare the rare words only get longer.
	if (level >= 14) return letterWords('english-450k', (w) => w.length >= 10 && w.length <= 16);
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

/** Settings for one round of a game at a difficulty; no top, so past Nightmare everything keeps tightening. */
export function roundSettings(game: GameId, level: number): RoundSettings {
	const L = Math.max(START, level);
	switch (game) {
		case 'race':
			return { pacerWpm: Math.round(20 + 8 * L), count: Math.round(10 + L) };
		case 'falling-words':
			return { target: Math.round(8 + L), pace: 0.75 + 0.06 * L };
		case 'falling-letters':
			return { target: Math.round(12 + 2 * L), pace: 0.75 + 0.07 * L };
		case 'echo': {
			// Only the word length, the word set and how long each letter is shown change; a letter stays at least 160 ms.
			const start = 2 + Math.ceil(L / 2);
			return { start, target: start + 1, showMs: Math.max(160, Math.round(1400 - (L - 1) * 90)) };
		}
		case 'listen':
			return { count: 6, target: L <= 4 ? 4 : 5 };
		case 'keyhunt':
			return { target: Math.round(12 + 2 * L), pace: 0.75 + 0.06 * L };
	}
}

const KEY = 'sqwer:endless';

export interface EndlessRecord {
	/** Highest score of a run. */
	best: number;
	/** Where the adaptive rating stood after the last run (levels.ts). */
	rating: number;
	difficulty: DifficultyId;
	/** Word source of the last run; levelled when missing. */
	source?: WordSource;
}

/** A saved record, from before the rating (a level 1-12 and the old level ids) or after. */
type SavedRecord = Omit<EndlessRecord, 'rating' | 'difficulty'> & { rating?: number; level?: number; difficulty: string };

function upgrade(r: SavedRecord): EndlessRecord {
	if (typeof r.rating === 'number') return { ...r, rating: Math.max(0, r.rating), difficulty: r.difficulty as DifficultyId };
	const { level, ...rest } = r;
	return { ...rest, rating: ratingOf(level ?? 3), difficulty: migrateChoice(r.difficulty) };
}

export function loadRecords(): Partial<Record<GameId, EndlessRecord>> {
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<GameId, SavedRecord>>;
		return Object.fromEntries(Object.entries(saved).flatMap(([id, r]) => (r ? [[id, upgrade(r)]] : [])));
	} catch {
		return {};
	}
}

/** Adaptive difficulty a run starts at: where the last one left off, or the middle of Easy. */
export const startDifficulty = (record: EndlessRecord | undefined) => difficultyOf(record?.rating ?? ratingOf(TIERS[0].difficulty));

export function saveRecord(game: GameId, record: EndlessRecord) {
	try {
		localStorage.setItem(KEY, JSON.stringify({ ...loadRecords(), [game]: record }));
	} catch {
		// Storage unavailable: records last for this visit only.
	}
}
