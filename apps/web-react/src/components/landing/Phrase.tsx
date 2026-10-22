// A short phrase set on a five-line staff, each character with its finger number above it in the finger's
// colour; the grammar of the hero staff at a smaller size. Spaces separate groups; characters off the layout
// (or Shift) show without a number.

import { fingerColour, fingerFor, fingerNumber } from '@/lib/fingering';

type PhraseProps = {
	/** Glyph groups, for example ['f', 'j'] or ['the', 'be', 'to']. */
	groups: string[];
	size?: 'sm' | 'lg';
	/** Accessible reading of the phrase; decorative when omitted. */
	label?: string;
	className?: string;
};

export function Phrase({ groups, size = 'sm', label, className = '' }: PhraseProps) {
	const big = size === 'lg';
	return (
		<div role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`relative ${className}`}>
			<div className={`pointer-events-none absolute inset-x-0 flex flex-col justify-between ${big ? 'top-[34px] h-[88px]' : 'top-[22px] h-[46px]'}`}>
				{[0, 1, 2, 3, 4].map((i) => (
					<span key={i} className="h-px bg-line-strong" />
				))}
			</div>
			<div className={`relative flex flex-wrap items-end ${big ? 'gap-x-10 gap-y-6' : 'gap-x-4 gap-y-3'}`}>
				{groups.map((g, gi) => (
					<span key={gi} className={`flex ${big ? 'gap-5' : 'gap-[7px]'}`}>
						{[...g].map((ch, ci) => {
							const f = fingerFor(ch);
							return (
								<span key={ci} className="flex flex-col items-center">
									<span className={`font-serif leading-none font-extrabold ${big ? 'text-[26px]' : 'text-[12px]'}`} style={{ color: f ? fingerColour(f) : 'transparent' }}>
										{f ? fingerNumber(f) : '·'}
									</span>
									<span className={`font-mono leading-none ${big ? 'mt-3 text-[64px]' : 'mt-[7px] text-[26px]'}`}>{ch}</span>
								</span>
							);
						})}
					</span>
				))}
			</div>
		</div>
	);
}
