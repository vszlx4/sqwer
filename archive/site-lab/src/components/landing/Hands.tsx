'use client';

import { useId } from 'react';

// Two hands seen from above as a hairline engraving, each finger washed in its colour, with an optional legend
// of values joined to the fingertips by leader lines. Geometry from apps/web's hand illustration.

import { FINGER_SHAPES, OUTLINES, SHADING_COLOURS, TIPS, VIEW } from '@/lib/hands/geometry';
import { FINGERS, kindOf, type Finger } from '@/lib/fingering';

export type LegendItem = { value: string; sub?: string; lit?: boolean };

const LABEL_X: Record<Finger, number> = { lp: 30, lr: 52, lm: 74, li: 96, lt: 118, rt: 182, ri: 204, rm: 226, rr: 248, rp: 270 };

type HandsProps = {
	/** Accessible description; empty hides the figure from assistive technology. */
	label: string;
	/** Colour strength per finger, 0 to 1; fingers left out are uncoloured. All full by default. */
	tone?: Partial<Record<Finger, number>>;
	legend?: Partial<Record<Finger, LegendItem>>;
	legendSize?: number;
	className?: string;
};

export function Hands({ label, tone, legend, legendSize = 11, className = '' }: HandsProps) {
	const uid = useId().replace(/:/g, '');
	const hasSub = legend && Object.values(legend).some((l) => l?.sub);
	const legendY = -8 - (hasSub ? legendSize * 1.3 : 0);
	const top = legend ? legendY - legendSize * 1.6 : -2;
	const strength = (f: Finger) => Math.max(0, Math.min(1, tone ? (tone[f] ?? 0) : 1));

	return (
		<svg
			viewBox={`0 ${top} ${VIEW.width} ${VIEW.height - top + 2}`}
			role={label ? 'img' : undefined}
			aria-label={label || undefined}
			aria-hidden={label ? undefined : true}
			className={`block h-auto w-full overflow-visible ${className}`}
		>
			<defs>
				{/* Each wash is strongest at the fingertip and fades out towards the palm, following the finger. */}
				{FINGERS.map((f) => (
					<linearGradient key={f} id={`${uid}-${f}`} gradientUnits="userSpaceOnUse" x1={TIPS[f].x} y1={TIPS[f].y} x2={TIPS[f].x} y2={kindOf(f) === 'thumb' ? 150 : 124}>
						<stop offset="0" stopColor={SHADING_COLOURS[kindOf(f)]} stopOpacity="1" />
						<stop offset="0.6" stopColor={SHADING_COLOURS[kindOf(f)]} stopOpacity="0.7" />
						<stop offset="1" stopColor={SHADING_COLOURS[kindOf(f)]} stopOpacity="0" />
					</linearGradient>
				))}
			</defs>
			{FINGERS.map((f) => (
				<path key={f} d={FINGER_SHAPES[f]} fill={`url(#${uid}-${f})`} fillOpacity={0.12 + strength(f) * 0.26} className="transition-[fill-opacity] duration-200" />
			))}
			{/* Engraved: the outline band drawn as two hairlines at the staff's weight. */}
			<path d={OUTLINES.left} fill="none" className="stroke-ink" strokeWidth={0.55} strokeLinejoin="round" />
			<path d={OUTLINES.right} fill="none" className="stroke-ink" strokeWidth={0.55} strokeLinejoin="round" />
			{legend && (
				<g aria-hidden="true">
					{FINGERS.map((f) => {
						const item = legend[f];
						if (!item) return null;
						const t = TIPS[f];
						const lx = LABEL_X[f];
						return (
							<g key={f}>
								<line x1={lx} y1={legendY + (hasSub ? legendSize * 1.3 : 0) + 4} x2={t.x} y2={t.y - (kindOf(f) === 'thumb' ? 4 : 6)} className="stroke-line-strong" strokeWidth={0.6} />
								<text
									x={lx}
									y={legendY}
									fontSize={legendSize}
									textAnchor="middle"
									className="font-serif transition-transform duration-200 [transform-box:fill-box] [transform-origin:center_bottom]"
									style={{ fill: item.lit ? 'var(--ink)' : SHADING_COLOURS[kindOf(f)], fontWeight: 800, transform: item.lit ? 'translateY(-3px) scale(1.25)' : undefined }}
								>
									{item.value}
								</text>
								{item.sub && (
									<text x={lx} y={legendY + legendSize * 1.3} fontSize={legendSize * 0.78} textAnchor="middle" className="fill-ink-2 font-mono">
										{item.sub}
									</text>
								)}
							</g>
						);
					})}
				</g>
			)}
		</svg>
	);
}
