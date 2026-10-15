export const CONTACT_EMAIL = 'info@mughram.com';

/**
 * The operator's legal details, shown on the legal pages. Empty values are left out of the
 * pages rather than shown as placeholders, so fill them in before launch.
 */
export const LEGAL = {
	/** Legal name of the person or company that operates sqwer. */
	operatorName: '',
	/** Postal address for legal and privacy correspondence. */
	operatorAddress: '',
	operatorCountry: 'the Kingdom of Saudi Arabia',
	/** Representative in the EU under Article 27 GDPR: name, address and email, once appointed. */
	euRepresentative: '',
	/** Representative in the United Kingdom under Article 27 UK GDPR, once appointed. */
	ukRepresentative: '',
	/** Company that hosts the website's server, once it is online, and where. */
	webHost: '',
	webHostLocation: 'Europe',
	/** Date shown on every legal page; change it whenever any of them changes. */
	updated: '15 October 2026'
} as const;

/**
 * The four areas of the product. Getting started is used once, so it is reached from the
 * home page and the course rather than kept in the navigation.
 */
export const NAV_LINKS = [
	{ href: '/learn', label: 'Courses' },
	{ href: '/exams', label: 'Examinations' },
	{ href: '/map', label: 'Finger map' },
	{ href: '/history', label: 'History' }
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
		title: 'Product',
		links: [{ href: '/start', label: 'Get started' }, ...NAV_LINKS]
	},
	{
		title: 'Help',
		links: [
			{ href: '/about', label: 'How it works' },
			{ href: '/faq', label: 'Frequently asked questions' },
			{ href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL }
		]
	},
	{
		title: 'Legal',
		links: [
			{ href: '/privacy', label: 'Privacy Policy' },
			{ href: '/terms', label: 'Terms and Conditions' },
			{ href: '/cookies', label: 'Cookie Policy' }
		]
	}
] as const;
