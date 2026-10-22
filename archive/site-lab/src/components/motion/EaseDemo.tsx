'use client';

import { useRef } from 'react';
import { EASES, gsap, useGSAP } from '@/lib/motion';
import { Button } from '@/components/ui/Button';

/** Plays each registered ease side by side, so curves can be compared and tuned. */
export function EaseDemo() {
	const ref = useRef<HTMLDivElement>(null);

	// Kill any running demo tweens when the page is left.
	useGSAP(() => () => gsap.killTweensOf('[data-ease]'), { scope: ref });

	const play = () => {
		for (const dot of ref.current?.querySelectorAll<HTMLElement>('[data-ease]') ?? []) {
			const track = dot.parentElement?.clientWidth ?? 0;
			gsap.fromTo(dot, { x: 0 }, { x: track - 32, duration: 0.9, ease: dot.dataset.ease, overwrite: true });
		}
	};

	return (
		<div ref={ref} className="flex flex-col gap-3">
			{Object.entries(EASES).map(([name, curve]) => (
				<div key={name} className="grid grid-cols-[110px_1fr] items-center gap-4 max-sm:grid-cols-1 max-sm:gap-1">
					<div>
						<div className="text-[14px] font-semibold">{name}</div>
						<div className="font-mono text-[12px] text-ink-2">{curve}</div>
					</div>
					<div data-track className="relative h-8 rounded bg-surface">
						<span data-ease={name} className="absolute top-1 left-0 size-6 rounded bg-accent" />
					</div>
				</div>
			))}
			<div>
				<Button onClick={play}>Play the eases</Button>
			</div>
		</div>
	);
}
