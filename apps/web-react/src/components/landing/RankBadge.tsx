import { useId } from 'react';

// The course rank emblem from the current site (apps/web RankBadge): a keycap in the material of the rank's tier,
// the level on its face, and one star for each tier reached. Ported unchanged except that level 10 is no longer crowned.

type Tier = 'bronze' | 'silver' | 'gold' | 'emerald' | 'diamond';

const MATERIALS: Record<Tier, { face: [string, string]; body: [string, string]; ink: string; glow: string }> = {
	bronze: { face: ['#f6cfa8', '#cd8752'], body: ['#9a5a2c', '#6b3a19'], ink: '#4a250c', glow: '#e9a46c' },
	silver: { face: ['#fbfcfd', '#b4bdc8'], body: ['#808b98', '#566070'], ink: '#2c333d', glow: '#d5dce4' },
	gold: { face: ['#fff0b8', '#e5a92a'], body: ['#b07408', '#7c5104'], ink: '#4b3100', glow: '#f5cd58' },
	emerald: { face: ['#b6f5da', '#1fae7b'], body: ['#0e7552', '#074d36'], ink: '#043222', glow: '#4fd6a2' },
	diamond: { face: ['#f1f8ff', '#a9b9ff'], body: ['#5363b8', '#2c3574'], ink: '#1c2257', glow: '#9fe7f5' }
};

export function RankBadge({ level, tier, size = 72 }: { level: number; tier: string; size?: number }) {
	const id = useId().replace(/:/g, '');
	const m = MATERIALS[(tier in MATERIALS ? tier : 'bronze') as Tier];
	const stars = Math.ceil(level / 2);
	return (
		<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ overflow: 'visible', filter: 'drop-shadow(0 3px 6px rgb(0 0 0 / 0.16))' }}>
			<defs>
				<linearGradient id={`${id}f`} x1="0" y1="0" x2="0.6" y2="1">
					<stop offset="0" stopColor={m.face[0]} />
					<stop offset="1" stopColor={m.face[1]} />
				</linearGradient>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={m.body[0]} />
					<stop offset="1" stopColor={m.body[1]} />
				</linearGradient>
				<radialGradient id={`${id}s`} cx="0.3" cy="0.15" r="0.75">
					<stop offset="0" stopColor="#fff" stopOpacity="0.75" />
					<stop offset="0.45" stopColor="#fff" stopOpacity="0" />
				</radialGradient>
			</defs>
			<ellipse cx="32" cy="56" rx="22" ry="4" fill={m.glow} opacity="0.35" />
			<rect x="7" y="9" width="50" height="47" rx="11" fill={`url(#${id}b)`} />
			<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}f)`} />
			<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}s)`} />
			<rect x="11.5" y="10.5" width="41" height="36" rx="8" fill="none" stroke="#fff" strokeOpacity="0.55" />
			<text x="32" y="36.5" textAnchor="middle" fill={m.ink} style={{ fontFamily: 'var(--font-altera-serif), Georgia, serif', fontSize: 21 }}>
				{level}
			</text>
			{Array.from({ length: stars }, (_, i) => (
				<path key={i} d="M0-3.1l.9 1.9 2.1.3-1.5 1.4.4 2.1L0 1.6l-1.9 1 .4-2.1-1.5-1.4 2.1-.3z" transform={`translate(${32 + (i - (stars - 1) / 2) * 7.2} 51.6)`} fill="#fff" fillOpacity="0.95" />
			))}
		</svg>
	);
}
