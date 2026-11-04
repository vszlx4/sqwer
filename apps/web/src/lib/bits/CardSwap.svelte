<!--
	Svelte Bits: Card Swap
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/card-swap.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: idle loop on the GSAP ticker instead of an interval, counted only while on screen in a visible tab with
	motion allowed, its progress written back (`wait`) for an outside indicator; slower staged swap (front card eases
	down and out, the stack steps forward one by one, the old front rises in at the back); no hover pause or card
	clicks; no loop under reduced motion; gsap through lib/motion with named eases; tilt by rotateX/rotateY instead
	of skew; offsets from the card size (resize aware); slots in CSS so SSR renders the stack; ordered list markup
	with aria-current on the front card; tokens for colours, border and radius.
-->
<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { onMount, untrack } from 'svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	type Props = {
		items: T[];
		card: Snippet<[T, number]>;
		/** Index of the front card, written back as the deck moves. */
		current?: number;
		/** Time to the next swap, 0 to 1, written back for an indicator. */
		wait?: number;
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
		/** Seconds each card rests at the front. */
		interval?: number;
		label?: string;
	};

	let {
		items,
		card,
		current = $bindable(0),
		wait = $bindable(0),
		width = '420px',
		height = '240px',
		spreadX = 0.12,
		spreadY = 0.16,
		depth = 4,
		rotateX = 0,
		rotateY = 0,
		perspective = 1600,
		interval = 6,
		label
	}: Props = $props();

	const els: HTMLLIElement[] = [];
	let root: HTMLDivElement;
	const total = $derived(items.length);
	const back = $derived(Math.min(depth, items.length) - 1);
	// Item indices from front to back. Starts in item order, which the SSR slots match; GSAP owns the slots after.
	let order = untrack(() => items.map((_, i) => i));

	let dx = 0;
	let dy = 0;
	let h = 0;
	let tl: gsap.core.Timeline | null = null;

	function slot(pos: number) {
		const s = Math.min(pos, back);
		return { x: s * dx, y: -s * dy, z: -s * dx * 1.5, zIndex: total - pos };
	}

	function measure() {
		const el = els[0];
		if (!el) return;
		dx = el.offsetWidth * spreadX;
		dy = el.offsetHeight * spreadY;
		h = el.offsetHeight;
	}

	function settle() {
		const gsap = motion();
		order.forEach((idx, pos) => gsap.set(els[idx]!, { ...slot(pos), rotateX, rotateY, force3D: true }));
	}

	// One swap: the front card eases down out of the frame, the stack steps forward one card at a time, then the old
	// front rises in at the back. About 2.2s, so each stage reads.
	function swap() {
		const gsap = motion();
		tl?.progress(1).kill();
		const [front, ...rest] = order;
		order = [...rest, front!];
		current = order[0]!;
		const out = els[front!]!;
		const t = gsap.timeline();
		t.to(out, { y: `+=${h * 1.15}`, z: `-=${dx * 0.5}`, duration: 0.9, ease: 'in-quick' }, 0);
		rest.forEach((idx, pos) => {
			const s = slot(pos);
			t.set(els[idx]!, { zIndex: s.zIndex }, 0.45);
			t.to(els[idx]!, { x: s.x, y: s.y, z: s.z, duration: 1.2, ease: 'out-expo' }, 0.45 + pos * 0.12);
		});
		const end = slot(total - 1);
		t.set(out, { zIndex: end.zIndex }, 0.9);
		t.to(out, { x: end.x, y: end.y, z: end.z, duration: 1.3, ease: 'out-expo' }, 0.95);
		tl = t;
	}

	onMount(() => {
		measure();
		settle();
		const ro = new ResizeObserver(() => {
			tl?.progress(1).kill();
			measure();
			settle();
		});
		if (els[0]) ro.observe(els[0]);
		let onScreen = false;
		const io = new IntersectionObserver(([e]) => (onScreen = e!.isIntersecting), { threshold: 0.3 });
		io.observe(root);

		// The clock only runs while someone can see the deck; reduced motion leaves the first card in front.
		const mm = whenMotion(() => {
			const gsap = motion();
			let elapsed = 0;
			const tick = (_t: number, deltaMs: number) => {
				if (!onScreen || document.hidden || interval <= 0) return;
				elapsed += Math.min(deltaMs, 100) / 1000;
				if (elapsed >= interval) {
					elapsed = 0;
					swap();
				}
				wait = elapsed / interval;
			};
			gsap.ticker.add(tick);
			return () => {
				gsap.ticker.remove(tick);
				wait = 0;
			};
		});

		return () => {
			ro.disconnect();
			io.disconnect();
			mm.revert();
			tl?.kill();
		};
	});
</script>

<div
	class="deck"
	bind:this={root}
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
		border-radius: var(--radius);
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
