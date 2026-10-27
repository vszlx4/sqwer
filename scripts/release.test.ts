import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { next } from './release.mjs';

describe('release versions', () => {
	it('continues and advances pre-release stages', () => {
		expect(next('1.0.0-beta.1', 'beta')).toBe('1.0.0-beta.2');
		expect(next('1.0.0-alpha.3', 'beta')).toBe('1.0.0-beta.1');
		expect(next('1.0.0-beta.4', 'rc')).toBe('1.0.0-rc.1');
		expect(next('1.0.0-rc.2', 'stable')).toBe('1.0.0');
	});

	it('bumps stable versions', () => {
		expect(next('1.0.0', 'patch')).toBe('1.0.1');
		expect(next('1.2.3', 'minor')).toBe('1.3.0');
		expect(next('1.2.3', 'major')).toBe('2.0.0');
	});

	it('starts a pre-release from a stable version', () => {
		expect(next('1.0.0', 'beta')).toBe('1.0.1-beta.1');
		expect(next('1.0.0', 'beta', 'minor')).toBe('1.1.0-beta.1');
		expect(next('1.4.2', 'rc', 'major')).toBe('2.0.0-rc.1');
	});

	it('refuses ambiguous steps', () => {
		expect(() => next('1.0.0-rc.1', 'beta')).toThrow();
		expect(() => next('1.0.0', 'stable')).toThrow();
		expect(() => next('1.0.0-beta.1', 'patch')).toThrow();
		expect(() => next('1.0', 'patch')).toThrow();
	});
});
