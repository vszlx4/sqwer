<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Seo from '#lib/site/Seo.svelte';
	import StageA from './StageA.svelte';
	import type { Screen } from './mock.ts';

	// The chosen Listen and type layout (open stage), the reference the screens build (issue 177) start from.
	type Area = 'learn' | 'games';

	const screen = $derived<Screen>((['listening', 'close', 'accepted'] as const).find((s) => s === page.url.searchParams.get('s')) ?? 'listening');
	const area = $derived<Area>(page.url.searchParams.get('area') === 'games' ? 'games' : 'learn');

	function set(key: string, value: string) {
		const url = new URL(page.url.href);
		url.searchParams.set(key, value);
		void goto(url.href, { replaceState: true, reset: false });
	}

	const SCREENS: [Screen, string][] = [
		['listening', 'Listening'],
		['close', 'Close answer'],
		['accepted', 'Accepted answer']
	];
	const AREAS: [Area, string][] = [
		['learn', 'Lesson'],
		['games', 'Endless']
	];
</script>

<Seo title="Listen and type mockup" description="Draft screen for review." noindex />

<div class="draft">
	<div class="bar" aria-label="Mockup controls" role="group">
		<p class="label">Draft · issue 176</p>
		{#each [['s', SCREENS, screen], ['area', AREAS, area]] as [key, options, current] (key)}
			<div class="seg" role="radiogroup" aria-label={key === 's' ? 'Moment' : 'Where'}>
				{#each options as [value, text] (value)}
					<button type="button" role="radio" aria-checked={current === value} onclick={() => set(key as string, value as string)}>{text}</button>
				{/each}
			</div>
		{/each}
	</div>

	<section class="frame" data-area={area}>
		{#key `${screen}-${area}`}
			<StageA {screen} {area} />
		{/key}
	</section>
</div>

<style>
	.draft {
		display: flex;
		flex-direction: column;
		gap: var(--space-32);
		padding-block: var(--space-24) var(--space-64);
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-8) var(--space-12);
	}
	.label {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.seg {
		display: flex;
		flex-wrap: wrap;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.seg button {
		min-height: 36px;
		padding: 0 var(--space-12);
		border: 0;
		background: var(--bg);
		color: var(--ink-2);
		font: inherit;
		font-size: var(--fs-13);
		cursor: pointer;
	}
	.seg button + button {
		border-left: 1px solid var(--line-strong);
	}
	.seg button[aria-checked='true'] {
		background: var(--ink);
		color: var(--bg);
	}
	.frame {
		width: 100%;
		max-width: var(--w-wide);
		margin-inline: auto;
	}
</style>
