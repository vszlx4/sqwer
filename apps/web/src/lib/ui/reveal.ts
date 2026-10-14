import type { Action } from 'svelte/action';

interface RevealOptions {
	/** Delay before the element appears, in milliseconds, for staggered groups. */
	delay?: number;
}

let observer: IntersectionObserver | null = null;
const delays = new WeakMap<Element, number>();

function shared(): IntersectionObserver {
	observer ??= new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				const el = entry.target as HTMLElement;
				el.style.setProperty('--reveal-delay', `${delays.get(el) ?? 0}ms`);
				el.dataset.reveal = 'shown';
				observer!.unobserve(el);
			}
		},
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
	);
	return observer;
}

/**
 * Fades and lifts an element into view the first time it is scrolled into the viewport.
 * Content is never hidden without JavaScript or when the person prefers reduced motion.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
	// Content already on screen when the page opens stays as rendered, so nothing flashes.
	if (node.getBoundingClientRect().top < window.innerHeight) return;
	node.dataset.reveal = 'hidden';
	delays.set(node, options?.delay ?? 0);
	shared().observe(node);
	return {
		destroy() {
			observer?.unobserve(node);
		}
	};
};
