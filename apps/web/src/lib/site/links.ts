export const CONTACT_EMAIL = 'info@mughram.com';

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
