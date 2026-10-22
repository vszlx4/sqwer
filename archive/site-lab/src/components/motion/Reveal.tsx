'use client';

import { useRef, type ReactNode } from 'react';
import { gsap, MEDIA, useGSAP } from '@/lib/motion';

type RevealProps = {
	children: ReactNode;
	/** Seconds before this element starts, for staggering siblings. */
	delay?: number;
	/** Animate direct children one after another instead of the wrapper as a whole. */
	stagger?: number;
	className?: string;
};

/**
 * Rises into view once when scrolled to (MOTION.md 2.2: 18px, 700ms, out-soft).
 * Nothing is hidden under reduced motion or before JavaScript runs.
 */
export function Reveal({ children, delay = 0, stagger, className }: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);

	useGSAP(
		() => {
			const el = ref.current;
			if (!el) return;
			const mm = gsap.matchMedia();
			mm.add(MEDIA.motion, () => {
				const targets = stagger ? Array.from(el.children) : el;
				gsap.from(targets, {
					autoAlpha: 0,
					y: 18,
					duration: 0.7,
					ease: 'out-soft',
					delay,
					stagger,
					scrollTrigger: { trigger: el, start: 'top 92%', once: true }
				});
			});
			return () => mm.revert();
		},
		{ scope: ref }
	);

	return (
		<div ref={ref} className={className}>
			{children}
		</div>
	);
}
