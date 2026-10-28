import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DURATIONS, EASES } from './tokens';

export const REDUCED = '(prefers-reduced-motion: reduce)';
export const MOTION_OK = '(prefers-reduced-motion: no-preference)';

let ready = false;

/** GSAP with plugins and named eases registered. Call on the client only. */
export function motion(): typeof gsap {
	if (ready) return gsap;
	gsap.registerPlugin(CustomEase, ScrollTrigger);
	for (const [name, curve] of Object.entries(EASES)) CustomEase.create(name, curve.join(','));
	gsap.defaults({ ease: 'out-soft', duration: DURATIONS.base });
	ready = true;
	return gsap;
}

/** Runs setup only while motion is allowed; reverted when the preference flips. Returns the context to revert. */
export function whenMotion(setup: () => void | (() => void)): gsap.MatchMedia {
	const mm = motion().matchMedia();
	mm.add(MOTION_OK, setup);
	return mm;
}

export { ScrollTrigger };
