import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AREAS, areaFor, areaRgb } from './areas';

describe('areas', () => {
	it('maps routes to their area and leaves the rest neutral', () => {
		expect(areaFor('/learn')).toBe('learn');
		expect(areaFor('/learn/home-row-1')).toBe('learn');
		expect(areaFor('/test')).toBe('practice');
		expect(areaFor('/competitive')).toBe('competitive');
		expect(areaFor('/map/session')).toBe('map');
		expect(areaFor('/play/falling')).toBe('games');
		expect(areaFor('/')).toBeNull();
		expect(areaFor('/account')).toBeNull();
		expect(areaFor('/testing')).toBeNull();
	});

	it('gives the dither one 0-1 color per area', () => {
		expect(areaRgb()).toHaveLength(Object.keys(AREAS).length);
		expect(areaRgb()[0]).toEqual([0.8, 249 / 255, 0]);
	});

	it('keeps app.css in step with the area colors', () => {
		const css = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');
		for (const [area, { color }] of Object.entries(AREAS)) expect(css).toContain(`--area-${area}: ${color};`);
	});
});
