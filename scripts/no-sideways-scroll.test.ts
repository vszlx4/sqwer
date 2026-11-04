import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Nothing scrolls sideways: no horizontal scrollers and no snap rails. A scroll area clips x (overflow: hidden auto);
// overflow-y alone would compute x to auto as well.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const SIDEWAYS = /(?:^|[;{\s])(overflow(?:-x|-y)?\s*:\s*[^;{}]+|scroll-snap-type\s*:\s*[^;{}]*\b(x|both|inline)\b[^;{}]*);/g;

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|css)$/.test(e.name) ? [path] : [];
	});
}

function scrollsSideways(decl: string): boolean {
	if (/^scroll-snap-type/.test(decl)) return true;
	const [prop, value] = decl.split(/\s*:\s*/);
	const parts = value.trim().split(/\s+/);
	if (prop === 'overflow-x') return /auto|scroll/.test(value);
	if (prop === 'overflow-y') return /auto|scroll/.test(value);
	return /auto|scroll/.test(parts[0]);
}

describe('no sideways scroll', () => {
	it('has no horizontal scrollers in styles', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			readFileSync(path, 'utf8')
				.split('\n')
				.forEach((line, i) => {
					for (const [, decl] of line.matchAll(SIDEWAYS)) if (scrollsSideways(decl)) stray.push(`${rel}:${i + 1}: ${line.trim()}`);
				});
		}
		expect(stray).toEqual([]);
	});
});
