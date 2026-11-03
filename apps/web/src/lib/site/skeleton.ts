export type SkeletonKind = 'page' | 'profile' | 'exercise';

/** Skeleton shape shown for a route path while it loads (lib/site/PageSkeleton.svelte). */
export function skeletonKind(pathname: string): SkeletonKind {
	if (pathname.startsWith('/u/') || pathname.startsWith('/account')) return 'profile';
	if (pathname !== '/learn/start' && /^\/(learn\/[^/]+|test|play\/[^/]+|exams\/[^/]+|map\/session)\/?$/.test(pathname)) return 'exercise';
	return 'page';
}
