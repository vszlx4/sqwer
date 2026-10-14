<script lang="ts">
	import Dialog from '#lib/ui/Dialog.svelte';

	let { open, onclose }: { open: boolean; onclose: () => void } = $props();
	let submitting = $state(false);
</script>

<Dialog {open} title="Sign out of sqwer?" alert {onclose}>
	<p>Your results, finger map and statistics are saved to your account. You can sign in again at any time.</p>
	{#snippet actions()}
		<button type="button" class="btn" data-autofocus onclick={onclose}>Stay signed in</button>
		<form method="POST" action="/signout" onsubmit={() => (submitting = true)}>
			<button type="submit" class="btn btn-primary" disabled={submitting}>{submitting ? 'Signing out…' : 'Sign out'}</button>
		</form>
	{/snippet}
</Dialog>

<style>
	form {
		display: contents;
	}
</style>
