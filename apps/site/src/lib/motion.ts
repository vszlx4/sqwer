'use client';

import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

// One place that registers GSAP plugins and sqwer's easing vocabulary (MOTION.md, section 1),
// so components write ease: 'out-expo' instead of repeating curves.
gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, useGSAP);

export const EASES = {
	'out-expo': '0.16,1,0.3,1',
	'out-soft': '0.2,0.7,0.2,1',
	'out-pop': '0.2,0.8,0.2,1',
	spring: '0.3,1.6,0.5,1',
	'spring-soft': '0.34,1.56,0.64,1',
	'in-quick': '0.4,0,1,1'
} as const;

for (const [name, curve] of Object.entries(EASES)) CustomEase.create(name, curve);

/** Standard durations in seconds (MOTION.md, section 1). */
export const DURATION = { instant: 0.07, fast: 0.13, base: 0.22, slow: 0.4, reveal: 0.7 } as const;

/**
 * Media conditions for gsap.matchMedia(). Put every animation under `motion`, so reduced motion
 * removes it in one place and GSAP reverts it when the condition stops matching.
 */
export const MEDIA = {
	motion: '(prefers-reduced-motion: no-preference)',
	reduced: '(prefers-reduced-motion: reduce)'
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
