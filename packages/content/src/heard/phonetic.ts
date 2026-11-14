/*
 * Sounds-right spellings: a key for how English letters are usually read, so "fone", "sircle" and "elephent" meet
 * "phone", "circle" and "elephant". The first vowel keeps its quality (long before a silent e or as a vowel pair);
 * later vowels are unstressed and fold into one. Strict on consonants, so "kat" stays apart from "kite".
 */

/** Vowel pairs read as one long vowel. */
const PAIRS: Record<string, string> = { ee: 'E', ea: 'E', ie: 'E', ei: 'E', ey: 'A', ai: 'A', ay: 'A', oa: 'O', oe: 'O', ow: 'O', oo: 'U', ue: 'U', ew: 'U', ui: 'U', ou: 'W', au: 'Q', aw: 'Q', oi: 'Y', oy: 'Y' };

/** Consonant spellings, longest first; each becomes one symbol. */
const CONSONANTS: [RegExp, string][] = [
	[/^(kn|gn|pn)/, 'n'],
	[/^wr/, 'r'],
	[/^ps/, 's'],
	[/^wh/, 'w'],
	[/^x/, 'z'],
	[/tch/g, 'C'],
	[/dge/g, 'J'],
	[/sch/g, 'sk'],
	[/ght/g, 't'],
	[/gh$/, ''],
	[/ph/g, 'f'],
	[/ck/g, 'k'],
	[/ch/g, 'C'],
	[/sh/g, 'S'],
	[/th/g, 'T'],
	[/qu/g, 'kw'],
	[/q/g, 'k'],
	[/x/g, 'ks'],
	[/c(?=[eiy])/g, 's'],
	[/c/g, 'k'],
	[/g(?=[eiy])/g, 'J'],
	[/z/g, 's'],
	[/mb$/, 'm']
];

/** Vowel letters; capitals are long vowels set by the rules (igh → I). */
const VOWEL = /[aeiouyAEIOU]/;

/** How a word is likely said, as a short key. Words with the same key sound alike when read out. */
export function soundKey(word: string): string {
	let w = word.toLowerCase().replace(/[^a-z]/g, '');
	// Pairs are read before consonants are folded, so "ow" and "ew" keep their w.
	const firstPair = w.match(/[aeiouy]{2}|[aeo]w/)?.[0];
	w = w.replace(/igh/g, 'I');
	for (const [from, to] of CONSONANTS) w = w.replace(from, to);
	w = w.replace(/([^aeiouy])\1+/g, '$1');

	// Silent e: dropped, and a single first vowel before one consonant reads long (fone, kite).
	let long = false;
	const silent = w.match(/^([^aeiouy]*)([aeiou])([^aeiouy])e$/);
	if (silent) long = true;
	if (w.length > 2 && /[^aeiouy]e$/.test(w)) w = w.slice(0, -1);

	let seen = false;
	let out = '';
	for (let i = 0; i < w.length; ) {
		const c = w[i]!;
		if (!VOWEL.test(c) || (c === 'y' && i === 0)) {
			out += c;
			i++;
			continue;
		}
		let run = '';
		while (i < w.length && VOWEL.test(w[i]!)) run += w[i++];
		if (seen) out += '@';
		else {
			const pair = firstPair && PAIRS[firstPair.slice(0, 2)];
			const marked = run.match(/[AEIOU]/)?.[0];
			out += marked ?? (run.length > 1 && pair ? pair : long ? run[0]!.toUpperCase() : run[0]!);
			seen = true;
		}
	}
	return out;
}
