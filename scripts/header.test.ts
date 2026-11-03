import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The navbar is a solid pill in the theme surface (#108). No glass, frost or see-through bar, in either theme.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const HEADER = join(SRC, 'lib/site/SiteHeader.svelte');

function files(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const path = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'assets' ? [] : files(path);
		return /\.(svelte|ts|css)$/.test(e.name) ? [path] : [];
	});
}

describe('site header', () => {
	it('has no glass: no backdrop filter, blur or see-through background', () => {
		const css = readFileSync(HEADER, 'utf8');
		expect(css).not.toMatch(/glass/i);
		expect(css).not.toMatch(/backdrop-filter/);
		expect(css).not.toMatch(/blur\(/);
		// Every background in the header is a plain token; mixes with transparent would let the page show through.
		const backgrounds = [...css.matchAll(/^\s*background(?:-color)?:\s*([^;]+);/gm)].map((m) => m[1]!.trim());
		expect(backgrounds.length).toBeGreaterThan(0);
		for (const value of backgrounds) expect(value).toMatch(/^var\(--[a-z0-9-]+\)$/);
	});

	it('has no glass component left to bring back', () => {
		expect(existsSync(join(SRC, 'lib/bits/GlassSurface.svelte'))).toBe(false);
		const users = files(SRC).filter((f) => /GlassSurface|--glass-/.test(readFileSync(f, 'utf8')));
		expect(users.map((f) => relative(SRC, f))).toEqual([]);
	});
});
