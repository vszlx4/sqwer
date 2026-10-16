/** One activity inside a lesson. Lessons run their steps in order. */
export type StepSpec =
	| {
			/** Shows where new keys are and which finger presses them; the learner presses each one. */
			kind: 'intro';
			keys: string[];
			tip: string;
	  }
	| {
			/** Typing practice from generated letter patterns, real words or set sentences. */
			kind: 'drill';
			title: string;
			source: DrillSource;
			/** Minimum accuracy, in percent, to pass the step. */
			minAccuracy: number;
			/** Practise the learner's weakest fingers: the focus becomes their keys within the pool. */
			weak?: boolean;
	  }
	| {
			/** Letters or words fall; typing one clears it before it lands. */
			kind: 'falling';
			items: 'letters' | 'words';
			pool: string;
			focus: string;
			/** Words to use instead of choosing them from the pool. */
			words?: readonly string[];
			/** Items to clear; the game ends as soon as they are cleared. */
			target: number;
			weak?: boolean;
	  }
	| {
			/** Notes move to a line in lanes, one per key; press the key on the beat. */
			kind: 'rhythm';
			keys: string[];
			/** When set, notes spell real words made from these letters, and the lanes are their letters. */
			pool?: string;
			bpm: number;
			/** Notes to hit on the beat; the game ends as soon as they are hit. */
			target: number;
	  }
	| {
			/** A key lights up on the keyboard; press it before it fades. Teaches where keys are. */
			kind: 'keyhunt';
			pool: string;
			focus: string;
			/** Keys to hit. */
			target: number;
			weak?: boolean;
	  }
	| {
			/** A race against a pacer typing at a set speed; finish the passage first. */
			kind: 'race';
			pool: string;
			focus: string;
			words?: readonly string[];
			/** Words in the passage, which is the finish line. */
			count: number;
			/** Whole sentences to race through in order, instead of separate words. */
			sentences?: readonly string[];
			pacerWpm: number;
			weak?: boolean;
	  }
	| {
			/** Keys flash in a sequence; repeat it from memory. The sequence grows by one each round. */
			kind: 'echo';
			pool: string;
			/** Length of the first sequence. */
			start: number;
			/** Sequence length to reach. */
			target: number;
			weak?: boolean;
	  }
	| {
			/** A word is spoken aloud; the learner types what they hear. */
			kind: 'listen';
			pool: string;
			focus: string;
			words?: readonly string[];
			count: number;
			/** Words that must be typed correctly to pass. */
			target: number;
	  }
	| {
			/** A timed passage with a speed and accuracy goal, closing a chapter. */
			kind: 'checkpoint';
			source: DrillSource;
			seconds: number;
			minWpm: number;
			minAccuracy: number;
	  };

export type DrillSource =
	| { type: 'patterns'; pool: string; focus: string; groups: number }
	| { type: 'words'; pool: string; focus: string; count: number; repeat: number }
	| { type: 'list'; words: string[]; repeat: number }
	| { type: 'sentences'; sentences: readonly string[]; count: number };

export type StepKind = StepSpec['kind'];

export interface Lesson {
	id: string;
	chapter: number;
	/** Position within the whole course, from 1. */
	order: number;
	title: string;
	summary: string;
	/** Keys introduced in this lesson, shown on the roadmap. */
	newKeys: string[];
	steps: StepSpec[];
}

export interface Chapter {
	number: number;
	title: string;
	summary: string;
	/** What a learner can already do if this chapter is the right place to start. */
	readyIf: string;
	lessons: Lesson[];
}

/** The outcome of one step, used for passing and for stars. */
export interface StepResult {
	passed: boolean;
	/** Typing accuracy in percent, or the hit rate of a game. */
	accuracy: number;
	wpm?: number;
	/** A short, factual summary such as "18 of 20 notes on the beat". */
	summary: string;
	/** False for steps that teach rather than test, such as key introductions; they do not affect stars. */
	graded?: boolean;
}

/** Saved progress for one lesson. */
export interface LessonProgress {
	stars: number;
	bestAccuracy: number;
	bestWpm: number;
	attempts: number;
	completedAt: number | null;
}
