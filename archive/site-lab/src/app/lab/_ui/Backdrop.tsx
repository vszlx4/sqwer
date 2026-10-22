'use client';

// Background renderer: twenty-eight CSS/SVG recipes plus ten shader and canvas ones. Every recipe is a function of the
// scheme, an intensity and an angle, so the same background re-colours itself with the palette.

import dynamic from 'next/dynamic';
import { useId, useMemo, type CSSProperties, type ReactNode } from 'react';
import { hexToRgb, mix, type Scheme } from '../_engine/color';
import { rng } from '../_engine/mix';
import { BGS } from '../_engine/options';

const BackdropGl = dynamic(() => import('./BackdropGl'), { ssr: false });

const A = (c: string, a: number) => `color-mix(in srgb, ${c} ${Math.round(Math.max(0, Math.min(1, a)) * 100)}%, transparent)`;
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

function noiseTile(ink: string, freq: string, alpha: number, octaves = 3, size = 300, seed = 3): string {
	const [r, g, b] = hexToRgb(ink).map((v) => (v / 255).toFixed(3));
	return svgUrl(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 ${(alpha * 2).toFixed(3)} 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
	);
}

type Layer = { style?: CSSProperties; children?: ReactNode; className?: string };

function tile(seed: number, w: number, h: number, draw: (r: () => number) => string): string {
	const r = rng(seed);
	return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${draw(r)}</svg>`);
}

function recipe(id: string, c: Scheme, i: number, uid: string): Layer {
	const mask = (m: string): CSSProperties => ({ maskImage: m, WebkitMaskImage: m });
	switch (id) {
		case 'paper':
			return { style: { backgroundImage: `${noiseTile(c.ink, '0.85', 0.12 + 0.3 * i)}, ${noiseTile(c.ink, '0.012 0.4', 0.05 + 0.12 * i, 2, 400, 8)}` } };
		case 'grain-gradient':
			return { style: { backgroundImage: `${noiseTile(c.ink, '0.9', 0.25 + 0.4 * i, 3, 260)}, linear-gradient(var(--angle), color-mix(in srgb, ${c.accent} ${20 + 60 * i}%, ${c.bg}), color-mix(in srgb, ${c.accent2} ${15 + 55 * i}%, ${c.bg}) 60%, ${c.bg})` } };
		case 'mesh':
			return {
				children: (
					<>
						<i className="dp-blob" style={{ left: '-10%', top: '-20%', width: '60%', height: '70%', background: A(c.accent, 0.25 + 0.55 * i), animationDuration: '19s' }} />
						<i className="dp-blob" style={{ right: '-10%', top: '10%', width: '55%', height: '65%', background: A(c.accent2, 0.22 + 0.5 * i), animationDuration: '23s', animationDelay: '-6s' }} />
						<i className="dp-blob" style={{ left: '20%', bottom: '-30%', width: '60%', height: '60%', background: A(mix(c.accent, c.accent2, 0.5), 0.2 + 0.45 * i), animationDuration: '29s', animationDelay: '-12s' }} />
					</>
				)
			};
		case 'spotlight':
			return { style: { backgroundImage: `radial-gradient(60% 55% at 50% -6%, ${A(c.accent, 0.12 + 0.55 * i)}, transparent 70%), radial-gradient(120% 90% at 50% 120%, ${A(c.ink, 0.1 + 0.2 * i)}, transparent 60%)` } };
		case 'bands':
			return { style: { backgroundImage: `linear-gradient(180deg, transparent 38%, ${A(c.accent2, 0.15 + 0.7 * i)} 38% 44%, transparent 44% 49%, ${A(c.accent, 0.15 + 0.7 * i)} 49% 57%, transparent 57% 62%, ${A(c.accent2, 0.15 + 0.7 * i)} 62% 72%, transparent 72% 76%, ${A(c.accent, 0.15 + 0.7 * i)} 76% 100%)` } };
		case 'grid':
			return { style: { backgroundImage: `linear-gradient(${A(c.ink, 0.08 + 0.22 * i)} 1px, transparent 1px), linear-gradient(90deg, ${A(c.ink, 0.08 + 0.22 * i)} 1px, transparent 1px)`, backgroundSize: '48px 48px', ...mask('radial-gradient(120% 100% at 50% 40%, #000 30%, transparent 90%)') } };
		case 'graph':
			return { style: { backgroundImage: `linear-gradient(${A(c.accent, 0.08 + 0.2 * i)} 1px, transparent 1px), linear-gradient(90deg, ${A(c.accent, 0.08 + 0.2 * i)} 1px, transparent 1px), linear-gradient(${A(c.ink, 0.1 + 0.25 * i)} 1px, transparent 1px), linear-gradient(90deg, ${A(c.ink, 0.1 + 0.25 * i)} 1px, transparent 1px)`, backgroundSize: '12px 12px, 12px 12px, 60px 60px, 60px 60px' } };
		case 'dots':
			return { style: { backgroundImage: `radial-gradient(${A(c.ink, 0.22 + 0.5 * i)} 1.3px, transparent 1.7px)`, backgroundSize: '18px 18px' } };
		case 'halftone':
			return { style: { backgroundImage: `radial-gradient(circle, ${A(c.ink, 0.2 + 0.6 * i)} 32%, transparent 34%)`, backgroundSize: '14px 14px', ...mask('linear-gradient(180deg, #000, transparent 85%)') } };
		case 'stripes':
			return { style: { backgroundImage: `repeating-linear-gradient(var(--angle), transparent 0 36px, ${A(c.accent, 0.12 + 0.55 * i)} 36px 72px)` } };
		case 'checker':
			return { style: { backgroundImage: `repeating-conic-gradient(${A(c.ink, 0.06 + 0.22 * i)} 0 25%, transparent 0 50%)`, backgroundSize: '44px 44px' } };
		case 'scanlines':
			return { style: { backgroundImage: `repeating-linear-gradient(0deg, ${A(c.ink, 0.06 + 0.35 * i)} 0 1px, transparent 1px 3px)` }, children: <i className="dp-scanband" style={{ background: `linear-gradient(180deg, transparent, ${A(c.accent, 0.04 + 0.12 * i)}, transparent)` }} /> };
		case 'perspective':
			return {
				children: (
					<>
						<div className="dp-sun" style={{ background: `linear-gradient(180deg, ${c.accent2}, ${c.accent})`, opacity: 0.35 + 0.65 * i }} />
						<div className="dp-floor" style={{ backgroundImage: `linear-gradient(${A(c.accent, 0.3 + 0.6 * i)} 2px, transparent 2px), linear-gradient(90deg, ${A(c.accent, 0.3 + 0.6 * i)} 2px, transparent 2px)` }} />
					</>
				)
			};
		case 'stars': {
			const star = tile(11, 800, 600, (r) => Array.from({ length: 110 }, () => `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * 600).toFixed(0)}" r="${(0.4 + r() * 1.5).toFixed(1)}" fill="${r() < 0.2 ? c.accent : c.ink}" opacity="${(0.25 + r() * 0.75).toFixed(2)}"/>`).join(''));
			const star2 = tile(29, 800, 600, (r) => Array.from({ length: 60 }, () => `<circle cx="${(r() * 800).toFixed(0)}" cy="${(r() * 600).toFixed(0)}" r="${(0.6 + r() * 1.6).toFixed(1)}" fill="${c.ink}"/>`).join(''));
			return { style: { backgroundImage: star, backgroundSize: '800px 600px', opacity: 0.35 + 0.65 * i }, children: <i className="dp-twinkle" style={{ backgroundImage: star2, backgroundSize: '800px 600px' }} /> };
		}
		case 'contour': {
			const [r, g, b] = hexToRgb(c.accent).map((v) => (v / 255).toFixed(3));
			return {
				children: (
					<svg width="100%" height="100%" aria-hidden="true" style={{ opacity: 0.25 + 0.6 * i }}>
						<filter id={`${uid}c`} x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006" numOctaves="3" seed="7" /><feColorMatrix values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  1 0 0 0 0`} /><feComponentTransfer><feFuncA type="discrete" tableValues="0 .5 0 .5 0 .5 0 .5 0 .5 0 .5" /></feComponentTransfer></filter>
						<rect width="100%" height="100%" filter={`url(#${uid}c)`} />
					</svg>
				)
			};
		}
		case 'waves': {
			const wave = (amp: number, fq: number, ph: number, y: number) => {
				let d = `M0,${y}`;
				for (let x = 0; x <= 2400; x += 20) d += `L${x},${(y + Math.sin(x * fq + ph) * amp).toFixed(1)}`;
				return d + 'L2400,400L0,400Z';
			};
			return {
				children: (
					<svg viewBox="0 0 1200 400" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">
						{[[26, 0.006, 0, 250, c.accent2, 0.16], [30, 0.008, 2, 280, c.accent, 0.22], [22, 0.011, 4, 315, c.accent2, 0.3], [18, 0.014, 1, 350, c.accent, 0.4]].map(([amp, fq, ph, y, col, op], k) => (
							<path key={k} className="dp-wave" style={{ animationDuration: `${22 - k * 4}s` }} d={wave(amp as number, fq as number, ph as number, y as number)} fill={col as string} opacity={(op as number) * (0.3 + i)} />
						))}
					</svg>
				)
			};
		}
		case 'flow': {
			const r = rng(5);
			const paths = Array.from({ length: 90 }, (_, k) => {
				let x = r() * 1200;
				let y = r() * 700;
				let d = `M${x.toFixed(0)},${y.toFixed(0)}`;
				for (let s = 0; s < 70; s++) {
					const a = Math.sin(x * 0.004) * 2.4 + Math.cos(y * 0.006) * 2.4;
					x += Math.cos(a) * 7;
					y += Math.sin(a) * 7;
					d += `L${x.toFixed(0)},${y.toFixed(0)}`;
				}
				return <path key={k} d={d} fill="none" stroke={k % 9 === 0 ? c.accent : c.ink} strokeWidth={k % 9 === 0 ? 1.6 : 0.8} opacity={k % 9 === 0 ? 0.9 : 0.35} />;
			});
			return { children: <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true" style={{ opacity: 0.2 + 0.8 * i }}>{paths}</svg> };
		}
		case 'blueprint':
			return { style: { backgroundImage: `linear-gradient(${A(c.ink, 0.28 + 0.4 * i)} 1px, transparent 1px), linear-gradient(90deg, ${A(c.ink, 0.28 + 0.4 * i)} 1px, transparent 1px), linear-gradient(${A(c.ink, 0.08 + 0.14 * i)} 1px, transparent 1px), linear-gradient(90deg, ${A(c.ink, 0.08 + 0.14 * i)} 1px, transparent 1px)`, backgroundSize: '96px 96px, 96px 96px, 16px 16px, 16px 16px' } };
		case 'concrete':
			return { style: { backgroundImage: `${noiseTile(c.ink, '0.95', 0.2 + 0.4 * i, 2, 200, 2)}, ${noiseTile(c.ink, '0.018', 0.12 + 0.35 * i, 4, 500, 5)}` } };
		case 'washi':
			return { style: { backgroundImage: `${noiseTile(c.ink, '0.012 0.5', 0.08 + 0.28 * i, 3, 400, 4)}, ${noiseTile(c.ink, '0.5 0.012', 0.04 + 0.12 * i, 2, 400, 9)}, ${noiseTile(c.accent, '0.008', 0.04 + 0.1 * i, 3, 600, 1)}` } };
		case 'newsprint':
			return { style: { backgroundImage: `${noiseTile(c.ink, '0.9', 0.18 + 0.3 * i, 2, 220)}, radial-gradient(${A(c.ink, 0.06 + 0.16 * i)} 1.1px, transparent 1.4px)`, backgroundSize: '220px 220px, 6px 6px' } };
		case 'crosshatch':
			return { style: { backgroundImage: `repeating-linear-gradient(45deg, ${A(c.ink, 0.05 + 0.2 * i)} 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, ${A(c.ink, 0.05 + 0.2 * i)} 0 1px, transparent 1px 7px)` } };
		case 'sunburst':
			return { style: { backgroundImage: `repeating-conic-gradient(from 0deg at 50% 100%, ${A(c.accent, 0.1 + 0.4 * i)} 0 7deg, transparent 7deg 14deg)`, ...mask('radial-gradient(90% 100% at 50% 100%, #000, transparent 80%)') } };
		case 'terrazzo': {
			const t = tile(17, 520, 520, (r) => Array.from({ length: 46 }, () => {
				const x = r() * 520;
				const y = r() * 520;
				const s = 6 + r() * 20;
				const pts = Array.from({ length: 5 }, (_, k) => `${(x + Math.cos(k * 1.256 + r()) * s).toFixed(0)},${(y + Math.sin(k * 1.256 + r()) * s).toFixed(0)}`).join(' ');
				return `<polygon points="${pts}" fill="${[c.accent, c.accent2, c.ink, c.line][Math.floor(r() * 4)]}"/>`;
			}).join(''));
			return { style: { backgroundImage: t, backgroundSize: '520px 520px', opacity: 0.25 + 0.75 * i } };
		}
		case 'memphis': {
			const t = tile(23, 480, 480, (r) => Array.from({ length: 28 }, () => {
				const x = r() * 480;
				const y = r() * 480;
				const col = [c.accent, c.accent2, c.ink][Math.floor(r() * 3)];
				const k = Math.floor(r() * 4);
				if (k === 0) return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + r() * 12).toFixed(0)}" fill="${col}"/>`;
				if (k === 1) return `<polygon points="${x.toFixed(0)},${y.toFixed(0)} ${(x + 26).toFixed(0)},${(y + 6).toFixed(0)} ${(x + 8).toFixed(0)},${(y + 28).toFixed(0)}" fill="${col}"/>`;
				if (k === 2) return `<path d="M${x.toFixed(0)} ${y.toFixed(0)}q8 -12 16 0t16 0t16 0" fill="none" stroke="${col}" stroke-width="3.5"/>`;
				return `<path d="M${x.toFixed(0)} ${(y - 9).toFixed(0)}v18M${(x - 9).toFixed(0)} ${y.toFixed(0)}h18" stroke="${col}" stroke-width="3.5"/>`;
			}).join(''));
			return { style: { backgroundImage: t, backgroundSize: '480px 480px', opacity: 0.3 + 0.7 * i } };
		}
		case 'bokeh':
			return {
				children: (
					<>
						{[[8, 18, 220, c.accent, 17], [60, 8, 160, c.accent2, 21], [78, 52, 260, c.accent, 25], [20, 66, 200, c.accent2, 19], [46, 38, 130, mix(c.accent, c.accent2, 0.5), 23], [90, 8, 120, c.accent, 27]].map(([x, y, s, col, dur], k) => (
							<i key={k} className="dp-bokeh" style={{ left: `${x}%`, top: `${y}%`, width: s as number, height: s as number, background: `radial-gradient(circle, ${A(col as string, 0.12 + 0.55 * i)}, transparent 68%)`, animationDuration: `${dur}s`, animationDelay: `${-k * 3}s` }} />
						))}
					</>
				)
			};
		case 'clouds':
			return {
				style: { backgroundImage: `linear-gradient(180deg, ${A(c.accent2, 0.08 + 0.4 * i)}, transparent 70%)` },
				children: (
					<>
						{[[6, 12, 340], [48, 4, 420], [70, 30, 300], [24, 44, 380]].map(([x, y, s], k) => (
							<i key={k} className="dp-cloud" style={{ left: `${x}%`, top: `${y}%`, width: s, height: (s as number) * 0.34, background: A(mix(c.bg, c.surface, 0.5), 0.35 + 0.6 * i), animationDuration: `${60 + k * 14}s`, animationDelay: `${-k * 11}s` }} />
						))}
					</>
				)
			};
		default:
			return {};
	}
}

export function Backdrop({ id, scheme, mode, intensity, live = true, seed = 1 }: { id: string; scheme: Scheme; mode: 'light' | 'dark'; intensity: number; live?: boolean; seed?: number }) {
	const uid = useId().replace(/:/g, '');
	const meta = BGS.find((b) => b.id === id);
	const layer = useMemo(() => (meta?.kind === 'css' ? recipe(id, scheme, intensity, uid) : {}), [id, scheme, intensity, uid, meta?.kind]);
	if (!meta || id === 'plain') return null;
	if (meta.kind === 'gl') {
		return (
			<div className="dp-bd" aria-hidden="true" data-bd={id}>
				{live ? <BackdropGl id={id} c={scheme} mode={mode} i={intensity} /> : <div className="absolute inset-0" style={{ background: `radial-gradient(70% 60% at 30% 20%, ${A(scheme.accent, 0.2 + 0.5 * intensity)}, transparent 70%), radial-gradient(60% 60% at 80% 70%, ${A(scheme.accent2, 0.15 + 0.4 * intensity)}, transparent 70%)` }} />}
			</div>
		);
	}
	void seed;
	return (
		<div className="dp-bd" aria-hidden="true" data-bd={id} style={layer.style}>
			{layer.children}
		</div>
	);
}
