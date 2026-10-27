/**
 * Form-fill summary for risk scoring, posted as `signals`: key and paste counts, pointer use, focused fields,
 * open time, navigator.webdriver. No typed content; not stored.
 */
export function formSignals(form: HTMLFormElement) {
	const opened = performance.now();
	const counts = { k: 0, p: 0, f: 0, v: 0 };
	let lastMove = 0;
	const key = () => counts.k++;
	const press = () => counts.p++;
	const move = () => {
		// Moves are counted in buckets, at most a few per second.
		const now = performance.now();
		if (now - lastMove > 250) {
			lastMove = now;
			counts.p++;
		}
	};
	const focus = () => counts.f++;
	const paste = () => counts.v++;

	let field = form.querySelector<HTMLInputElement>('input[name="signals"]');
	if (!field) {
		field = document.createElement('input');
		field.type = 'hidden';
		field.name = 'signals';
		form.append(field);
	}
	const write = () => {
		field!.value = JSON.stringify({ ...counts, t: Math.round(performance.now() - opened), w: navigator.webdriver ? 1 : 0 });
	};
	write();

	form.addEventListener('keydown', key);
	form.addEventListener('pointerdown', press);
	form.addEventListener('pointermove', move, { passive: true });
	form.addEventListener('focusin', focus);
	form.addEventListener('paste', paste);
	// Capture phase, so the value is current before any other submit handler sends the form.
	form.addEventListener('submit', write, { capture: true });
	form.addEventListener('formdata', write);
	return () => {
		form.removeEventListener('keydown', key);
		form.removeEventListener('pointerdown', press);
		form.removeEventListener('pointermove', move);
		form.removeEventListener('focusin', focus);
		form.removeEventListener('paste', paste);
		form.removeEventListener('submit', write, { capture: true });
		form.removeEventListener('formdata', write);
	};
}
