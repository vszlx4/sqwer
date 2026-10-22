'use client';

import { useRef } from 'react';
import { gsap, MEDIA, useGSAP } from '@/lib/motion';

// Headings fill with ink from the baseline up as they scroll into view: a faint ghost of the words is always there,
// and a clipped copy rises over it. Fully inked without JavaScript and under reduced motion.

export function RisingInk({ children, className = '' }: { children: string; className?: string }) {
	const root = useRef<HTMLSpanElement>(null);
	const ink = useRef<HTMLSpanElement>(null);
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(MEDIA.motion, () => {
				gsap.fromTo(ink.current, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 92%', end: 'top 55%', scrub: 0.8 } });
			});
			return () => mm.revert();
		},
		{ scope: root }
	);
	return (
		<span ref={root} className={`rising ${className}`}>
			<span aria-hidden="true" className="rising-ghost">{children}</span>
			<span ref={ink} className="rising-ink">{children}</span>
		</span>
	);
}
