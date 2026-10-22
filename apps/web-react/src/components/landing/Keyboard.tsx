// A keyboard drawn from @sqwer/layouts (ANSI, Mac), each key tinted by its finger and marked with the finger's
// number. Static and decorative unless a label is given.

import { LAYOUT, fingerColour, fingerNumber } from '@/lib/fingering';

const U = 40;
/** Short legends so wide modifier names never run into each other. */
const SHORT: Record<string, string> = { control: 'ctrl', option: 'opt', command: 'cmd', 'Caps Lock': 'caps', Backspace: 'delete', Enter: 'return' };
const GAP = 4;

export function Keyboard({ label, highlight = [], className = '' }: { label?: string; highlight?: string[]; className?: string }) {
	const w = LAYOUT.width * U;
	const h = LAYOUT.height * U;
	return (
		<svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`block h-auto w-full ${className}`}>
			{LAYOUT.keys.map((k) => {
				const x = k.x * U + GAP / 2;
				const y = k.y * U + GAP / 2;
				const kw = k.w * U - GAP;
				const kh = k.h * U - GAP;
				const colour = fingerColour(k.finger);
				const strong = highlight.includes(k.code);
				const small = !k.char || k.label.length > 1;
				return (
					<g key={k.code}>
						<rect x={x} y={y} width={kw} height={kh} rx={3} style={{ fill: colour, fillOpacity: strong ? 0.9 : 0.16 }} />
						<rect x={x + 0.5} y={y + 0.5} width={kw - 1} height={kh - 1} rx={2.5} fill="none" style={{ stroke: colour, strokeOpacity: 0.55 }} strokeWidth={1} />
						{k.code !== 'Space' && (
							<text x={x + (small ? 6 : kw / 2)} y={y + kh / 2 + (small ? 4 : 5)} textAnchor={small ? 'start' : 'middle'} fontSize={small ? 8.5 : 14} className={`font-mono ${strong ? 'fill-bg' : 'fill-ink'}`}>
								{k.char && k.label.length === 1 ? k.label.toUpperCase() : (SHORT[k.label] ?? k.label)}
							</text>
						)}
						{k.char && k.code !== 'Space' && (
							<text x={x + kw - 4} y={y + 10} textAnchor="end" fontSize={8} fontWeight={800} className="font-serif" style={{ fill: strong ? 'var(--bg)' : colour }}>
								{fingerNumber(k.finger)}
							</text>
						)}
						{(k.code === 'KeyF' || k.code === 'KeyJ') && <rect x={x + kw / 2 - 5} y={y + kh - 9} width={10} height={2} rx={1} className={strong ? 'fill-bg' : 'fill-ink'} />}
					</g>
				);
			})}
		</svg>
	);
}
