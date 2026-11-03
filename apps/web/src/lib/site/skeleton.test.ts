import { describe, expect, it } from 'vitest';
import { skeletonKind } from './skeleton.ts';

describe('skeletonKind', () => {
	it('shapes profiles and account pages', () => {
		expect(skeletonKind('/u/someone')).toBe('profile');
		expect(skeletonKind('/account/statistics')).toBe('profile');
	});

	it('shapes exercises', () => {
		for (const path of ['/learn/home-row', '/test', '/play/race', '/exams/finger-speed', '/map/session']) expect(skeletonKind(path)).toBe('exercise');
	});

	it('falls back to a plain page', () => {
		for (const path of ['/', '/learn', '/learn/start', '/exams', '/competitive', '/history/abc']) expect(skeletonKind(path)).toBe('page');
	});
});
