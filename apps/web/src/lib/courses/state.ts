/** How a learner describes their typing when they begin. */
export const LEVELS = ['new', 'some', 'confident'] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_TEXT: Record<Level, { title: string; body: string }> = {
	new: { title: 'I am new to typing', body: 'I look at the keyboard and use one or two fingers.' },
	some: { title: 'I type, but not properly', body: 'I am fairly quick, but I look at the keys or use my own fingering.' },
	confident: { title: 'I already type well', body: 'I touch type and want to become faster and more accurate.' }
};
