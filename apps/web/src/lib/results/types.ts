import type { Finger } from '@sqwer/layouts';

/** Examinations a result can belong to. */
export const EXAM_IDS = ['placement', 'timed', 'words', 'symbols', 'endurance', 'finger-speed'] as const;
export type ExamId = (typeof EXAM_IDS)[number];

export interface FingerScore {
	wpm: number;
	accuracy: number;
	keystrokes: number;
}

export interface TimelineSample {
	/** Seconds since the first keystroke. */
	s: number;
	wpm: number;
	raw: number;
	acc: number;
	burst: number;
	err: number;
}

export interface WordRecord {
	/** Word shown. */
	w: string;
	/** What was typed for it. */
	t: string;
	ms: number;
	wpm: number;
	ok: boolean;
}

/** A replay event: [milliseconds, character]. "\b" deletes a character, "\u0017" deletes a word. */
export type ReplayEvent = [number, string];

export interface ResultDetail {
	timeline: TimelineSample[];
	words: WordRecord[];
	/** Words displayed during the test, up to the last one reached. */
	targets: string[];
	replay: ReplayEvent[];
	chars: { correct: number; incorrect: number; extra: number; missed: number };
	keystrokes: { total: number; incorrect: number; backspaces: number };
	/** Incorrect keystrokes per expected character. */
	missedKeys: Record<string, number>;
}

export interface ResultRecord {
	id: string;
	exam: ExamId;
	/** Completed normally, or left before the end. */
	status: 'completed' | 'abandoned';
	/** Epoch milliseconds when the test ended. */
	at: number;
	wpm: number;
	accuracy: number;
	raw?: number;
	consistency?: number;
	seconds: number;
	/** Short description, e.g. "time 60s · English". */
	label: string;
	/** Per-finger scores (finger speed assessment). */
	fingers?: Partial<Record<Finger, FingerScore>>;
	detail?: ResultDetail;
}
