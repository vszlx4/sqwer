import { floatAway } from '#lib/bits/ScrollFloat.svelte';
import { motion } from '#lib/motion/gsap.ts';

/* Hero takeover: while the hero track scrolls under its sticky stage, the primary button grows into a dark portal
   that fills the screen. The label gives way to the journey line, which swells with the portal; the corners blur
   and darken first. Scrubbed, so it plays both ways. Call under whenMotion; the timeline dies with its context. */

export interface TakeoverParts {
	/** Tall section the stage sticks inside. */
	track: HTMLElement;
	/** The real primary button, hidden while the portal stands in for it. */
	button: HTMLElement;
	/** Full-bleed layer clipped to the button, then to the whole stage. */
	portal: HTMLElement;
	/** The button's label inside the portal. */
	label: HTMLElement;
	/** The journey line; its font size is driven here. */
	line: HTMLElement;
	/** Corner blur and vignette. */
	veil: HTMLElement;
	/** Hero copy that steps back as the portal grows. */
	fade: Element[];
	/** Pressure for the journey line, 0 to 1. */
	onPressure: (p: number) => void;
}

// Longest line of the journey text in characters, and the mono advance per em.
const LINE_CHARS = 12;
const ADVANCE = 0.6;

export function heroTakeover(p: TakeoverParts): void {
	const gsap = motion();
	const box = () => p.portal.getBoundingClientRect();
	const btn = () => p.button.getBoundingClientRect();
	const style = getComputedStyle(p.button);
	const radius = parseFloat(style.borderTopLeftRadius) || 0;

	// Button rect as an inset of the portal, so the portal starts exactly on the button.
	const inset = () => {
		const o = box();
		const b = btn();
		return `inset(${b.top - o.top}px ${o.right - b.right}px ${o.bottom - b.bottom}px ${b.left - o.left}px round ${radius}px)`;
	};
	// Offset from the stage centre to the button centre, for the text to travel from.
	const offset = () => {
		const o = box();
		const b = btn();
		return { x: b.left + b.width / 2 - (o.left + o.width / 2), y: b.top + b.height / 2 - (o.top + o.height / 2) };
	};
	// GSAP blends resolved colours, not custom properties.
	const token = (name: string) => getComputedStyle(p.portal).getPropertyValue(name).trim();
	const startSize = parseFloat(style.fontSize) || 17;
	const endSize = () => Math.min(box().width * 0.86, 1400) / (LINE_CHARS * ADVANCE);

	const pressure = { p: 0 };
	const tl = gsap.timeline({
		defaults: { ease: 'none' },
		scrollTrigger: { trigger: p.track, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
	});

	// The portal takes the button's place on the first pixel of scroll.
	tl.fromTo(p.portal, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.001 }, 0);
	tl.fromTo(p.button, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.001 }, 0);
	tl.fromTo(p.portal, { clipPath: inset }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.72, ease: 'in-quick' }, 0);
	tl.fromTo(
		p.portal,
		{ backgroundColor: style.backgroundColor, color: style.color },
		{ backgroundColor: token('--band-bg'), color: token('--band-ink'), duration: 0.5 },
		0
	);
	tl.fromTo(p.veil, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: 'out-soft' }, 0);
	tl.fromTo(p.fade, { opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(6px)', duration: 0.35, ease: 'out-soft' }, 0.02);

	// The label rides with the portal from the button to the centre, on the portal's own curve, and hands over once
	// the dark covers the middle of the screen.
	tl.fromTo(p.label, { x: () => offset().x, y: () => offset().y }, { x: 0, y: 0, duration: 0.72, ease: 'in-quick' }, 0);
	tl.fromTo(p.label, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.1 }, 0.36);
	// The line never moves: it appears in the centre, grows in place to the width of the screen and thickens from
	// light to heaviest.
	tl.fromTo(p.line, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, 0.42);
	tl.fromTo(p.line, { fontSize: () => startSize * 1.4 }, { fontSize: endSize, duration: 0.42, ease: 'out-soft' }, 0.42);
	tl.fromTo(pressure, { p: 0 }, { p: 1, duration: 0.42, onUpdate: () => p.onPressure(pressure.p) }, 0.44);

	// Then the letters float straight up out of each line from its middle outwards (Scroll Float, without the sideways
	// squeeze), blurring and fading, until only the dark is left for the next section.
	for (const row of p.line.querySelectorAll('.pressure')) {
		tl.to(
			row.querySelectorAll('.char'),
			{ ...floatAway(), scaleX: 1, transformOrigin: '50% 50%', stagger: { each: 0.006, from: 'center' }, duration: 0.08 },
			0.87
		);
	}
	tl.to({}, { duration: 0.04 }, 0.96);
}
