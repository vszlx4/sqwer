import { flushSync } from 'svelte';

/** Runs an in-place swap inside a view transition. Immediate when unsupported or with reduced motion. */
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
