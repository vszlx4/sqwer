/*
 * Selectable word lists. Files in ../lists hold one word per line, in source order (by frequency where `ordered`).
 * Kept verbatim: the larger lists include profanity, slurs and age-restricted words. They are ordinary English
 * vocabulary here, carry no intent to offend, and are not filtered. Do not remove words for being offensive; fix only
 * errors. Intake: comma and space joined entries split, duplicates dropped, æ → ae and þ/ð → th.
 * The curated tiers in sets.ts and the exam list stay separate and keep their exclusions.
 * Source: Monkeytype's language files (GPL-3.0), credited per list in `credit`.
 */

export const MONKEYTYPE = { name: 'Monkeytype', url: 'https://github.com/monkeytypegame/monkeytype', licence: 'GPL-3.0' } as const;

export interface WordListCredit {
	/** File in Monkeytype's frontend/static/languages. */
	file: string;
	/** GitHub user who first added the list. */
	author: string;
	/** Where the list author took the words from, when recorded. */
	basis?: string;
}

export const WORD_LIST_IDS = [
	'english-200',
	'english-1k',
	'english-5k',
	'english-10k',
	'english-25k',
	'english-450k',
	'double-letters',
	'contractions',
	'shakespearean',
	'misspelled',
	'legal',
	'medical',
	'old-english'
] as const;
export type WordListId = (typeof WORD_LIST_IDS)[number];

export const LIST_LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert', 'Master'] as const;

export interface WordListInfo {
	id: WordListId;
	name: string;
	group: 'English' | 'Themed';
	/** Difficulty, 1 to 6; see LIST_LEVELS. */
	level: number;
	/** Word count after intake. */
	size: number;
	ordered: boolean;
	/** May contain profanity or age-restricted words. */
	mature: boolean;
	summary: string;
	credit: WordListCredit;
}

export const WORD_LISTS: readonly WordListInfo[] = [
	{ id: 'english-200', name: 'English 200', group: 'English', level: 1, size: 200, ordered: true, mature: false, summary: 'The 200 most common words.', credit: { file: 'english.json', author: 'Miodec' } },
	{ id: 'english-1k', name: 'English 1k', group: 'English', level: 2, size: 1000, ordered: true, mature: false, summary: 'The 1,000 most common words.', credit: { file: 'english_1k.json', author: 'Miodec' } },
	{ id: 'english-5k', name: 'English 5k', group: 'English', level: 3, size: 5000, ordered: true, mature: false, summary: 'The 5,000 most common words.', credit: { file: 'english_5k.json', author: 'Miodec' } },
	{ id: 'english-10k', name: 'English 10k', group: 'English', level: 4, size: 9944, ordered: true, mature: false, summary: 'About 10,000 common words, including names of places and months.', credit: { file: 'english_10k.json', author: 'Miodec' } },
	{ id: 'english-25k', name: 'English 25k', group: 'English', level: 5, size: 24141, ordered: false, mature: true, summary: 'About 24,000 words, from everyday to rare.', credit: { file: 'english_25k.json', author: 'precompute' } },
	{ id: 'english-450k', name: 'English 450k', group: 'English', level: 6, size: 450029, ordered: false, mature: true, summary: 'A full dictionary of about 450,000 words, abbreviations and names.', credit: { file: 'english_450k.json', author: 'GFruit' } },
	{ id: 'double-letters', name: 'Double letters', group: 'Themed', level: 2, size: 202, ordered: false, mature: false, summary: 'Words with doubled letters, for quick repeats.', credit: { file: 'english_doubleletter.json', author: 'QuackerDeezles', basis: 'panopy.com and yourdictionary.com double-letter word lists' } },
	{ id: 'contractions', name: 'Contractions', group: 'Themed', level: 3, size: 183, ordered: false, mature: false, summary: 'Contractions with apostrophes, such as can’t and you’ve.', credit: { file: 'english_contractions.json', author: 'monners', basis: 'Wikipedia: List of English contractions' } },
	{ id: 'shakespearean', name: 'Shakespearean', group: 'Themed', level: 3, size: 193, ordered: false, mature: false, summary: 'Words from Shakespeare’s English, such as thou and hark.', credit: { file: 'english_shakespearean.json', author: 'risograph' } },
	{ id: 'misspelled', name: 'Commonly misspelled', group: 'Themed', level: 4, size: 1729, ordered: false, mature: false, summary: 'Words people often spell wrong.', credit: { file: 'english_commonly_misspelled.json', author: 'ssantichaivekin', basis: 'Wikipedia: Lists of common misspellings' } },
	{ id: 'legal', name: 'Legal', group: 'Themed', level: 4, size: 4049, ordered: false, mature: false, summary: 'Legal and business vocabulary.', credit: { file: 'english_legal.json', author: 'pprestwood-collab' } },
	{ id: 'medical', name: 'Medical', group: 'Themed', level: 5, size: 594, ordered: false, mature: false, summary: 'Medical and anatomical terms.', credit: { file: 'english_medical.json', author: 'aarnav593' } },
	{ id: 'old-english', name: 'Old English', group: 'Themed', level: 5, size: 200, ordered: false, mature: false, summary: 'Old English words, with æ as ae and þ or ð as th.', credit: { file: 'english_old.json', author: 'kjvlbu' } }
];

export const DEFAULT_WORD_LIST: WordListId = 'english-200';

export const wordListById = (id: string): WordListInfo | undefined => WORD_LISTS.find((l) => l.id === id);

export const isWordListId = (id: unknown): id is WordListId => typeof id === 'string' && (WORD_LIST_IDS as readonly string[]).includes(id);

/** Words of a list file: one per line, blank lines ignored. */
export const parseWordList = (text: string): string[] => text.split('\n').map((w) => w.trim()).filter(Boolean);
