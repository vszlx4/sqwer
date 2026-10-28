import { motion, whenMotion } from './gsap';

// Wheel input eases the native window scroll on the GSAP ticker. Native scroll stays the source of truth, so
// position: sticky, window.scrollY, scrollIntoView and ScrollTrigger work unchanged (ScrollSmoother's transformed
// content would break the sticky header and sidebars).

/** Share of the remaining distance covered per 60 fps frame. */
export const LERP = 0.12;
const LINE = 16;

/** Wheel delta in px, from any deltaMode. */
export function wheelPixels(e: Pick<WheelEvent, 'deltaY' | 'deltaMode'>, page: number): number {
	if (e.deltaMode === 1) return e.deltaY * LINE;
	if (e.deltaMode === 2) return e.deltaY * page;
	return e.deltaY;
}

/** Frame-rate independent step towards target; snaps when under half a pixel. */
export function step(current: number, target: number, ratio: number): number {
	const next = current + (target - current) * (1 - (1 - LERP) ** ratio);
	return Math.abs(target - next) < 0.5 ? target : next;
}

/** True when the wheel belongs to a nested scroller, an opted-out region or an open modal. */
function native(e: WheelEvent): boolean {
	if (e.defaultPrevented || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return true;
	if (document.querySelector('dialog:modal')) return true;
	for (let el = e.target as Element | null; el && el !== document.body; el = el.parentElement) {
		if (el.hasAttribute('data-native-scroll')) return true;
		if (el.scrollHeight <= el.clientHeight) continue;
		const { overflowY } = getComputedStyle(el);
		if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
		if (e.deltaY < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
	}
	return false;
}

let stopActive: (() => void) | undefined;

/** Drops any wheel glide in progress, e.g. before the router sets the scroll position. */
export function stopSmoothScroll(): void {
	stopActive?.();
}

/** Smooth wheel scrolling for the window while motion is allowed. Returns the teardown. */
export function smoothScroll(): () => void {
	const mm = whenMotion(() => {
		if (!matchMedia('(pointer: fine)').matches) return;
		const gsap = motion();
		const html = document.documentElement;
		let current = 0;
		let target = 0;
		let running = false;

		const stop = () => {
			if (!running) return;
			running = false;
			gsap.ticker.remove(tick);
		};
		const tick = () => {
			current = step(current, target, gsap.ticker.deltaRatio(60));
			window.scrollTo(0, current);
			if (current === target) stop();
		};
		const onWheel = (e: WheelEvent) => {
			if (native(e)) return;
			e.preventDefault();
			if (!running) current = target = window.scrollY;
			const max = html.scrollHeight - window.innerHeight;
			target = gsap.utils.clamp(0, max, target + wheelPixels(e, window.innerHeight));
			if (!running && target !== current) {
				running = true;
				gsap.ticker.add(tick);
			}
		};

		// Keyboard, scrollbar and touch input take over from a glide.
		const opts = { passive: true } as const;
		window.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('keydown', stop, opts);
		window.addEventListener('pointerdown', stop, opts);
		stopActive = stop;
		return () => {
			stop();
			window.removeEventListener('wheel', onWheel);
			window.removeEventListener('keydown', stop);
			window.removeEventListener('pointerdown', stop);
			stopActive = undefined;
		};
	});
	return () => mm.revert();
}
