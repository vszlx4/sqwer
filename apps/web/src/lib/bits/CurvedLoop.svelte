<!--
	Svelte Bits: Curved Loop
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/curved-loop.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: drift on the GSAP ticker through lib/motion in px per second (frame-rate independent), only while on
	screen and motion is allowed; still under reduced motion (drag still works); offset kept in a plain variable
	instead of state and read back from the attribute; no full-screen min-height; fill and type from the parent
	(currentColor, no fixed weight); svg aria-hidden with the text once in an sr-only span; text prop renamed.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	type Props = {
		text: string;
		/** Drift in px per second. */
		speed?: number;
		/** Depth of the curve in viewBox units; negative bows upward. */
		curveAmount?: number;
		direction?: 'left' | 'right';
		interactive?: boolean;
		class?: string;
	};

	let { text, speed = 60, curveAmount = 400, direction = 'left', interactive = true, class: className = '' }: Props = $props();

	const unit = $derived(text.replace(/\s+$/, '') + ' ');
	const uid = $props.id();
	const pathId = `curve-${uid}`;
	const pathD = $derived(`M-100,40 Q500,${40 + curveAmount} 1540,40`);

	let measureEl: SVGTextElement | undefined = $state();
	let pathEl: SVGTextPathElement | undefined = $state();
	let spacing = $state(0);
	const repeated = $derived(spacing ? Array(Math.ceil(1800 / spacing) + 2).fill(unit).join('') : unit);

	let offset = 0;
	let dragging = $state(false);
	let lastX = 0;
	let velX = 0;
	let dir: 'left' | 'right' = 'left';

	function set(next: number) {
		if (!spacing || !pathEl) return;
		if (next <= -spacing) next += spacing;
		if (next > 0) next -= spacing;
		offset = next;
		pathEl.setAttribute('startOffset', `${next}px`);
	}

	$effect(() => {
		dir = direction;
	});

	$effect(() => {
		void unit;
		void className;
		if (measureEl) spacing = measureEl.getComputedTextLength();
	});

	$effect(() => {
		if (spacing && pathEl) set(-spacing);
	});

	let root: HTMLDivElement;
	onMount(() => {
		let onScreen = false;
		const io = new IntersectionObserver(([e]) => (onScreen = e!.isIntersecting));
		io.observe(root);
		const mm = whenMotion(() => {
			const gsap = motion();
			const tick = (_t: number, deltaMs: number) => {
				if (!onScreen || dragging) return;
				const step = (speed * Math.min(deltaMs, 50)) / 1000;
				set(offset + (dir === 'right' ? step : -step));
			};
			gsap.ticker.add(tick);
			return () => gsap.ticker.remove(tick);
		});
		return () => {
			io.disconnect();
			mm.revert();
		};
	});

	function down(e: PointerEvent) {
		if (!interactive) return;
		dragging = true;
		lastX = e.clientX;
		velX = 0;
		(e.currentTarget as Element).setPointerCapture?.(e.pointerId);
	}
	function move(e: PointerEvent) {
		if (!dragging) return;
		velX = e.clientX - lastX;
		lastX = e.clientX;
		set(offset + velX);
	}
	function up() {
		if (!dragging) return;
		dragging = false;
		if (velX) dir = velX > 0 ? 'right' : 'left';
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="curved {className}"
	class:interactive
	class:dragging
	bind:this={root}
	style:visibility={spacing ? 'visible' : 'hidden'}
	onpointerdown={down}
	onpointermove={move}
	onpointerup={up}
	onpointercancel={up}
>
	<span class="sr-only">{text}</span>
	<svg viewBox="0 0 1440 120" aria-hidden="true">
		<text bind:this={measureEl} xml:space="preserve" class="measure">{unit}</text>
		<defs>
			<path id={pathId} d={pathD} fill="none" />
		</defs>
		{#if spacing}
			<text xml:space="preserve"><textPath bind:this={pathEl} href="#{pathId}" xml:space="preserve">{repeated}</textPath></text>
		{/if}
	</svg>
</div>

<style>
	.curved {
		width: 100%;
	}
	.interactive {
		cursor: grab;
		touch-action: pan-y;
	}
	.dragging {
		cursor: grabbing;
	}
	svg {
		display: block;
		width: 100%;
		aspect-ratio: 100 / 12;
		overflow: visible;
		fill: currentColor;
		user-select: none;
		-webkit-user-select: none;
	}
	.measure {
		visibility: hidden;
		pointer-events: none;
	}
</style>
