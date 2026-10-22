'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ReactLenis, useLenis, type LenisRef } from 'lenis/react';
import { gsap, ScrollTrigger } from '@/lib/motion';

/**
 * Smooth scrolling for the whole page (Lenis on the window, so position: sticky keeps working).
 * - GSAP's ticker drives Lenis, and every Lenis scroll updates ScrollTrigger, so they never drift.
 * - Off under reduced motion; touch devices keep native scrolling.
 * - Anchor links glide to their target and honour scroll-margin-top (the sticky header offset).
 * - Inner scroll areas (menus, dialogs, tables) opt out with the data-lenis-prevent attribute.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
	const lenisRef = useRef<LenisRef>(null);

	useEffect(() => {
		// The Lenis instance is created after this effect runs, so it is read on every frame.
		const update = (time: number) => lenisRef.current?.lenis?.raf(time * 1000);
		gsap.ticker.add(update);
		gsap.ticker.lagSmoothing(0);
		return () => gsap.ticker.remove(update);
	}, []);

	return (
		<ReactLenis
			root
			ref={lenisRef}
			options={{
				autoRaf: false,
				lerp: 0.1,
				anchors: true,
				respectReducedMotion: true,
				stopInertiaOnNavigate: true,
				syncTouch: false
			}}
		>
			<ScrollTriggerSync />
			{children}
		</ReactLenis>
	);
}

/** Keeps ScrollTrigger in step with Lenis; must sit inside ReactLenis. */
function ScrollTriggerSync() {
	useLenis(ScrollTrigger.update);
	return null;
}
