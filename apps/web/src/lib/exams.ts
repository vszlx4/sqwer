import type { ExamId } from './results/types.ts';

export type ExamCategory = 'Assessment' | 'Speed and accuracy' | 'Technique' | 'Competitive';

export interface TestPreset {
	mode: 'time' | 'words';
	time?: 15 | 30 | 60 | 120;
	words?: 10 | 25 | 50 | 100;
	punctuation: boolean;
	numbers: boolean;
	/** Whether the typist may change the settings. */
	adjustable: boolean;
}

export interface Exam {
	id: ExamId | 'finger-map';
	title: string;
	category: ExamCategory;
	purpose: string;
	measures: string[];
	duration: string;
	href: string;
	preset?: TestPreset;
}

/** Core keys that must be mapped before the finger speed assessment is available. */
export const ASSESSMENT_COVERAGE = 0.75;

export const EXAMS: Exam[] = [
	{
		id: 'placement',
		title: 'Placement test',
		category: 'Assessment',
		purpose: 'Establishes your starting speed and accuracy so that later progress can be measured against it.',
		measures: ['Speed', 'Accuracy', 'Consistency'],
		duration: '60 seconds',
		href: '/test?exam=placement',
		preset: { mode: 'time', time: 60, punctuation: false, numbers: false, adjustable: false }
	},
	{
		id: 'timed',
		title: 'Timed test',
		category: 'Speed and accuracy',
		purpose: 'Measures speed and accuracy over a period you choose, from 15 seconds to two minutes.',
		measures: ['Speed', 'Accuracy', 'Consistency'],
		duration: '15 seconds to 2 minutes',
		href: '/test?exam=timed',
		preset: { mode: 'time', time: 30, punctuation: false, numbers: false, adjustable: true }
	},
	{
		id: 'words',
		title: 'Word-count test',
		category: 'Speed and accuracy',
		purpose: 'Measures how quickly and accurately you complete a fixed passage of 25 words.',
		measures: ['Speed', 'Accuracy', 'Completion time'],
		duration: 'About 30 seconds',
		href: '/test?exam=words',
		preset: { mode: 'words', words: 25, punctuation: false, numbers: false, adjustable: false }
	},
	{
		id: 'symbols',
		title: 'Punctuation and numbers',
		category: 'Speed and accuracy',
		purpose: 'Tests capital letters, punctuation and the number row, which rely on Shift and longer reaches.',
		measures: ['Speed', 'Accuracy'],
		duration: '60 seconds',
		href: '/test?exam=symbols',
		preset: { mode: 'time', time: 60, punctuation: true, numbers: true, adjustable: false }
	},
	{
		id: 'endurance',
		title: 'Endurance test',
		category: 'Speed and accuracy',
		purpose: 'Measures whether your speed and accuracy hold steady over a longer passage.',
		measures: ['Speed', 'Accuracy', 'Consistency'],
		duration: '2 minutes',
		href: '/test?exam=endurance',
		preset: { mode: 'time', time: 120, punctuation: false, numbers: false, adjustable: false }
	},
	{
		id: 'competitive',
		title: 'Competitive test',
		category: 'Competitive',
		purpose: 'Sixty seconds of common words. Your best result with at least 92% accuracy sets your speed tier and your place on the leaderboard.',
		measures: ['Speed', 'Accuracy'],
		duration: '60 seconds',
		href: '/test?exam=competitive',
		preset: { mode: 'time', time: 60, punctuation: false, numbers: false, adjustable: false }
	},
	{
		id: 'finger-map',
		title: 'Finger mapping',
		category: 'Technique',
		purpose: 'Records which finger you use for each key, including habits that depend on the neighboring keys.',
		measures: ['Key coverage', 'Non-standard fingering', 'Context habits'],
		duration: 'Approximately 10 minutes in total; can be split into sessions',
		href: '/map'
	},
	{
		id: 'finger-speed',
		title: 'Finger speed assessment',
		category: 'Technique',
		purpose: 'Measures the speed and accuracy of each finger, using your own finger map, to identify the weakest fingers.',
		measures: ['Speed per finger', 'Accuracy per finger'],
		duration: 'Four stages of 20 seconds',
		href: '/exams/finger-speed'
	}
];

export const CATEGORIES: { name: ExamCategory; description: string }[] = [
	{ name: 'Assessment', description: 'A reference point for measuring your progress.' },
	{ name: 'Speed and accuracy', description: 'Tests of overall typing performance under different conditions.' },
	{ name: 'Technique', description: 'Analysis of how each finger is used.' }
];

export const examById = (id: string) => EXAMS.find((e) => e.id === id);
