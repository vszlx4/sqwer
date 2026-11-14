<script lang="ts">
	/** Thin progress bar for clips made. */
	let { made, total, label }: { made: number; total: number; label: string } = $props();
	const share = $derived(total ? Math.min(1, made / total) : 0);
</script>

<span class="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={made}>
	<span style:transform={`scaleX(${share})`}></span>
</span>

<style>
	.bar {
		display: block;
		width: 100%;
		height: var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink);
		transform-origin: left;
	}
</style>
