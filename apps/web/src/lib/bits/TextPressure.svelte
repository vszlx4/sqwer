<!--
	Svelte Bits: Text Pressure
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/text-pressure.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: driven by a `pressure` prop (0 to 1, scroll on the landing page) instead of the pointer: a crest of weight
	sweeps across the letters while the whole line thickens; no rAF loop, letters update only when pressure moves;
	weight axis only (range by props), on the mono variable font token (no remote font, no width or italic axes); size inherited
	from the parent instead of fitted; no fixed colours (currentColor); h1 swapped for a span, letters aria-hidden
	under one aria-label, `.char` on each for outside timelines; optional accents flash on some letters as the crest
	passes; width and stroke options dropped.
-->
<script lang="ts">
	type Props = {
		text: string;
		/** 0 is a light line, 1 a heavy one; in between a crest of weight crosses the letters. */
		pressure?: number;
		/** Weight range on the font's wght axis. */
		min?: number;
		max?: number;
		/** Colors (any CSS color) some letters flash to as the crest passes them, then fade back from. */
		accents?: string[];
		class?: string;
	};

	let { text, pressure = 0, min = 100, max = 900, accents = [], class: className = '' }: Props = $props();
	// Crest half-width, as a fraction of the line.
	const SPREAD = 0.28;

	const chars = $derived([...text]);

	function weight(i: number, p: number) {
		const at = chars.length > 1 ? i / (chars.length - 1) : 0.5;
		// The crest enters left of the first letter and leaves right of the last.
		const crest = -SPREAD + p * (1 + 2 * SPREAD);
		const near = Math.max(0, 1 - Math.abs(at - crest) / SPREAD);
		const base = min + (max - min) * p;
		return Math.round(Math.max(base, min + (max - min) * near));
	}

	// Every third letter (spaces skipped) takes the next accent; it shows only near the crest, so it comes and goes.
	const tinted = $derived.by(() => {
		let n = 0;
		return chars.map((c) => (c === ' ' ? null : n++ % 3 === 1 ? accents[Math.floor(n / 3) % accents.length] ?? null : null));
	});

	function tint(i: number, p: number) {
		const accent = tinted[i];
		if (!accent || p <= 0 || p >= 1) return undefined;
		const at = chars.length > 1 ? i / (chars.length - 1) : 0.5;
		const crest = -SPREAD + p * (1 + 2 * SPREAD);
		const near = Math.max(0, 1 - Math.abs(at - crest) / (SPREAD * 0.7));
		return near > 0 ? `color-mix(in srgb, ${accent} ${Math.round(near * 100)}%, currentColor)` : undefined;
	}
</script>

<span class="pressure {className}" aria-label={text} role="img">
	{#each chars as char, i (i)}
		<span class="char" aria-hidden="true" style:font-variation-settings="'wght' {weight(i, pressure)}" style:color={tint(i, pressure)}>{char === ' ' ? ' ' : char}</span>
	{/each}
</span>

<style>
	.pressure {
		display: inline-flex;
		justify-content: center;
		font-family: var(--font-mono);
		text-transform: uppercase;
		white-space: nowrap;
		user-select: none;
	}
	.pressure > span {
		display: inline-block;
	}
</style>
