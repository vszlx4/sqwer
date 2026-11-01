import type { RankStop } from '#lib/courses/journey.ts';
import type { Tier } from '#lib/courses/progression.ts';

/*
 * Rank tree geometry. Built in (u, s) space, u along the trunk (course time, linear), s across it, then mapped to
 * x/y per orientation: wide grows left to right, narrow grows top to bottom. Branch tips are composed by hand per
 * orientation so the dense early ranks fan out; where a branch meets the trunk always comes from the data.
 */

export type Orient = 'wide' | 'narrow';
export interface Pt {
	x: number;
	y: number;
}
export interface Leaf {
	x: number;
	y: number;
	/** Degrees; 0 points along +x. */
	angle: number;
	size: number;
	tier: Tier;
}
export interface Twig {
	shape: string;
	/** Where it grows from. */
	base: Pt;
}
export interface Label {
	x: number;
	y: number;
	anchor: 'start' | 'end';
	/** Box for overlap checks, in canvas units. */
	box: { x: number; y: number; w: number; h: number };
}
export interface Branch {
	stop: RankStop;
	/** Share of the trunk where the branch starts, for timing. */
	at: number;
	attach: Pt;
	tip: Pt;
	shape: string;
	line: string;
	twigs: Twig[];
	leaves: Leaf[];
	label: Label;
	/** Sample points of the wood and leaf tips, for overlap checks. */
	hits: Pt[];
}
export interface Tick {
	at: number;
	x: number;
	y: number;
	text: string;
}
export interface Tree {
	orient: Orient;
	width: number;
	height: number;
	trunk: string;
	trunkLine: string;
	roots: Twig[];
	branches: Branch[];
	/** Unlabeled growth along the trunk, between ranks. */
	sprigs: { at: number; twig: Twig; leaves: Leaf[] }[];
	ticks: Tick[];
	axis: string;
}

interface Frame {
	width: number;
	height: number;
	/** Trunk start and the u of the last rank. */
	u0: number;
	u1: number;
	/** Trunk tip, past the last rank. */
	uEnd: number;
	s0: number;
	/** Trunk width at root and tip. */
	w0: number;
	w1: number;
	/** Hand-placed branch tips (u, s), one per rank. */
	tips: [number, number][];
	/** Wide only: labels that read leftwards from their tip. */
	endLabels: number[];
	/** Axis offset across the trunk. */
	axisS: number;
}

const FRAMES: Record<Orient, Frame> = {
	wide: {
		width: 1160,
		height: 724,
		u0: 70,
		u1: 1040,
		uEnd: 1124,
		s0: 340,
		w0: 15,
		w1: 2.5,
		tips: [
			[96, 120],
			[110, 556],
			[252, 214],
			[230, 470],
			[340, 300],
			[420, 470],
			[620, 110],
			[720, 556],
			[1010, 150],
			[1086, 556]
		],
		endLabels: [9],
		axisS: 684
	},
	narrow: {
		width: 360,
		height: 1500,
		u0: 56,
		u1: 1400,
		uEnd: 1470,
		s0: 70,
		w0: 12,
		w1: 2,
		tips: [
			[56, 124],
			[150, 124],
			[244, 124],
			[338, 124],
			[432, 124],
			[526, 124],
			[700, 124],
			[930, 124],
			[1312, 124],
			[1400, 134]
		],
		endLabels: [],
		axisS: 34
	}
};

export const LABEL = { badge: 34, name: 20, meta: 13, line: 19 } as const;

/** Rough text widths for layout checks: serif name and mono meta. */
const nameWidth = (s: string) => s.length * LABEL.name * 0.5;
const metaWidth = (s: string) => s.length * LABEL.meta * 0.6;

export function labelLines(stop: RankStop, time: (minutes: number) => string): [string, string] {
	if (stop.wpm === null) return ['Lesson 1', 'Any speed'];
	return [`Lesson ${stop.lessons} · ${time(stop.minutes)}`, `${stop.wpm} WPM · ${stop.accuracy}%`];
}

/** Small deterministic noise, so the tree is the same on server and client. */
function noise(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Curve = (t: number) => Pt;

function cubic(a: Pt, b: Pt, c: Pt, d: Pt): Curve {
	return (t) => {
		const m = 1 - t;
		return {
			x: m * m * m * a.x + 3 * m * m * t * b.x + 3 * m * t * t * c.x + t * t * t * d.x,
			y: m * m * m * a.y + 3 * m * m * t * b.y + 3 * m * t * t * c.y + t * t * t * d.y
		};
	};
}

function tangent(curve: Curve, t: number): Pt {
	const a = curve(Math.max(0, t - 0.01));
	const b = curve(Math.min(1, t + 0.01));
	const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
	return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
}

/** Filled outline of a curve that narrows from w0 to w1, with a rounded tip. */
function taper(curve: Curve, w0: number, w1: number, steps = 18): string {
	const left: Pt[] = [];
	const right: Pt[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const p = curve(t);
		const d = tangent(curve, t);
		// Eases thinner fast near the base, like wood.
		const w = lerp(w0, w1, 1 - (1 - t) ** 1.6) / 2;
		left.push({ x: p.x - d.y * w, y: p.y + d.x * w });
		right.push({ x: p.x + d.y * w, y: p.y - d.x * w });
	}
	const end = curve(1);
	const pts = left.map((p) => `${r1(p.x)} ${r1(p.y)}`).join(' L');
	const back = right
		.reverse()
		.map((p) => `${r1(p.x)} ${r1(p.y)}`)
		.join(' L');
	return `M${pts} Q${r1(end.x)} ${r1(end.y)} ${back} Z`;
}

function line(curve: Curve, steps = 12): string {
	const pts: string[] = [];
	for (let i = 0; i <= steps; i++) {
		const p = curve(i / steps);
		pts.push(`${r1(p.x)} ${r1(p.y)}`);
	}
	return `M${pts.join(' L')}`;
}

/** A short curved shoot from p in direction (degrees), bending by bend degrees. */
function shoot(p: Pt, angle: number, length: number, bend: number): Curve {
	const a = (angle * Math.PI) / 180;
	const b = ((angle + bend) * Math.PI) / 180;
	const mid = { x: p.x + Math.cos(a) * length * 0.5, y: p.y + Math.sin(a) * length * 0.5 };
	const end = { x: mid.x + Math.cos(b) * length * 0.5, y: mid.y + Math.sin(b) * length * 0.5 };
	return cubic(p, mid, mid, end);
}

const deg = (d: Pt) => (Math.atan2(d.y, d.x) * 180) / Math.PI;

export function buildTree(stops: RankStop[], orient: Orient, time: (minutes: number) => string): Tree {
	const f = FRAMES[orient];
	const xy = (u: number, s: number): Pt => (orient === 'wide' ? { x: u, y: s } : { x: s, y: u });
	const meander = (u: number) => {
		const k = u - f.u0;
		return orient === 'wide' ? 9 * Math.sin(k / 150) + 4 * Math.sin(k / 53) : 5 * Math.sin(k / 170) + 2 * Math.sin(k / 61);
	};
	const trunkCurve: Curve = (t) => {
		const u = lerp(f.u0, f.uEnd, t);
		return xy(u, f.s0 + meander(u));
	};
	const total = stops.at(-1)!.minutes || 1;
	const uOf = (minutes: number) => lerp(f.u0, f.u1, minutes / total);
	const share = (u: number) => (u - f.u0) / (f.uEnd - f.u0);
	const rand = noise(orient === 'wide' ? 7 : 11);

	const branches = stops.map((stop, i): Branch => {
		const u = uOf(stop.minutes);
		const attach = xy(u, f.s0 + meander(u));
		const [tu, ts] = f.tips[i]!;
		const tip = xy(tu, ts);
		const A = { u, s: f.s0 + meander(u) };
		const du = tu - A.u;
		const ds = ts - A.s;
		const curve = cubic(attach, xy(A.u + du * 0.1, A.s + ds * 0.6), xy(A.u + du * 0.5, ts - ds * 0.08), tip);
		const level = stop.rank.level;
		const width = 2.2 + level * 0.45;

		// Twigs and leaves fill in with each rank.
		const twigs: Twig[] = [];
		const leaves: Leaf[] = [];
		const hits: Pt[] = Array.from({ length: 25 }, (_, k) => curve(k / 24));
		const tier = stop.rank.tier;
		const count = 1 + Math.floor(level / 3);
		for (let k = 0; k < count; k++) {
			const t = 0.42 + (0.4 * (k + 0.5)) / count;
			const p = curve(t);
			const side = k % 2 === 0 ? 1 : -1;
			const dir = deg(tangent(curve, t)) + side * (38 + rand() * 18);
			const len = (16 + level * 1.6 + rand() * 8) * (orient === 'wide' ? 1 : 0.65);
			const twig = shoot(p, dir, len, -side * 18);
			twigs.push({ shape: taper(twig, Math.max(1.2, width * 0.45), 0.6, 6), base: p });
			const end = twig(1);
			const endDir = deg(tangent(twig, 1));
			for (let k = 0; k <= 8; k++) hits.push(twig(k / 8));
			leaves.push({ x: end.x, y: end.y, angle: endDir + (rand() - 0.5) * 30, size: 7 + rand() * 3, tier });
			if (level >= 4) {
				const mid = twig(0.55);
				leaves.push({ x: mid.x, y: mid.y, angle: endDir - side * 55, size: 6 + rand() * 2, tier });
			}
		}
		// A crown of leaves just short of the tip, behind the badge.
		const crown = 1 + Math.ceil(level / 3);
		for (let k = 0; k < crown; k++) {
			const t = 0.62 + 0.24 * (k / crown);
			const p = curve(t);
			const side = k % 2 === 0 ? 1 : -1;
			leaves.push({ x: p.x, y: p.y, angle: deg(tangent(curve, t)) + side * (50 + rand() * 20), size: 6.5 + rand() * 3, tier });
		}

		// Labels: wide hangs above or below the tip; narrow reads to the right of it.
		const [m1, m2] = labelLines(stop, time);
		const w = Math.max(LABEL.badge + 10 + nameWidth(stop.rank.name), metaWidth(m1), metaWidth(m2));
		const h = LABEL.badge + 8 + LABEL.line * 2;
		let label: Label;
		if (orient === 'wide') {
			const up = ts < f.s0;
			const anchor = f.endLabels.includes(i) ? 'end' : 'start';
			const x = anchor === 'start' ? tip.x - 6 : tip.x + 6;
			const y = up ? tip.y - 18 - h : tip.y + 18;
			label = { x, y, anchor, box: { x: anchor === 'start' ? x : x - w, y, w, h } };
		} else {
			const x = tip.x + 30;
			const y = tip.y - LABEL.badge / 2;
			label = { x, y, anchor: 'start', box: { x, y, w, h } };
		}

		for (const l of leaves) {
			const a = (l.angle * Math.PI) / 180;
			hits.push({ x: l.x + Math.cos(a) * l.size * 1.7, y: l.y + Math.sin(a) * l.size * 1.7 });
		}
		return { stop, at: share(u), attach, tip, shape: taper(curve, width, 1.1), line: line(curve), twigs, leaves, label, hits };
	});

	// Sprigs fill the long stretches of trunk between ranks.
	const sprigs: Tree['sprigs'] = [];
	const us = branches.map((b) => (orient === 'wide' ? b.attach.x : b.attach.y));
	const gap = orient === 'wide' ? 52 : 70;
	for (let i = 0; i < us.length; i++) {
		const from = us[i]!;
		const to = us[i + 1] ?? f.uEnd;
		const n = Math.floor((to - from) / gap) - 1;
		for (let k = 1; k <= n; k++) {
			const u = from + ((to - from) * k) / (n + 1);
			const p = xy(u, f.s0 + meander(u));
			const side = (i + k) % 2 === 0 ? -1 : 1;
			// Wide: up or down off the trunk, leaning forward. Narrow: to the right only, short.
			const dir = orient === 'wide' ? side * (55 + rand() * 20) : 20 + rand() * 30;
			const twig = shoot(p, dir, 14 + rand() * 12, (orient === 'wide' ? -side : -1) * 25);
			const end = twig(1);
			const tier = branches[i]!.stop.rank.tier;
			sprigs.push({
				at: share(u),
				twig: { shape: taper(twig, 2, 0.6, 5), base: p },
				leaves: [
					{ x: end.x, y: end.y, angle: deg(tangent(twig, 1)), size: 6 + rand() * 2, tier },
					...(rand() > 0.5 ? [{ ...twig(0.5), angle: deg(tangent(twig, 0.5)) + side * 60, size: 5, tier }] : [])
				]
			});
		}
	}

	// Roots: a few short tendrils behind the start of the trunk.
	const root = trunkCurve(0);
	const back = orient === 'wide' ? 180 : -90;
	const roots = [-38, -12, 22, 46].map((a, k) => {
		const c = shoot(root, back + a, 18 + k * 5, a > 0 ? 20 : -20);
		return { shape: taper(c, 3.4 - k * 0.4, 0.5, 6), base: root };
	});

	// Hour marks along the axis, every two hours.
	const ticks: Tick[] = [];
	for (let hour = 0; hour * 60 <= total; hour += 2) {
		const u = uOf(hour * 60);
		const p = xy(u, f.axisS);
		ticks.push({ at: share(u), ...p, text: `${hour} h` });
	}
	const a0 = xy(f.u0, f.axisS);
	const a1 = xy(f.uEnd, f.axisS);

	return {
		orient,
		width: f.width,
		height: f.height,
		trunk: taper(trunkCurve, f.w0, f.w1, 40),
		trunkLine: line(trunkCurve, 24),
		roots,
		branches,
		sprigs,
		ticks,
		axis: `M${a0.x} ${a0.y} L${a1.x} ${a1.y}`
	};
}
