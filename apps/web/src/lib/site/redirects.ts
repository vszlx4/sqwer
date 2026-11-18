import { isPracticeTest } from '#lib/exams.ts';

/*
 * Permanent redirects. Every address names its place in the site: Practice pages live under /practice and the
 * competitive test under /competitive. Old links and bookmarks still arrive; parent paths without a page of
 * their own lead to the list they belong to.
 */

/** Old prefix → new prefix. The rest of the path and the query string are kept. */
const MOVED: readonly (readonly [from: string, to: string])[] = [
	['/exams', '/practice'],
	['/play', '/practice/play'],
	['/map', '/practice/finger-map'],
	['/history', '/practice/history'],
	['/about', '/how-it-works']
];

/** Paths without a page, and the list they belong to. */
const PARENTS: Readonly<Record<string, string>> = {
	'/practice/play': '/practice#games',
	'/practice/test': '/practice'
};

const within = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

/** Where an address lives now, or null when it has a page of its own. */
export function redirectFor(url: URL): string | null {
	const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
	if (path === '/test') return testAddress(url.searchParams);
	const moved = MOVED.find(([from]) => within(path, from));
	const next = moved ? `${moved[1]}${path.slice(moved[0].length)}` : path;
	if (Object.hasOwn(PARENTS, next)) return PARENTS[next]!;
	return moved ? `${next}${url.search}` : null;
}

/** /test?exam=<id> → that test's own address (the timed test when none or unknown); other parameters are kept. */
function testAddress(params: URLSearchParams): string {
	const query = new URLSearchParams(params);
	const exam = query.get('exam') ?? '';
	query.delete('exam');
	const path = exam === 'competitive' ? '/competitive/test' : `/practice/test/${isPracticeTest(exam) ? exam : 'timed'}`;
	const rest = query.toString();
	return rest ? `${path}?${rest}` : path;
}
