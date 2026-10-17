/*
 * Keyboard behaviour shared by the whole site.
 *
 * 1. Space never scrolls a page. It still presses a focused button, ticks a checkbox and types in a
 *    text field, as people expect.
 * 2. While a typing surface is running (a test, a lesson exercise, a game, the finger map), it keeps
 *    the keyboard: Space never scrolls or presses a button, keys pressed while something else has
 *    focus are sent to it, and after a click anywhere (except into a text field, a menu or a dialog)
 *    focus returns to it.
 *
 * Typing surfaces call `claimTyping` while they are active; the guards are installed once, in the
 * root layout.
 */

export interface TypingSurface {
	/** Give the surface the keyboard: focus its input, or clear focus for games that listen on the window. */
	focus: () => void;
	/** For surfaces with their own input: handle a key that arrived while something else had focus. */
	key?: (e: KeyboardEvent) => void;
}

/** Where a key types text itself. */
const TEXT_ENTRY =
	'textarea, select, [contenteditable]:not([contenteditable="false"]), input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="range"]):not([type="color"]):not([type="file"])';
/** Controls that Space presses or toggles. */
const PRESSABLE =
	'button, a[href], summary, label, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"], input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="reset"]';
/** Places that keep focus while they are open. */
const KEEPS_FOCUS = 'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';

const surfaces: TypingSurface[] = [];
const top = () => surfaces.at(-1) ?? null;

/** Registers an active typing surface; returns the function that releases it. */
export function claimTyping(surface: TypingSurface): () => void {
	surfaces.push(surface);
	return () => {
		const i = surfaces.lastIndexOf(surface);
		if (i >= 0) surfaces.splice(i, 1);
	};
}

/** Clears focus from whatever has it, for surfaces that listen on the window. */
export function releaseFocus() {
	const el = document.activeElement as HTMLElement | null;
	if (el && el !== document.body) el.blur();
}

const closest = (target: EventTarget | null, selector: string) => (target instanceof Element ? target.closest(selector) : null);

function onKeydown(e: KeyboardEvent) {
	if (e.defaultPrevented || e.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
	const surface = top();
	const inText = !!closest(e.target, TEXT_ENTRY);
	const onControl = !!closest(e.target, PRESSABLE);

	if (!surface) {
		// Space scrolls only when nothing else would use it.
		if (e.key === ' ' && !inText && !onControl) e.preventDefault();
		return;
	}
	if (inText || closest(e.target, KEEPS_FOCUS)) return;
	if (e.key === ' ' || ((e.key.length === 1 || e.key === 'Backspace') && onControl)) {
		// The key belongs to the exercise, not to the button or page that happens to have focus.
		e.preventDefault();
		if (onControl) {
			e.stopImmediatePropagation();
			releaseFocus();
			surface.focus();
			if (surface.key) surface.key(e);
			// Games listen on the window: the same key again, now from the page instead of the button.
			else document.body.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, code: e.code, shiftKey: e.shiftKey, repeat: e.repeat, bubbles: true, cancelable: true }));
		}
	}
}

function onPointerUp(e: PointerEvent) {
	if (!top() || closest(e.target, TEXT_ENTRY) || closest(e.target, KEEPS_FOCUS)) return;
	// After the click has done its work (a button may open a dialog or leave the page).
	setTimeout(() => {
		const surface = top();
		if (!surface) return;
		const active = document.activeElement;
		if (closest(active, KEEPS_FOCUS) || (closest(active, TEXT_ENTRY) && active !== document.body)) {
			// A dialog or another text field took focus on purpose; the surface's own input is the exception.
			if (!(active instanceof HTMLElement && active.dataset.typingInput !== undefined)) return;
		}
		surface.focus();
	}, 0);
}

function onWindowFocus() {
	const active = document.activeElement;
	if (closest(active, KEEPS_FOCUS)) return;
	top()?.focus();
}

/** Installs the guards once for the page; returns the function that removes them. */
export function installKeyboardGuards(): () => void {
	window.addEventListener('keydown', onKeydown, true);
	document.addEventListener('pointerup', onPointerUp, true);
	window.addEventListener('focus', onWindowFocus);
	return () => {
		window.removeEventListener('keydown', onKeydown, true);
		document.removeEventListener('pointerup', onPointerUp, true);
		window.removeEventListener('focus', onWindowFocus);
	};
}
