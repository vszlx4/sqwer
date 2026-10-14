<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		actions: Snippet;
		onclose: () => void;
		/**
		 * Confirmation of a consequential action. The dialog is announced as an alert dialog
		 * and is not dismissed by clicking outside it, so it cannot be closed by accident.
		 */
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
		width: min(460px, calc(100vw - 32px));
		max-height: calc(100dvh - 32px);
		overflow: auto;
		overscroll-behavior: contain;
		box-shadow: var(--shadow-lg);
	}
	dialog[open] {
		animation: dialog-in 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 0.45);
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
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	h2 {
		font-size: 26px;
		line-height: 1.15;
	}
	.content {
		font-size: 15px;
		color: var(--ink-2);
		line-height: 1.55;
	}
	.content :global(p + p) {
		margin-top: 8px;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 8px;
	}
	@media (max-width: 480px) {
		.actions {
			flex-direction: column-reverse;
		}
		.actions :global(.btn) {
			width: 100%;
		}
	}
</style>
