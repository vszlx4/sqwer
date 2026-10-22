'use client';

import { Staff } from './Staff';
import { useLit } from './lit';
import { fingerFor } from '@/lib/fingering';

/** The typeable staff; the finger it just played lights up on the hands panel. */
export function HeroStaff({ className = '' }: { className?: string }) {
	const { setLit } = useLit();
	return (
		<Staff
			className={className}
			onProgress={(i) => {
				const ch = 'asdfjkl;'[i];
				setLit(ch ? fingerFor(ch) : null);
			}}
		/>
	);
}
