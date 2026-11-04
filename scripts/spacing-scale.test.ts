import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Margin, padding and gap come from the app.css spacing scale (1px hairlines aside); container widths of 420px
// and up from the width tokens. A value off the scale carries an off-scale comment with its reason on the line.
const SRC = fileURLToPath(new URL('../apps/web/src', import.meta.url));
const SPACING =
	/(?:^|[;{\s])((?:margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|gap|row-gap|column-gap)\s*:\s*([^;{}]+);/g;
const WIDTH = /(?:^|[;{\s])(width|max-width)\s*:\s*([^;{}]+);/g;
const PX = /(\d*\.?\d+)px\b/g;

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
	let inside = false;
	return src.split('\n').map((line) => {
		if (/<style[^>]*>/.test(line)) inside = true;
		const out = inside ? line : '';
		if (/<\/style>/.test(line)) inside = false;
		return out;
	});
}

describe('spacing scale', () => {
	it('holds margin, padding, gap and container widths to the app.css tokens', () => {
		const stray: string[] = [];
		for (const path of files(SRC)) {
			const rel = relative(SRC, path);
			styles(readFileSync(path, 'utf8'), path.endsWith('.svelte')).forEach((line, i) => {
				if (/off-scale:/.test(line)) return;
				const raw = [
					...[...line.matchAll(SPACING)].flatMap(([, , v]) => [...v.matchAll(PX)].filter(([, n]) => +n > 1)),
					...[...line.matchAll(WIDTH)].flatMap(([, , v]) => [...v.matchAll(PX)].filter(([, n]) => +n >= 420))
				];
				if (raw.length) stray.push(`${rel}:${i + 1}: ${line.trim()}`);
			});
		}
		expect(stray).toEqual([]);
	});
});
