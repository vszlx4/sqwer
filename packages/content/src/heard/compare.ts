/*
 * Letter comparison of an answer with the word: one slot per letter, fewest edits, two neighboring letters typed in
 * the wrong order counting as one swap.
 */

export type LetterMark = 'right' | 'extra' | 'missing' | 'changed' | 'swapped';

/** One slot: the typed letter over the word's letter ('' for a gap) and how they differ. */
export interface Letter {
	typed: string;
	word: string;
	mark: LetterMark;
}

/** Edit table with swaps (optimal string alignment). */
function table(a: readonly string[], b: readonly string[]): number[][] {
	const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++) {
			d[i]![j] = Math.min(d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1), d[i - 1]![j]! + 1, d[i]![j - 1]! + 1);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== b[j - 1]) d[i]![j] = Math.min(d[i]![j]!, d[i - 2]![j - 2]! + 1);
		}
	return d;
}

/** Edits between two strings, a swap of neighbors counting as one. */
export function editDistance(typed: string, word: string): number {
	const a = [...typed];
	const b = [...word];
	return table(a, b)[a.length]![b.length]!;
}

/** Aligns `typed` to `word`, both already normalized. */
export function compareLetters(typed: string, word: string): Letter[] {
	const a = [...typed];
	const b = [...word];
	const d = table(a, b);
	const out: Letter[] = [];
	let i = a.length;
	let j = b.length;
	while (i > 0 || j > 0) {
		const here = d[i]![j]!;
		if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1] && a[i - 1] !== b[j - 1] && here === d[i - 2]![j - 2]! + 1) {
			out.push({ typed: a[i - 1]!, word: b[j - 1]!, mark: 'swapped' }, { typed: a[i - 2]!, word: b[j - 2]!, mark: 'swapped' });
			i -= 2;
			j -= 2;
		} else if (i > 0 && j > 0 && here === d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1)) {
			out.push({ typed: a[i - 1]!, word: b[j - 1]!, mark: a[i - 1] === b[j - 1] ? 'right' : 'changed' });
			i--;
			j--;
		} else if (i > 0 && here === d[i - 1]![j]! + 1) {
			out.push({ typed: a[i - 1]!, word: '', mark: 'extra' });
			i--;
		} else {
			out.push({ typed: '', word: b[j - 1]!, mark: 'missing' });
			j--;
		}
	}
	return out.reverse();
}
