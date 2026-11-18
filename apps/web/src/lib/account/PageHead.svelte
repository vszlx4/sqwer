<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Account page heading: the title, one line on what the page holds, and an optional action. */
	let { title, line, action }: { title: string; line?: string; action?: Snippet } = $props();
</script>

<header class="head">
	<div>
		<h1>{title}</h1>
		{#if line}<p>{line}</p>{/if}
	</div>
	{#if action}<div class="action">{@render action()}</div>{/if}
</header>

<style>
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-12) var(--space-20);
		margin-bottom: var(--space-24);
	}
	h1 {
		font-size: var(--fs-title);
		line-height: var(--lh-snug);
		overflow-wrap: anywhere;
	}
	p {
		margin-top: var(--space-6);
		color: var(--ink-2);
	}
	.action {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
</style>
