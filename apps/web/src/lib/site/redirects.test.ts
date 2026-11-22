import { describe, expect, it } from 'vitest';
import { redirectFor } from './redirects.ts';

const to = (path: string) => redirectFor(new URL(path, 'https://sqwer.invalid'));

describe('redirectFor', () => {
	it('sends old addresses to their place in the area, keeping the rest', () => {
		expect(to('/exams')).toBe('/practice');
		expect(to('/exams/finger-speed')).toBe('/practice/finger-speed');
		expect(to('/play/listen')).toBe('/practice/play/listen');
		expect(to('/map?saved=3')).toBe('/practice/finger-map?saved=3');
		expect(to('/map/session')).toBe('/practice/finger-map/session');
		expect(to('/history/abc')).toBe('/account/history/abc');
		expect(to('/about')).toBe('/how-it-works');
		expect(to('/practice/history/abc?x=1')).toBe('/account/history/abc?x=1');
		expect(to('/admin/analytics?range=7d')).toBe('/account/admin/analytics?range=7d');
		expect(to('/account/voice')).toBe('/account/sound');
	});

	it('gives each test its own address', () => {
		expect(to('/test')).toBe('/practice/test/timed');
		expect(to('/test?exam=placement')).toBe('/practice/test/placement');
		expect(to('/test?exam=competitive')).toBe('/competitive/test');
		expect(to('/test?exam=nope&x=1')).toBe('/practice/test/timed?x=1');
	});

	it('leads parent paths to their list and leaves pages alone', () => {
		expect(to('/play')).toBe('/practice#games');
		expect(to('/practice/play/')).toBe('/practice#games');
		expect(to('/practice/test')).toBe('/practice');
		for (const path of ['/', '/practice', '/practice/test/timed', '/practice/play/race', '/competitive/test', '/learn/start', '/playground', '/testing']) {
			expect(to(path)).toBeNull();
		}
	});
});
