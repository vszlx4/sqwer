import type { Action } from 'svelte/action';
import { motion, whenMotion } from '#lib/motion/gsap.ts';
import type { Loop } from './scenes.ts';

export interface LoopOptions extends Loop {
	/** Receives loop time on every frame. */
	set: (t: number) => void;
}

/**
 * Runs a preview's loop clock on the GSAP ticker while the node is on screen and motion is allowed. Starts from the
 * still frame, so the first animated frame matches the rendered one; reduced motion goes back to it.
 */
export const loop: Action<HTMLElement, LoopOptions> = (node, options) => {
	let o = options;
	let time = o.still;
	let onScreen = false;
	let allowed = false;
	let running = false;
	const gsap = motion();
	const tick = (_: number, dt: number) => {
		// Capped so a long frame or a returning tab never skips ahead.
		time = (time + Math.min(dt, 50) / 1000) % o.period;
		o.set(time);
	};
	const sync = () => {
		const go = onScreen && allowed;
		if (go === running) return;
		running = go;
		if (go) gsap.ticker.add(tick);
		else gsap.ticker.remove(tick);
	};
	const io = new IntersectionObserver(([entry]) => {
		onScreen = !!entry?.isIntersecting;
		sync();
	});
	io.observe(node);
	const mm = whenMotion(() => {
		allowed = true;
		sync();
		return () => {
			allowed = false;
			sync();
			time = o.still;
			o.set(time);
		};
	});
	return {
		update(next) {
			o = next;
		},
		destroy() {
			io.disconnect();
			mm.revert();
			gsap.ticker.remove(tick);
		}
	};
};
