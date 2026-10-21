// Every destination the new pages link to, in one place.
// The new site is not wired to the app yet: entries marked `wired: false` are placeholders to connect
// when the pages are rebuilt (their targets are the current routes, see UI_MAP.md section 1).

export type Destination = { href: string; label: string; wired: boolean };

const todo = (href: string, label: string): Destination => ({ href, label, wired: false });

export const LINKS = {
	home: { href: '/', label: 'Home', wired: true },
	foundations: { href: '/foundations', label: 'Foundations', wired: true },
	getStarted: todo('/start', 'Get started'),
	typingTest: todo('/test', 'Take a typing test'),
	learn: todo('/learn', 'Learning path'),
	practice: todo('/exams', 'Practice'),
	competitive: todo('/competitive', 'Competitive'),
	fingerMap: todo('/map', 'Finger map'),
	signIn: todo('/signin', 'Sign in'),
	signUp: todo('/signup', 'Create account')
} satisfies Record<string, Destination>;

export const NAV = [LINKS.learn, LINKS.practice, LINKS.competitive];
