<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import Icon from '#lib/ui/Icon.svelte';

	/** Save bar for a form: stays in reach while there are changes, says when they are saved. */
	interface Props {
		dirty: boolean;
		saving: boolean;
		/** Set after a save until the next change. */
		saved: boolean;
		label?: string;
		ondiscard: () => void;
	}
	let { dirty, saving, saved, label = 'Save changes', ondiscard }: Props = $props();

	// Leaving with unsaved changes asks first: the browser's own prompt on unload, a confirm in the app.
	beforeNavigate((nav) => {
		if (!dirty || saving) return;
		if (nav.type === 'leave') nav.cancel();
		else if (!confirm('Leave without saving your changes?')) nav.cancel();
	});
</script>

<div class="bar" class:dirty>
	<p class="state" role="status">
		{#if dirty}
			Unsaved changes
		{:else if saved}
			<Icon name="check" size={16} /> Saved
		{:else}
			All changes saved
		{/if}
	</p>
	<div class="buttons">
		<button type="button" class="btn" disabled={!dirty || saving} onclick={ondiscard}>Discard</button>
		<button type="submit" class="btn btn-primary" disabled={!dirty || saving}>{saving ? 'Saving…' : label}</button>
	</div>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-12);
		padding: var(--space-12) 0 var(--space-16);
		border-top: 1px solid var(--line);
		background: var(--bg);
	}
	.state {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	/* Follows the page only while there is something to save. */
	.bar.dirty {
		position: sticky;
		bottom: 0;
		z-index: 5;
	}
	.dirty .state {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	.buttons {
		display: flex;
		gap: var(--space-8);
	}
</style>
