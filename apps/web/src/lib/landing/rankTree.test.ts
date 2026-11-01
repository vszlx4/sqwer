import { describe, expect, it } from 'vitest';
import { rankJourney, roughTime } from '#lib/courses/journey.ts';
import { buildTree, type Orient } from './rankTree.ts';

const stops = rankJourney();

describe.each<Orient>(['wide', 'narrow'])('the %s rank tree', (orient) => {
	const tree = buildTree(stops, orient, roughTime);
	const boxes = tree.branches.map((b) => b.label.box);

	it('has a branch per rank, rooted along the trunk in time order', () => {
		expect(tree.branches).toHaveLength(stops.length);
		const ats = tree.branches.map((b) => b.at);
		expect(ats).toEqual([...ats].sort((a, b) => a - b));
		expect(ats[0]).toBe(0);
		expect(ats.at(-1)!).toBeLessThan(1);
	});

	it('keeps every label inside the canvas', () => {
		for (const b of boxes) {
			expect(b.x).toBeGreaterThanOrEqual(0);
			expect(b.y).toBeGreaterThanOrEqual(0);
			expect(b.x + b.w).toBeLessThanOrEqual(tree.width);
			expect(b.y + b.h).toBeLessThanOrEqual(tree.height);
		}
	});

	it('never overlaps two labels', () => {
		for (let i = 0; i < boxes.length; i++)
			for (let j = i + 1; j < boxes.length; j++) {
				const a = boxes[i]!;
				const b = boxes[j]!;
				const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
				expect(apart, `${stops[i]!.rank.name} and ${stops[j]!.rank.name}`).toBe(true);
			}
	});

	it('keeps wood and leaves clear of every label', () => {
		for (const b of tree.branches)
			for (const p of b.hits)
				for (const [j, box] of boxes.entries()) {
					const inside = p.x > box.x - 2 && p.x < box.x + box.w + 2 && p.y > box.y - 2 && p.y < box.y + box.h + 2;
					expect(inside, `${b.stop.rank.name} wood in ${stops[j]!.rank.name} label at ${Math.round(p.x)},${Math.round(p.y)}`).toBe(false);
				}
	});

	it('grows fuller with each rank', () => {
		const leaves = tree.branches.map((b) => b.leaves.length);
		for (let i = 1; i < leaves.length; i++) expect(leaves[i]!).toBeGreaterThanOrEqual(leaves[i - 1]!);
	});

	it('is the same on every build', () => {
		expect(buildTree(stops, orient, roughTime)).toEqual(tree);
	});
});
