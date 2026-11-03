import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Type in component styles comes from the app.css scale. A value off the scale carries an off-scale comment
// with its reason on the same line.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const DECL = /(?:^|[;{\s])(font-size|line-height|letter-spacing|font-weight)\s*:\s*([^;{}]+);/g;
const TOKEN: Record<string, RegExp> = {
	'font-size': /^(var\(--fs-[a-z0-9]+\)|inherit|[\d.]+em|[\d.]+%)$/,
	'line-height': /^(var\(--lh-[a-z]+\)|inherit|normal)$/,
	'letter-spacing': /^(var\(--tr-[a-z]+\)|inherit|normal|0)$/,
	'font-weight': /^(var\(--fw-[a-z]+\)|inherit|normal)$/
};

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|css)$/.test(e.name) && e.name !== 'app.css' ? [path] : [];
	});
}

/** Style blocks only; markup and scripts keep their line numbers as blank lines. */
function styles(src: string, svelte: boolean): string[] {
	if (!svelte) return src.split('\n');
	const lines = src.split('\n');
	let inside = false;
	return lines.map((line) => {
		if (/<style[^>]*>/.test(line)) inside = true;
		const out = inside ? line : '';
		if (/<\/style>/.test(line)) inside = false;
		return out;
	});
}

describe('type scale', () => {
	it('holds component type to the app.css tokens', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			styles(readFileSync(path, 'utf8'), path.endsWith('.svelte')).forEach((line, i) => {
				if (/off-scale:/.test(line)) return;
				for (const [, prop, raw] of line.matchAll(DECL)) {
					const value = raw.replace(/\s*!important$/, '').trim();
					if (!TOKEN[prop].test(value)) stray.push(`${rel}:${i + 1}: ${line.trim()}`);
				}
			});
		}
		expect(stray).toEqual([]);
	});
});
