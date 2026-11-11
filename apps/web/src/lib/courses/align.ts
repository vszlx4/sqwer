/*
 * Letter alignment for Listen and type: what was typed over the word, one slot per letter, with the fewest edits.
 * Feeds the explanation panel until graded results (letter-level feedback) replace it.
 */

export type Mark = 'same' | 'extra' | 'missing' | 'wrong' | 'variant';

/** One aligned slot: the typed letter over the word's letter ('' for a gap) and what differs. */
export interface Slot {
	typed: string;
	word: string;
	mark: Mark;
}

/** Aligns `typed` to `word` by edit distance. With `variant`, every difference is an accepted spelling. */
export function align(typed: string, word: string, variant = false): Slot[] {
	const a = [...typed.toLowerCase()];
	const b = [...word.toLowerCase()];
	const cost: number[][] = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			cost[i][j] = Math.min(cost[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), cost[i - 1][j] + 1, cost[i][j - 1] + 1);

	const slots: Slot[] = [];
	let i = a.length;
	let j = b.length;
	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
			slots.push({ typed: a[i - 1], word: b[j - 1], mark: a[i - 1] === b[j - 1] ? 'same' : 'wrong' });
			i--;
			j--;
		} else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
			slots.push({ typed: a[i - 1], word: '', mark: 'extra' });
			i--;
		} else {
			slots.push({ typed: '', word: b[j - 1], mark: 'missing' });
			j--;
		}
	}
	slots.reverse();
	return variant ? slots.map((s) => (s.mark === 'same' ? s : { ...s, mark: 'variant' })) : slots;
}

const COUNT = ['no', 'one', 'two', 'three', 'four', 'five'];
const count = (n: number, what: string) => `${COUNT[n] ?? n} ${what}${n === 1 ? '' : 's'}`;

/** One plain sentence on what differs, for a wrong answer. */
export function describe(slots: readonly Slot[]): string {
	const n = (mark: Mark) => slots.filter((s) => s.mark === mark).length;
	const parts = [
		n('wrong') && count(n('wrong'), 'wrong letter'),
		n('extra') && count(n('extra'), 'extra letter'),
		n('missing') && count(n('missing'), 'missing letter')
	].filter((p): p is string => !!p);
	if (!parts.length) return 'Spelled exactly right.';
	if (slots.every((s) => s.mark !== 'same')) return 'A different word.';
	const text = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
	return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

/** Text version of the comparison, for screen readers. */
export function spoken(typed: string, word: string): string {
	const spell = (w: string) => [...w].join(' ');
	return typed === word ? `You typed ${spell(word)}.` : `You typed ${spell(typed)}. The word is ${spell(word)}.`;
}
