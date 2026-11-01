import type { BranchedMenuSection } from '#lib/bits/BranchedMenu.svelte';

export const CONTACT_EMAIL = 'info@mughram.com';

/** Operator legal details for the legal pages. Empty values are omitted. */
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

/** Product areas: learning, practice, competition. Finger map and history sit under practice. */
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

/** Footer columns, each drawn as a branched menu: the product by area, then help. Account pages live in the account
 *  menu and legal pages in the footer's bottom line. */
export const FOOTER_SECTIONS = [
	{
		label: 'Learn',
		links: [
			{ href: '/learn', label: 'Learning path', icon: 'route' },
			{ href: '/start', label: 'Find your level', icon: 'target' }
		]
	},
	{
		label: 'Practice',
		links: [
			{ href: '/exams', label: 'Typing tests', icon: 'gauge' },
			{ href: '/map', label: 'Finger map', icon: 'hand' },
			{ href: '/history', label: 'History', icon: 'history' },
			{ href: '/competitive', label: 'Competitive', icon: 'trophy' }
		]
	},
	{
		label: 'Help',
		links: [
			{ href: '/about', label: 'How it works', icon: 'info' },
			{ href: '/faq', label: 'FAQ', icon: 'question' },
			{ href: '/accessibility', label: 'Accessibility', icon: 'access' },
			{ href: `mailto:${CONTACT_EMAIL}`, label: 'Contact', icon: 'mail' }
		]
	}
] as const satisfies readonly BranchedMenuSection[];

/** The footer's bottom line: every legal document, the legal center first. */
export const FOOTER_LEGAL = [
	{ href: '/legal', label: 'Legal' },
	{ href: '/terms', label: 'Terms' },
	{ href: '/privacy', label: 'Privacy' },
	{ href: '/cookies', label: 'Cookies' },
	{ href: '/copyright', label: 'Copyright' },
	{ href: '/security', label: 'Security' }
] as const;
