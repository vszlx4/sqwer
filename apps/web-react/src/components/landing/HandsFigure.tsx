import { Hands, type LegendItem } from './Hands';
import { HOME } from './data';
import { FINGERS, fingerNumber } from '@/lib/fingering';

export function HandsFigure({ className = '' }: { className?: string }) {
	const legend = Object.fromEntries(
		FINGERS.map((f) => [f, { value: String(fingerNumber(f)), sub: HOME[f] === 'Space' ? '' : HOME[f], lit: false } satisfies LegendItem])
	);
	return (
		<Hands
			className={className}
			label="Two hands on the home row. Left: little finger 5 on A, ring 4 on S, middle 3 on D, index 2 on F. Right: index 2 on J, middle 3 on K, ring 4 on L, little 5 on semicolon. Thumbs, 1, on the space bar."
			legend={legend}
			legendSize={12}
		/>
	);
}
