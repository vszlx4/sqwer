<!--
	Svelte Bits: Card Swap
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/card-swap.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: controlled by an `active` index (scroll-driven on the landing page) instead of an interval, hover pause
	and card clicks; swaps both ways; gsap through lib/motion with named eases and durations; instant under reduced
	motion; front card marked aria-current; stack depth capped so long decks stay compact; offsets from the card size
	(resize aware); slots in CSS so SSR renders the stack; ordered list markup, no role=button; tokens for colours,
	border and radius (`--card-radius` override).
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { motion, REDUCED } from '#lib/motion/gsap.ts';
	import { DURATIONS } from '#lib/motion/tokens.ts';

	type Props = {
		items: T[];
		card: Snippet<[T, number]>;
		/** Index of the front card. */
		active?: number;
		/** Card size, any CSS length. */
		width?: string;
		height?: string;
		/** Offset between stacked cards, as a fraction of the card width and height. */
		spreadX?: number;
		spreadY?: number;
		/** Cards visible in the stack; the rest wait behind the last one. */
		depth?: number;
		skew?: number;
		label?: string;
	};

	let {
		items,
		card,
		active = 0,
		width = '420px',
		height = '240px',
		spreadX = 0.12,
		spreadY = 0.16,
		depth = 4,
		skew = 4,
		label
	}: Props = $props();

	const els: HTMLLIElement[] = [];
	const total = $derived(items.length);
	const back = $derived(Math.min(depth, items.length) - 1);

	// order[0] is the front card; front tracks the index the deck currently shows.
	let order: number[] = [];
	let front = 0;
	// Card shown at the front, marked aria-current for styling and assistive tech.
	let current = $state(0);
	let dx = 0;
	let dy = 0;
	let h = 0;
	let tl: gsap.core.Timeline | null = null;

	function slot(i: number) {
		const s = Math.min(i, back);
		return { x: s * dx, y: -s * dy, z: -s * dx * 1.5, zIndex: total - i };
	}

	function measure() {
		const el = els[0];
		if (!el) return;
		dx = el.offsetWidth * spreadX;
		dy = el.offsetHeight * spreadY;
		h = el.offsetHeight;
	}

	function placeAll() {
		order.forEach((idx, i) => motion().set(els[idx]!, { ...slot(i), skewY: skew, force3D: true }));
	}

	// Front card drops out and returns to the back; the rest move up one slot.
	function forward(gsap: typeof import('gsap').gsap) {
		const [first, ...rest] = order;
		const el = els[first!]!;
		const t = gsap.timeline();
		t.to(el, { y: `+=${h * 1.3}`, duration: DURATIONS.slow, ease: 'in-quick' });
		rest.forEach((idx, i) => {
			const s = slot(i);
			t.set(els[idx]!, { zIndex: s.zIndex }, 0.1);
			t.to(els[idx]!, { x: s.x, y: s.y, z: s.z, duration: DURATIONS.slow, ease: 'out-soft' }, 0.1 + i * 0.04);
		});
		const end = slot(total - 1);
		t.set(el, { zIndex: end.zIndex });
		t.to(el, { x: end.x, y: end.y, z: end.z, duration: DURATIONS.slow, ease: 'out-expo' });
		order = [...rest, first!];
		return t;
	}

	// Back card rises from below to the front; the rest move back one slot.
	function backward(gsap: typeof import('gsap').gsap) {
		const last = order[order.length - 1]!;
		const rest = order.slice(0, -1);
		const el = els[last]!;
		const start = slot(0);
		const t = gsap.timeline();
		t.to(el, { x: start.x, y: start.y + h * 1.3, z: start.z, duration: DURATIONS.slow, ease: 'in-quick' });
		t.set(el, { zIndex: total + 1 });
		rest.forEach((idx, i) => {
			const s = slot(i + 1);
			t.set(els[idx]!, { zIndex: s.zIndex }, DURATIONS.slow);
			t.to(els[idx]!, { x: s.x, y: s.y, z: s.z, duration: DURATIONS.slow, ease: 'out-soft' }, DURATIONS.slow + i * 0.04);
		});
		t.to(el, { y: start.y, duration: DURATIONS.slow, ease: 'out-expo' }, DURATIONS.slow);
		t.set(el, { zIndex: start.zIndex });
		order = [last, ...rest];
		return t;
	}

	// Steps one card at a time toward target; a newer step finishes the running one first.
	function go(target: number) {
		if (!order.length) return;
		const gsap = motion();
		const reduced = matchMedia(REDUCED).matches;
		while (front !== target) {
			tl?.progress(1);
			const ahead = (target - front + total) % total <= total / 2;
			tl = ahead ? forward(gsap) : backward(gsap);
			front = (front + (ahead ? 1 : -1) + total) % total;
			if (reduced) tl.progress(1);
		}
		current = order[0]!;
	}

	onMount(() => {
		order = items.map((_, i) => i);
		measure();
		placeAll();
		go(active);
		const ro = new ResizeObserver(() => {
			tl?.progress(1);
			measure();
			placeAll();
		});
		if (els[0]) ro.observe(els[0]);
		return () => {
			ro.disconnect();
			tl?.kill();
		};
	});

	$effect(() => {
		go(active);
	});
</script>

<div class="deck" style:--w={width} style:--h={height} style:--sx={spreadX} style:--sy={spreadY} style:--back={back} style:--skew="{skew}deg">
	<ol aria-label={label}>
		{#each items as item, i (i)}
			<li bind:this={els[i]} aria-current={i === current ? 'step' : undefined} style:--slot={Math.min(i, back)} style:z-index={total - i}>
				{@render card(item, i)}
			</li>
		{/each}
	</ol>
</div>

<style>
	.deck {
		--dx: calc(var(--w) * var(--sx));
		--dy: calc(var(--h) * var(--sy));
		position: relative;
		width: calc(var(--w) + var(--back) * var(--dx));
		height: calc(var(--h) + var(--back) * var(--dy));
		perspective: 900px;
		perspective-origin: 30% 70%;
	}
	ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: absolute;
		left: 0;
		bottom: 0;
		width: var(--w);
		height: var(--h);
		overflow: hidden;
		border: 1px solid var(--line-strong);
		/* Cards may set their own radius; tokens default otherwise. */
		border-radius: var(--card-radius, 3px);
		background: var(--bg);
		box-shadow: var(--lift);
		transform-style: preserve-3d;
		backface-visibility: hidden;
		will-change: transform;
		/* Same slots as slot(); GSAP takes over on mount. */
		transform: translate3d(
				calc(var(--slot) * var(--dx)),
				calc(var(--slot) * var(--dy) * -1),
				calc(var(--slot) * var(--dx) * -1.5)
			)
			skewY(var(--skew));
	}
</style>
