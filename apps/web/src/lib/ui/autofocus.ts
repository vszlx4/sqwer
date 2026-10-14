import type { Action } from 'svelte/action';

/** Moves keyboard focus to the element when it appears, without scrolling the page. */
export const autofocus: Action<HTMLElement> = (node) => {
	requestAnimationFrame(() => node.focus({ preventScroll: true }));
};
