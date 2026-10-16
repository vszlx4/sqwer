<script lang="ts">
	import EndlessGame from '#lib/games/EndlessGame.svelte';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title={`${data.game.title}: endless mode`} description={`${data.game.summary} Played in endless rounds with adaptive difficulty.`} />

<Breadcrumbs items={[{ href: '/exams', label: 'Practice' }, { href: '/exams#games', label: 'Endless games' }, { href: `/play/${data.game.id}`, label: data.game.title }]} />

<div class="play">
	<header>
		<p class="kicker">Endless mode</p>
		<h1>{data.game.title}</h1>
		<p class="summary">{data.game.summary}</p>
	</header>
	{#key data.game.id}<EndlessGame game={data.game} />{/key}
</div>

<style>
	.play {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.kicker {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(32px, 4.4vw, 48px);
		line-height: 1.05;
	}
	.summary {
		margin-top: 6px;
		max-width: 64ch;
		color: var(--ink-2);
	}
</style>
