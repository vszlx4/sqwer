<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * One section of an account settings page: what it is and why on the left, the controls on the
	 * right. Sections are separated by rules rather than boxed, so a page of settings reads as one list.
	 */
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
		gap: 18px clamp(20px, 4vw, 48px);
		padding: 28px 0;
		border-top: 1px solid var(--line);
	}
	.setting:first-of-type {
		border-top: 0;
		padding-top: 4px;
	}
	.about {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	h2 {
		font-size: 20px;
		line-height: 1.2;
	}
	.about p {
		max-width: 40ch;
		font-size: 14px;
		line-height: 1.55;
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 14px;
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
