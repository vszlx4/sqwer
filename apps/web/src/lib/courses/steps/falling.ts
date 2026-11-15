/** Field height in lessons; endless runs can fill the screen instead. */
export const HEIGHT = 420;
/** Drops start this far above the field and land this far above its bottom. */
export const TOP = 40;
export const FLOOR = 46;
/** Speed scale for a taller field, so a drop takes the same time to land at any height. */
export const fallScale = (height: number) => (Math.max(HEIGHT, height) - FLOOR + TOP) / (HEIGHT - FLOOR + TOP);
