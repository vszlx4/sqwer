<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { sectionOf, usage } from './store.svelte.ts';

	// Counts active time only: the page is visible and was used within the last minute.
	const IDLE_MS = 60_000;
	const TICK_MS = 5_000;

	onMount(() => {
		let lastInput = Date.now();
		let lastTick = Date.now();
		const active = () => (lastInput = Date.now());
		const events = ['keydown', 'pointerdown', 'pointermove', 'wheel', 'touchstart', 'scroll'] as const;
		for (const e of events) window.addEventListener(e, active, { passive: true });

		usage.load().then(() => usage.visit());

		const flush = () => {
			const now = Date.now();
			const idle = now - lastInput > IDLE_MS || document.visibilityState !== 'visible';
			if (!idle) usage.tick(sectionOf(page.url.pathname), Math.min(now - lastTick, TICK_MS * 2));
			lastTick = now;
		};
		const timer = setInterval(flush, TICK_MS);
		const saveTimer = setInterval(() => usage.save(), 30_000);
		const onHide = () => {
			flush();
			usage.save();
			usage.sync(true);
		};
		const onVisibility = () => {
			if (document.visibilityState === 'hidden') onHide();
			else lastTick = Date.now();
		};
		document.addEventListener('visibilitychange', onVisibility);
		window.addEventListener('pagehide', onHide);

		return () => {
			clearInterval(timer);
			clearInterval(saveTimer);
			for (const e of events) window.removeEventListener(e, active);
			document.removeEventListener('visibilitychange', onVisibility);
			window.removeEventListener('pagehide', onHide);
		};
	});
</script>
