export const CONTACT_EMAIL = 'info@mughram.com';

/**
 * The operator's legal details, shown on the legal pages. Empty values are left out of the
 * pages rather than shown as placeholders.
 */
export const LEGAL = {
	/** The individual who runs sqwer as a free, non-commercial project. */
	operatorName: 'Ahmed Mughram',
	operatorCountry: 'the Kingdom of Saudi Arabia',
	/** Representative in the EU under Article 27 GDPR: name, address and email, once appointed. */
	euRepresentative: '',
	/** Representative in the United Kingdom under Article 27 UK GDPR, once appointed. */
	ukRepresentative: '',
	/** Provider that hosts the website's server, once it is online, and where. */
	webHost: '',
	webHostLocation: 'Europe'
} as const;

/**
 * The three areas of the product: learning, practice and competition. The finger map and history
 * belong to practice and are reached from its page; Getting started from the home page and course.
 */
export const NAV_LINKS = [
	{ href: '/learn', label: 'Learning path', icon: 'route', description: 'Lessons, games and course ranks' },
	{ href: '/exams', label: 'Practice', icon: 'gauge', description: 'Tests, finger map and history, with XP' },
	{ href: '/competitive', label: 'Competitive', icon: 'trophy', description: 'Speed tiers and leaderboards' }
] as const;

/** Account pages, listed once and shared by the account menu and the account section. */
export const ACCOUNT_LINKS = [
	{ href: '/account', label: 'Overview' },
	{ href: '/account/profile', label: 'Profile' },
	{ href: '/account/statistics', label: 'Statistics' },
	{ href: '/account/security', label: 'Security' },
	{ href: '/account/data', label: 'Your data' }
] as const;

/** The footer is the complete site map; other pages link only to what the reader needs next. */
export const FOOTER_GROUPS = [
	{
		title: 'Learn',
		links: [
			{ href: '/start', label: 'Get started' },
			...NAV_LINKS.map(({ href, label }) => ({ href, label })),
			{ href: '/map', label: 'Finger map' },
			{ href: '/history', label: 'History' }
		]
	},
	{
		title: 'Account',
		links: [
			{ href: '/signup', label: 'Create an account' },
			{ href: '/signin', label: 'Sign in' },
			{ href: '/account/profile', label: 'Profile' },
			{ href: '/account/data', label: 'Download or delete data' }
		]
	},
	{
		title: 'Help',
		links: [
			{ href: '/about', label: 'How it works' },
			{ href: '/faq', label: 'Questions and answers' },
			{ href: '/accessibility', label: 'Accessibility' },
			{ href: `mailto:${CONTACT_EMAIL}`, label: 'Contact us' }
		]
	},
	{
		title: 'Legal',
		links: [
			{ href: '/legal', label: 'Legal centre' },
			{ href: '/terms', label: 'Terms and Conditions' },
			{ href: '/privacy', label: 'Privacy Policy' },
			{ href: '/cookies', label: 'Cookies and storage' },
			{ href: '/copyright', label: 'Content and copyright' },
			{ href: '/security', label: 'Security' }
		]
	}
] as const;
