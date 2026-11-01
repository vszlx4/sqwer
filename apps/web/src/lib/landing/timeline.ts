import type { Action } from 'svelte/action';
import { motion, whenMotion } from '#lib/motion/gsap.ts';
import { DURATIONS } from '#lib/motion/tokens.ts';

// Trunk draw time, in seconds; branches follow the tip, so this sets the pace of the whole reveal.
const GROW = 2.4;
const NARROW = '(max-width: 900px)';

/**
 * Grows the rank timeline like a tree: the trunk draws from its root and each branch sprouts as the tip passes,
 * node first, then stem, then its label. Left as rendered if on screen at mount or under reduced motion.
 */
export const growTimeline: Action<HTMLElement> = (node) => {
	const mm = whenMotion(() => {
		if (node.getBoundingClientRect().top < window.innerHeight) return;
		const gsap = motion();
		const trunk = node.querySelector<HTMLElement>('.trunk')!;
		const stops = [...node.querySelectorAll<HTMLElement>('li')];
		const narrow = window.matchMedia(NARROW).matches;
		const tl = gsap.timeline({
			scrollTrigger: { trigger: node, start: 'top 78%', once: true },
			onComplete: () => gsap.set([trunk, ...node.querySelectorAll('.node, .stem, .label, .note')], { clearProps: 'all' })
		});

		tl.from(trunk, { [narrow ? 'scaleY' : 'scaleX']: 0, duration: GROW, ease: 'none' }, 0);
		for (const li of stops) {
			// Where the branch meets the trunk, as a share of the trunk.
			const at = narrow ? li.offsetTop / trunk.offsetHeight : li.offsetLeft / trunk.offsetWidth;
			const t = Math.min(1, at) * GROW;
			const away = narrow ? { x: -8 } : { y: li.classList.contains('below') ? -8 : 8 };
			tl.from(li.querySelector('.node'), { scale: 0, duration: DURATIONS.base, ease: 'out-pop' }, t)
				.from(li.querySelector('.stem'), { [narrow ? 'scaleX' : 'scaleY']: 0, duration: DURATIONS.slow, ease: 'out-soft' }, t + 0.08)
				.from(li.querySelector('.label'), { opacity: 0, ...away, duration: DURATIONS.reveal, ease: 'out-soft' }, t + 0.3);
		}
		tl.from(node.querySelector('.note'), { opacity: 0, duration: DURATIONS.reveal }, GROW);
	});
	return { destroy: () => mm.revert() };
};
