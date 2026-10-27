/** Account data categories, cleared independently. Server deletes rows; browser drops local copies. */
export const DATA_CATEGORIES = [
	{
		id: 'learning',
		title: 'Learning path',
		summary: 'Lesson stars and points, practice days and streak, your stated level, starting point and course pace.',
		effect: 'The course starts again from the beginning or from a new placement. XP earned from lessons is removed from your level.'
	},
	{
		id: 'practice',
		title: 'Practice results',
		summary: 'Results of every test and assessment except ranked tests, including placement tests, with their charts and replays.',
		effect: 'Your history and personal bests start again. XP earned from these tests is removed from your level.'
	},
	{
		id: 'ranked',
		title: 'Ranked results',
		summary: 'Results of the competitive test, which set your speed rank and your place on the leaderboard.',
		effect: 'You become unranked until your next ranked test. XP earned from ranked tests is removed from your level.'
	},
	{
		id: 'fingermap',
		title: 'Finger map',
		summary: 'The keystrokes you tagged with the finger that typed them, and the profile worked out from them.',
		effect: 'Finger guidance returns to standard touch typing until you map your fingers again.'
	},
	{
		id: 'usage',
		title: 'Usage statistics',
		summary: 'Time spent on the site, visits, tests started and finished, and the words you typed, from every device.',
		effect: 'The Statistics page starts counting again from now.'
	}
] as const;

export type DataCategory = (typeof DATA_CATEGORIES)[number]['id'];

export const DATA_CATEGORY_IDS = DATA_CATEGORIES.map((c) => c.id) as [DataCategory, ...DataCategory[]];

/** The category a test result belongs to. */
export const categoryOfExam = (exam: string): DataCategory => (exam === 'competitive' ? 'ranked' : 'practice');

/** When each category was last cleared, in epoch milliseconds. */
export type DataResets = Partial<Record<DataCategory, number>>;
