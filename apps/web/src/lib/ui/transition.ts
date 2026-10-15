import { flushSync } from 'svelte';

/**
 * Applies a change that replaces what is on screen (an examination becoming its results, a lesson
 * step becoming its outcome) inside a view transition, so it dissolves and sharpens like a page
 * change instead of snapping. Falls back to an immediate change where unsupported or when the
 * person prefers reduced motion.
 */
export function swap(update: () => void): void {
	if (
		typeof document === 'undefined' ||
		!document.startViewTransition ||
		matchMedia('(prefers-reduced-motion: reduce)').matches
	) {
		update();
		return;
	}
	document.startViewTransition(() => flushSync(update));
}
