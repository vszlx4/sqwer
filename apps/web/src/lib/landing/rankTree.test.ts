import { describe, expect, it } from 'vitest';
import { rankJourney, roughTime } from '#lib/courses/journey.ts';
import { BADGE, SHOWN, buildGraph, type Orient } from './rankTree.ts';

const stops = rankJourney();

describe.each<Orient>(['wide', 'narrow'])('the %s rank fork graph', (orient) => {
	const graph = buildGraph(stops, orient, roughTime);
	const boxes = graph.nodes.map((n) => n.box);
	// Badges count as boxes too.
	const solids = [...boxes, ...graph.nodes.map((n) => ({ x: n.pos.x - BADGE / 2, y: n.pos.y - BADGE / 2, w: BADGE, h: BADGE }))];

	it('runs from Novice to Legend through the milestones, in time order', () => {
		expect(graph.nodes.map((n) => n.stop.rank.level)).toEqual([...SHOWN]);
		const ats = graph.nodes.map((n) => n.at);
		expect(ats).toEqual([...ats].sort((a, b) => a - b));
		expect(ats[0]).toBe(0);
		expect(ats.at(-1)).toBe(1);
	});

	it('keeps every text block inside the canvas', () => {
		for (const b of boxes) {
			expect(b.x).toBeGreaterThanOrEqual(0);
			expect(b.y).toBeGreaterThanOrEqual(0);
			expect(b.x + b.w).toBeLessThanOrEqual(graph.width);
			expect(b.y + b.h).toBeLessThanOrEqual(graph.height);
		}
	});

	it('never overlaps two text blocks or badges', () => {
		for (let i = 0; i < solids.length; i++)
			for (let j = i + 1; j < solids.length; j++) {
				const a = solids[i]!;
				const b = solids[j]!;
				const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
				if (i % graph.nodes.length !== j % graph.nodes.length) expect(apart, `${i} and ${j}`).toBe(true);
			}
	});

	it('keeps forks and the trunk clear of every text block', () => {
		const trunk = Array.from({ length: 200 }, (_, k) => ({
			x: graph.from.x + ((graph.to.x - graph.from.x) * k) / 199,
			y: graph.from.y + ((graph.to.y - graph.from.y) * k) / 199
		}));
		for (const p of [...trunk, ...graph.nodes.flatMap((n) => n.hits)])
			for (const [j, b] of boxes.entries())
				expect(p.x > b.x - 2 && p.x < b.x + b.w + 2 && p.y > b.y - 2 && p.y < b.y + b.h + 2, `${graph.nodes[j]!.stop.rank.name} at ${p.x},${p.y}`).toBe(false);
	});

	it('marks the ranks in between on the trunk', () => {
		for (const d of graph.dots) expect(SHOWN as readonly number[]).not.toContain(d.level);
		expect(graph.dots.length).toBeGreaterThan(0);
	});
});
