import { gsap } from 'gsap';
import { describe, expect, it } from 'vitest';
import { motion } from './gsap';
import { LERP, step, wheelPixels } from './smooth-scroll';
import { bezier, cssEase, DURATIONS, EASES, type EaseName } from './tokens';

describe('motion tokens', () => {
	it('keeps the curves from MOTION.md', () => {
		expect(cssEase('out-expo')).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
		expect(cssEase('out-soft')).toBe('cubic-bezier(0.2, 0.7, 0.2, 1)');
		expect(cssEase('spring')).toBe('cubic-bezier(0.3, 1.6, 0.5, 1)');
	});

	it('orders durations from instant to reveal', () => {
		const values = Object.values(DURATIONS);
		expect(values).toEqual([...values].sort((a, b) => a - b));
		expect(DURATIONS.reveal).toBe(0.7);
	});

	it('solves bezier ends and overshoot', () => {
		expect(bezier(EASES['out-soft'], 0)).toBeCloseTo(0, 5);
		expect(bezier(EASES['out-soft'], 1)).toBeCloseTo(1, 5);
		const peak = Math.max(...Array.from({ length: 99 }, (_, i) => bezier(EASES.spring, (i + 1) / 100)));
		expect(peak).toBeGreaterThan(1);
	});
});

describe('motion()', () => {
	it('registers every named ease to match its curve', () => {
		motion();
		for (const name of Object.keys(EASES) as EaseName[]) {
			const ease = gsap.parseEase(name);
			expect(ease, name).toBeTypeOf('function');
			for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
				expect(ease(t), `${name} at ${t}`).toBeCloseTo(bezier(EASES[name], t), 2);
			}
		}
	});

	it('is idempotent', () => {
		expect(motion()).toBe(motion());
	});
});

describe('smooth scroll', () => {
	it('converts wheel deltas to pixels', () => {
		expect(wheelPixels({ deltaY: 120, deltaMode: 0 }, 800)).toBe(120);
		expect(wheelPixels({ deltaY: 3, deltaMode: 1 }, 800)).toBe(48);
		expect(wheelPixels({ deltaY: -1, deltaMode: 2 }, 800)).toBe(-800);
	});

	it('eases towards the target at any frame rate and settles', () => {
		expect(step(0, 100, 1)).toBeCloseTo(100 * LERP, 5);
		// Two 120 fps frames cover what one 60 fps frame does.
		expect(step(step(0, 100, 0.5), 100, 0.5)).toBeCloseTo(step(0, 100, 1), 5);
		expect(step(99.7, 100, 1)).toBe(100);
		let y = 0;
		for (let i = 0; i < 200 && y !== 500; i++) y = step(y, 500, 1);
		expect(y).toBe(500);
	});
});
