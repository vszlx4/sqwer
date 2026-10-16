<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/ui/Icon.svelte';
	import { CHAPTERS } from './catalog.ts';
	import { placementCredit } from './progression.ts';
	import { courses } from './store.svelte.ts';

	/**
	 * Starts the course at the chapter the placement test recommends. With an account, the chapters
	 * before it are marked complete with full stars and their points are added to the learner's XP;
	 * the server works this out from the saved placement test.
	 */
	let { chapter, large = false }: { chapter: number; large?: boolean } = $props();

	const signedIn = $derived(!!page.data.user);
	const credit = $derived(placementCredit(chapter, courses.progress));
	let busy = $state(false);
	let failed = $state(false);

	async function start() {
		busy = true;
		failed = false;
		if (signedIn) {
			const placed = await courses.place();
			if (!placed) {
				busy = false;
				failed = true;
				return;
			}
			await invalidate('app:user');
			await goto(`/learn/${CHAPTERS[placed.chapter - 1]!.lessons[0]!.id}`);
			return;
		}
		const first = CHAPTERS[chapter - 1]!.lessons[0]!.id;
		await courses.setStart(first);
		await goto(`/learn/${first}`);
	}
</script>

<div class="placement-start">
	<button type="button" class="btn btn-primary" class:btn-lg={large} disabled={busy} onclick={start}>
		{busy ? 'Saving your level…' : `Start chapter ${chapter}`} <Icon name="arrow" size={large ? 18 : 16} />
	</button>
	{#if chapter > 1}
		<p class="credit">
			{#if !signedIn}
				<a href="/signin">Sign in</a> to have chapters 1 to {chapter - 1} marked complete and earn their XP.
			{:else if credit.lessons}
				Chapters 1 to {chapter - 1} will be marked complete with full stars: <b>{credit.lessons} lessons, +{credit.xp.toLocaleString('en-GB')} XP</b>.
			{:else}
				Chapters 1 to {chapter - 1} are already complete with full stars.
			{/if}
		</p>
	{/if}
	{#if failed}
		<p class="error" role="alert">Your level could not be saved. Check your connection and try again; if you took the test without an account, take it again while signed in.</p>
	{/if}
</div>

<style>
	.placement-start {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.credit {
		font-size: 14px;
		color: var(--ink-2);
	}
	.credit b {
		color: var(--violet);
		font-variant-numeric: tabular-nums;
	}
	.error {
		font-size: 14px;
		color: var(--error);
	}
</style>
