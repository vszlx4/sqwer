<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		actions: Snippet;
		onclose: () => void;
	}

	let { open, title, children, actions, onclose }: Props = $props();
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog bind:this={dialog} aria-labelledby="dialog-title" {onclose} onclick={(e) => e.target === dialog && onclose()}>
	<div class="body">
		<h2 id="dialog-title">{title}</h2>
		<div class="content">{@render children()}</div>
		<div class="actions">{@render actions()}</div>
	</div>
</dialog>

<style>
	dialog {
		border: 1px solid var(--line-strong);
		border-radius: 3px;
		background: var(--bg);
		color: var(--ink);
		padding: 0;
		width: min(440px, calc(100vw - 32px));
		box-shadow: var(--shadow);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.4);
	}
	.body {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	h2 {
		font-size: 24px;
		font-weight: 400;
	}
	.content {
		font-size: 15px;
		color: var(--ink-2);
		line-height: 1.5;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 8px;
	}
</style>
