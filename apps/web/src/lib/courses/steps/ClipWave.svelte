<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import type { ClipShape } from '../voice/shape.ts';

	/**
	 * A word's waveform: the spoken part of its clip as muted bars that rise in when the clip is ready, then turn to
	 * the accent one by one as it plays and stay lit until it plays again. Without a clip (the device's own voice)
	 * the bars are flat and fill over an estimated length.
	 */
	interface Props {
		/** Null while the clip is being made, or when there is none. */
		shape: ClipShape | null;
		playing: boolean;
		/** Position in the whole clip from 0 to 1, read every frame while playing; null when it is not known. */
		progress: () => number | null;
		/** Expected length in milliseconds, used when the position is not known. */
		estimate: number;
		bars?: number;
	}

	let { shape, playing, progress, estimate, bars = 32 }: Props = $props();

	const heights = $derived(shape?.bars ?? Array.from({ length: bars }, () => 0.1));
	/** How much of the word has been heard, 0 to 1. */
	let heard = $state(0);
	let risen = $state(false);
	let frame = 0;

	// A new word: bars start low and rise to its outline on the next frame.
	$effect(() => {
		void shape;
		heard = 0;
		target = 0;
		risen = false;
		const f = requestAnimationFrame(() => (risen = true));
		return () => cancelAnimationFrame(f);
	});

	/** Where the sound is; `heard` glides after it so a short word still reads as a sweep. */
	let target = 0;
	const GLIDE = 0.1;

	function glide() {
		cancelAnimationFrame(frame);
		const step = () => {
			if (playing) {
				const at = progress();
				const s = shape;
				const part = at !== null && s ? (at - s.from) / Math.max(0.01, s.to - s.from) : (performance.now() - started) / estimate;
				target = Math.min(1, Math.max(0, part));
			}
			heard += (target - heard) * GLIDE;
			if (Math.abs(target - heard) < 0.004) heard = target;
			if (playing || heard !== target) frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
	}

	let started = 0;
	$effect(() => {
		if (playing) {
			untrack(() => {
				heard = 0;
				target = 0;
				started = performance.now();
				glide();
			});
			return;
		}
		// Ended rather than stopped early: the sweep finishes and the whole word stays lit.
		untrack(() => {
			target = target > 0.6 ? 1 : heard;
			glide();
		});
	});
	onDestroy(() => cancelAnimationFrame(frame));

	const lit = $derived(Math.round(heard * heights.length));
</script>

<div class="wave" aria-hidden="true">
	{#each heights as h, i (i)}
		<span class:lit={i < lit} style:--h={risen ? h : 0.1} style:--i={i}></span>
	{/each}
</div>

<style>
	.wave {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 4px; /* off-scale: bar spacing */
		width: 100%;
		height: 100%;
	}
	span {
		flex: 1;
		max-width: 5px; /* off-scale: bar width */
		height: 100%;
		border-radius: 2px; /* off-scale: bar ends */
		background: var(--line-strong);
		transform: scaleY(var(--h));
		transition:
			transform var(--dur-slow) var(--ease-out),
			background-color var(--dur-instant) linear;
		/* Bars rise one after another, left to right. */
		transition-delay: calc(var(--i) * 10ms), 0s;
	}
	span.lit {
		background: var(--accent);
	}
	@media (prefers-reduced-motion: reduce) {
		span {
			transition: none;
		}
	}
</style>
