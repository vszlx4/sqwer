<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One setting in a flush panel: name and a short line on the left, its control on the right. */
	interface Props {
		label: string;
		hint?: string;
		/** id of the control, so the name labels it. */
		for?: string;
		/** Control below the name instead of beside it, for wide controls. */
		stacked?: boolean;
		/** Wide control (a segmented choice, a select): moves below the name on phones. */
		wide?: boolean;
		disabled?: boolean;
		children: Snippet;
	}
	let { label, hint, for: target, stacked = false, wide = false, disabled = false, children }: Props = $props();
	const uid = $props.id();
</script>

<div class="row" class:stacked class:wide class:disabled role="group" aria-labelledby={`${uid}-label`}>
	<div class="text">
		{#if target}
			<label class="name" id={`${uid}-label`} for={target}>{label}</label>
		{:else}
			<span class="name" id={`${uid}-label`}>{label}</span>
		{/if}
		{#if hint}<span class="hint">{hint}</span>{/if}
	</div>
	<div class="control">{@render children()}</div>
</div>

<style>
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-8) var(--space-20);
		padding: var(--space-16) var(--space-20);
	}
	.row:not(:first-child) {
		border-top: 1px solid var(--line);
	}
	.row.stacked {
		grid-template-columns: minmax(0, 1fr);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.name {
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.hint {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.control {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: var(--space-8);
		min-width: 0;
	}
	.stacked .control {
		justify-content: flex-start;
	}
	.disabled .text {
		opacity: 0.55;
	}
	@media (max-width: 560px) {
		.row.wide {
			grid-template-columns: minmax(0, 1fr);
		}
		.wide .control {
			justify-content: flex-start;
		}
	}
</style>
