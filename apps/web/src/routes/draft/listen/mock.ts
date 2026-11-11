// Still data for the Listen and type mockups (issue 176): one round, three moments. Nothing here is live.

export type Screen = 'listening' | 'close' | 'accepted';
export type Mark = 'same' | 'extra' | 'missing' | 'wrong' | 'variant';
export type Dot = 'exact' | 'accepted' | 'close' | 'wrong' | 'now' | 'todo';

/** One aligned slot: what was typed over what was said, and the mark under it. */
export interface Slot {
	typed: string;
	word: string;
	mark: Mark;
}

export interface Result {
	grade: 'Close' | 'Accepted';
	typed: string;
	word: string;
	slots: Slot[];
	/** One plain sentence on the mistake or the variant. */
	note: string;
	/** Partial credit for the round, from 0 to 1. */
	credit: number;
	/** Text version of the comparison for screen readers. */
	spoken: string;
}

const slots = (typed: string, word: string, marks: Mark[]): Slot[] =>
	marks.map((mark, i) => ({ typed: typed[i] === '-' ? '' : typed[i], word: word[i] === '-' ? '' : word[i], mark }));

export const RESULTS: Record<Exclude<Screen, 'listening'>, Result> = {
	close: {
		grade: 'Close',
		typed: 'nitch',
		word: 'niche',
		slots: slots('nitch-', 'ni-che', ['same', 'same', 'extra', 'same', 'same', 'missing']),
		note: 'One extra letter, one missing. The ending -iche sounds like -itch but drops the t and ends in e.',
		credit: 0.5,
		spoken: 'You typed n i t c h. The word is n i c h e. Extra t after i, missing e at the end.'
	},
	accepted: {
		grade: 'Accepted',
		typed: 'colour',
		word: 'color',
		slots: slots('colour', 'colo-r', ['same', 'same', 'same', 'same', 'variant', 'same']),
		note: 'British spelling. Both count; American English writes color.',
		credit: 1,
		spoken: 'You typed c o l o u r, the British spelling. The American spelling is c o l o r. Both count.'
	}
};

export const WORD_COUNT = 12;
export const INDEX = 4;

/** Results so far, then the word in play, then the words still to come. */
export function dots(screen: Screen): Dot[] {
	const done: Dot[] = ['exact', 'exact', 'accepted', 'wrong'];
	const now: Dot = screen === 'listening' ? 'now' : screen === 'close' ? 'close' : 'accepted';
	return [...done, now, ...Array<Dot>(WORD_COUNT - done.length - 1).fill('todo')];
}

/** Still voice level, one value per bar, 0 to 1. */
export const LEVEL = [0.18, 0.34, 0.62, 0.9, 0.74, 1, 0.82, 0.56, 0.7, 0.44, 0.28, 0.16];
