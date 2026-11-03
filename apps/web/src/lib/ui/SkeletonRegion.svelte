<script lang="ts">
	import type { Snippet } from 'svelte';

	// One busy status for a group of Skeleton shapes, stacked; screen readers hear the label only.
	type Props = { label: string; gap?: string; children: Snippet };

	let { label, gap = '14px', children }: Props = $props();
</script>

<div class="skeleton" role="status" aria-busy="true" style:gap>
	<span class="sr-only">{label}</span>
	{@render children()}
</div>

<style>
	.skeleton {
		display: flex;
		flex-direction: column;
		width: 100%;
	}
</style>
