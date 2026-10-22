import { useId } from 'react';
import { LogoMark } from '@/components/brand/LogoMark';

// A rotating circle of type: words set along SVG circles with <textPath>, the logo in the middle. Two rings turn
// in opposite directions. Static under reduced motion (the text still reads around the circle).

const OUTER = 'sqwer · learn to type with every finger · sqwer · one key at a time · ';
const INNER = 'a s d f · j k l ; · home row · 5 4 3 2 · 2 3 4 5 · ';

export function OrbitalType({ className = '' }: { className?: string }) {
	const id = useId().replace(/:/g, '');
	const circle = (r: number) => `M 210 210 m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`;
	return (
		<div className={`orbital ${className}`}>
			<svg viewBox="0 0 420 420" role="img" aria-label="sqwer, learn to type with every finger, one key at a time">
				<defs>
					<path id={`${id}o`} d={circle(172)} />
					<path id={`${id}i`} d={circle(128)} />
				</defs>
				<circle cx="210" cy="210" r="196" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
				<circle cx="210" cy="210" r="104" fill="none" stroke="var(--line-strong)" strokeWidth="1" />
				<g className="orbital-ring orbital-outer">
					<text fontFamily="var(--font-altera-serif), Georgia, serif" fontSize="30" fill="var(--ink)" aria-hidden="true">
						<textPath href={`#${id}o`} textLength={2 * Math.PI * 172 - 4} lengthAdjust="spacing">{OUTER}</textPath>
					</text>
				</g>
				<g className="orbital-ring orbital-inner">
					<text fontFamily="var(--font-geist-mono), ui-monospace, monospace" fontSize="15" letterSpacing="2" fill="var(--accent)" aria-hidden="true">
						<textPath href={`#${id}i`} textLength={2 * Math.PI * 128 - 4} lengthAdjust="spacing">{INNER}</textPath>
					</text>
				</g>
			</svg>
			<LogoMark className="orbital-logo" />
		</div>
	);
}
