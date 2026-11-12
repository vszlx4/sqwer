<script lang="ts">
	import { onDestroy } from 'svelte';

	/**
	 * A word's waveform in two layers: the whole clip in a muted tone, and the same bars in colour filling from the
	 * left as it plays. Without a clip (the device's own voice) the bars are flat and fill while it speaks.
	 */
	interface Props {
		/** Bar heights from 0 to 1; null while the clip is being made or when there is none. */
		shape: number[] | null;
		playing: boolean;
		/** Playback position from 0 to 1, read every frame while playing; null when it is not known. */
		progress: () => number | null;
		bars?: number;
	}

	let { shape, playing, progress, bars = 48 }: Props = $props();

	const heights = $derived(shape ?? Array.from({ length: bars }, () => 0.14));
	let at = $state(0);
	let frame = 0;

	$effect(() => {
		cancelAnimationFrame(frame);
		if (!playing) {
			at = 0;
			return;
		}
		const tick = () => {
			at = progress() ?? 1;
			frame = requestAnimationFrame(tick);
		};
		tick();
		return () => cancelAnimationFrame(frame);
	});
	onDestroy(() => cancelAnimationFrame(frame));
</script>

<div class="wave" class:flat={!shape} aria-hidden="true">
	{#each [false, true] as top (top)}
		<div class="layer" class:top style:clip-path={top ? `inset(0 ${(1 - at) * 100}% 0 0)` : undefined}>
			{#each heights as h, i (i)}<span style:height={`${Math.round(h * 100)}%`}></span>{/each}
		</div>
	{/each}
</div>

<style>
	.wave {
		position: relative;
		display: grid;
		width: 100%;
		height: 100%;
	}
	.layer {
		grid-area: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 3px; /* off-scale: bar spacing */
		color: var(--line-strong);
	}
	.layer.top {
		color: var(--accent);
	}
	.layer span {
		flex: 1;
		max-width: 5px; /* off-scale: bar width */
		min-height: 3px;
		border-radius: 2px; /* off-scale: bar ends */
		background: currentColor;
	}
	.flat .layer span {
		min-height: 4px;
	}
</style>
