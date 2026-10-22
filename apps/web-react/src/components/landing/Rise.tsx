'use client';

import { gsap, MEDIA, ScrollTrigger, useGSAP } from '@/lib/motion';

/** Headings and figures ease up once as they come into view. Nothing else on the page scroll-animates. */
export function Rise() {
	useGSAP(() => {
		const mm = gsap.matchMedia();
		mm.add(MEDIA.motion, () => {
			ScrollTrigger.batch('[data-rise]', {
				start: 'top 90%',
				once: true,
				onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'out-expo', stagger: 0.08, overwrite: true })
			});
			// Content already on screen at load is left as it is.
			gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.top < innerHeight * 0.9) gsap.set(el, { opacity: 1, y: 0 });
			});
		});
		return () => mm.revert();
	});
	return null;
}
