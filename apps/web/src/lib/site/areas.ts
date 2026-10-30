// Each part of the site owns one color; pages outside an area stay neutral (ink). No main color.
export const AREAS = {
	learn: { label: 'Learning path', color: '#ccf900' },
	practice: { label: 'Practice', color: '#3debd8' },
	competitive: { label: 'Competitive', color: '#ff6b1f' },
	map: { label: 'Finger map', color: '#a08cff' },
	games: { label: 'Games', color: '#ffc72c' }
} as const;

export type Area = keyof typeof AREAS;

const ROUTES: [prefix: string, area: Area][] = [
	['/learn', 'learn'],
	['/start', 'learn'],
	['/journey', 'learn'],
	['/exams', 'learn'],
	['/test', 'practice'],
	['/history', 'practice'],
	['/competitive', 'competitive'],
	['/map', 'map'],
	['/play', 'games']
];

/** Area of a path, or null for neutral pages (home, account, legal). */
export function areaFor(pathname: string): Area | null {
	for (const [prefix, area] of ROUTES) if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return area;
	return null;
}

/** Hero dither colors as 0-1 RGB, in area order. */
export function areaRgb(): [number, number, number][] {
	return Object.values(AREAS).map(({ color }) => {
		const n = parseInt(color.slice(1), 16);
		return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
	});
}
