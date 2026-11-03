import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BREAKPOINTS } from '../apps/web/src/lib/site/breakpoints.ts';

// Width queries use the five breakpoints only: max-width at a step, min-width one pixel above it.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const QUERY = /\((max|min)-width:\s*(\d+)px\)/g;
const STEPS = new Set<number>(Object.values(BREAKPOINTS));

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|ts|css)$/.test(e.name) ? [path] : [];
	});
}

describe('breakpoints', () => {
	it('come from lib/site/breakpoints.ts', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			readFileSync(path, 'utf8')
				.split('\n')
				.forEach((line, i) => {
					for (const [, kind, px] of line.matchAll(QUERY)) {
						const step = kind === 'max' ? +px : +px - 1;
						if (!STEPS.has(step)) stray.push(`${rel}:${i + 1}: ${line.trim()}`);
					}
				});
		}
		expect(stray).toEqual([]);
	});

	it('run widest first', () => {
		const px = Object.values(BREAKPOINTS);
		expect(px).toEqual([...px].sort((a, b) => b - a));
	});
});
