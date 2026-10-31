<!--
	Svelte Bits: Card Swap
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/card-swap.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: one timeline of every swap, scrubbed by a `progress` prop (scroll on the landing page) and eased toward
	it, instead of an interval, hover pause and card clicks; no swap is ever skipped and it plays both ways; gsap
	through lib/motion with named eases; snaps to whole swaps under reduced motion; tilt by rotateX/rotateY instead
	of skew; offsets from the card size (resize aware); slots in CSS so SSR renders the stack; ordered list markup
	with aria-current on the front card, no role=button; tokens for colours and border, `--card-radius` override.
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { motion, REDUCED } from '#lib/motion/gsap.ts';
	import { DURATIONS } from '#lib/motion/tokens.ts';

	type Props = {
		items: T[];
		card: Snippet<[T, number]>;
		/** 0 shows the first card, 1 the last; swaps play in between. */
		progress?: number;
		/** Index of the front card, written back as the deck moves. */
		current?: number;
		/** Card size, any CSS length. */
		width?: string;
		height?: string;
		/** Offset between stacked cards, as a fraction of the card width and height. */
		spreadX?: number;
		spreadY?: number;
		/** Cards visible in the stack; the rest wait behind the last one. */
		depth?: number;
		/** Tilt in degrees: rotateX leans the cards back, rotateY turns them. */
		rotateX?: number;
		rotateY?: number;
		perspective?: number;
		label?: string;
	};

	let {
		items,
		card,
		progress = 0,
		current = $bindable(0),
		width = '420px',
		height = '240px',
		spreadX = 0.12,
		spreadY = 0.16,
		depth = 4,
		rotateX = 0,
		rotateY = 0,
		perspective = 1600,
		label
	}: Props = $props();

	const els: HTMLLIElement[] = [];
	const total = $derived(items.length);
	const back = $derived(Math.min(depth, items.length) - 1);
	// Still time before the first swap and after the last, in timeline units (one unit per swap).
	const HOLD = 0.35;

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

	/** Target time for a progress value; whole swaps only under reduced motion. */
	function timeAt(p: number) {
		const t = Math.min(1, Math.max(0, p)) * (total - 1);
		return HOLD + (matchMedia(REDUCED).matches ? Math.round(t) : t);
	}

	// Swap k: card k drops out and returns to the back, the cards behind it move up one slot.
	function build() {
		const gsap = motion();
		tl?.kill();
		items.forEach((_, i) => gsap.set(els[i]!, { ...slot(i), rotateX, rotateY, force3D: true }));
		const t = gsap.timeline({
			paused: true,
			onUpdate: () => (current = Math.min(total - 1, Math.max(0, Math.round(t.time() - HOLD))))
		});
		const order = items.map((_, i) => i);
		for (let k = 0; k < total - 1; k++) {
			const at = HOLD + k + 0.5;
			const [front, ...rest] = order;
			const el = els[front!]!;
			// Each swap spans 0.7 of its unit, so every card rests a moment at the front.
			t.to(el, { y: `+=${h * 1.3}`, duration: 0.3, ease: 'in-quick' }, at - 0.3);
			rest.forEach((idx, i) => {
				const s = slot(i);
				t.set(els[idx]!, { zIndex: s.zIndex }, at - 0.1);
				t.to(els[idx]!, { x: s.x, y: s.y, z: s.z, duration: 0.4, ease: 'out-soft' }, at - 0.2 + i * 0.03);
			});
			const end = slot(total - 1);
			t.set(el, { zIndex: end.zIndex }, at);
			t.to(el, { x: end.x, y: end.y, z: end.z, duration: 0.4, ease: 'out-expo' }, at);
			order.splice(0, order.length, ...rest, front!);
		}
		t.to({}, { duration: HOLD }, HOLD + total - 1);
		t.time(timeAt(progress));
		tl = t;
	}

	onMount(() => {
		measure();
		build();
		const ro = new ResizeObserver(() => {
			measure();
			build();
		});
		if (els[0]) ro.observe(els[0]);
		return () => {
			ro.disconnect();
			tl?.kill();
		};
	});

	// Eases toward the scroll position, so fast scrolling still plays every swap.
	$effect(() => {
		const target = timeAt(progress);
		if (!tl) return;
		if (matchMedia(REDUCED).matches) tl.time(target);
		else {
			// Longer catch-up for longer jumps: about 0.9s per swap still to play, at least one reveal.
			const duration = Math.min(2.6, Math.max(DURATIONS.reveal, Math.abs(target - tl.time()) * 0.9));
			motion().to(tl, { time: target, duration, ease: 'out-soft', overwrite: true });
		}
	});
</script>

<div
	class="deck"
	style:--w={width}
	style:--h={height}
	style:--sx={spreadX}
	style:--sy={spreadY}
	style:--back={back}
	style:--rx="{rotateX}deg"
	style:--ry="{rotateY}deg"
	style:perspective="{perspective}px"
>
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
		perspective-origin: 20% 80%;
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
		transform-style: preserve-3d;
		backface-visibility: hidden;
		will-change: transform;
		/* Same slots as slot(); GSAP takes over on mount. */
		transform: translate3d(
				calc(var(--slot) * var(--dx)),
				calc(var(--slot) * var(--dy) * -1),
				calc(var(--slot) * var(--dx) * -1.5)
			)
			rotateX(var(--rx))
			rotateY(var(--ry));
	}
</style>
