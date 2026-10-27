/** Usage statistics: how the site is used, never who the user is. */
export interface ExamUsage {
	started: number;
	completed: number;
	abandoned: number;
	/** Milliseconds spent typing in this examination. */
	ms: number;
}

export interface WordUsage {
	/** Times the word was typed. */
	n: number;
	/** Times it was typed correctly. */
	ok: number;
	/** Sum of per-word speeds, for the average. */
	sumWpm: number;
	/** Highest speed for the word. */
	bestWpm: number;
}

export interface Usage {
	version: 1;
	firstSeen: number;
	lastSeen: number;
	/** Active milliseconds on the site (page visible and recently used). */
	activeMs: number;
	/** Page loads. */
	visits: number;
	/** Active milliseconds per section of the site. */
	sections: Record<string, number>;
	/** Active milliseconds per day, keyed YYYY-MM-DD. */
	days: Record<string, number>;
	/** Active milliseconds per hour of the day (0–23, local time). */
	hours: number[];
	tests: ExamUsage & { byExam: Record<string, ExamUsage> };
	typing: { keystrokes: number; incorrect: number; backspaces: number; words: number; correctWords: number };
	words: Record<string, WordUsage>;
	mapping: { entries: number };
}

export const emptyUsage = (): Usage => ({
	version: 1,
	firstSeen: Date.now(),
	lastSeen: Date.now(),
	activeMs: 0,
	visits: 0,
	sections: {},
	days: {},
	hours: Array.from({ length: 24 }, () => 0),
	tests: { started: 0, completed: 0, abandoned: 0, ms: 0, byExam: {} },
	typing: { keystrokes: 0, incorrect: 0, backspaces: 0, words: 0, correctWords: 0 },
	words: {},
	mapping: { entries: 0 }
});

const addRecord = (a: Record<string, number>, b: Record<string, number>) => {
	const out = { ...a };
	for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 0) + v;
	return out;
};

const addExam = (a: ExamUsage, b: ExamUsage): ExamUsage => ({
	started: a.started + b.started,
	completed: a.completed + b.completed,
	abandoned: a.abandoned + b.abandoned,
	ms: a.ms + b.ms
});

/** Combines usage from several devices. */
export function mergeUsage(list: Usage[]): Usage {
	const out = emptyUsage();
	if (!list.length) return out;
	out.firstSeen = Math.min(...list.map((u) => u.firstSeen));
	out.lastSeen = Math.max(...list.map((u) => u.lastSeen));
	for (const u of list) {
		out.activeMs += u.activeMs;
		out.visits += u.visits;
		out.sections = addRecord(out.sections, u.sections);
		out.days = addRecord(out.days, u.days);
		out.hours = out.hours.map((h, i) => h + (u.hours[i] ?? 0));
		const byExam = { ...out.tests.byExam };
		for (const [k, v] of Object.entries(u.tests.byExam)) byExam[k] = addExam(byExam[k] ?? { started: 0, completed: 0, abandoned: 0, ms: 0 }, v);
		out.tests = { ...addExam(out.tests, u.tests), byExam };
		out.typing = {
			keystrokes: out.typing.keystrokes + u.typing.keystrokes,
			incorrect: out.typing.incorrect + u.typing.incorrect,
			backspaces: out.typing.backspaces + u.typing.backspaces,
			words: out.typing.words + u.typing.words,
			correctWords: out.typing.correctWords + u.typing.correctWords
		};
		for (const [w, v] of Object.entries(u.words)) {
			const cur = out.words[w];
			out.words[w] = cur
				? { n: cur.n + v.n, ok: cur.ok + v.ok, sumWpm: cur.sumWpm + v.sumWpm, bestWpm: Math.max(cur.bestWpm, v.bestWpm) }
				: { ...v };
		}
		out.mapping.entries += u.mapping.entries;
	}
	return out;
}

export interface WordHighlights {
	mostTyped: { word: string; n: number } | null;
	fastest: { word: string; wpm: number } | null;
	slowest: { word: string; wpm: number } | null;
	leastAccurate: { word: string; accuracy: number; n: number } | null;
}

/** Notable words: speeds from 3+ letter words; slowest and least accurate need 3+ attempts. */
export function wordHighlights(words: Record<string, WordUsage>): WordHighlights {
	const entries = Object.entries(words);
	const long = entries.filter(([w]) => w.length >= 3);
	const repeated = long.filter(([, v]) => v.n >= 3);
	const by = <T>(list: T[], key: (x: T) => number) => list.reduce<T | null>((best, x) => (!best || key(x) > key(best) ? x : best), null);
	const most = by(entries, ([, v]) => v.n);
	const fast = by(long, ([, v]) => v.bestWpm);
	const slow = by(repeated, ([, v]) => -(v.sumWpm / v.n));
	const inaccurate = by(repeated, ([, v]) => -(v.ok / v.n));
	return {
		mostTyped: most ? { word: most[0], n: most[1].n } : null,
		fastest: fast ? { word: fast[0], wpm: fast[1].bestWpm } : null,
		slowest: slow ? { word: slow[0], wpm: slow[1].sumWpm / slow[1].n } : null,
		leastAccurate: inaccurate && inaccurate[1].ok < inaccurate[1].n
			? { word: inaccurate[0], accuracy: (inaccurate[1].ok / inaccurate[1].n) * 100, n: inaccurate[1].n }
			: null
	};
}
