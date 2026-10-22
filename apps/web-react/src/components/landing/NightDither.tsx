'use client';

import { useEffect, useRef, useState } from 'react';
import Dither from '@/components/reactbits/Dither';

/** The dithered wave field behind the dark bands: ultramarine on night navy, still under reduced motion. */
export function NightDither({ className = '', lazy = false }: { className?: string; lazy?: boolean }) {
	const [still, setStill] = useState(false);
	const [near, setNear] = useState(!lazy);
	const box = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const q = matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => setStill(q.matches);
		sync();
		q.addEventListener('change', sync);
		return () => q.removeEventListener('change', sync);
	}, []);
	// A dither further down the page only starts when it is close to the viewport.
	useEffect(() => {
		if (near || !box.current) return;
		const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '800px 0px' });
		io.observe(box.current);
		return () => io.disconnect();
	}, [near]);
	return (
		<div ref={box} aria-hidden="true" className={`night-dither ${className}`}>
			{near && <Dither waveColor="#4a63ff" backgroundColor="#05060d" colorNum={4} pixelSize={3} waveSpeed={0.04} waveAmplitude={0.3} waveFrequency={3} enableMouseInteraction={!still} disableAnimation={still} />}
		</div>
	);
}
