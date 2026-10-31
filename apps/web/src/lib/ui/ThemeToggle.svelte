<script lang="ts">
	import { onMount } from 'svelte';
	import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
	import { motion, REDUCED } from '#lib/motion/gsap.ts';
	import { DURATIONS } from '#lib/motion/tokens.ts';
	import { saveSettings, settings, type ThemePref } from '#lib/settings.svelte.ts';

	// One button cycles light → dark → system; the icon morphs between sun, moon and a half disc.
	const ORDER: ThemePref[] = ['light', 'dark', 'system'];
	const LABEL: Record<ThemePref, string> = { light: 'Light', dark: 'Dark', system: 'System' };
	// 24×24 shapes for the core path. Sun core, moon crescent, left half of a disc.
	const SHAPE: Record<ThemePref, string> = {
		light: 'M12 7.5a4.5 4.5 0 1 1 0 9a4.5 4.5 0 1 1 0-9z',
		dark: 'M20 14.6A8 8 0 1 1 9.4 4a6.3 6.3 0 0 0 10.6 10.6z',
		system: 'M12 4a8 8 0 0 0 0 16z'
	};
	const RAYS = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);

	// The saved theme is only known in the browser; show the default until then.
	let mounted = $state(false);
	const current = $derived<ThemePref>(mounted ? settings.theme : 'light');
	const next = $derived(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!);

	let core: SVGPathElement;
	let rays: SVGGElement;
	let ring: SVGCircleElement;

	function show(theme: ThemePref, animate: boolean) {
		const gsap = motion();
		const d = animate && !window.matchMedia(REDUCED).matches ? DURATIONS.slow : 0;
		const sun = theme === 'light';
		gsap.to(core, { morphSVG: SHAPE[theme], duration: d, ease: 'out-expo', overwrite: 'auto' });
		gsap.to(rays, { opacity: sun ? 1 : 0, scale: sun ? 1 : 0.5, rotate: sun ? 0 : -45, svgOrigin: '12 12', duration: d, ease: 'out-expo', overwrite: 'auto' });
		gsap.to(ring, { opacity: theme === 'system' ? 1 : 0, duration: d, ease: 'out-soft', overwrite: 'auto' });
	}

	onMount(() => {
		motion().registerPlugin(MorphSVGPlugin);
		mounted = true;
	});

	function cycle() {
		settings.theme = next;
		saveSettings();
	}

	// Animates whenever the setting changes; the first run only sets the saved theme.
	let shown: ThemePref | null = null;
	$effect(() => {
		const theme = current;
		if (!mounted || theme === shown) return;
		show(theme, shown !== null);
		shown = theme;
	});
</script>

<button
	type="button"
	class="theme"
	onclick={cycle}
	aria-label={`Theme: ${LABEL[current]}. Switch to ${LABEL[next].toLowerCase()}`}
	title={`Theme: ${LABEL[current]}`}
>
	<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
		<g bind:this={rays} class="rays">
			{#each RAYS as a (a)}
				<line x1={12 + Math.cos(a) * 7} y1={12 + Math.sin(a) * 7} x2={12 + Math.cos(a) * 9.5} y2={12 + Math.sin(a) * 9.5} />
			{/each}
		</g>
		<circle bind:this={ring} class="ring" cx="12" cy="12" r="8" opacity="0" />
		<path bind:this={core} d={SHAPE.light} fill="currentColor" />
	</svg>
</button>

<style>
	.theme {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 999px;
		color: var(--ink);
		cursor: pointer;
		transition: background-color 140ms ease;
	}
	.theme:hover {
		background: color-mix(in srgb, var(--surface) 80%, transparent);
	}
	.theme:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.rays line {
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
	}
	.ring {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.6;
	}
</style>
