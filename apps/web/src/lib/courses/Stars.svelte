<script lang="ts">
	/** Earned stars out of three. With `pop`, earned stars appear one after another. */
	let { stars, size = 18, pop = false }: { stars: number; size?: number; pop?: boolean } = $props();
</script>

<span class="stars" class:pop role="img" aria-label={`${stars} of 3 stars`}>
	{#each [0, 1, 2] as i (i)}
		<svg width={size} height={size} viewBox="0 0 24 24" class:on={i < stars} style:--i={i} aria-hidden="true">
			<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
		</svg>
	{/each}
</span>

<style>
	.stars {
		display: inline-flex;
		gap: 2px;
		vertical-align: middle;
	}
	path {
		fill: var(--surface-2);
		stroke: var(--line-strong);
		stroke-width: 1;
	}
	.on path {
		fill: #f5b700;
		stroke: #c48f00;
	}
	.pop .on {
		animation: star-pop 520ms cubic-bezier(0.3, 1.6, 0.5, 1) both;
		animation-delay: calc(300ms + var(--i) * 260ms);
	}
	@keyframes star-pop {
		from {
			transform: scale(0) rotate(-40deg);
			opacity: 0;
		}
	}
</style>
