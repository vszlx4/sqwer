<script lang="ts">
	import { onMount } from 'svelte';
	import { LESSON_MINUTES, TYPICAL_STARS, rankJourney, roughTime } from '#lib/courses/journey.ts';
	import type { Tier } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import { BADGE_MATERIALS } from '#lib/progress/rank-art.ts';
	import { below } from '#lib/site/breakpoints.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { BADGE, TEXT, buildGraph, nodeLines, type Orient } from './rankTree.ts';
	import { growTree } from './timeline.ts';

	/* Novice to Legend on one straight trunk over course time, the milestone ranks forking off it. Only the
	   orientation in use is drawn, on the client, in a stage that holds its size from the first paint. The SVG is
	   decoration; the list carries the same facts for assistive tech and for pages without scripts. */

	const NARROW = below('wide');
	const stops = rankJourney();
	const id = $props.id();
	let orient = $state<Orient | null>(null);
	const graph = $derived(orient ? buildGraph(stops, orient, roughTime) : null);

	onMount(() => {
		const mq = window.matchMedia(NARROW);
		const pick = () => (orient = mq.matches ? 'narrow' : 'wide');
		pick();
		mq.addEventListener('change', pick);
		return () => mq.removeEventListener('change', pick);
	});

	// Tier line colors from the badge materials: the darker body on light pages, the glow on dark ones.
	const TIERS = Object.keys(BADGE_MATERIALS) as Tier[];
	const tierVars = TIERS.map((t) => `--${t}-on-light: ${BADGE_MATERIALS[t].body[0]}; --${t}-on-dark: ${BADGE_MATERIALS[t].glow}`).join('; ');
	const tierColor = (t: Tier) => `var(--${t})`;
	const last = stops.at(-1)!;
	/** Where each material starts along the trunk, for its gradient. */
	const tierStops = TIERS.map((t) => ({ tier: t, at: stops.find((s) => s.rank.tier === t)!.minutes / last.minutes }));
	const minutes = `${Math.floor(LESSON_MINUTES)} to ${Math.ceil(LESSON_MINUTES)}`;
</script>

<div class="ranks-graph" style={tierVars}>
	<div class="rank-stage">
		{#if graph}
			{@const g = graph}
			<svg class="graph" viewBox="0 0 {g.width} {g.height}" aria-hidden="true" use:growTree>
				<defs>
					<linearGradient id="{id}-trunk" gradientUnits="userSpaceOnUse" x1={g.from.x} y1={g.from.y} x2={g.to.x} y2={g.to.y}>
						{#each tierStops as s, i (s.tier)}
							<stop offset={s.at} style:stop-color={tierColor(s.tier)} />
							<stop offset={tierStops[i + 1]?.at ?? 1} style:stop-color={tierColor(s.tier)} />
						{/each}
					</linearGradient>
				</defs>

				<path class="trunk" d={g.trunk} stroke="url(#{id}-trunk)" />
				{#each g.dots as d (d.level)}
					<circle class="dot" data-at={d.at} cx={d.pos.x} cy={d.pos.y} r="3.5" style:stroke={tierColor(d.tier)} />
				{/each}

				{#each g.nodes as n (n.stop.rank.level)}
					{@const [m1, m2] = nodeLines(n.stop, roughTime)}
					<g class="node" data-at={n.at} style:--tier={tierColor(n.stop.rank.tier)}>
						{#if n.fork}
							<path class="fork" d={n.fork} />
						{/if}
						{#if n.junction}
							<circle class="junction" cx={n.junction.x} cy={n.junction.y} r="4" />
						{/if}
						<g transform="translate({n.pos.x - BADGE / 2} {n.pos.y - BADGE / 2})">
							<g class="badge"><RankBadge rank={n.stop.rank} size={BADGE} /></g>
						</g>
						<g class="text">
							<text class="name" x={n.text.x} y={n.text.y}>{n.stop.rank.name}</text>
							<text class="meta" x={n.text.x} y={n.text.y + TEXT.gap + 2}>{m1}</text>
							<text class="meta" x={n.text.x} y={n.text.y + TEXT.gap * 2 + 2}>{m2}</text>
						</g>
					</g>
				{/each}
			</svg>
		{/if}
	</div>

	<ol class="sr-only">
		{#each stops as s (s.rank.level)}
			{@const [m1, m2] = nodeLines(s, roughTime)}
			<li>Rank {s.rank.level}, {s.rank.name}: {m1}, {m2}.</li>
		{/each}
	</ol>
	<noscript>
		<ol class="plain">
			{#each stops as s (s.rank.level)}
				{@const [m1, m2] = nodeLines(s, roughTime)}
				<li><strong>{s.rank.name}</strong> · {m1} · {m2}</li>
			{/each}
		</ol>
		<style>.rank-stage { display: none; }</style>
	</noscript>

	<p class="note">
		<Icon name="info" size={16} />
		<span>
			Approximate. Based on a steady learner earning {TYPICAL_STARS} stars a lesson at {minutes} minutes each, through all
			{last.lessons} lessons in about {roughTime(last.minutes)}. Speed and accuracy are the chapter check targets at each rank;
			your own pace will differ.
		</span>
	</p>
</div>

<style>
	.ranks-graph {
		--bronze: var(--bronze-on-light);
		--silver: var(--silver-on-light);
		--gold: var(--gold-on-light);
		--emerald: var(--emerald-on-light);
		--diamond: var(--diamond-on-light);
		margin-top: 48px;
	}
	:global(:root[data-theme='dark']) .ranks-graph {
		--bronze: var(--bronze-on-dark);
		--silver: var(--silver-on-dark);
		--gold: var(--gold-on-dark);
		--emerald: var(--emerald-on-dark);
		--diamond: var(--diamond-on-dark);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .ranks-graph {
			--bronze: var(--bronze-on-dark);
			--silver: var(--silver-on-dark);
			--gold: var(--gold-on-dark);
			--emerald: var(--emerald-on-dark);
			--diamond: var(--diamond-on-dark);
		}
	}
	/* Holds the graph's size before it is drawn, so nothing moves. */
	.rank-stage {
		aspect-ratio: 1160 / 400;
	}
	.graph {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.trunk,
	.fork {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.trunk {
		stroke-width: 3;
	}
	.fork {
		stroke: var(--tier);
		stroke-width: 2.5;
	}
	.junction {
		fill: var(--tier);
		stroke: var(--bg);
		stroke-width: 2;
	}
	.dot {
		fill: var(--bg);
		stroke-width: 2;
	}
	.name {
		font-family: var(--font-serif);
		font-size: var(--fs-20);
		fill: var(--ink);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		font-variant-numeric: tabular-nums;
		fill: var(--ink-2);
	}
	.plain {
		display: grid;
		gap: 8px;
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.note {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin-top: 32px;
		padding-top: 16px;
		border-top: 1px solid var(--line);
		font-size: var(--fs-13);
		line-height: var(--lh-body);
		color: var(--ink-3);
	}
	.note :global(.icon-info) {
		flex: none;
		margin-top: 2px;
		color: var(--ink-2);
	}
	.note span {
		max-width: 76ch;
	}

	/* Under 1100px (NARROW) the wide graph's text gets too small; the narrow one runs downwards instead. */
	@media (max-width: 1100px) {
		.rank-stage {
			aspect-ratio: 360 / 860;
			max-width: 440px;
			margin: 0 auto;
		}
	}
</style>
