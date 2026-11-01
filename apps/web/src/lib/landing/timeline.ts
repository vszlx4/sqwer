import type { Action } from 'svelte/action';
import { motion, ScrollTrigger, whenMotion } from '#lib/motion/gsap.ts';
import { DURATIONS } from '#lib/motion/tokens.ts';

// Trunk draw time, in seconds; every fork and mark is timed to the trunk's tip, so this paces the whole graph.
const GROW = 2.6;
const START = 0.3;

const $ = <T extends Element>(root: ParentNode, sel: string) => [...root.querySelectorAll<T>(sel)];
const at = (el: Element) => START + Number((el as HTMLElement).dataset.at ?? 0) * GROW;

/** Draws a stroked path from its start. The gap outruns the path, so no sliver shows before it begins. */
function draw(tl: gsap.core.Timeline, path: SVGPathElement, duration: number, ease: string, time: number) {
	const len = path.getTotalLength();
	tl.fromTo(path, { strokeDasharray: `${len} ${len + 4}`, strokeDashoffset: len + 2 }, { strokeDashoffset: 0, duration, ease }, time);
}

function build(svg: SVGSVGElement): gsap.core.Timeline {
	const gsap = motion();
	const tl = gsap.timeline({ paused: true });

	draw(tl, svg.querySelector('.trunk')!, GROW, 'none', START);
	for (const dot of $(svg, '.dot')) tl.from(dot, { scale: 0, transformOrigin: '50% 50%', duration: DURATIONS.base, ease: 'out-pop' }, at(dot));

	// Each rank as the tip reaches it: the junction, the fork drawn out, the badge, then its figures.
	for (const node of $(svg, '.node')) {
		let t = at(node);
		const fork = node.querySelector<SVGPathElement>('.fork');
		const junction = node.querySelector('.junction');
		if (junction) tl.from(junction, { scale: 0, transformOrigin: '50% 50%', duration: DURATIONS.base, ease: 'out-pop' }, t);
		if (fork) {
			draw(tl, fork, 0.6, 'out-soft', t + 0.05);
			t += 0.5;
		}
		tl.from(node.querySelector('.badge'), { scale: 0.4, opacity: 0, transformOrigin: '50% 50%', duration: DURATIONS.reveal, ease: 'spring-soft' }, t).from(
			node.querySelector('.text'),
			{ opacity: 0, x: -10, duration: DURATIONS.reveal, ease: 'out-soft' },
			t + 0.1
		);
	}
	return tl;
}

/**
 * Draws the rank graph once: played on entry when wide, scrubbed forward by scroll when tall and narrow.
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
					// Forward only: scrolling back never undraws it.
					onUpdate: (self) => {
						if (self.progress > tl.progress()) gsap.to(tl, { progress: self.progress, duration: 0.6, ease: 'out-soft', overwrite: true });
					}
				})
			: ScrollTrigger.create({ trigger: svg, start: 'top 72%', once: true, onEnter: () => tl.play() });
		return () => {
			st.kill();
			tl.progress(1).kill();
			// Only what the timeline wrote; inline tier colors stay.
			gsap.set($(svg, '.trunk, .fork, .dot, .junction, .badge, .text'), { clearProps: 'transform,opacity,strokeDasharray,strokeDashoffset' });
		};
	});
	return { destroy: () => mm.revert() };
};
