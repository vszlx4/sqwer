<script lang="ts">
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import Dialog from './Dialog.svelte';

	interface Props {
		/** Form action the confirmed request is sent to. */
		action: string;
		title: string;
		/** Explains the consequence, so the person can decide. */
		message: Snippet;
		/** Label of the button that opens the confirmation. */
		trigger: Snippet;
		triggerClass?: string;
		triggerLabel?: string;
		/** Label of the button that carries out the action, naming it specifically. */
		confirmLabel: string;
		/** Shown on the confirm button while the request is in progress, ending with an ellipsis. */
		pendingLabel?: string;
		danger?: boolean;
		/** Hidden form fields sent with the request. */
		fields?: Snippet;
	}

	let { action, title, message, trigger, triggerClass = 'btn', triggerLabel, confirmLabel, pendingLabel = 'Please wait…', danger = false, fields }: Props =
		$props();
	let open = $state(false);
	let submitting = $state(false);
</script>

<button type="button" class={triggerClass} aria-label={triggerLabel} aria-haspopup="dialog" onclick={() => (open = true)}>
	{@render trigger()}
</button>

<Dialog {open} {title} alert onclose={() => (open = false)}>
	{@render message()}
	{#snippet actions()}
		<button type="button" class="btn" data-autofocus onclick={() => (open = false)}>Cancel</button>
		<form
			method="POST"
			{action}
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
					open = false;
				};
			}}
		>
			{@render fields?.()}
			<button type="submit" class={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={submitting}>
				{submitting ? pendingLabel : confirmLabel}
			</button>
		</form>
	{/snippet}
</Dialog>

<style>
	form {
		display: contents;
	}
</style>
