/* The typed wordmark shared by the brand band and the finale: letters widened to the logo's proportions, with the
   curve's ✦ on the last letter. */

export const LETTERS = [...'sqwer'];

// The logo's letters, x-height to the tail of the q, in LogoWordmark units.
const LOGO_RATIO = 515.867 / 95.744;

// The ✦ of the curved loop on a 100 unit box: four points, each side bowing in through a control point near the
// centre.
export const STAR = (() => {
	const at = (deg: number, r: number) => {
		const a = (deg * Math.PI) / 180;
		return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
	};
	let d = `M${at(-90, 50)}`;
	for (let k = 0; k < 4; k++) d += `Q${at(-90 + 90 * k + 45, 8)} ${at(-90 + 90 * (k + 1), 50)}`;
	return `${d}Z`;
})();

/** How much wider the laid-out letters must get to match the logo's proportions, from their ink. */
export function stretch(word: HTMLElement, letters: HTMLElement): number {
	const css = getComputedStyle(word);
	const ctx = document.createElement('canvas').getContext('2d')!;
	ctx.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
	const els = [...letters.querySelectorAll<HTMLElement>('.letter')];
	const first = els[0]!;
	const last = els.at(-1)!;
	const left = first.offsetLeft - ctx.measureText(first.textContent ?? '').actualBoundingBoxLeft;
	const right = last.offsetLeft + ctx.measureText(last.textContent ?? '').actualBoundingBoxRight;
	const height = ctx.measureText('x').actualBoundingBoxAscent + ctx.measureText('q').actualBoundingBoxDescent;
	return Math.max(1, LOGO_RATIO / ((right - left) / height));
}

/** How far the star moves out to stay on the last letter while the letters widen by k from their middle. */
export const shift = (letters: HTMLElement, k: number) => ((k - 1) * letters.offsetWidth) / 2;
