<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto, invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/ui/Icon.svelte';
	import { CHAPTERS } from './catalog.ts';
	import { placementCredit } from './progression.ts';
	import { courses } from './store.svelte.ts';
	import { formatNumber } from '#lib/i18n/format.ts';

	/**
	 * Starts at the placement chapter. Signed in: earlier chapters complete with full stars, points added to XP
	 * (computed on the server).
	 */
	interface Props {
		chapter: number;
		large?: boolean;
		/** Centre the buttons and the note, for centred layouts. */
		centred?: boolean;
		/** Further buttons, shown in the same row as the start button. */
		children?: Snippet;
	}
	let { chapter, large = false, centred = false, children }: Props = $props();

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

<div class="placement-start" class:centred>
	<div class="buttons">
		<button type="button" class="btn btn-primary" class:btn-lg={large} disabled={busy} aria-busy={busy} onclick={start}>
			{busy ? 'Saving your level…' : `Start chapter\u00a0${chapter}`} <Icon name="arrow" size={large ? 18 : 16} />
		</button>
		{@render children?.()}
	</div>
	{#if chapter > 1}
		<p class="credit">
			{#if !signedIn}
				<a href="/signin">Sign in</a> to have chapters 1 to {chapter - 1} marked complete and earn their XP.
			{:else if credit.lessons}
				Chapters 1 to&nbsp;{chapter - 1} will be marked complete with full stars: <b>{credit.lessons}&nbsp;lessons, +{formatNumber(credit.xp)}&nbsp;XP</b>.
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
		gap: 10px;
	}
	.placement-start.centred {
		align-items: center;
		text-align: center;
	}
	.buttons {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.centred .buttons {
		justify-content: center;
	}
	.credit {
		max-width: 60ch;
		font-size: 14px;
		line-height: 1.5;
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.credit b {
		color: var(--violet);
		font-variant-numeric: tabular-nums;
	}
	@media (max-width: 480px) {
		.centred,
		.centred .buttons {
			align-self: stretch;
		}
		.centred .buttons {
			flex-direction: column;
			align-items: stretch;
		}
		.centred .buttons :global(.btn) {
			justify-content: center;
		}
	}
	.error {
		font-size: 14px;
		color: var(--error);
	}
</style>
