import type { Action } from 'svelte/action';
import { motion, ScrollTrigger, whenMotion } from '#lib/motion/gsap.ts';
import { DURATIONS, STAGGER } from '#lib/motion/tokens.ts';

// Trunk draw time, in seconds; every branch, sprig and hour mark is timed to the tip, so this paces the whole tree.
const GROW = 3;

const $ = <T extends Element>(root: ParentNode, sel: string) => [...root.querySelectorAll<T>(sel)];
const at = (el: Element) => Number((el as HTMLElement).dataset.at ?? 0) * GROW;

/** Draws a masked shape along its centerline, from base to tip. */
function draw(tl: gsap.core.Timeline, path: SVGPathElement, duration: number, ease: string, time: number) {
	// A gap longer than the path, so no sliver of dash shows at either end before it starts.
	const len = path.getTotalLength();
	tl.fromTo(path, { strokeDasharray: `${len} ${len + 4}`, strokeDashoffset: len + 2 }, { strokeDashoffset: 0, duration, ease }, time);
}

/** Shoots and leaves sprout from their base; twigs carry their base in data-base. */
function sprout(tl: gsap.core.Timeline, root: Element, time: number) {
	for (const [k, twig] of $<SVGPathElement>(root, ':scope > .twig').entries())
		tl.from(twig, { scale: 0, svgOrigin: twig.dataset.base, duration: DURATIONS.slow, ease: 'out-soft' }, time + k * STAGGER.base);
	tl.from($(root, '.leaf'), { scale: 0, rotation: -24, transformOrigin: '0% 50%', duration: DURATIONS.reveal, ease: 'spring-soft', stagger: STAGGER.tight }, time + 0.15);
}

function build(svg: SVGSVGElement): gsap.core.Timeline {
	const gsap = motion();
	const tl = gsap.timeline({ paused: true });

	// Roots first, then the trunk climbs; hour marks appear as the tip passes them.
	sprout(tl, svg.querySelector('.wood')!, 0);
	draw(tl, svg.querySelector('mask[id$="-trunk"] .grow')!, GROW, 'none', 0.2);
	for (const tick of $(svg, '.tick')) tl.from(tick, { opacity: 0, duration: DURATIONS.slow }, 0.2 + at(tick));
	for (const sprig of $(svg, '.sprig')) sprout(tl, sprig, 0.2 + at(sprig));

	// Each branch grows out where the tip meets it, then twigs, leaves, the bud and its rank.
	for (const [i, branch] of $(svg, '.branch').entries()) {
		const t = 0.2 + at(branch);
		draw(tl, svg.querySelector(`mask[id$="-b${i}"] .grow`)!, 0.9, 'out-soft', t);
		sprout(tl, branch, t + 0.4);
		tl.from(branch.querySelector('.bud'), { scale: 0, transformOrigin: '50% 50%', duration: DURATIONS.slow, ease: 'out-pop' }, t + 0.7)
			.from(branch.querySelector('.label'), { opacity: 0, y: 8, duration: DURATIONS.reveal, ease: 'out-soft' }, t + 0.75);
	}
	return tl;
}

/**
 * Grows the rank tree once: played on entry for the wide tree, scrubbed forward by scroll for the tall narrow one.
 * Left as drawn if on screen at mount (also after a breakpoint swap) or under reduced motion.
 */
export const growTree: Action<SVGSVGElement> = (svg) => {
	const mm = whenMotion(() => {
		if (svg.getBoundingClientRect().top < window.innerHeight) return;
		const gsap = motion();
		const tl = build(svg);
		const tall = svg.viewBox.baseVal.height > svg.viewBox.baseVal.width;
		const st = tall
			? ScrollTrigger.create({
					trigger: svg,
					start: 'top 75%',
					end: 'bottom 85%',
					// Forward only: scrolling back never ungrows it.
					onUpdate: (self) => {
						if (self.progress > tl.progress()) gsap.to(tl, { progress: self.progress, duration: 0.6, ease: 'out-soft', overwrite: true });
					}
				})
			: ScrollTrigger.create({ trigger: svg, start: 'top 72%', once: true, onEnter: () => tl.play() });
		return () => {
			st.kill();
			tl.progress(1).kill();
			gsap.set($(svg, '[style]'), { clearProps: 'all' });
		};
	});
	return { destroy: () => mm.revert() };
};
