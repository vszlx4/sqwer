// Procedural illustration: sixteen SVG generators that draw with the palette and a seed. No image files, no network;
// the same (kind, scheme, seed) always draws the same picture, and the SVG can be copied or downloaded as is.

import type { ReactNode } from 'react';
import { mix, type Scheme } from '../_engine/color';
import { rng } from '../_engine/mix';

type Pt = [number, number];
type Rand = () => number;
const f = (n: number) => Math.round(n * 10) / 10;
const rn = (r: Rand, a: number, b: number) => a + r() * (b - a);
const pick = <T,>(r: Rand, a: readonly T[]) => a[Math.floor(r() * a.length)];

/** Closed Catmull-Rom spline through points. */
function smooth(pts: Pt[]): string {
	const n = pts.length;
	let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % n];
		const p3 = pts[(i + 2) % n];
		d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
	}
	return d + 'Z';
}

const blob = (r: Rand, cx: number, cy: number, rad: number, n = 7, jit = 0.35): string =>
	smooth(Array.from({ length: n }, (_, i): Pt => {
		const a = (i / n) * Math.PI * 2;
		const k = rad * (1 - jit / 2 + r() * jit);
		return [cx + Math.cos(a) * k, cy + Math.sin(a) * k];
	}));

/** Hand-wobbled polyline. */
function wob(r: Rand, pts: Pt[], j = 1.6): string {
	return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f(x + rn(r, -j, j))},${f(y + rn(r, -j, j))}`).join('');
}
const circ = (r: Rand, cx: number, cy: number, rad: number, n = 22, j = 1.6): string =>
	wob(r, Array.from({ length: n + 2 }, (_, i): Pt => [cx + Math.cos((i / n) * Math.PI * 2) * rad, cy + Math.sin((i / n) * Math.PI * 2) * rad]), j);

function torn(r: Rand, x: number, y: number, w: number, h: number, j = 5): string {
	const pts: Pt[] = [];
	const step = 14;
	for (let i = 0; i <= w; i += step) pts.push([x + i, y + rn(r, -j, j)]);
	for (let i = 0; i <= h; i += step) pts.push([x + w + rn(r, -j, j), y + i]);
	for (let i = w; i >= 0; i -= step) pts.push([x + i, y + h + rn(r, -j, j)]);
	for (let i = h; i >= 0; i -= step) pts.push([x + rn(r, -j, j), y + i]);
	return 'M' + pts.map(([a, b]) => `${f(a)},${f(b)}`).join('L') + 'Z';
}

const MONO = 'var(--f-mono, ui-monospace, Menlo, monospace)';
const DISPLAY = 'var(--f-display, Georgia, serif)';

function geo(c: Scheme, r: Rand): ReactNode {
	const cols = [c.accent, c.accent2, c.ink, c.surface2];
	const tiles: ReactNode[] = [];
	for (let gy = 0; gy < 3; gy++)
		for (let gx = 0; gx < 4; gx++) {
			const x = gx * 100;
			const y = gy * 100;
			const a = pick(r, cols);
			const b = pick(r, cols.filter((k) => k !== a));
			const t = Math.floor(r() * 7);
			const rot = Math.floor(r() * 4) * 90;
			const sh =
				t === 0 ? <circle cx={50} cy={50} r={44} fill={a} /> :
				t === 1 ? <path d="M0,0H100A100,100 0 0 1 0,100Z" fill={a} transform={`rotate(${rot} 50 50)`} /> :
				t === 2 ? <path d="M0,100A50,50 0 0 1 100,100Z" fill={a} transform={`rotate(${rot} 50 50)`} /> :
				t === 3 ? <path d="M0,100L100,100L0,0Z" fill={a} transform={`rotate(${rot} 50 50)`} /> :
				t === 4 ? <g fill={a}><rect y={10} width={100} height={20} /><rect y={40} width={100} height={20} /><rect y={70} width={100} height={20} /></g> :
				t === 5 ? <circle cx={50} cy={50} r={34} fill="none" stroke={a} strokeWidth={14} /> :
				<g><rect x={14} y={14} width={44} height={44} fill={a} /><circle cx={66} cy={66} r={24} fill={b} /></g>;
			tiles.push(<g key={`${gx}${gy}`} transform={`translate(${x} ${y})`}><rect width={100} height={100} fill={pick(r, [c.bg, c.surface, c.surface2])} />{sh}</g>);
		}
	return tiles;
}

function landscape(c: Scheme, r: Rand): ReactNode {
	const id = `lg${Math.floor(r() * 1e6)}`;
	const sunX = rn(r, 90, 310);
	const hills = [0, 1, 2, 3].map((i) => {
		const base = 150 + i * 38;
		const amp = 34 - i * 5;
		const ph = r() * 6;
		const fq = rn(r, 0.011, 0.02);
		let d = `M0,300L0,${f(base)}`;
		for (let x = 0; x <= 400; x += 10) d += `L${x},${f(base + Math.sin(x * fq + ph) * amp + Math.sin(x * fq * 2.3 + ph) * amp * 0.4)}`;
		return <path key={i} d={d + 'L400,300Z'} fill={mix(c.accent2, c.ink, 0.12 + i * 0.22)} />;
	});
	return (
		<>
			<defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={c.surface2} /><stop offset="1" stopColor={mix(c.bg, c.accent, 0.18)} /></linearGradient></defs>
			<rect width={400} height={300} fill={`url(#${id})`} />
			<circle cx={sunX} cy={100} r={36} fill={c.accent} />
			{hills}
		</>
	);
}

function sketch(c: Scheme, r: Rand): ReactNode {
	const rays = Array.from({ length: 10 }, (_, i) => {
		const a = (i / 10) * Math.PI * 2;
		return <path key={i} d={wob(r, [[310 + Math.cos(a) * 44, 78 + Math.sin(a) * 44], [310 + Math.cos(a) * 62, 78 + Math.sin(a) * 62]], 1.2)} />;
	});
	const hatch = Array.from({ length: 12 }, (_, i) => <path key={i} d={wob(r, [[30 + i * 11, 190], [60 + i * 11, 150]], 1.4)} stroke={c.accent} />);
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			<g fill="none" stroke={c.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
				<path d={circ(r, 310, 78, 30)} />
				{rays}
				<path d={wob(r, [[10, 262], [120, 258], [250, 264], [390, 259]], 2.4)} />
				<path d={wob(r, [[40, 262], [40, 230], [80, 230], [80, 200], [120, 200], [120, 170], [160, 170]], 1.8)} />
				{hatch}
				<path d={wob(r, [[230, 262], [232, 215], [228, 180]], 1.6)} />
				<path d={wob(r, [[230, 215], [200, 200], [188, 176], [214, 188], [230, 215]], 1.6)} />
				<path d={wob(r, [[232, 195], [262, 180], [278, 150], [250, 160], [232, 195]], 1.6)} />
				<path d={wob(r, [[290, 220], [340, 215], [350, 235]], 2)} />
				<path d={wob(r, [[340, 205], [352, 235], [326, 238]], 2)} />
				<path d={wob(r, Array.from({ length: 9 }, (_, i): Pt => [60 + i * 18, 110 + (i % 2) * 14]), 1.4)} stroke={c.accent2} />
			</g>
		</>
	);
}

function collage(c: Scheme, r: Rand): ReactNode {
	const dots: ReactNode[] = [];
	for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) dots.push(<circle key={`${x}${y}`} cx={252 + x * 12} cy={30 + y * 12} r={1.2 + ((x + y) % 4) * 0.8} fill={c.ink} />);
	return (
		<>
			<rect width={400} height={300} fill={c.surface2} />
			<path d={torn(r, 24, 36, 190, 150)} fill={c.accent} transform="rotate(-5 120 110)" />
			<path d={torn(r, 160, 120, 200, 140)} fill={c.accent2} transform="rotate(4 260 190)" />
			<path d={torn(r, 36, 190, 120, 80)} fill={c.ink} transform="rotate(3 96 230)" />
			<g>{dots}</g>
			<circle cx={110} cy={110} r={44} fill={c.bg} />
			<text x={110} y={126} textAnchor="middle" fontSize={44} fontFamily={DISPLAY} fill={c.ink}>№7</text>
			<rect x={130} y={20} width={64} height={22} fill={c.bg} opacity={0.7} transform="rotate(-9 160 30)" />
			<rect x={280} y={246} width={64} height={22} fill={c.bg} opacity={0.7} transform="rotate(7 312 258)" />
			<text x={196} y={222} fontSize={13} fontFamily={MONO} fill={c.bg} transform="rotate(4 260 190)">found, cut, pasted</text>
		</>
	);
}

function pixel(c: Scheme, r: Rand): ReactNode {
	const cells: ReactNode[] = [];
	const W = 40;
	const H = 30;
	const heights = Array.from({ length: W }, (_, x) => Math.round(8 + Math.sin(x * 0.35) * 3 + Math.sin(x * 0.9 + r() * 3) * 1.6));
	const sx = 8 + Math.floor(r() * 24);
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			let col = mix(c.surface2, c.accent2, (y / H) * 0.55);
			if (y >= H - heights[x]) col = y > H - 3 ? c.ink : mix(c.accent2, c.ink, 0.25 + ((x + y) % 2) * 0.1);
			if ((x - sx) ** 2 + (y - 8) ** 2 < 14) col = c.accent;
			if (y > 3 && y < 7 && ((x > 4 && x < 10) || (x > 24 && x < 31)) && (y === 5 || x % 5 !== 0)) col = c.bg;
			cells.push(<rect key={`${x}-${y}`} x={x * 10} y={y * 10} width={10.2} height={10.2} fill={col} shapeRendering="crispEdges" />);
		}
	return cells;
}

function orbital(c: Scheme, r: Rand): ReactNode {
	const rings = [34, 58, 84, 112, 140].map((rad, i) => {
		const rot = rn(r, 0, 180);
		const a = r() * Math.PI * 2;
		return (
			<g key={i} transform={`rotate(${f(rot)} 200 150)`}>
				<ellipse cx={200} cy={150} rx={rad * 1.35} ry={rad * 0.7} fill="none" stroke={i % 2 ? c.ink2 : c.ink} strokeWidth={i === 2 ? 1.6 : 0.8} />
				<circle cx={200 + Math.cos(a) * rad * 1.35} cy={150 + Math.sin(a) * rad * 0.7} r={5 + (i % 3) * 2} fill={i % 2 ? c.accent2 : c.accent} />
			</g>
		);
	});
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			<path d="M0 150H400M200 0V300" stroke={c.line} />
			{rings}
			<circle cx={200} cy={150} r={22} fill={c.accent} />
			<circle cx={200} cy={150} r={8} fill={c.bg} />
		</>
	);
}

function halftone(c: Scheme): ReactNode {
	const dots: ReactNode[] = [];
	const step = 11;
	for (let y = 6; y < 300; y += step)
		for (let x = 6; x < 400; x += step) {
			const dx = x - 200;
			const dy = y - 150;
			const d = Math.hypot(dx, dy);
			let k = 0.15 + (y / 300) * 0.35;
			let col = c.ink;
			if (d < 104) {
				const nz = Math.sqrt(1 - (d / 104) ** 2);
				const lit = Math.max(0, (-dx * 0.5 - dy * 0.7) / 104 * 0.6 + nz * 0.6);
				k = 1 - lit * 0.9;
				col = c.accent;
			}
			dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={Math.max(0.2, k * step * 0.52)} fill={col} />);
		}
	return <><rect width={400} height={300} fill={c.bg} />{dots}</>;
}

function blobs(c: Scheme, r: Rand): ReactNode {
	const id = `gr${Math.floor(r() * 1e6)}`;
	return (
		<>
			<defs><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(r() * 99)} /><feColorMatrix values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0`} /></filter></defs>
			<rect width={400} height={300} fill={c.surface2} />
			<path d={blob(r, 130, 150, 110)} fill={c.accent} />
			<path d={blob(r, 270, 120, 90)} fill={c.accent2} opacity={0.92} />
			<path d={blob(r, 240, 220, 70)} fill={mix(c.accent, c.ink, 0.3)} opacity={0.9} />
			<path d={blob(r, 70, 50, 38, 6)} fill={c.ink} opacity={0.85} />
			<circle cx={320} cy={250} r={20} fill={c.bg} />
			<rect width={400} height={300} filter={`url(#${id})`} />
		</>
	);
}

function iso(x: number, y: number, w: number, h: number, d: number, top: string, left: string, right: string, ink: string): ReactNode {
	const k = 0.5;
	return (
		<g stroke={ink} strokeWidth={1.4} strokeLinejoin="round">
			<path d={`M${x},${y}L${x + w},${y - w * k}L${x + w + d},${y - w * k + d * k}L${x + d},${y + d * k}Z`} fill={top} />
			<path d={`M${x},${y}L${x + d},${y + d * k}L${x + d},${y + d * k + h}L${x},${y + h}Z`} fill={left} />
			<path d={`M${x + d},${y + d * k}L${x + w + d},${y - w * k + d * k}L${x + w + d},${y - w * k + d * k + h}L${x + d},${y + d * k + h}Z`} fill={right} />
		</g>
	);
}

function arch(c: Scheme): ReactNode {
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			<g stroke={c.line} strokeWidth={1}>{Array.from({ length: 21 }, (_, i) => <path key={i} d={`M${i * 20},0V300M0,${i * 20}H400`} />)}</g>
			{iso(80, 190, 120, 70, 70, c.surface, c.surface2, mix(c.surface2, c.ink, 0.12), c.ink)}
			{iso(150, 150, 70, 100, 50, c.accent, mix(c.accent, c.ink, 0.15), mix(c.accent, c.ink, 0.3), c.ink)}
			{iso(250, 200, 90, 40, 40, c.surface, c.surface2, mix(c.surface2, c.ink, 0.12), c.ink)}
			<g stroke={c.ink} strokeWidth={1} fill={c.ink} fontFamily={MONO} fontSize={9}>
				<path d="M60 275H260M60 270V280M260 270V280" fill="none" />
				<text x={140} y={290} stroke="none">12 400</text>
				<path d="M330 120V250M325 120H335M325 250H335" fill="none" />
				<text x={338} y={190} stroke="none">3 200</text>
			</g>
		</>
	);
}

function terminal(c: Scheme): ReactNode {
	const panel = mix(c.ink, c.bg, 0.9);
	const fg = mix(c.bg, c.ink, 0.9);
	const lines: [string, string][] = [
		['$ sqwer lesson --finger 4', fg],
		['› rest on  a  s  d  f', c.accent],
		['› rest on  j  k  l  ;', c.accent],
		['  accuracy 98 %   41 wpm', fg],
		['  next: top row  q w e r', c.accent2]
	];
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			<rect x={28} y={32} width={344} height={236} rx={4} fill={panel} stroke={c.line} />
			<g>{[0, 1, 2].map((i) => <circle key={i} cx={46 + i * 16} cy={50} r={4.5} fill={[c.accent, c.accent2, c.line][i]} />)}</g>
			<g fontFamily={MONO} fontSize={13}>
				{lines.map(([t, col], i) => <text key={i} x={44} y={92 + i * 26} fill={col}>{t}</text>)}
				<rect x={44} y={220} width={9} height={16} fill={c.accent} />
			</g>
		</>
	);
}

function sunset(c: Scheme): ReactNode {
	const band = [c.accent, c.accent2, mix(c.accent, c.accent2, 0.5), c.ink];
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			{band.map((k, i) => <path key={i} d={`M${20 + i * 22},300A${180 - i * 22},${180 - i * 22} 0 0 1 ${380 - i * 22},300Z`} fill={k} />)}
			<circle cx={200} cy={190} r={50} fill={c.bg} />
			<circle cx={200} cy={190} r={42} fill={c.accent} />
			{[0, 1, 2, 3].map((i) => <rect key={i} x={150} y={196 + i * 10} width={100} height={3 + i * 2} fill={c.bg} />)}
			<rect y={266} width={400} height={34} fill={c.ink} />
			{[0, 1, 2].map((i) => <rect key={i} y={274 + i * 8} width={400} height={2 + i} fill={c.accent2} />)}
		</>
	);
}

function cartoon(c: Scheme, r: Rand): ReactNode {
	const st = { stroke: c.ink, strokeWidth: 4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
	return (
		<g {...st}>
			<rect width={400} height={300} fill={c.surface2} stroke="none" />
			<g>{Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${86 + Math.cos((i / 10) * 6.283) * 40},${74 + Math.sin((i / 10) * 6.283) * 40}L${86 + Math.cos((i / 10) * 6.283) * 56},${74 + Math.sin((i / 10) * 6.283) * 56}`} />)}</g>
			<circle cx={86} cy={74} r={32} fill={c.accent2} />
			<circle cx={76} cy={68} r={3} fill={c.ink} />
			<circle cx={96} cy={68} r={3} fill={c.ink} />
			<path d="M72 84Q86 98 100 84" fill="none" />
			<g fill={c.bg}><circle cx={290} cy={70} r={22} /><circle cx={316} cy={78} r={18} /><circle cx={266} cy={80} r={16} /></g>
			<ellipse cx={90} cy={300} rx={170} ry={90} fill={c.accent} />
			<ellipse cx={320} cy={310} rx={150} ry={100} fill={mix(c.accent, c.accent2, 0.45)} />
			<rect x={300} y={186} width={14} height={50} fill={mix(c.ink, c.accent2, 0.4)} />
			<circle cx={307} cy={176} r={30} fill={c.accent2} />
			<path d="M200 130l8 18 19 2-14 13 4 19-17-10-17 10 4-19-14-13 19-2z" fill={c.bg} transform={`rotate(${f(rn(r, -10, 10))} 200 150)`} />
			<ellipse cx={170} cy={266} rx={22} ry={5} fill={c.ink} opacity={0.25} stroke="none" />
			<circle cx={170} cy={236} r={22} fill={c.bg} />
			<path d="M154 232Q170 222 186 232" fill="none" />
		</g>
	);
}

function typeArt(c: Scheme, r: Rand): ReactNode {
	const g = pick(r, ['Aa', '&', 'g', 'R', '§', '7', 'Qu']);
	return (
		<>
			<rect width={400} height={300} fill={c.bg} />
			<circle cx={rn(r, 120, 280)} cy={150} r={rn(r, 80, 120)} fill={c.accent} />
			<text x={200} y={236} textAnchor="middle" fontSize={g.length > 1 ? 210 : 270} fontFamily={DISPLAY} fontStyle="var(--ital, normal)" fill={c.ink}>{g}</text>
			<path d="M24 28H376" stroke={c.ink} strokeWidth={1.5} />
			<text x={24} y={22} fontSize={10} fontFamily={MONO} fill={c.ink}>SPECIMEN</text>
			<text x={376} y={22} fontSize={10} fontFamily={MONO} fill={c.ink} textAnchor="end">{g.length}/ 52 pt</text>
		</>
	);
}

function flow(c: Scheme, r: Rand): ReactNode {
	const ph = r() * 10;
	const lines = Array.from({ length: 80 }, (_, i) => {
		let x = rn(r, 0, 400);
		let y = rn(r, 0, 300);
		let d = `M${f(x)},${f(y)}`;
		for (let k = 0; k < 36; k++) {
			const a = Math.sin(x * 0.012 + ph) * 2 + Math.cos(y * 0.016 - ph) * 2;
			x += Math.cos(a) * 5;
			y += Math.sin(a) * 5;
			d += `L${f(x)},${f(y)}`;
		}
		return <path key={i} d={d} fill="none" stroke={i % 7 === 0 ? c.accent : i % 11 === 0 ? c.accent2 : c.ink} strokeWidth={i % 7 === 0 ? 1.8 : 0.8} opacity={i % 7 === 0 ? 1 : 0.7} />;
	});
	return <><rect width={400} height={300} fill={c.bg} />{lines}</>;
}

function botanical(c: Scheme, r: Rand): ReactNode {
	const plants = [0, 1, 2].map((p) => {
		const x0 = 90 + p * 110 + rn(r, -12, 12);
		const top = 50 + rn(r, 0, 60);
		const leaves = Array.from({ length: 7 }, (_, i) => {
			const y = 270 - ((270 - top) * (i + 1)) / 8;
			const side = i % 2 ? 1 : -1;
			const len = 40 - i * 2.5;
			return <path key={i} d={`M${x0},${y}Q${x0 + side * len * 0.6},${y - len * 0.9} ${x0 + side * len},${y - len * 0.35}Q${x0 + side * len * 0.5},${y + len * 0.05} ${x0},${y}Z`} fill={i % 3 === 0 ? c.accent2 : mix(c.accent2, c.accent, 0.4 + (i % 2) * 0.2)} opacity={0.95} />;
		});
		return (
			<g key={p}>
				<path d={`M${x0},280Q${x0 + rn(r, -14, 14)},${(280 + top) / 2} ${x0},${top}`} stroke={c.ink} strokeWidth={2.2} fill="none" />
				{leaves}
				<circle cx={x0} cy={top - 6} r={13} fill={c.accent} />
				<circle cx={x0} cy={top - 6} r={5} fill={c.bg} />
			</g>
		);
	});
	return <><rect width={400} height={300} fill={c.surface2} /><path d="M40 300V150A160 160 0 0 1 360 150V300Z" fill={mix(c.surface2, c.accent, 0.14)} />{plants}</>;
}

function dashboard(c: Scheme, r: Rand): ReactNode {
	const bars = Array.from({ length: 9 }, (_, i) => {
		const h = 30 + r() * 80;
		return <rect key={i} x={30 + i * 22} y={180 - h} width={14} height={h} fill={i === 6 ? c.accent : mix(c.accent, c.bg, 0.55)} />;
	});
	let y = 120;
	const line = Array.from({ length: 9 }, (_, i): Pt => [37 + i * 22, (y = Math.max(60, Math.min(170, y + rn(r, -26, 18))))]);
	return (
		<>
			<rect width={400} height={300} fill={c.surface2} />
			<rect x={14} y={14} width={246} height={196} fill={c.bg} stroke={c.line} />
			<path d="M24 180H250M24 140H250M24 100H250" stroke={c.line} />
			{bars}
			<path d={'M' + line.map((p) => p.join(',')).join('L')} fill="none" stroke={c.ink} strokeWidth={2} />
			<rect x={272} y={14} width={114} height={92} fill={c.bg} stroke={c.line} />
			<circle cx={329} cy={60} r={28} fill="none" stroke={c.line} strokeWidth={10} />
			<circle cx={329} cy={60} r={28} fill="none" stroke={c.accent2} strokeWidth={10} strokeDasharray="110 176" transform="rotate(-90 329 60)" />
			<rect x={272} y={118} width={114} height={92} fill={c.accent} />
			<text x={284} y={160} fontSize={30} fontFamily={DISPLAY} fill={c.onAccent}>+12.4%</text>
			<text x={284} y={184} fontSize={10} fontFamily={MONO} fill={c.onAccent}>QUARTER ON QUARTER</text>
			<rect x={14} y={222} width={372} height={64} fill={c.bg} stroke={c.line} />
			{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={26} y={234 + i * 10} width={60 + ((i * 53) % 180)} height={4} fill={i === 0 ? c.accent : c.line} />)}
		</>
	);
}

export const ART_KINDS = ['geo', 'landscape', 'sketch', 'collage', 'pixel', 'orbital', 'halftone', 'blob', 'arch', 'terminal', 'sunset', 'cartoon', 'type', 'flow', 'botanical', 'dashboard'] as const;

export function artNodes(kind: string, c: Scheme, seed: number): ReactNode {
	const r = rng(seed * 7919 + kind.length * 31);
	switch (kind) {
		case 'geo': return geo(c, r);
		case 'landscape': return landscape(c, r);
		case 'sketch': return sketch(c, r);
		case 'collage': return collage(c, r);
		case 'pixel': return pixel(c, r);
		case 'orbital': return orbital(c, r);
		case 'halftone': return halftone(c);
		case 'blob': return blobs(c, r);
		case 'arch': return arch(c);
		case 'terminal': return terminal(c);
		case 'sunset': return sunset(c);
		case 'cartoon': return cartoon(c, r);
		case 'type': return typeArt(c, r);
		case 'flow': return flow(c, r);
		case 'botanical': return botanical(c, r);
		default: return dashboard(c, r);
	}
}

export function Art({ kind, scheme, seed = 1, className, label, slice = true }: { kind: string; scheme: Scheme; seed?: number; className?: string; label?: string; slice?: boolean }) {
	return (
		<svg viewBox="0 0 400 300" preserveAspectRatio={slice ? 'xMidYMid slice' : 'xMidYMid meet'} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
			{artNodes(kind, scheme, seed)}
		</svg>
	);
}
