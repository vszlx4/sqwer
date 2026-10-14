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
 * The sqwer course: one long road from the first two keys to fluent typing.
 * Each chapter adds a group of keys or a skill, and every lesson builds only on
 * what earlier lessons taught, so a learner who finishes a chapter is ready for
 * the next. All chapters are open: the roadmap recommends, it does not lock.
 */

const HOME = 'fjdksla;gh';
const TOP = 'eiruwtyoqp';
const BOTTOM = 'vmc,x.z/bn';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const LEFT_HAND = new Set('qwertasdfgzxcvb');

interface KeyLessonPlan {
	title: string;
	keys: string;
	tip: string;
	game: 'falling' | 'rhythm';
}

/** Letters only, for choosing real words. */
const lettersOf = (pool: string) => [...pool].filter((c) => /[a-z]/.test(c)).join('');

function keyLesson(plan: KeyLessonPlan, known: string, chapter: number, bpm: number): Omit<Lesson, 'id' | 'order'> {
	const pool = known + plan.keys;
	const steps: StepSpec[] = [
		{ kind: 'intro', keys: [...plan.keys], tip: plan.tip },
		{
			kind: 'drill',
			title: `Get to know ${keyList([...plan.keys])}`,
			source: { type: 'patterns', pool: plan.keys, focus: plan.keys, groups: 14 },
			minAccuracy: 85
		},
		{
			kind: 'drill',
			title: 'Mix them with the keys you know',
			source: { type: 'patterns', pool, focus: plan.keys, groups: 18 },
			minAccuracy: 88
		},
		plan.game === 'rhythm'
			? { kind: 'rhythm', keys: [...plan.keys, ...[...known].filter((c) => /[a-z;]/.test(c)).slice(-2)].slice(0, 4), bpm, notes: 20 }
			: { kind: 'falling', items: 'letters', pool, focus: plan.keys, seconds: 45, target: 18 }
	];
	const words = wordsUsing(lettersOf(pool), lettersOf(plan.keys));
	if (words.length >= 8) {
		steps.push({
			kind: 'drill',
			title: 'Real words, a few times each',
			source: { type: 'words', pool: lettersOf(pool), focus: lettersOf(plan.keys), count: 8, repeat: 3 },
			minAccuracy: 90
		});
	}
	return {
		chapter,
		title: plan.title,
		summary: `Learn ${keyList([...plan.keys])}. ${plan.tip}`,
		newKeys: [...plan.keys],
		steps
	};
}

function wordsLesson(title: string, summary: string, chapter: number, pool: string, list?: readonly string[]): Omit<Lesson, 'id' | 'order'> {
	const source: DrillSource = list
		? { type: 'list', words: [...list], repeat: 3 }
		: { type: 'words', pool, focus: '', count: 10, repeat: 3 };
	return {
		chapter,
		title,
		summary,
		newKeys: [],
		steps: [
			{ kind: 'drill', title: 'Repeat each word until it feels natural', source, minAccuracy: 90 },
			{ kind: 'listen', pool, focus: '', words: list, count: 10, target: 7 },
			{ kind: 'falling', items: 'words', pool, focus: '', words: list, seconds: 60, target: 12 }
		]
	};
}

function checkpoint(title: string, chapter: number, source: DrillSource, seconds: number, minWpm: number, minAccuracy = 90): Omit<Lesson, 'id' | 'order'> {
	return {
		chapter,
		title,
		summary: `A ${seconds}-second check of the whole chapter: at least ${minWpm} WPM with ${minAccuracy}% accuracy.`,
		newKeys: [],
		steps: [{ kind: 'checkpoint', source, seconds, minWpm, minAccuracy }]
	};
}

function sentencesLesson(title: string, summary: string, chapter: number, sentences: readonly string[], newKeys: string[] = [], tip = ''): Omit<Lesson, 'id' | 'order'> {
	const steps: StepSpec[] = [];
	if (newKeys.length) steps.push({ kind: 'intro', keys: newKeys, tip });
	steps.push(
		{ kind: 'drill', title: 'Short sentences', source: { type: 'sentences', sentences, count: 4 }, minAccuracy: 88 },
		{ kind: 'drill', title: 'A few more', source: { type: 'sentences', sentences, count: 5 }, minAccuracy: 90 }
	);
	return { chapter, title, summary, newKeys, steps };
}

function symbolLesson(title: string, keys: string, tip: string, chapter: number, extra: readonly string[] = []): Omit<Lesson, 'id' | 'order'> {
	const steps: StepSpec[] = [
		{ kind: 'intro', keys: [...keys], tip },
		{ kind: 'drill', title: `Practise ${keyList([...keys])}`, source: { type: 'patterns', pool: keys, focus: keys, groups: 14 }, minAccuracy: 85 },
		{ kind: 'falling', items: 'letters', pool: keys, focus: keys, seconds: 40, target: 14 }
	];
	if (extra.length) steps.push({ kind: 'drill', title: 'In context', source: { type: 'list', words: [...extra], repeat: 2 }, minAccuracy: 88 });
	return { chapter, title, summary: `Learn ${keyList([...keys])}. ${tip}`, newKeys: [...keys], steps };
}

/** Capitalised words whose first letter is typed by the given hand. */
function capitalWords(hand: 'left' | 'right', count: number): string[] {
	return wordsUsing(LETTERS)
		.filter((w) => w.length >= 3 && LEFT_HAND.has(w[0]!) === (hand === 'left'))
		.slice(0, count)
		.map((w) => w[0]!.toUpperCase() + w.slice(1));
}

/** A finger named the way a teacher would say it: "left index finger", "right little finger", "left thumb". */
export function fingerName(f: Finger): string {
	const KIND = { pinky: 'little finger', ring: 'ring finger', middle: 'middle finger', index: 'index finger', thumb: 'thumb' } as const;
	return `${handOf(f)} ${KIND[kindOf(f)]}`;
}

export function keyList(keys: string[]): string {
	const names = keys.map(keyName);
	return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** A readable name for a key or character. */
export function keyName(k: string): string {
	const NAMES: Record<string, string> = {
		';': 'semicolon',
		',': 'comma',
		'.': 'full stop',
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
const chunks = (list: readonly string[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

function build(): Chapter[] {
	const chapters: Omit<Chapter, 'lessons'>[] = [
		{ number: 1, title: 'The home row', summary: 'Where your fingers rest, and the eight keys under them.', readyIf: 'This is the very beginning. No experience is needed.' },
		{ number: 2, title: 'Reaching up', summary: 'The top row, reached from home and back again.', readyIf: 'You can type the home row without looking at the keyboard.' },
		{ number: 3, title: 'Reaching down', summary: 'The bottom row, which completes the alphabet.', readyIf: 'You can type the home and top rows without looking.' },
		{ number: 4, title: 'Capital letters', summary: 'Shift, held by the hand that is not typing the letter.', readyIf: 'You can type every letter without looking.' },
		{ number: 5, title: 'Punctuation', summary: 'Full stops, commas, apostrophes and question marks.', readyIf: 'You type capital letters with the opposite Shift key.' },
		{ number: 6, title: 'Numbers', summary: 'The number row, one finger for each pair of digits.', readyIf: 'You type sentences with punctuation comfortably.' },
		{ number: 7, title: 'Common words, part one', summary: 'The hundred most frequent words, until they are automatic.', readyIf: 'You know where every key is and type at about 20 WPM.' },
		{ number: 8, title: 'Common words, part two', summary: 'The next hundred words, for everyday writing.', readyIf: 'The most common short words feel automatic.' },
		{ number: 9, title: 'Sentences and flow', summary: 'Reading ahead and typing whole sentences in a steady rhythm.', readyIf: 'You type common words without thinking about the keys.' },
		{ number: 10, title: 'Building speed', summary: 'Short sprints, common letter pairs and faster rhythm.', readyIf: 'You type sentences steadily at about 30 WPM.' },
		{ number: 11, title: 'Accuracy and endurance', summary: 'Longer passages with near-perfect accuracy.', readyIf: 'You reach about 35 WPM and want to make it last.' },
		{ number: 12, title: 'Symbols', summary: 'The symbols used in email, prices and code.', readyIf: 'You type fluently and need the less common keys.' }
	];

	const lessons: Omit<Lesson, 'id' | 'order'>[] = [];
	const add = (l: Omit<Lesson, 'id' | 'order'>) => lessons.push(l);

	// Chapter 1: the home row.
	let known = '';
	const home: KeyLessonPlan[] = [
		{ title: 'F and J', keys: 'fj', game: 'rhythm', tip: 'Rest your index fingers on F and J. Feel the small bumps: they let you find home without looking.' },
		{ title: 'D and K', keys: 'dk', game: 'falling', tip: 'Your middle fingers rest on D and K, next to your index fingers.' },
		{ title: 'S and L', keys: 'sl', game: 'rhythm', tip: 'Your ring fingers rest on S and L.' },
		{ title: 'A and semicolon', keys: 'a;', game: 'falling', tip: 'Your little fingers rest on A and the semicolon. Now all eight fingers are home.' },
		{ title: 'G and H', keys: 'gh', game: 'rhythm', tip: 'Stretch each index finger one key inwards, then return it home.' }
	];
	for (const plan of home) {
		add(keyLesson(plan, known, 1, 72));
		known += plan.keys;
	}
	add(wordsLesson('Home row words', 'Real words made only from home-row keys, repeated until they are familiar.', 1, lettersOf(HOME)));
	add(checkpoint('Home row check', 1, { type: 'words', pool: lettersOf(HOME), focus: '', count: 40, repeat: 1 }, 45, 8));

	// Chapter 2: the top row.
	const top: KeyLessonPlan[] = [
		{ title: 'E and I', keys: 'ei', game: 'falling', tip: 'Reach up with your middle fingers, then return them to D and K.' },
		{ title: 'R and U', keys: 'ru', game: 'rhythm', tip: 'Reach up and slightly left with your index fingers.' },
		{ title: 'T and Y', keys: 'ty', game: 'falling', tip: 'The longest index-finger reaches on the top row: up and inwards.' },
		{ title: 'W and O', keys: 'wo', game: 'rhythm', tip: 'Reach up with your ring fingers. Keep the other fingers resting.' },
		{ title: 'Q and P', keys: 'qp', game: 'falling', tip: 'Reach up with your little fingers, the hardest reach in this chapter.' }
	];
	for (const plan of top) {
		add(keyLesson(plan, known, 2, 80));
		known += plan.keys;
	}
	add(wordsLesson('Top row words', 'Words that use the home and top rows, repeated to build memory.', 2, lettersOf(HOME + TOP)));
	add(checkpoint('Top row check', 2, { type: 'words', pool: lettersOf(HOME + TOP), focus: '', count: 50, repeat: 1 }, 60, 12));

	// Chapter 3: the bottom row.
	const bottom: KeyLessonPlan[] = [
		{ title: 'V and M', keys: 'vm', game: 'rhythm', tip: 'Reach down with your index fingers: V on the left, M on the right.' },
		{ title: 'C and comma', keys: 'c,', game: 'falling', tip: 'Reach down with your middle fingers.' },
		{ title: 'X and full stop', keys: 'x.', game: 'rhythm', tip: 'Reach down with your ring fingers.' },
		{ title: 'Z and slash', keys: 'z/', game: 'falling', tip: 'Reach down with your little fingers.' },
		{ title: 'B and N', keys: 'bn', game: 'falling', tip: 'Reach down and inwards with your index fingers. The alphabet is complete.' }
	];
	for (const plan of bottom) {
		add(keyLesson(plan, known, 3, 88));
		known += plan.keys;
	}
	add(wordsLesson('Whole-alphabet words', 'Words from every row, repeated until each reach feels natural.', 3, LETTERS));
	add(checkpoint('Alphabet check', 3, { type: 'words', pool: LETTERS, focus: '', count: 60, repeat: 1 }, 60, 15));

	// Chapter 4: capital letters.
	add({
		chapter: 4,
		title: 'Right Shift',
		summary: 'Capitals of left-hand letters: hold the right Shift with your right little finger.',
		newKeys: ['ShiftRight'],
		steps: [
			{ kind: 'intro', keys: ['ShiftRight'], tip: 'For a capital typed by the left hand, hold the right Shift key with your right little finger.' },
			{ kind: 'drill', title: 'Capitals with the right Shift', source: { type: 'list', words: capitalWords('left', 12), repeat: 2 }, minAccuracy: 88 }
		]
	});
	add({
		chapter: 4,
		title: 'Left Shift',
		summary: 'Capitals of right-hand letters: hold the left Shift with your left little finger.',
		newKeys: ['ShiftLeft'],
		steps: [
			{ kind: 'intro', keys: ['ShiftLeft'], tip: 'For a capital typed by the right hand, hold the left Shift key with your left little finger.' },
			{ kind: 'drill', title: 'Capitals with the left Shift', source: { type: 'list', words: capitalWords('right', 12), repeat: 2 }, minAccuracy: 88 }
		]
	});
	add({
		chapter: 4,
		title: 'Mixed capitals',
		summary: 'Choosing the correct Shift key without thinking about it.',
		newKeys: [],
		steps: [
			{ kind: 'drill', title: 'Both hands', source: { type: 'list', words: [...capitalWords('left', 8), ...capitalWords('right', 8)].sort(), repeat: 1 }, minAccuracy: 90 },
			{ kind: 'falling', items: 'words', pool: LETTERS, focus: '', words: [...capitalWords('left', 10), ...capitalWords('right', 10)], seconds: 60, target: 10 }
		]
	});
	add(sentencesLesson('Sentences', 'Capital letters at the start of sentences, with full stops at the end.', 4, CAPITAL_SENTENCES));
	add(checkpoint('Capitals check', 4, { type: 'sentences', sentences: CAPITAL_SENTENCES, count: 10 }, 60, 15));

	// Chapter 5: punctuation.
	add(sentencesLesson('Full stops and commas', 'Pauses inside sentences and at their end.', 5, PUNCTUATION_SENTENCES.filter((s) => !/['?!]/.test(s))));
	add(symbolLesson('Apostrophe', "'", 'The apostrophe is next to the semicolon, under your right little finger.', 5, ["it's", "don't", "I'm", "we're", "they're", "can't", "won't", "let's"]));
	add(symbolLesson('Question and exclamation marks', '?!', 'Both need Shift: the question mark with the left Shift, the exclamation mark with the right.', 5, ['Why?', 'Who?', 'Stop!', 'Yes!', 'Ready?', 'Look!']));
	add(symbolLesson('Quotation marks and hyphens', '"-', 'The quotation mark is Shift with the apostrophe key; the hyphen is at the top right.', 5, ['well-known', 'up-to-date', '"yes"', '"no"', 'self-made', 'one-way']));
	add(sentencesLesson('Punctuated sentences', 'Everyday sentences with every mark from this chapter.', 5, PUNCTUATION_SENTENCES));
	add(checkpoint('Punctuation check', 5, { type: 'sentences', sentences: PUNCTUATION_SENTENCES, count: 10 }, 60, 16));

	// Chapter 6: numbers.
	add(symbolLesson('4, 5, 6 and 7', '4567', 'Index fingers reach up two rows: 4 and 5 with the left, 6 and 7 with the right.', 6, ['45', '67', '456', '74', '56', '765']));
	add(symbolLesson('3 and 8', '38', 'Middle fingers reach up two rows.', 6, ['38', '83', '348', '583', '838']));
	add(symbolLesson('2 and 9', '29', 'Ring fingers reach up two rows.', 6, ['29', '92', '239', '942', '292']));
	add(symbolLesson('1 and 0', '10', 'Little fingers reach up two rows.', 6, ['10', '100', '2010', '1990', '101']));
	add(sentencesLesson('Numbers in text', 'Times, amounts and dates inside sentences.', 6, NUMBER_SENTENCES));
	add(checkpoint('Numbers check', 6, { type: 'sentences', sentences: NUMBER_SENTENCES, count: 8 }, 60, 16));

	// Chapters 7 and 8: common words, in groups of twenty.
	chunks(COMMON_1, 20).forEach((group, i) =>
		add(wordsLesson(`Common words ${i + 1}`, `Twenty of the most frequent words: ${group.slice(0, 5).join(', ')} and more.`, 7, LETTERS, group))
	);
	chunks(COMMON_2, 20).forEach((group, i) =>
		add(wordsLesson(`Everyday words ${i + 1}`, `Twenty everyday words: ${group.slice(0, 5).join(', ')} and more.`, 8, LETTERS, group))
	);

	// Chapter 9: sentences and flow.
	const practice = [...PRACTICE_SENTENCES];
	add(sentencesLesson('Reading ahead', 'Read the next word while your fingers type the current one.', 9, practice.slice(0, 5)));
	add(sentencesLesson('Steady rhythm', 'An even pace is faster than bursts and pauses.', 9, practice.slice(5)));
	add({
		chapter: 9,
		title: 'Listen and type',
		summary: 'Type words as you hear them, without seeing them first.',
		newKeys: [],
		steps: [
			{ kind: 'listen', pool: LETTERS, focus: '', words: COMMON_1.slice(0, 60), count: 12, target: 9 },
			{ kind: 'listen', pool: LETTERS, focus: '', words: COMMON_2.slice(0, 60), count: 12, target: 9 }
		]
	});
	add({
		chapter: 9,
		title: 'Rhythm on the home row',
		summary: 'Keys on a steady beat, to train an even rhythm.',
		newKeys: [],
		steps: [
			{ kind: 'rhythm', keys: ['a', 's', 'd', 'f'], bpm: 100, notes: 28 },
			{ kind: 'rhythm', keys: ['j', 'k', 'l', ';'], bpm: 100, notes: 28 }
		]
	});
	add(checkpoint('Flow check', 9, { type: 'sentences', sentences: PRACTICE_SENTENCES, count: 10 }, 60, 25));

	// Chapter 10: building speed.
	add({
		chapter: 10,
		title: 'Common letter pairs',
		summary: 'The pairs that appear in almost every sentence: th, he, in, er, an and more.',
		newKeys: [],
		steps: [
			{ kind: 'drill', title: 'Pairs', source: { type: 'list', words: ['th', 'he', 'in', 'er', 'an', 're', 'on', 'at', 'en', 'nd', 'ti', 'es', 'or', 'te', 'of', 'ed'], repeat: 3 }, minAccuracy: 92 },
			{ kind: 'drill', title: 'Pairs in words', source: { type: 'list', words: ['the', 'then', 'there', 'other', 'into', 'under', 'and', 'order', 'one', 'atone', 'tend', 'notes'], repeat: 2 }, minAccuracy: 92 }
		]
	});
	add({
		chapter: 10,
		title: 'Short sprints',
		summary: 'Three short, fast passages with a rest between them.',
		newKeys: [],
		steps: [1, 2, 3].map(() => ({ kind: 'checkpoint', source: { type: 'list', words: [...COMMON_1], repeat: 1 }, seconds: 15, minWpm: 25, minAccuracy: 92 }) as StepSpec)
	});
	add({
		chapter: 10,
		title: 'Faster rhythm',
		summary: 'The rhythm game at a quicker tempo across the whole home row.',
		newKeys: [],
		steps: [
			{ kind: 'rhythm', keys: ['d', 'f', 'j', 'k'], bpm: 132, notes: 32 },
			{ kind: 'rhythm', keys: ['s', 'd', 'k', 'l'], bpm: 132, notes: 32 }
		]
	});
	add({
		chapter: 10,
		title: 'Word bursts',
		summary: 'Clear falling words before they land, at an increasing pace.',
		newKeys: [],
		steps: [
			{ kind: 'falling', items: 'words', pool: LETTERS, focus: '', words: COMMON_1, seconds: 60, target: 18 },
			{ kind: 'falling', items: 'words', pool: LETTERS, focus: '', words: COMMON_2, seconds: 60, target: 18 }
		]
	});
	add(checkpoint('Speed check', 10, { type: 'list', words: [...ENGLISH_WORDS], repeat: 1 }, 60, 35));

	// Chapter 11: accuracy and endurance.
	add({
		chapter: 11,
		title: 'Accuracy first',
		summary: 'A passage where accuracy matters more than speed.',
		newKeys: [],
		steps: [{ kind: 'drill', title: 'Near-perfect accuracy', source: { type: 'words', pool: LETTERS, focus: '', count: 30, repeat: 1 }, minAccuracy: 97 }]
	});
	add(checkpoint('Two-minute passage', 11, { type: 'list', words: [...ENGLISH_WORDS], repeat: 1 }, 120, 30, 94));
	add(sentencesLesson('Mixed text', 'Capitals, punctuation and numbers together.', 11, [...CAPITAL_SENTENCES, ...PUNCTUATION_SENTENCES, ...NUMBER_SENTENCES]));
	add(checkpoint('Endurance check', 11, { type: 'sentences', sentences: [...PRACTICE_SENTENCES, ...CAPITAL_SENTENCES], count: 20 }, 120, 35, 95));

	// Chapter 12: symbols.
	add(symbolLesson('@, # and $', '@#$', 'Shift with 2, 3 and 4. Use the Shift key on the opposite hand.', 12, ['me@home', '#1', '$5', '$20', 'us@work']));
	add(symbolLesson('%, & and *', '%&*', 'Shift with 5, 7 and 8.', 12, ['50%', 'you & me', '2*3', '100%', 'A&B']));
	add(symbolLesson('Brackets', '()[]', 'Round brackets are Shift with 9 and 0; square brackets sit right of P.', 12, ['(yes)', '[1]', '(a)', '[note]', 'f(x)']));
	add(checkpoint('Final check', 12, { type: 'sentences', sentences: [...PUNCTUATION_SENTENCES, ...NUMBER_SENTENCES], count: 14 }, 120, 38, 95));

	return chapters.map((c) => ({
		...c,
		lessons: lessons
			.map((l, i) => ({ ...l, id: `l${String(i + 1).padStart(2, '0')}`, order: i + 1 }))
			.filter((l) => l.chapter === c.number)
	}));
}

export const CHAPTERS: Chapter[] = build();
export const LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);
export const FIRST_LESSON = LESSONS[0]!;

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const chapterOf = (lesson: Lesson) => CHAPTERS.find((c) => c.number === lesson.chapter)!;
export const lessonAfter = (lesson: Lesson) => LESSONS[lesson.order] ?? null;
