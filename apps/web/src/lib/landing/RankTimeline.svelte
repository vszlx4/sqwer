<script lang="ts">
	import { onMount } from 'svelte';
	import { LESSON_MINUTES, TYPICAL_STARS, rankJourney, roughTime } from '#lib/courses/journey.ts';
	import type { Tier } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import { BADGE_MATERIALS } from '#lib/progress/rank-art.ts';
	import { LABEL, buildTree, labelLines, type Leaf, type Orient } from './rankTree.ts';
	import { growTree } from './timeline.ts';

	/* The ten ranks as one tree on a course-time axis: wide grows left to right, narrow top to bottom. Only the
	   orientation in use is drawn, on the client, in a stage that holds its size from the first paint. The SVG is
	   decoration; the list carries the same facts for assistive tech and for pages without scripts. */

	const NARROW = '(max-width: 1100px)';
	const stops = rankJourney();
	const id = $props.id();
	let orient = $state<Orient | null>(null);
	const tree = $derived(orient ? buildTree(stops, orient, roughTime) : null);

	onMount(() => {
		const mq = window.matchMedia(NARROW);
		const pick = () => (orient = mq.matches ? 'narrow' : 'wide');
		pick();
		mq.addEventListener('change', pick);
		return () => mq.removeEventListener('change', pick);
	});
	const TIERS = Object.keys(BADGE_MATERIALS) as Tier[];
	const minutes = `${Math.floor(LESSON_MINUTES)} to ${Math.ceil(LESSON_MINUTES)}`;

	/** Leaf outline pointing along +x from its stem, in absolute units so GSAP owns the transform. */
	function leaf(l: Leaf) {
		const L = l.size * 1.7;
		const w = L * 0.24;
		return `M0 0 C${L * 0.28} ${-w * 1.5} ${L * 0.74} ${-w * 1.2} ${L} 0 C${L * 0.74} ${w * 1.2} ${L * 0.28} ${w * 1.5} 0 0Z`;
	}
</script>

<div class="tree-wrap">
	<div class="rank-stage">
		{#if tree}
		{@const t = tree}
		{@const key = `${id}-${t.orient}`}
		<svg class="tree" viewBox="0 0 {t.width} {t.height}" aria-hidden="true" use:growTree>
			<defs>
				{#each TIERS as tier (tier)}
					<linearGradient id="{key}-{tier}" x1="0" y1="0" x2="1" y2="0">
						<stop offset="0" stop-color={BADGE_MATERIALS[tier].body[0]} />
						<stop offset="1" stop-color={BADGE_MATERIALS[tier].face[1]} />
					</linearGradient>
				{/each}
				<mask id="{key}-trunk" maskUnits="userSpaceOnUse">
					<path class="grow" d={t.trunkLine} stroke="white" stroke-width="28" fill="none" />
				</mask>
				{#each t.branches as b, i (b.stop.rank.level)}
					<mask id="{key}-b{i}" maskUnits="userSpaceOnUse">
						<path class="grow" d={b.line} stroke="white" stroke-width="18" fill="none" />
					</mask>
				{/each}
			</defs>

			<g class="axis">
				<path class="axis-line" d={t.axis} />
				{#each t.ticks as k (k.text)}
					<g class="tick" data-at={k.at}>
						{#if t.orient === 'wide'}
							<path d="M{k.x} {k.y - 5} V{k.y + 5}" />
							<text x={k.x} y={k.y + 24} text-anchor="middle">{k.text}</text>
						{:else}
							<path d="M{k.x - 5} {k.y} H{k.x + 5}" />
							<text x={k.x - 12} y={k.y + 4} text-anchor="end">{k.text}</text>
						{/if}
					</g>
				{/each}
			</g>

			<g class="wood">
				{#each t.roots as r, i (i)}
					<path class="twig root" d={r.shape} data-base="{r.base.x} {r.base.y}" />
				{/each}
				<path class="trunk" d={t.trunk} mask="url(#{key}-trunk)" />
			</g>

			{#each t.sprigs as s, i (i)}
				<g class="sprig" data-at={s.at}>
					<path class="twig" d={s.twig.shape} data-base="{s.twig.base.x} {s.twig.base.y}" />
					{#each s.leaves as l, j (j)}
						<g transform="translate({l.x} {l.y}) rotate({l.angle})"><path class="leaf" d={leaf(l)} fill="url(#{key}-{l.tier})" /></g>
					{/each}
				</g>
			{/each}

			{#each t.branches as b, i (b.stop.rank.level)}
				{@const [m1, m2] = labelLines(b.stop, roughTime)}
				{@const end = b.label.anchor === 'end'}
				<g class="branch" data-at={b.at}>
					<path class="limb" d={b.shape} mask="url(#{key}-b{i})" />
					{#each b.twigs as w, j (j)}
						<path class="twig" d={w.shape} data-base="{w.base.x} {w.base.y}" />
					{/each}
					{#each b.leaves as l, j (j)}
						<g transform="translate({l.x} {l.y}) rotate({l.angle})"><path class="leaf" d={leaf(l)} fill="url(#{key}-{l.tier})" /></g>
					{/each}
					<circle class="bud" cx={b.tip.x} cy={b.tip.y} r="4.5" />
					<g transform="translate({b.label.x} {b.label.y})">
						<g class="label">
							<g transform="translate({end ? -LABEL.badge : 0} 0)"><RankBadge rank={b.stop.rank} size={LABEL.badge} /></g>
							<text class="name" x={end ? -LABEL.badge - 10 : LABEL.badge + 10} y="24" text-anchor={end ? 'end' : 'start'}>{b.stop.rank.name}</text>
							<text class="meta" x={end ? -2 : 2} y={LABEL.badge + 8 + 13} text-anchor={end ? 'end' : 'start'}>{m1}</text>
							<text class="meta" x={end ? -2 : 2} y={LABEL.badge + 8 + 13 + LABEL.line} text-anchor={end ? 'end' : 'start'}>{m2}</text>
						</g>
					</g>
				</g>
			{/each}
		</svg>
		{/if}
	</div>

	<ol class="sr-only">
		{#each stops as s (s.rank.level)}
			{@const [m1, m2] = labelLines(s, roughTime)}
			<li>Rank {s.rank.level}, {s.rank.name}: {m1}, {m2}.</li>
		{/each}
	</ol>

	<noscript>
		<ol class="plain">
			{#each stops as s (s.rank.level)}
				{@const [m1, m2] = labelLines(s, roughTime)}
				<li><strong>{s.rank.name}</strong> · {m1} · {m2}</li>
			{/each}
		</ol>
		<style>.rank-stage { display: none; }</style>
	</noscript>

	<p class="note">
		All figures are approximate: a steady learner earning {TYPICAL_STARS} stars a lesson, at {minutes} minutes each. Speed and
		accuracy are the chapter check targets at that point. Your own pace will differ.
	</p>
</div>

<style>
	.tree-wrap {
		--wood: color-mix(in srgb, var(--ink) 80%, var(--accent));
		margin-top: 40px;
	}
	:global(:root[data-theme='dark']) .tree-wrap {
		--wood: color-mix(in srgb, var(--ink-2) 78%, var(--accent));
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .tree-wrap {
			--wood: color-mix(in srgb, var(--ink-2) 78%, var(--accent));
		}
	}
	/* Holds the tree's size before it is drawn, so nothing moves. */
	.rank-stage {
		aspect-ratio: 1160 / 724;
	}
	.tree {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.plain {
		display: grid;
		gap: 8px;
		max-width: 520px;
		margin: 0 auto;
		font-size: 14px;
		color: var(--ink-2);
	}
	.trunk,
	.limb,
	.twig {
		fill: var(--wood);
	}
	.leaf {
		stroke: var(--bg);
		stroke-width: 0.6;
	}
	.bud {
		fill: var(--accent);
		stroke: var(--bg);
		stroke-width: 2.5;
	}
	.axis-line,
	.tick path {
		fill: none;
		stroke: var(--line-strong);
		stroke-width: 1;
	}
	.tick text {
		font-family: var(--font-mono);
		font-size: 11px;
		fill: var(--ink-3);
	}
	.name {
		font-family: var(--font-serif);
		font-size: 20px;
		fill: var(--ink);
	}
	.meta {
		font-family: var(--font-mono);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		fill: var(--ink-2);
	}
	.note {
		max-width: 640px;
		margin: 20px auto 0;
		font-size: 12.5px;
		line-height: 1.5;
		text-align: center;
		color: var(--ink-3);
	}

	/* Under 1100px (NARROW) the wide tree's text gets too small; the narrow one grows downwards instead. */
	@media (max-width: 1100px) {
		.rank-stage {
			aspect-ratio: 360 / 1500;
			max-width: 440px;
			margin: 0 auto;
		}
		.note {
			max-width: 440px;
			text-align: left;
		}
	}
</style>
