import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Colors live in app.css tokens. Literal colors elsewhere make recoloring miss things.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
// Files allowed to hold literal colors, each with its reason in the file.
const ALLOWED = new Set(['app.css', 'lib/progress/rank-art.ts', 'lib/site/areas.ts', 'lib/site/areas.test.ts']);
const COLOR = /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z-])|\brgba?\(|\bhsla?\(/;
// Lines that may carry a literal: theme-color metas (no CSS there) and masks (alpha only).
const EXEMPT = /theme-color|meta\.content|mask-image/;

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|ts|css|html)$/.test(e.name) ? [path] : [];
	});
}

describe('colors', () => {
	it('come from app.css tokens, not literals in components', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			if (ALLOWED.has(rel)) continue;
			readFileSync(path, 'utf8')
				.split('\n')
				.forEach((line, i) => {
					if (COLOR.test(line) && !EXEMPT.test(line)) stray.push(`${rel}:${i + 1}: ${line.trim()}`);
				});
		}
		expect(stray).toEqual([]);
	});
});
