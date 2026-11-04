<script lang="ts">
	// Placeholder shape for content still loading. Hidden from assistive tech; wrap groups in SkeletonRegion.
	type Props = {
		/** CSS width; text lines default to full width. */
		width?: string;
		/** CSS height; a text line is one line of body copy. */
		height?: string;
		/** Text lines; the last one is shorter. */
		lines?: number;
		circle?: boolean;
	};

	let { width = '100%', height, lines = 0, circle = false }: Props = $props();
</script>

{#if lines > 0}
	<span class="lines" style:width aria-hidden="true">
		{#each Array.from({ length: lines }) as _, i (i)}
			<span class="bone line" style:width={i === lines - 1 && lines > 1 ? '62%' : undefined}></span>
		{/each}
	</span>
{:else}
	<span class="bone" class:circle style:width style:height={height ?? '1em'} aria-hidden="true"></span>
{/if}

<style>
	.bone {
		display: block;
		max-width: 100%;
		border-radius: var(--radius);
		background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface) 50%, var(--surface-2) 100%) 0 0 / 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}
	.circle {
		border-radius: 50%;
		flex: none;
	}
	.lines {
		display: flex;
		flex-direction: column;
		gap: 0.55em;
		max-width: 100%;
	}
	.line {
		height: 0.8em;
	}
	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: -100% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bone {
			animation: none;
			background: var(--surface-2);
		}
	}
</style>
