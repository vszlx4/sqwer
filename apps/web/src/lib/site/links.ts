export const CONTACT_EMAIL = 'info@mughram.com';

export const NAV_LINKS = [
	{ href: '/journey', label: 'Your journey' },
	{ href: '/exams', label: 'Examinations' },
	{ href: '/map', label: 'Finger map' },
	{ href: '/history', label: 'History' }
] as const;

export const FOOTER_GROUPS = [
	{
		title: 'Learn',
		links: [
			{ href: '/journey', label: 'Your journey' },
			{ href: '/exams', label: 'Examinations' },
			{ href: '/history', label: 'History' },
			{ href: '/about', label: 'How it works' },
			{ href: '/faq', label: 'FAQ' }
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
