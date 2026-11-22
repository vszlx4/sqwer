<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { localDay } from './progression.ts';
	import { courses } from './store.svelte.ts';

	/** Day streak for signed-in learners: lit once today counts, dim while today is still open. */
	const today = $derived(courses.days.includes(localDay()));
	const n = $derived(courses.streak);
	const label = $derived(
		n === 0 ? 'No streak yet. Finish a test or lesson to start one.' : today ? `${n}-day streak. Today counts.` : `${n}-day streak. Finish a test today to keep it.`
	);
</script>

{#if courses.signedIn && courses.loaded}
	<span class="streak" class:lit={today} title={label} data-testid="streak">
		<Icon name="flame" size={15} />
		<b aria-hidden="true">{n}</b>
		<span class="sr-only">{label}</span>
	</span>
{/if}

<style>
	.streak {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-10);
		border-radius: var(--radius-pill);
		border: 1px solid var(--line-strong);
		color: var(--ink-3);
		font-size: var(--fs-13);
		font-variant-numeric: tabular-nums;
		transition:
			color var(--dur-base) var(--ease-out),
			background-color var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out);
	}
	.streak b {
		font-weight: var(--fw-bold);
	}
	.lit {
		border-color: transparent;
		background: var(--streak-soft);
		color: var(--streak);
	}
	.lit :global(svg) {
		fill: currentColor;
	}
</style>
