// sqwer: parses CSS colours in code, so React Bits components no longer depend on reading a pixel back from a
// canvas. Browsers with fingerprinting protection (Zen, Firefox with resistFingerprinting, Brave, Safari's
// advanced protection) randomise or blank that read-back, which turned every colour white or noisy and made the
// backgrounds invisible. Returns [r, g, b, a] in 0..255, or null for anything it does not parse (callers then
// fall back to the canvas read-back).

const NAMED: Record<string, [number, number, number, number]> = {
	transparent: [0, 0, 0, 0],
	white: [255, 255, 255, 255],
	black: [0, 0, 0, 255]
};

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

export function readCssColour(input: unknown): number[] | null {
	if (typeof input !== 'string') return null;
	const value = input.trim().toLowerCase();
	if (NAMED[value]) return [...NAMED[value]];
	const hex = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
	if (hex) {
		let h = hex[1];
		if (h.length <= 4) h = [...h].map((c) => c + c).join('');
		const n = (i: number) => parseInt(h.slice(i, i + 2), 16);
		return [n(0), n(2), n(4), h.length === 8 ? n(6) : 255];
	}
	const fn = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(value);
	if (fn) {
		const ch = (s: string) => (s.endsWith('%') ? (parseFloat(s) / 100) * 255 : parseFloat(s));
		const alpha = fn[4] === undefined ? 255 : fn[4].endsWith('%') ? (parseFloat(fn[4]) / 100) * 255 : parseFloat(fn[4]) * 255;
		return [clamp(ch(fn[1])), clamp(ch(fn[2])), clamp(ch(fn[3])), clamp(alpha)];
	}
	return null;
}
