import type { Action } from 'svelte/action';
import { motion, whenMotion } from './gsap';
import { DURATIONS, STAGGER, type EaseName } from './tokens';

// Start line for scroll entrances, 8% above the fold.
const START = 'top 92%';

function onScreen(node: Element): boolean {
	return node.getBoundingClientRect().top < window.innerHeight;
}

/** Runs build under the motion guard; rebuilt on update, reverted on destroy. */
function scoped<T>(node: HTMLElement, options: T, build: (node: HTMLElement, options: T) => void) {
	let mm = whenMotion(() => build(node, options));
	return {
		update(next: T) {
			mm.revert();
			mm = whenMotion(() => build(node, next));
		},
		destroy() {
			mm.revert();
		}
	};
}

export interface RevealOptions {
	/** Delay in seconds, for hand-staggered groups. */
	delay?: number;
	/** Rise distance in px. */
	y?: number;
	ease?: EaseName;
}

/** Fades and lifts the node on first scroll into view. Left as rendered if on screen at mount. */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) =>
	scoped(node, options, (el, o) => {
		if (onScreen(el)) return;
		motion().from(el, {
			opacity: 0,
			y: o?.y ?? 18,
			duration: DURATIONS.reveal,
			ease: o?.ease ?? 'out-soft',
			delay: o?.delay ?? 0,
			scrollTrigger: { trigger: el, start: START, once: true }
		});
	});

export interface StaggerOptions {
	/** Children to animate; direct children by default. */
	selector?: string;
	/** Seconds between children. */
	each?: number;
	y?: number;
	/** Start on mount instead of on scroll. */
	immediate?: boolean;
}

/** Rises the node's children in sequence. */
export const stagger: Action<HTMLElement, StaggerOptions | undefined> = (node, options) =>
	scoped(node, options, (el, o) => {
		const targets = o?.selector ? el.querySelectorAll(o.selector) : el.children;
		if (!targets.length || (!o?.immediate && onScreen(el))) return;
		motion().from(targets, {
			opacity: 0,
			y: o?.y ?? 14,
			duration: DURATIONS.slow,
			ease: 'out-expo',
			stagger: o?.each ?? STAGGER.base,
			scrollTrigger: o?.immediate ? undefined : { trigger: el, start: START, once: true }
		});
	});

export interface EnterOptions {
	/** Place in the view's entrance order; each step waits one stagger. */
	i?: number;
}

// Server-rendered views are already on screen when scripts arrive; entrances start once the app has mounted.
let mounted = false;

/** Marks the app as mounted; called once by the root layout. */
export function appMounted() {
	mounted = true;
}

/** Rises the node in on mount (the `.rise` pattern), for views that swap in on the client. */
export const enter: Action<HTMLElement, EnterOptions | undefined> = (node, options) =>
	scoped(node, options, (el, o) => {
		if (!mounted) return;
		motion().from(el, {
			opacity: 0,
			y: 14,
			duration: DURATIONS.slow,
			ease: 'out-expo',
			delay: 0.06 + (o?.i ?? 0) * STAGGER.base,
			clearProps: 'opacity,transform'
		});
	});

export interface ParallaxOptions {
	/** Total travel in px across the scroll range; negative moves up. */
	distance?: number;
}

/** Moves the node with scroll while it crosses the viewport. Decorative layers only. */
export const parallax: Action<HTMLElement, ParallaxOptions | undefined> = (node, options) =>
	scoped(node, options, (el, o) => {
		const distance = o?.distance ?? -60;
		motion().fromTo(
			el,
			{ y: -distance / 2 },
			{
				y: distance / 2,
				ease: 'none',
				scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
			}
		);
	});
