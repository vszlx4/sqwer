<script lang="ts">
	import EndlessGame from '#lib/games/EndlessGame.svelte';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let running = $state(false);
</script>

<Seo title={`${data.game.title}: endless mode`} description={`${data.game.summary} Played in endless rounds with adaptive difficulty.`} />

{#if !running}
	<Breadcrumbs items={[{ href: '/exams', label: 'Practice' }, { href: '/exams#games', label: 'Endless games' }, { href: `/play/${data.game.id}`, label: data.game.title }]} />
{/if}

<!-- During a run the game owns the first screen: no title, and the footer stays below the fold. -->
<div class="play" class:running>
	{#if running}
		<h1 class="sr-only">{data.game.title}</h1>
	{:else}
		<header>
			<p class="kicker">Endless mode</p>
			<h1>{data.game.title}</h1>
			<p class="summary">{data.game.summary}</p>
		</header>
	{/if}
	{#key data.game.id}<EndlessGame game={data.game} bind:running />{/key}
</div>

<style>
	.play {
		display: flex;
		flex-direction: column;
		gap: var(--space-24);
	}
	.running {
		min-height: calc(100dvh - var(--header-h) - var(--main-top) - var(--main-bottom));
	}
	.running > :global(.endless) {
		flex: 1;
	}
	.kicker {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	.summary {
		margin-top: var(--space-6);
		max-width: 64ch;
		color: var(--ink-2);
	}
</style>
