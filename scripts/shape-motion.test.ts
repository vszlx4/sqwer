import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DURATIONS, EASES } from '../apps/web/src/lib/motion/tokens.ts';

// Corners, CSS transitions and page-level stacking come from app.css tokens. Small z-index integers order siblings
// inside one component. A value off the scale carries an off-scale comment with its reason on the line.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const APP = readFileSync(join(SRC, 'app.css'), 'utf8');

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|css)$/.test(e.name) && e.name !== 'app.css' ? [path] : [];
	});
}

/** Style blocks only; markup and scripts become blank lines so offsets keep their line numbers. */
function styles(src: string, svelte: boolean): string {
	if (!svelte) return src;
	let inside = false;
	return src
		.split('\n')
		.map((line) => {
			if (/<style[^>]*>/.test(line)) inside = true;
			const out = inside ? line : '';
			if (/<\/style>/.test(line)) inside = false;
			return out;
		})
		.join('\n');
}

const RULES: [RegExp, (value: string) => boolean][] = [
	[/(?:^|[;{\s])border(?:-[a-z]+)*-radius\s*:\s*([^;{}]+);/g, (v) => /^((var\(--radius(-pill)?\)|0|50%|inherit)\s*)+$/.test(v)],
	[
		/(?:^|[;{\s])transition(?:-duration|-timing-function)?\s*:\s*([^;{}]+);/g,
		(v) =>
			!/!important/.test(v) &&
			!/cubic-bezier|\bease(-in|-out|-in-out)?\b(?!\))/.test(v.replace(/var\(--ease-[a-z]+\)/g, '')) &&
			![...v.matchAll(/(?<![\w-])(\d*\.?\d+)m?s\b/g)].some(([t, n]) => +n !== 0 && !/^0m?s$/.test(t))
	],
	[/(?:^|[;{\s])z-index\s*:\s*([^;{}]+);/g, (v) => /^var\(--z-[a-z]+\)$/.test(v) || (/^-?\d+$/.test(v) && Math.abs(+v) <= 5)]
];

describe('shape and motion tokens', () => {
	it('hold radius, transitions and z-index in component styles to app.css', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			const css = styles(readFileSync(path, 'utf8'), path.endsWith('.svelte'));
			const lines = css.split('\n');
			for (const [re, ok] of RULES) {
				for (const m of css.matchAll(re)) {
					const line = css.slice(0, m.index).split('\n').length + (m[0].startsWith('\n') ? 1 : 0);
					if (/off-scale:/.test(lines[line - 1] ?? '')) continue;
					const value = m[1].replace(/\s+/g, ' ').trim();
					if (!ok(value)) stray.push(`${rel}:${line}: ${value}`);
				}
			}
		}
		expect(stray).toEqual([]);
	});

	it('keep CSS transition steps equal to lib/motion', () => {
		const token = (name: string) => APP.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
		for (const [name, seconds] of Object.entries(DURATIONS)) expect(token(`dur-${name}`)).toBe(`${Math.round(seconds * 1000)}ms`);
		expect(token('ease-out')).toBe(`cubic-bezier(${EASES['out-expo'].join(', ')})`);
		expect(token('ease-spring')).toBe(`cubic-bezier(${EASES['spring-soft'].join(', ')})`);
	});
});
