<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		actions: Snippet;
		onclose: () => void;
		/** Alert dialog for consequential actions; outside clicks don't dismiss. */
		alert?: boolean;
	}

	let { open, title, children, actions, onclose, alert = false }: Props = $props();
	let dialog: HTMLDialogElement | undefined = $state();
	const id = $props.id();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) {
			dialog.showModal();
			// Start on the least consequential action, as recommended for alert dialogs.
			const safe = dialog.querySelector<HTMLElement>('[data-autofocus]');
			safe?.focus();
		}
		if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	role={alert ? 'alertdialog' : undefined}
	aria-labelledby={`${id}-title`}
	aria-describedby={`${id}-content`}
	{onclose}
	onclick={(e) => !alert && e.target === dialog && onclose()}
>
	<div class="body">
		<h2 id={`${id}-title`}>{title}</h2>
		<div class="content" id={`${id}-content`}>{@render children()}</div>
		<div class="actions">{@render actions()}</div>
	</div>
</dialog>

<style>
	/* Centred in the viewport; the CSS reset removes the browser's default auto margins. */
	dialog {
		margin: auto;
		border: 1px solid var(--line-strong);
		border-radius: 3px;
		background: var(--bg);
		color: var(--ink);
		padding: 0;
		width: min(var(--w-form), calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		overflow: auto;
		overscroll-behavior: contain;
		box-shadow: var(--shadow-lg);
	}
	dialog[open] {
		animation: dialog-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	dialog::backdrop {
		background: var(--scrim);
		-webkit-backdrop-filter: blur(2px);
		backdrop-filter: blur(2px);
	}
	dialog[open]::backdrop {
		animation: backdrop-in 200ms ease;
	}
	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}
	@keyframes backdrop-in {
		from {
			opacity: 0;
		}
	}
	.body {
		padding: var(--space-24);
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}
	h2 {
		font-size: var(--fs-28);
		line-height: var(--lh-snug);
	}
	.content {
		font-size: var(--fs-15);
		color: var(--ink-2);
		line-height: var(--lh-body);
	}
	.content :global(p + p) {
		margin-top: var(--space-8);
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-8);
		flex-wrap: wrap;
		margin-top: var(--space-8);
	}
	@media (max-width: 420px) {
		.actions {
			flex-direction: column-reverse;
		}
		.actions :global(.btn) {
			width: 100%;
		}
	}
</style>
