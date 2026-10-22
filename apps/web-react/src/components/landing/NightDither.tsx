'use client';

import { useEffect, useState } from 'react';
import Dither from '@/components/reactbits/Dither';

/** The dithered wave field behind the dark bands: ultramarine on night navy, still under reduced motion. */
export function NightDither({ className = '' }: { className?: string }) {
	const [still, setStill] = useState(false);
	useEffect(() => {
		const q = matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => setStill(q.matches);
		sync();
		q.addEventListener('change', sync);
		return () => q.removeEventListener('change', sync);
	}, []);
	return (
		<div aria-hidden="true" className={`night-dither ${className}`}>
			<Dither waveColor="#4a63ff" backgroundColor="#05060d" colorNum={4} pixelSize={3} waveSpeed={0.04} waveAmplitude={0.3} waveFrequency={3} enableMouseInteraction={!still} disableAnimation={still} />
		</div>
	);
}
