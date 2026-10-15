<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { Tween } from 'svelte/motion';

	/** A number that counts up to its value when it appears or changes; immediate when motion is reduced. */
	let { value, format = (n: number) => String(Math.round(n)), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number } = $props();

	const tween = new Tween(0);
	$effect(() => {
		const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		void tween.set(value, { duration: reduce ? 0 : duration, easing: cubicOut });
	});
</script>

{format(tween.current)}
