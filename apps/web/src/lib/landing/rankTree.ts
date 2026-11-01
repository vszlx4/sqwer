import type { RankStop } from '#lib/courses/journey.ts';
import type { Tier } from '#lib/courses/progression.ts';

/*
 * Forked rank line. A straight trunk from Novice to Legend on linear course time, with milestone ranks forking off it
 * in straight runs joined by rounded corners. Built in (u, s) space, u along the trunk and s across it, then mapped
 * to x/y: wide runs left to right, narrow top to bottom with every fork on one side.
 */

export type Orient = 'wide' | 'narrow';
export interface Pt {
	x: number;
	y: number;
}
export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}
export interface Node {
	stop: RankStop;
	/** Share of the trunk where it starts, for timing. */
	at: number;
	/** Badge center. */
	pos: Pt;
	/** Path from the trunk to the badge; empty for the trunk's two ends. */
	fork: string;
	junction: Pt | null;
	/** Text block: left edge and first baseline. */
	text: Pt;
	box: Box;
	/** Sample points of the fork, for overlap checks. */
	hits: Pt[];
}
export interface Dot {
	level: number;
	at: number;
	pos: Pt;
	tier: Tier;
}
export interface Graph {
	orient: Orient;
	width: number;
	height: number;
	trunk: string;
	/** Trunk ends, for the tier gradient. */
	from: Pt;
	to: Pt;
	nodes: Node[];
	/** Ranks left off the graph, as small marks on the trunk. */
	dots: Dot[];
}

/** Milestones: one rank per badge material, first to last. */
export const SHOWN = [1, 3, 5, 7, 10] as const;

/** A fork: which side, how far its 45° climb goes, how long it runs on to the badge. */
interface Fork {
	side: 1 | -1;
	rise: number;
	run: number;
}

interface Frame {
	width: number;
	height: number;
	u0: number;
	u1: number;
	s0: number;
	/** Forks for ranks 3, 5 and 7; uneven on purpose. */
	forks: Fork[];
}

const FRAMES: Record<Orient, Frame> = {
	wide: {
		width: 1160,
		height: 400,
		u0: 46,
		u1: 990,
		s0: 196,
		forks: [
			{ side: 1, rise: 84, run: 70 },
			{ side: -1, rise: 118, run: 58 },
			{ side: 1, rise: 128, run: 84 }
		]
	},
	narrow: {
		width: 360,
		height: 860,
		u0: 40,
		u1: 800,
		s0: 40,
		forks: [
			{ side: 1, rise: 46, run: 48 },
			{ side: 1, rise: 72, run: 30 },
			{ side: 1, rise: 52, run: 62 }
		]
	}
};

export const BADGE = 34;
const RADIUS = 14;
/** Text block: name, then two lines of figures. */
export const TEXT = { name: 19, meta: 12.5, gap: 19 } as const;
const BLOCK_H = 66;

export function nodeLines(stop: RankStop, time: (minutes: number) => string): [string, string] {
	if (stop.wpm === null) return ['Lesson 1', 'Any speed'];
	return [`Lesson ${stop.lessons} · ${time(stop.minutes)}`, `${stop.wpm} WPM · ${stop.accuracy}%`];
}

const textWidth = (stop: RankStop, time: (minutes: number) => string) =>
	Math.max(stop.rank.name.length * TEXT.name * 0.5, ...nodeLines(stop, time).map((l) => l.length * TEXT.meta * 0.6));

const r1 = (n: number) => Math.round(n * 10) / 10;

export function buildGraph(stops: RankStop[], orient: Orient, time: (minutes: number) => string): Graph {
	const f = FRAMES[orient];
	const xy = (u: number, s: number): Pt => (orient === 'wide' ? { x: u, y: s } : { x: s, y: u });
	const total = stops.at(-1)!.minutes || 1;
	const uOf = (minutes: number) => f.u0 + ((f.u1 - f.u0) * minutes) / total;
	const share = (u: number) => (u - f.u0) / (f.u1 - f.u0);
	const shown = stops.filter((s) => (SHOWN as readonly number[]).includes(s.rank.level));
	// Text sits after the badge, first baseline a little above its center.
	const after = (pos: Pt) => ({ x: pos.x + BADGE / 2 + 12, y: pos.y - 14 });

	const nodes = shown.map((stop, i): Node => {
		const u = uOf(stop.minutes);
		const w = textWidth(stop, time);
		const block = (text: Pt) => ({ x: text.x, y: text.y - TEXT.name, w, h: BLOCK_H });

		if (i === 0 || i === shown.length - 1) {
			const pos = xy(u, f.s0);
			// Wide Novice reads above its badge, since the trunk runs on to its right.
			const text = orient === 'wide' && i === 0 ? { x: pos.x - BADGE / 2, y: pos.y - BADGE / 2 - 14 - BLOCK_H + TEXT.name } : after(pos);
			return { stop, at: share(u), pos, fork: '', junction: null, text, box: block(text), hits: [] };
		}

		// Off the trunk with a rounded turn, a straight 45° climb, a rounded turn back, a straight run to the badge.
		const { side, rise, run } = f.forks[i - 1]!;
		const k = RADIUS * Math.SQRT1_2;
		const s = (d: number) => f.s0 + side * d;
		const p = (uu: number, ss: number) => {
			const q = xy(uu, ss);
			return `${r1(q.x)} ${r1(q.y)}`;
		};
		// The turn starts at the junction, so no fork color lands on the trunk before it.
		const a = u + RADIUS;
		const fork = [
			`M${p(u, f.s0)}`,
			`Q${p(a, f.s0)} ${p(a + k, s(k))}`,
			`L${p(a + rise - k, s(rise - k))}`,
			`Q${p(a + rise, s(rise))} ${p(a + rise + RADIUS, s(rise))}`,
			`L${p(a + rise + run - BADGE / 2, s(rise))}`
		].join(' ');
		const pos = xy(a + rise + run, s(rise));
		const text = after(pos);
		const hits: Pt[] = [];
		for (let t = 0; t <= 1.001; t += 0.05) hits.push(xy(a + rise * t, s(rise * t)));
		for (let t = 0; t <= 1.001; t += 0.1) hits.push(xy(a + rise + (run - BADGE / 2) * t, s(rise)));
		return { stop, at: share(u), pos, fork, junction: xy(u, f.s0), text, box: block(text), hits };
	});

	// Ranks in between, as marks on the trunk, unless they would sit under a badge or a junction.
	const taken = nodes.map((n) => n.junction ?? n.pos);
	const dots = stops
		.filter((s) => !(SHOWN as readonly number[]).includes(s.rank.level))
		.map((s) => {
			const u = uOf(s.minutes);
			return { level: s.rank.level, at: share(u), pos: xy(u, f.s0), tier: s.rank.tier };
		})
		.filter((d) => taken.every((t) => Math.hypot(t.x - d.pos.x, t.y - d.pos.y) > BADGE));

	const from = xy(f.u0, f.s0);
	const to = xy(f.u1, f.s0);
	return { orient, width: f.width, height: f.height, trunk: `M${from.x} ${from.y} L${to.x} ${to.y}`, from, to, nodes, dots };
}
