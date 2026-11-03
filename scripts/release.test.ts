import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without types
import { next, releaseBranch } from './release.mjs';

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

	it('bumps one step for a hotfix', () => {
		expect(next('1.0.0-beta.1', 'bump')).toBe('1.0.0-beta.2');
		expect(next('1.0.0-rc.3', 'bump')).toBe('1.0.0-rc.4');
		expect(next('1.0.0', 'bump')).toBe('1.0.1');
	});

	it('refuses ambiguous steps', () => {
		expect(() => next('1.0.0-rc.1', 'beta')).toThrow();
		expect(() => next('1.0.0', 'stable')).toThrow();
		expect(() => next('1.0.0-beta.1', 'patch')).toThrow();
		expect(() => next('1.0', 'patch')).toThrow();
	});

	it('names version branches so the naming check accepts them', () => {
		// Same pattern as .github/workflows/pr-hygiene.yml.
		const allowed = /^(feat|fix|docs|chore|refactor|test|design|security)\/[a-z0-9][a-z0-9-]*$/;
		expect(releaseBranch('1.0.0-beta.32')).toBe('chore/release-1-0-0-beta-32');
		for (const v of ['1.0.0-alpha.1', '1.0.0-rc.12', '1.0.0', '2.10.3']) expect(releaseBranch(v)).toMatch(allowed);
	});

	it('matches the pattern the naming check uses', () => {
		const workflow = readFileSync(new URL('../.github/workflows/pr-hygiene.yml', import.meta.url), 'utf8');
		expect(workflow).toContain('^(feat|fix|docs|chore|refactor|test|design|security)/[a-z0-9][a-z0-9-]*$');
	});
});
