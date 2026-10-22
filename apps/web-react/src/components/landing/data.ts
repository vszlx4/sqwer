import course from '@/content/course.json';
import type { Finger } from '@/lib/fingering';

// Copy and tables for the landing page. Course facts come from src/content/course.json.

export const PART_COLOUR = ['var(--teal)', 'var(--sky)', 'var(--iris)', 'var(--coral)'];

/** Ranks a steady learner reaches around these chapters (from the current landing page). */
export const RANK_AT: Record<number, number> = { 1: 2, 3: 3, 4: 4, 7: 5, 9: 6, 10: 7, 12: 9 };

export const HOME: Record<Finger, string> = { lp: 'A', lr: 'S', lm: 'D', li: 'F', lt: 'Space', rt: 'Space', ri: 'J', rm: 'K', rr: 'L', rp: ';' };

export const STEP_KINDS: { id: keyof typeof course.steps; name: string; line: string }[] = [
	{ id: 'drill', name: 'Drills', line: 'Short timed passages over the keys you know.' },
	{ id: 'falling', name: 'Falling letters and words', line: 'Type each before it lands.' },
	{ id: 'echo', name: 'Echo', line: 'Letters light up and fade; type them from memory.' },
	{ id: 'keyhunt', name: 'Key hunt', line: 'Find the lit key by touch before its light runs out.' },
	{ id: 'race', name: 'Races', line: 'Beat the pacer to the end of a passage.' },
	{ id: 'intro', name: 'Key introductions', line: 'Each new key, its finger and its place.' },
	{ id: 'listen', name: 'Listen and type', line: 'Hear a word, type it without seeing it.' },
	{ id: 'checkpoint', name: 'Checkpoints', line: 'One at the end of every chapter.' }
];

export const GAMES = [
	{ kind: 'falling', title: 'Falling letters', body: 'Letters drop from the top. Type each one before it lands.' },
	{ kind: 'words', title: 'Falling words', body: 'Whole words fall instead of letters, faster as you go.' },
	{ kind: 'listen', title: 'Listen and type', body: 'Hear a word and type it, without seeing it first.' },
	{ kind: 'keyhunt', title: 'Key hunt', body: 'A key lights up. Find it by touch before its light runs out.' },
	{ kind: 'race', title: 'Race', body: 'Type a passage before the pacer reaches the finish line.' },
	{ kind: 'echo', title: 'Echo', body: 'The letters of a word light up one at a time and fade. Type the word from memory.' }
] as const;

export const PRINCIPLES = [
	{ title: 'Free to learn', body: 'The whole course is free. An account saves your progress, stars and rank on every device.' },
	{ title: 'Your data stays yours', body: 'No advertising or tracking. Export or delete everything at any time.' },
	{ title: 'Clear definitions', body: 'Every figure is defined, and the same rules are applied to every result.' }
];

/** Figures from the database; shown as not connected until the site is wired. */
export const LIVE = { wired: false, items: ['lessons typed today', 'new typists this week', 'tests taken today'] };

export const TEMPO = [
	{ wpm: 20, term: 'Largo' },
	{ wpm: 40, term: 'Andante' },
	{ wpm: 60, term: 'Moderato' },
	{ wpm: 80, term: 'Allegro' },
	{ wpm: 100, term: 'Presto' }
];

/** The movements of the score, in order. The label names each in the playhead and the timeline. */
export const MOVEMENTS = [
	{ id: 'rest', label: 'Rest your fingers', short: 'Rest' },
	{ id: 'hands', label: 'Your hands', short: 'Hands' },
	{ id: 'score', label: 'Follow the score', short: 'Score' },
	{ id: 'practise', label: 'Practise', short: 'Practise' },
	{ id: 'grow', label: 'Grow', short: 'Grow' },
	{ id: 'technique', label: 'Your technique', short: 'Technique' },
	{ id: 'tempo', label: 'Your tempo', short: 'Tempo' },
	{ id: 'begin', label: 'Begin', short: 'Begin' }
] as const;

export { course };
