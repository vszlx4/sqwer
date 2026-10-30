import {
	CAPITAL_SENTENCES,
	ENGLISH_WORDS,
	NUMBER_SENTENCES,
	PRACTICE_SENTENCES,
	PUNCTUATION_SENTENCES,
	wordsUsing
} from '@sqwer/content';
import { handOf, kindOf, type Finger } from '@sqwer/layouts';
import type { Chapter, DrillSource, Lesson, StepSpec } from './types.ts';

/*
 * Course: first two keys to fluency, about a lesson a day, 5-8 minutes each. Steps have goals, not time
 * limits; timed checks only end chapters, and each chapter ends on weak fingers. No locked chapters.
 */

const HOME = 'fjdksla;gh';
const TOP = 'eiruwtyoqp';
const BOTTOM = 'vmc,x.z/bn';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const LEFT_HAND = new Set('qwertasdfgzxcvb');

type Draft = Omit<Lesson, 'id' | 'order'>;

/** Letters only, for choosing real words. */
const lettersOf = (pool: string) => [...pool].filter((c) => /[a-z]/.test(c)).join('');
const chunks = <T>(list: readonly T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/* ---------------------------------------------------------------- building blocks */

const drill = (title: string, source: DrillSource, minAccuracy = 88, weak = false): StepSpec => ({ kind: 'drill', title, source, minAccuracy, ...(weak ? { weak } : {}) });
const patterns = (pool: string, focus: string, groups = 10): DrillSource => ({ type: 'patterns', pool, focus, groups });
const wordsFrom = (pool: string, focus: string, count = 12): DrillSource => ({ type: 'words', pool, focus, count, repeat: 1 });
const listOf = (words: readonly string[]): DrillSource => ({ type: 'list', words: [...words], repeat: 1 });
const sentencesOf = (sentences: readonly string[], count: number): DrillSource => ({ type: 'sentences', sentences, count });

const keyhunt = (pool: string, focus: string, target = 14, weak = false): StepSpec => ({ kind: 'keyhunt', pool, focus, target, ...(weak ? { weak } : {}) });
const fallingLetters = (pool: string, focus: string, target = 14, weak = false): StepSpec => ({ kind: 'falling', items: 'letters', pool, focus, target, ...(weak ? { weak } : {}) });
const fallingWords = (pool: string, focus: string, target = 10, words?: readonly string[]): StepSpec => ({ kind: 'falling', items: 'words', pool, focus, words, target });
const echo = (pool: string, start = 3, target = 5, weak = false): StepSpec => ({ kind: 'echo', pool, start, target, ...(weak ? { weak } : {}) });
const race = (pool: string, focus: string, pacerWpm: number, count = 10, words?: readonly string[]): StepSpec => ({ kind: 'race', pool, focus, words, count, pacerWpm });
const raceSentences = (sentences: readonly string[], pacerWpm: number, count = 14): StepSpec => ({ kind: 'race', pool: LETTERS, focus: '', sentences, count, pacerWpm });
const listen = (pool: string, words?: readonly string[], count = 8, target = 6): StepSpec => ({ kind: 'listen', pool, focus: '', words, count, target });

interface KeyPlan {
	title: string;
	keys: string;
	tip: string;
}

/** Two lessons per key pair: introduce, then apply. Games rotate between pairs. */
function keyLessons(plan: KeyPlan, known: string, chapter: number, n: number, pacer: number): Draft[] {
	const pool = known + plan.keys;
	const L = lettersOf(pool);
	const F = lettersOf(plan.keys);
	const hasWords = wordsUsing(L, F).length >= 10;
	const odd = n % 2 === 1;

	const learn: StepSpec[] = [
		{ kind: 'intro', keys: [...plan.keys], tip: plan.tip },
		drill(`Get to know ${keyList([...plan.keys])}`, patterns(plan.keys, plan.keys, 10), 85),
		keyhunt(pool, plan.keys, 12)
	];
	if (known) learn.push(drill('Mix them with the keys you know', patterns(pool, plan.keys, 12)));
	learn.push(odd ? fallingLetters(pool, plan.keys, 14) : echo(pool, 3, 5));
	if (hasWords) learn.push(drill('Real words', wordsFrom(L, F, 10), 90));
	learn.push(hasWords ? fallingWords(L, F, 8) : keyhunt(pool, '', 14));

	const use: StepSpec[] = [
		drill('Warm up', patterns(pool, plan.keys, 12)),
		odd ? echo(pool, 3, 6) : fallingLetters(pool, plan.keys, 16),
		hasWords ? drill('Words with the new keys', wordsFrom(L, F, 14), 90) : drill('Longer groups', patterns(pool, plan.keys, 14)),
		hasWords ? race(L, F, pacer, 10) : keyhunt(pool, '', 16),
		drill('Everything so far', patterns(pool, '', 12)),
		hasWords ? fallingWords(L, F, 10) : keyhunt(pool, plan.keys, 18)
	];

	return [
		{ chapter, title: plan.title, summary: `Learn ${keyList([...plan.keys])}. ${plan.tip}`, newKeys: [...plan.keys], steps: learn },
		{
			chapter,
			title: `${plan.title} in use`,
			summary: `${keyList([...plan.keys])} with the keys you already know, at a quicker pace.`,
			newKeys: [],
			steps: use
		}
	];
}

/** Two lessons of real words at the end of a letters chapter. */
function rowWordLessons(chapter: number, pool: string, focus: string, name: string, pacer: number): Draft[] {
	const L = lettersOf(pool);
	return [
		{
			chapter,
			title: `${name} words`,
			summary: `Real words from the keys of this chapter, in a race, by ear and as they fall.`,
			newKeys: [],
			steps: [
				drill('The words', wordsFrom(L, focus, 16), 90),
				race(L, focus, pacer, 10),
				listen(L, undefined, 8, 6),
				fallingWords(L, focus, 12),
				keyhunt(pool, focus, 16),
				drill('Once more, quicker', wordsFrom(L, focus, 14), 90)
			]
		},
		{
			chapter,
			title: `${name} in flow`,
			summary: 'Longer runs of words at an even pace, and a memory round.',
			newKeys: [],
			steps: [
				drill('Warm up', patterns(pool, focus, 12)),
				echo(pool, 4, 7),
				drill('Words in a row', wordsFrom(L, '', 18), 90),
				race(L, '', pacer + 3, 12),
				keyhunt(pool, '', 18),
				drill('A last run', wordsFrom(L, focus, 16), 91)
			]
		}
	];
}

/** Practice for the learner's weakest fingers, chosen when the lesson starts. */
function weakLesson(chapter: number, pool: string): Draft {
	const L = lettersOf(pool);
	return {
		chapter,
		title: 'Weak fingers',
		summary: 'Extra practice for your two weakest fingers, chosen from your results. Without results yet, the little and ring fingers.',
		newKeys: [],
		steps: [
			drill('Your weakest fingers', patterns(pool, '', 12), 86, true),
			keyhunt(pool, '', 14, true),
			...(L.length >= 8 ? [drill('Words for those fingers', wordsFrom(L, '', 12), 88, true)] : []),
			fallingLetters(pool, '', 14, true),
			echo(pool, 3, 6, true),
			drill('Once more, steadily', patterns(pool, '', 12), 88, true)
		]
	};
}

/** The timed check at the end of a chapter: the only timed step in the course. */
function check(title: string, chapter: number, source: DrillSource, seconds: number, minWpm: number, minAccuracy = 90): Draft {
	return {
		chapter,
		title,
		summary: `The end-of-chapter check: ${seconds} seconds at ${minWpm} WPM or more with ${minAccuracy}% accuracy, to show you are ready for the next chapter.`,
		newKeys: [],
		steps: [{ kind: 'checkpoint', source, seconds, minWpm, minAccuracy }]
	};
}

/** A lesson for a group of symbols or digits, and one that uses them. */
function symbolLessons(title: string, keys: string, tip: string, chapter: number, context: readonly string[], n: number): Draft[] {
	const half = Math.ceil(context.length / 2);
	return [
		{
			chapter,
			title,
			summary: `Learn ${keyList([...keys])}. ${tip}`,
			newKeys: [...keys],
			steps: [
				{ kind: 'intro', keys: [...keys], tip },
				drill(`Practice ${keyList([...keys])}`, patterns(keys, keys, 10), 85),
				n % 2 ? fallingLetters(keys, keys, 12) : keyhunt(keys, keys, 12),
				drill('In context', listOf(context.slice(0, half)), 88),
				echo(keys, 3, 5)
			]
		},
		{
			chapter,
			title: `${title} in use`,
			summary: `${keyList([...keys])} inside words and phrases.`,
			newKeys: [],
			steps: [
				drill('Warm up', patterns(keys, keys, 12), 86),
				n % 2 ? keyhunt(keys, keys, 14) : fallingLetters(keys, keys, 14),
				drill('More context', listOf(context.slice(half)), 88),
				echo(keys, 4, 6),
				drill('All of them together', listOf(context), 88)
			]
		}
	];
}

/** Capitalised words whose first letter is typed by the given hand. */
function capitalWords(hand: 'left' | 'right', count: number, skip = 0): string[] {
	return wordsUsing(LETTERS)
		.filter((w) => w.length >= 3 && LEFT_HAND.has(w[0]!) === (hand === 'left'))
		.slice(skip, skip + count)
		.map((w) => w[0]!.toUpperCase() + w.slice(1));
}

/** Words and short phrases, split for lessons that use them in turn. */
type WordGame = 'race' | 'listen' | 'falling' | 'echo';
function wordGame(game: WordGame, words: readonly string[], pacer: number): StepSpec {
	switch (game) {
		case 'race':
			return race(LETTERS, '', pacer, 12, words);
		case 'listen':
			return listen(LETTERS, words, 8, 6);
		case 'falling':
			return fallingWords(LETTERS, '', 12, words);
		case 'echo':
			return echo(LETTERS, 4, 7);
	}
}

/** A lesson on a group of frequent words, with three of the word games in a rotating order. */
function wordsLesson(title: string, summary: string, chapter: number, group: readonly string[], n: number, pacer: number): Draft {
	const ORDERS: WordGame[][] = [
		['listen', 'race', 'falling'],
		['falling', 'echo', 'race'],
		['race', 'listen', 'echo'],
		['echo', 'falling', 'listen'],
		['echo', 'race', 'listen'],
		['race', 'echo', 'falling']
	];
	const [a, b, c] = ORDERS[n % ORDERS.length]!;
	const half = Math.ceil(group.length / 2);
	return {
		chapter,
		title,
		summary,
		newKeys: [],
		steps: [
			drill('The first half', listOf(group.slice(0, half)), 90),
			wordGame(a!, group, pacer),
			drill('The second half', listOf(group.slice(half)), 90),
			wordGame(b!, group, pacer + 2),
			drill('All of them', listOf(group), 91),
			wordGame(c!, group, pacer + 4)
		]
	};
}

/** A lesson on a set of sentences. */
function sentenceLesson(title: string, summary: string, chapter: number, set: readonly string[], pacer: number, extra: StepSpec[] = []): Draft {
	const words = set.flatMap((s) => s.split(' '));
	const half = Math.ceil(set.length / 2);
	return {
		chapter,
		title,
		summary,
		newKeys: [],
		steps: [
			drill('Sentences', sentencesOf(set.slice(0, half), half), 90),
			raceSentences(set, pacer),
			...extra,
			drill('More sentences', sentencesOf(set.slice(half), set.length - half), 90),
			fallingWords(LETTERS, '', 10, words)
		]
	};
}
/** Finger label: "left index finger", "right little finger", "left thumb". */
export function fingerName(f: Finger): string {
	const KIND = { pinky: 'little finger', ring: 'ring finger', middle: 'middle finger', index: 'index finger', thumb: 'thumb' } as const;
	return `${handOf(f)} ${KIND[kindOf(f)]}`;
}
export function keyList(keys: string[]): string {
	const names = keys.map(keyName);
	return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
export function keyName(k: string): string {
	const NAMES: Record<string, string> = {
		';': 'semicolon',
		',': 'comma',
		'.': 'period',
		'/': 'slash',
		"'": 'apostrophe',
		'"': 'quotation mark',
		'-': 'hyphen',
		'?': 'question mark',
		'!': 'exclamation mark',
		ShiftLeft: 'left Shift',
		ShiftRight: 'right Shift'
	};
	return NAMES[k] ?? (/^[a-z]$/.test(k) ? k.toUpperCase() : k);
}

const COMMON_1 = ENGLISH_WORDS.slice(0, 100);
const COMMON_2 = ENGLISH_WORDS.slice(100, 200);
const LESS_COMMON = ENGLISH_WORDS.slice(200);

function build(): Chapter[] {
	const chapters: Omit<Chapter, 'lessons'>[] = [
		{ number: 1, title: 'The home row', summary: 'Where your fingers rest, and the eight keys under them.', readyIf: 'This is the very beginning. No experience is needed.' },
		{ number: 2, title: 'Reaching up', summary: 'The top row, reached from home and back again.', readyIf: 'You can type the home row without looking at the keyboard.' },
		{ number: 3, title: 'Reaching down', summary: 'The bottom row, which completes the alphabet.', readyIf: 'You can type the home and top rows without looking.' },
		{ number: 4, title: 'Capital letters', summary: 'Shift, held by the hand that is not typing the letter.', readyIf: 'You can type every letter without looking.' },
		{ number: 5, title: 'Punctuation', summary: 'Periods, commas, apostrophes, question marks and more.', readyIf: 'You type capital letters with the opposite Shift key.' },
		{ number: 6, title: 'Numbers', summary: 'The number row, one finger for each pair of digits.', readyIf: 'You type sentences with punctuation comfortably.' },
		{ number: 7, title: 'Common words, part one', summary: 'The hundred most frequent words, until they are automatic.', readyIf: 'You know where every key is and type at about 20 WPM.' },
		{ number: 8, title: 'Common words, part two', summary: 'The next hundred words, for everyday writing.', readyIf: 'The most common short words feel automatic.' },
		{ number: 9, title: 'Sentences and flow', summary: 'Reading ahead and typing whole sentences at a steady pace.', readyIf: 'You type common words without thinking about the keys.' },
		{ number: 10, title: 'Building speed', summary: 'Letter pairs, word endings, sprints and a quicker pace.', readyIf: 'You type sentences steadily at 30 WPM or faster.' },
		{ number: 11, title: 'Accuracy and endurance', summary: 'Longer passages with near-perfect accuracy.', readyIf: 'You reach about 35 WPM and want to make it last.' },
		{ number: 12, title: 'Symbols', summary: 'The symbols used in email, prices and code.', readyIf: 'You type fluently and need the less common keys.' }
	];

	const lessons: Draft[] = [];
	const add = (...l: Draft[]) => lessons.push(...l);

	// Chapters 1 to 3: the letters, two lessons for each pair of keys.
	const rows: { chapter: number; name: string; pacer: number; seconds: number; minWpm: number; plans: KeyPlan[] }[] = [
		{
			chapter: 1,
			name: 'Home row',
			pacer: 10,
			seconds: 30,
			minWpm: 8,
			plans: [
				{ title: 'F and J', keys: 'fj', tip: 'Rest your index fingers on F and J. Feel the small bumps: they let you find home without looking.' },
				{ title: 'D and K', keys: 'dk', tip: 'Your middle fingers rest on D and K, next to your index fingers.' },
				{ title: 'S and L', keys: 'sl', tip: 'Your ring fingers rest on S and L.' },
				{ title: 'A and semicolon', keys: 'a;', tip: 'Your little fingers rest on A and the semicolon. Now all eight fingers are home.' },
				{ title: 'G and H', keys: 'gh', tip: 'Stretch each index finger one key inwards, then return it home.' }
			]
		},
		{
			chapter: 2,
			name: 'Top row',
			pacer: 13,
			seconds: 40,
			minWpm: 12,
			plans: [
				{ title: 'E and I', keys: 'ei', tip: 'Reach up with your middle fingers, then return them to D and K.' },
				{ title: 'R and U', keys: 'ru', tip: 'Reach up and slightly left with your index fingers.' },
				{ title: 'T and Y', keys: 'ty', tip: 'The longest index-finger reaches on the top row: up and inwards.' },
				{ title: 'W and O', keys: 'wo', tip: 'Reach up with your ring fingers. Keep the other fingers resting.' },
				{ title: 'Q and P', keys: 'qp', tip: 'Reach up with your little fingers, the hardest reach in this chapter.' }
			]
		},
		{
			chapter: 3,
			name: 'Bottom row',
			pacer: 16,
			seconds: 45,
			minWpm: 15,
			plans: [
				{ title: 'V and M', keys: 'vm', tip: 'Reach down with your index fingers: V on the left, M on the right.' },
				{ title: 'C and comma', keys: 'c,', tip: 'Reach down with your middle fingers.' },
				{ title: 'X and period', keys: 'x.', tip: 'Reach down with your ring fingers.' },
				{ title: 'Z and slash', keys: 'z/', tip: 'Reach down with your little fingers.' },
				{ title: 'B and N', keys: 'bn', tip: 'Reach down and inwards with your index fingers. The alphabet is complete.' }
			]
		}
	];
	let known = '';
	let pair = 0;
	for (const row of rows) {
		const start = known;
		for (const plan of row.plans) {
			add(...keyLessons(plan, known, row.chapter, pair++, row.pacer));
			known += plan.keys;
		}
		const focus = lettersOf(known.slice(start.length));
		add(...rowWordLessons(row.chapter, known, focus, row.name, row.pacer));
		add(weakLesson(row.chapter, known));
		add(check(`${row.name} check`, row.chapter, wordsFrom(lettersOf(known), '', 60), row.seconds, row.minWpm));
	}

	// Chapter 4: capital letters.
	const CAPS = [...CAPITAL_SENTENCES];
	add(
		{
			chapter: 4,
			title: 'Right Shift',
			summary: 'Capitals of left-hand letters: hold the right Shift with your right little finger.',
			newKeys: ['ShiftRight'],
			steps: [
				{ kind: 'intro', keys: ['ShiftRight'], tip: 'For a capital typed by the left hand, hold the right Shift key with your right little finger.' },
				drill('Capitals with the right Shift', listOf(capitalWords('left', 10)), 88),
				fallingWords(LETTERS, '', 8, capitalWords('left', 16)),
				drill('A few more', listOf(capitalWords('left', 10, 10)), 88),
				race(LETTERS, '', 16, 8, capitalWords('left', 14, 20))
			]
		},
		{
			chapter: 4,
			title: 'Left Shift',
			summary: 'Capitals of right-hand letters: hold the left Shift with your left little finger.',
			newKeys: ['ShiftLeft'],
			steps: [
				{ kind: 'intro', keys: ['ShiftLeft'], tip: 'For a capital typed by the right hand, hold the left Shift key with your left little finger.' },
				drill('Capitals with the left Shift', listOf(capitalWords('right', 10)), 88),
				race(LETTERS, '', 16, 8, capitalWords('right', 14, 10)),
				drill('A few more', listOf(capitalWords('right', 10, 24)), 88),
				fallingWords(LETTERS, '', 8, capitalWords('right', 16, 34))
			]
		},
		{
			chapter: 4,
			title: 'Mixed capitals',
			summary: 'Choosing the correct Shift key without thinking about it.',
			newKeys: [],
			steps: [
				drill('Both hands', listOf([...capitalWords('left', 8, 40), ...capitalWords('right', 8, 50)].sort()), 90),
				fallingWords(LETTERS, '', 10, [...capitalWords('left', 10, 30), ...capitalWords('right', 10, 40)]),
				drill('Names and places', listOf(['London', 'Maria', 'Tokyo', 'Ahmed', 'Lima', 'Oslo', 'Grace', 'Nairobi', 'Kofi', 'Seoul']), 90),
				listen(LETTERS, capitalWords('left', 10, 60).map((w) => w.toLowerCase()), 8, 6),
				race(LETTERS, '', 18, 10, [...capitalWords('left', 8, 70), ...capitalWords('right', 8, 70)])
			]
		},
		sentenceLesson('Capital sentences', 'Capital letters at the start of sentences, with periods at the end.', 4, CAPS.slice(0, 10), 16),
		sentenceLesson('More capital sentences', 'New sentences, a little longer.', 4, CAPS.slice(10, 20), 18, [echo(LETTERS, 4, 6)]),
		sentenceLesson('Capitals in flow', 'Sentences typed without stopping at the capitals.', 4, CAPS.slice(20, 30), 20, [listen(LETTERS, COMMON_1.slice(0, 40), 8, 6)]),
		weakLesson(4, LETTERS),
		check('Capitals check', 4, sentencesOf(CAPS.slice(30), CAPS.length - 30), 45, 15)
	);

	// Chapter 5: punctuation.
	const PUNCT = [...PUNCTUATION_SENTENCES];
	add(
		sentenceLesson('Periods and commas', 'Pauses inside sentences and at their end.', 5, PUNCT.filter((s) => !/['?!"]/.test(s)).slice(0, 10), 18),
		...symbolLessons('Apostrophe', "'", 'The apostrophe is next to the semicolon, under your right little finger.', 5, ["it's", "don't", "I'm", "we're", "they're", "can't", "won't", "let's", "she's", "you'll", "isn't", "we've"], 0),
		...symbolLessons('Question and exclamation marks', '?!', 'Both need Shift: the question mark with the left Shift, the exclamation mark with the right.', 5, ['Why?', 'Who?', 'Stop!', 'Yes!', 'Ready?', 'Look!', 'Now?', 'Wow!', 'Where?', 'Go!'], 1),
		...symbolLessons('Quotation marks and hyphens', '"-', 'The quotation mark is Shift with the apostrophe key; the hyphen is at the top right.', 5, ['well-known', 'up-to-date', '"yes"', '"no"', 'self-made', 'one-way', '"hello"', 'long-term', '"wait"', 'part-time'], 2),
		sentenceLesson('Punctuated sentences', 'Everyday sentences with every mark from this chapter.', 5, PUNCT.slice(16, 28), 20),
		weakLesson(5, LETTERS + ".,'"),
		check('Punctuation check', 5, sentencesOf(PUNCT.slice(28), PUNCT.length - 28), 45, 16)
	);

	// Chapter 6: numbers.
	const NUMS = [...NUMBER_SENTENCES];
	add(
		...symbolLessons('4, 5, 6 and 7', '4567', 'Index fingers reach up two rows: 4 and 5 with the left, 6 and 7 with the right.', 6, ['45', '67', '456', '74', '56', '765', '4,567', '57', '64', '7654'], 0),
		...symbolLessons('3 and 8', '38', 'Middle fingers reach up two rows.', 6, ['38', '83', '348', '583', '838', '3,800', '88', '33', '388', '8,383'], 1),
		...symbolLessons('2 and 9', '29', 'Ring fingers reach up two rows.', 6, ['29', '92', '239', '942', '292', '9,292', '22', '99', '2,929', '929'], 2),
		...symbolLessons('1 and 0', '10', 'Little fingers reach up two rows.', 6, ['10', '100', '2010', '1990', '101', '1,000', '110', '1010', '0.1', '10.01'], 3),
		{
			chapter: 6,
			title: 'The whole number row',
			summary: 'Every digit, by touch, in games and short numbers.',
			newKeys: [],
			steps: [
				drill('All ten digits', patterns(DIGITS, '', 12), 86),
				keyhunt(DIGITS, '', 16),
				drill('Years and prices', listOf(['1999', '2024', '15.50', '3.75', '1066', '2001', '42', '7.99', '1984', '360']), 88),
				echo(DIGITS, 4, 7),
				fallingLetters(DIGITS, '', 16)
			]
		},
		sentenceLesson('Numbers in text', 'Times, amounts and dates inside sentences.', 6, NUMS.slice(0, 10), 16),
		sentenceLesson('More numbers in text', 'New sentences with larger numbers.', 6, NUMS.slice(10, 22), 18, [keyhunt(DIGITS, '', 14)]),
		weakLesson(6, LETTERS + DIGITS),
		check('Numbers check', 6, sentencesOf(NUMS.slice(22), NUMS.length - 22), 45, 16)
	);

	// Chapters 7 and 8: frequent words, in groups of thirteen.
	chunks(COMMON_1, 13).forEach((group, i) =>
		add(wordsLesson(`Common words, set ${i + 1}`, `Thirteen of the most frequent words, such as ${group.slice(0, 4).join(', ')}.`, 7, group, i, 20 + i))
	);
	add(weakLesson(7, LETTERS), check('Common words check', 7, listOf(COMMON_1), 60, 22));
	chunks(COMMON_2, 13).forEach((group, i) =>
		add(wordsLesson(`Everyday words, set ${i + 1}`, `Thirteen everyday words, such as ${group.slice(0, 4).join(', ')}.`, 8, group, i + 3, 24 + i))
	);
	add(weakLesson(8, LETTERS), check('Everyday words check', 8, listOf(COMMON_2), 60, 25));

	// Chapter 9: sentences and flow.
	const FLOW = [...PRACTICE_SENTENCES];
	const flowNames = [
		['Reading ahead', 'Read the next word while your fingers type the current one.'],
		['Even pace', 'Keeping an even speed is faster than bursts and pauses.'],
		['Light hands', 'Sentences about posture, typed with relaxed hands.'],
		['Phrases, not letters', 'Common phrases typed as single movements.'],
		['Longer sentences', 'Sentences that need you to keep going.'],
		['Flow practice', 'A mix of everything in this chapter.']
	] as const;
	const flowGames: StepSpec[] = [listen(LETTERS, COMMON_1.slice(0, 50), 8, 6), fallingWords(LETTERS, '', 12, COMMON_1.slice(0, 60)), echo(LETTERS, 4, 7), keyhunt(LETTERS, '', 18), listen(LETTERS, COMMON_2.slice(0, 50), 8, 6), race(LETTERS, '', 28, 12, COMMON_2)];
	chunks(FLOW.slice(0, 42), 7).forEach((set, i) => add(sentenceLesson(flowNames[i]![0], flowNames[i]![1], 9, set, 24 + i * 2, [flowGames[i]!])));
	add(weakLesson(9, LETTERS), check('Flow check', 9, sentencesOf(FLOW.slice(42), FLOW.length - 42), 60, 25));

	// Chapter 10: building speed.
	const PAIRS = ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of', 'ed'];
	const ENDINGS = ['ing', 'ed', 'er', 'ly', 'tion', 'est', 'ness', 'ment', 'able', 'ful'];
	add(
		{
			chapter: 10,
			title: 'Common letter pairs',
			summary: 'The pairs that appear in almost every sentence: th, he, in, er, an and more.',
			newKeys: [],
			steps: [
				drill('Pairs', listOf(PAIRS), 92),
				fallingWords(LETTERS, '', 14, PAIRS),
				drill('Pairs in words', listOf(['the', 'then', 'there', 'other', 'into', 'under', 'and', 'order', 'one', 'atone', 'tend', 'notes']), 92),
				race(LETTERS, '', 30, 12, ['the', 'then', 'there', 'other', 'into', 'under', 'and', 'order', 'one', 'tend', 'notes', 'often']),
				echo(LETTERS, 5, 8)
			]
		},
		{
			chapter: 10,
			title: 'Word endings',
			summary: 'Endings such as -ing, -ed and -tion, typed as one movement.',
			newKeys: [],
			steps: [
				drill('Endings', listOf(ENDINGS), 92),
				keyhunt(LETTERS, 'tion', 18),
				drill('Endings in words', listOf(['reading', 'played', 'faster', 'slowly', 'station', 'longest', 'kindness', 'movement', 'readable', 'helpful']), 92),
				fallingWords(LETTERS, '', 12, ['going', 'asked', 'better', 'quickly', 'nation', 'biggest', 'darkness', 'payment', 'capable', 'careful']),
				race(LETTERS, '', 32, 12, ['writing', 'opened', 'teacher', 'really', 'motion', 'closest', 'fairness', 'statement'])
			]
		},
		{
			chapter: 10,
			title: 'Sprint races',
			summary: 'Three short races against quicker and quicker pacers.',
			newKeys: [],
			steps: [drill('Warm up', listOf(COMMON_1.slice(0, 20)), 90), race(LETTERS, '', 30, 12, COMMON_1), race(LETTERS, '', 35, 12, COMMON_2), race(LETTERS, '', 40, 12, LESS_COMMON)]
		},
		{
			chapter: 10,
			title: 'Quick reactions',
			summary: 'Key hunts and falling words at a quicker pace, with a memory round between.',
			newKeys: [],
			steps: [keyhunt(LETTERS, '', 22), echo(LETTERS, 5, 8), fallingWords(LETTERS, '', 14, COMMON_2), drill('Steady words', listOf(COMMON_2.slice(0, 24)), 92)]
		},
		{
			chapter: 10,
			title: 'Word bursts',
			summary: 'Clear falling words before they land; they speed up as you go.',
			newKeys: [],
			steps: [fallingWords(LETTERS, '', 16, COMMON_1), drill('Between bursts', listOf(COMMON_1.slice(40, 64)), 92), fallingWords(LETTERS, '', 16, COMMON_2), keyhunt(LETTERS, '', 20)]
		},
		wordsLesson('Less common words', 'Longer, less frequent words for wider reaches.', 10, LESS_COMMON.slice(0, 16), 1, 30),
		wordsLesson('Speed practice', 'Everything in this chapter, at a quicker pace.', 10, LESS_COMMON.slice(16, 32), 4, 34),
		weakLesson(10, LETTERS),
		check('Speed check', 10, listOf(ENGLISH_WORDS), 60, 35)
	);

	// Chapter 11: accuracy and endurance.
	const MIXED = [...CAPITAL_SENTENCES.slice(30), ...PUNCTUATION_SENTENCES.slice(30), ...NUMBER_SENTENCES.slice(24)];
	add(
		{
			chapter: 11,
			title: 'Accuracy first',
			summary: 'Passages where accuracy matters more than speed.',
			newKeys: [],
			steps: [
				drill('Near-perfect accuracy', listOf(LESS_COMMON.slice(32, 56)), 97),
				keyhunt(LETTERS, '', 20),
				drill('Again, carefully', listOf(LESS_COMMON.slice(56, 80)), 97),
				echo(LETTERS, 5, 8),
				drill('A final careful run', listOf(LESS_COMMON.slice(80, 104)), 97)
			]
		},
		sentenceLesson('Mixed text', 'Capitals, punctuation and numbers together.', 11, MIXED, 30),
		wordsLesson('Careful words', 'Long words, typed accurately before quickly.', 11, LESS_COMMON.slice(104, 120), 2, 32),
		wordsLesson('Precision practice', 'A last set of words with a high accuracy goal.', 11, LESS_COMMON.slice(120, 136), 5, 34),
		weakLesson(11, LETTERS),
		check('Endurance check', 11, sentencesOf([...FLOW, ...CAPITAL_SENTENCES], 14), 90, 35, 95)
	);

	// Chapter 12: symbols.
	const SYMBOLS = '@#$%&*()[]';
	add(
		...symbolLessons('@, # and $', '@#$', 'Shift with 2, 3 and 4. Use the Shift key on the opposite hand.', 12, ['me@home', '#1', '$5', '$20', 'us@work', '#tag', '$99', 'hi@sqwer', '#42', '$1.50'], 0),
		...symbolLessons('%, & and *', '%&*', 'Shift with 5, 7 and 8.', 12, ['50%', 'you & me', '2*3', '100%', 'A&B', '*note', '25%', 'R&D', '3*4', '75%'], 1),
		...symbolLessons('Brackets', '()[]', 'Round brackets are Shift with 9 and 0; square brackets sit right of P.', 12, ['(yes)', '[1]', '(a)', '[note]', 'f(x)', '(see below)', '[2]', 'g(y)', '(etc)', '[end]'], 2),
		{
			chapter: 12,
			title: 'Every symbol',
			summary: 'All the symbols of this chapter, by touch.',
			newKeys: [],
			steps: [drill('All the symbols', patterns(SYMBOLS, '', 12), 85), keyhunt(SYMBOLS, '', 16), echo(SYMBOLS, 3, 6), fallingLetters(SYMBOLS, '', 14)]
		},
		weakLesson(12, LETTERS + DIGITS),
		check('Final check', 12, sentencesOf([...PUNCTUATION_SENTENCES, ...NUMBER_SENTENCES], 10), 90, 38, 95)
	);

	return chapters.map((c) => ({
		...c,
		lessons: lessons
			.map((l, i) => ({ ...l, id: `l${String(i + 1).padStart(3, '0')}`, order: i + 1 }))
			.filter((l) => l.chapter === c.number)
	}));
}

export const CHAPTERS: Chapter[] = build();

/** The four parts of the course, which group its chapters. Each has its own colour on the course page. */
export const PARTS = [
	{ id: 'letters', title: 'Letters', summary: 'Every letter, row by row, by touch.', colour: 'lime', chapters: [1, 2, 3] },
	{ id: 'marks', title: 'Capitals, marks and numbers', summary: 'Shift, punctuation and the number row.', colour: 'cyan', chapters: [4, 5, 6] },
	{ id: 'words', title: 'Words and flow', summary: 'Frequent words and whole sentences.', colour: 'violet', chapters: [7, 8, 9] },
	{ id: 'mastery', title: 'Speed and mastery', summary: 'Speed, endurance and symbols.', colour: 'orange', chapters: [10, 11, 12] }
] as const;

export type Part = (typeof PARTS)[number];
export const partOf = (chapter: number): Part => PARTS.find((p) => (p.chapters as readonly number[]).includes(chapter))!;
export const LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);
export const FIRST_LESSON = LESSONS[0]!;

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const chapterOf = (lesson: Lesson) => CHAPTERS.find((c) => c.number === lesson.chapter)!;
export const lessonAfter = (lesson: Lesson) => LESSONS[lesson.order] ?? null;
