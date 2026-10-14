export type TestMode = { kind: 'time'; seconds: number } | { kind: 'words'; count: number };

export interface Keystroke {
	/** Milliseconds since the first keystroke. */
	t: number;
	kind: 'insert' | 'delete';
	/** Typed character (inserts only). */
	char?: string;
	/** Character the text asked for; undefined for extra characters. */
	expected?: string;
	correct?: boolean;
	/** Word the keystroke belongs to. */
	word: number;
	/** Physical key, when known. */
	code?: string;
	/** Deletes: the whole word was removed (Ctrl/Alt + Backspace). */
	whole?: boolean;
}

export type TypeResult = 'ignored' | 'correct' | 'incorrect';

/** Extra characters allowed beyond the end of a word. */
export const MAX_EXTRA = 10;

/**
 * One typing test. Words are typed one at a time; space submits the current
 * word. Backspace can return to a previous word only if it contains a mistake.
 *
 * Words tests end as soon as the last word reaches its full length; time tests
 * end at the time limit, and keystrokes after the limit are not counted.
 */
export class TypingSession {
	readonly mode: TestMode;
	readonly targets: string[];
	readonly inputs: string[];
	wordIndex = 0;
	/** True when the final word was submitted with space before reaching its length. */
	lastSubmitted = false;
	readonly keystrokes: Keystroke[] = [];
	/** Clock time (e.g. performance.now()) of the first keystroke. */
	startedAt: number | null = null;
	/** Milliseconds from start to finish. */
	duration: number | null = null;

	constructor(words: string[], mode: TestMode) {
		this.mode = mode;
		this.targets = [...words];
		this.inputs = words.map(() => '');
	}

	get started() {
		return this.startedAt !== null;
	}

	get finished() {
		return this.duration !== null;
	}

	get currentTarget() {
		return this.targets[this.wordIndex] ?? '';
	}

	get currentInput() {
		return this.inputs[this.wordIndex] ?? '';
	}

	/** The character that should be typed next, or ' ' when the word is complete. */
	get nextChar(): string | undefined {
		if (this.finished) return undefined;
		const target = this.currentTarget;
		const input = this.currentInput;
		if (input.length < target.length) return target[input.length];
		return this.wordIndex < this.targets.length - 1 ? ' ' : undefined;
	}

	/** Character typed just before the caret, if any. */
	get prevChar(): string | undefined {
		const input = this.currentInput;
		if (input.length) return input[input.length - 1];
		return this.wordIndex > 0 ? ' ' : undefined;
	}

	/** Whether word `i` has been submitted (left with space). */
	isSubmitted(i: number) {
		return i < this.wordIndex || (i === this.wordIndex && this.lastSubmitted);
	}

	appendWords(words: string[]) {
		for (const w of words) {
			this.targets.push(w);
			this.inputs.push('');
		}
	}

	/** Elapsed milliseconds for a keystroke at `now`, or null if the time limit has passed. */
	private elapsed(now: number): number | null {
		if (this.startedAt === null) this.startedAt = now;
		const t = now - this.startedAt;
		if (this.mode.kind === 'time' && t >= this.mode.seconds * 1000) {
			this.finish(now);
			return null;
		}
		return t;
	}

	type(char: string, now: number, code?: string): TypeResult {
		if (this.finished) return 'ignored';
		const w = this.wordIndex;
		const input = this.inputs[w]!;
		const target = this.targets[w]!;

		if (char === ' ') {
			if (input === '') return 'ignored';
			const t = this.elapsed(now);
			if (t === null) return 'ignored';
			const correct = input.length >= target.length;
			this.keystrokes.push({ t, kind: 'insert', char, expected: correct ? ' ' : target[input.length], correct, word: w, code });
			if (w >= this.targets.length - 1) {
				this.lastSubmitted = true;
				this.finish(now);
			} else {
				this.wordIndex++;
			}
			return correct ? 'correct' : 'incorrect';
		}

		if (input.length >= target.length + MAX_EXTRA) return 'ignored';
		const t = this.elapsed(now);
		if (t === null) return 'ignored';
		const expected = target[input.length];
		const correct = char === expected;
		this.inputs[w] = input + char;
		this.keystrokes.push({ t, kind: 'insert', char, expected, correct, word: w, code });

		// A words test ends when the last word reaches its full length.
		if (this.mode.kind === 'words' && w === this.targets.length - 1 && this.inputs[w]!.length >= target.length) {
			this.finish(now);
		}
		return correct ? 'correct' : 'incorrect';
	}

	/** Delete one character, or the whole word when `word` is true. */
	backspace(now: number, word = false): boolean {
		if (this.finished || !this.started) return false;
		const t = this.elapsed(now);
		if (t === null) return false;
		let w = this.wordIndex;
		if (this.inputs[w] === '') {
			if (w === 0 || this.inputs[w - 1] === this.targets[w - 1]) return false;
			this.wordIndex = --w;
			if (!word) {
				this.keystrokes.push({ t, kind: 'delete', word: w });
				return true;
			}
		}
		this.inputs[w] = word ? '' : this.inputs[w]!.slice(0, -1);
		this.keystrokes.push({ t, kind: 'delete', word: w, whole: word });
		return true;
	}

	finish(now: number) {
		if (this.finished) return;
		if (this.startedAt === null) this.startedAt = now;
		const elapsed = now - this.startedAt;
		this.duration = this.mode.kind === 'time' ? Math.min(elapsed, this.mode.seconds * 1000) : elapsed;
	}
}

/**
 * Re-creates a session from its recorded keystrokes. Used for replays and to
 * compute statistics at any point in time with exactly the same rules.
 */
export function replaySession(targets: string[], keystrokes: Keystroke[], untilMs = Infinity): TypingSession {
	const s = new TypingSession(targets, { kind: 'time', seconds: 1e9 });
	for (const k of keystrokes) {
		if (k.t > untilMs) break;
		if (k.kind === 'insert') s.type(k.char!, k.t, k.code);
		else s.backspace(k.t, k.whole);
	}
	return s;
}
