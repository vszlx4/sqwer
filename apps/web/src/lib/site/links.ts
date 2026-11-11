import type { Area } from './areas.ts';
import type { BranchedMenuSection } from '#lib/bits/BranchedMenu.svelte';

export const CONTACT_EMAIL = 'info@mughram.com';

/** Operator legal details for the legal pages. Empty values are omitted. */
export const LEGAL = {
	/** The individual who runs sqwer. */
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

/** Product areas: learning, practice, competition. Finger map and history sit under practice. area colors the
 *  current link (lib/site/areas.ts). */
export const NAV_LINKS = [
	{ href: '/learn', label: 'Learning path', icon: 'route', area: 'learn', description: 'Lessons, games and course ranks' },
	{ href: '/exams', label: 'Practice', icon: 'gauge', area: 'practice', description: 'Tests, finger map and history, with XP' },
	{ href: '/competitive', label: 'Competitive', icon: 'trophy', area: 'competitive', description: 'Speed tiers and leaderboards' }
] as const satisfies readonly { href: string; label: string; icon: string; area: Area; description: string }[];

/** Account pages, listed once and shared by the account menu and the account section. */
export const ACCOUNT_LINKS = [
	{ href: '/account', label: 'Overview' },
	{ href: '/account/profile', label: 'Profile' },
	{ href: '/account/statistics', label: 'Statistics' },
	{ href: '/account/security', label: 'Security' },
	{ href: '/account/voice', label: 'Voice' },
	{ href: '/account/data', label: 'Your data' }
] as const;

/** Footer columns, each drawn as a branched menu: the product by area, help, then every legal document, the legal
 *  center first. Account pages live in the account menu. */
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
	},
	{
		label: 'Legal',
		links: [
			{ href: '/legal', label: 'Legal center', icon: 'scale' },
			{ href: '/terms', label: 'Terms', icon: 'document' },
			{ href: '/privacy', label: 'Privacy', icon: 'lock' },
			{ href: '/cookies', label: 'Cookies', icon: 'cookie' },
			{ href: '/copyright', label: 'Copyright', icon: 'copyright' },
			{ href: '/security', label: 'Security', icon: 'shield' }
		]
	}
] as const satisfies readonly BranchedMenuSection[];
