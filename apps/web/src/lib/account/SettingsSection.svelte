<script lang="ts">
	import type { Snippet } from 'svelte';

	/** Account panel: a titled box with one short line of help, an optional header action and its controls. */
	interface Props {
		title: string;
		description?: string;
		/** A panel whose action cannot be undone, such as deleting the account. */
		danger?: boolean;
		/** Rows run edge to edge (SettingRow); otherwise the body is padded. */
		flush?: boolean;
		id?: string;
		/** A solid glyph before the title. */
		icon?: Snippet;
		/** Header control on the right, such as a status or a link. */
		action?: Snippet;
		children: Snippet;
	}
	let { title, description, danger = false, flush = false, id, icon, action, children }: Props = $props();
	const uid = $props.id();
	const headingId = $derived(id ? `${id}-title` : `panel-${uid}`);
</script>

<section class="panel" class:danger {id} aria-labelledby={headingId}>
	<header class="head">
		<div class="about">
			<h2 id={headingId} class:with-icon={!!icon}>{@render icon?.()}{title}</h2>
			{#if description}<p>{description}</p>{/if}
		</div>
		{#if action}<div class="action">{@render action()}</div>{/if}
	</header>
	<div class="body" class:flush>
		{@render children()}
	</div>
</section>

<style>
	.panel {
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--bg);
		min-width: 0;
	}
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-12) var(--space-20);
		flex-wrap: wrap;
		padding: var(--space-16) var(--space-20);
		border-bottom: 1px solid var(--line);
		background: var(--surface);
	}
	.about {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	h2 {
		font-size: var(--fs-16);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-base);
	}
	h2.with-icon {
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}
	.about p {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.action {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		flex: none;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding: var(--space-20);
		min-width: 0;
	}
	.body.flush {
		gap: 0;
		padding: 0;
	}
	.danger {
		border-color: color-mix(in srgb, var(--error) 45%, var(--line));
	}
	.danger .head {
		background: var(--error-soft);
	}
	.danger h2 {
		color: var(--error);
	}
</style>
