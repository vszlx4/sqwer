<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Settings section: description left, controls right, separated by rules. */
	interface Props {
		title: string;
		description?: string;
		/** A section whose action cannot be undone, such as deleting the account. */
		danger?: boolean;
		id?: string;
		aside?: Snippet;
		children: Snippet;
	}
	let { title, description, danger = false, id, aside, children }: Props = $props();
	const uid = $props.id();
	const headingId = $derived(id ? `${id}-title` : `section-${uid}`);
</script>

<section class="setting" class:danger {id} aria-labelledby={headingId}>
	<div class="about">
		<h2 id={headingId}>{title}</h2>
		{#if description}<p>{description}</p>{/if}
		{@render aside?.()}
	</div>
	<div class="body">
		{@render children()}
	</div>
</section>

<style>
	.setting {
		display: grid;
		grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.5fr);
		gap: var(--space-20) clamp(var(--space-20), 4vw, var(--space-48));
		padding: var(--space-32) 0;
		border-top: 1px solid var(--line);
	}
	.setting:first-of-type {
		border-top: 0;
		padding-top: var(--space-4);
	}
	.about {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	h2 {
		font-size: var(--fs-20);
		line-height: var(--lh-base);
	}
	.about p {
		max-width: 40ch;
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		min-width: 0;
	}
	.danger h2 {
		color: var(--error);
	}
	@media (max-width: 760px) {
		.setting {
			grid-template-columns: 1fr;
		}
	}
</style>
