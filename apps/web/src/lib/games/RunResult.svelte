<script lang="ts">
	import type { Snippet } from 'svelte';
	import LevelIcon from './LevelIcon.svelte';
	import StatIcon from './StatIcon.svelte';
	import type { RunStat } from './RunBar.svelte';
	import { tierOf } from './levels.ts';

	export interface Split {
		label: string;
		count: number;
		/** app.css color for the segment. */
		color: string;
	}

	/**
	 * The end of a run on one screen: score and level reached up front, a few statistics, how the answers split
	 * (one bar), the words to practice as chips that never push the page longer, and the actions.
	 */
	let {
		summary,
		score,
		best,
		newBest,
		top,
		stats,
		split = [],
		misses = [],
		actions
	}: {
		summary: string;
		score: number;
		best: number;
		newBest: boolean;
		/** Highest difficulty of the run; 0 when nothing was played. */
		top: number;
		stats: RunStat[];
		split?: Split[];
		misses?: { word: string; typed: string }[];
		actions: Snippet;
	} = $props();

	/** Missed words shown as chips, about three rows at the width there is; the rest are counted. */
	let width = $state(640);
	const SHOWN = $derived(Math.max(5, Math.floor(width / 130) * 3 - 1));
	const total = $derived(split.reduce((n, s) => n + s.count, 0));
	const tier = $derived(top ? tierOf(top) : null);
</script>

<section class="run-result" aria-labelledby="run-title">
	<header>
		<h2 id="run-title">Run complete</h2>
		<p>{summary}</p>
	</header>

	<div class="hero">
		<div class="score">
			<span class="points">{score}</span>
			<span class="unit">points</span>
			<span class="record" class:new={newBest}>
				{#if newBest}<StatIcon name="score" size={14} /> New best{:else if best}Best {best}{/if}
			</span>
		</div>
		{#if tier}
			<div class="reached" style:--level={`var(--level-${tier.id})`}>
				<LevelIcon id={tier.id} size={40} />
				<span><small>Reached</small><b>{tier.name}</b></span>
			</div>
		{/if}
	</div>

	<ul class="stats">
		{#each stats as s (s.label)}
			<li><StatIcon name={s.icon} size={18} /><b>{s.value}</b><span>{s.label}</span></li>
		{/each}
	</ul>

	{#if total}
		<div class="split">
			<div class="bar" aria-hidden="true">
				{#each split.filter((s) => s.count) as s (s.label)}<span style:flex-grow={s.count} style:background={`var(${s.color})`}></span>{/each}
			</div>
			<ul>
				{#each split as s (s.label)}
					<li><span class="dot" style:background={`var(${s.color})`} aria-hidden="true"></span>{s.label} <b>{s.count}</b></li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if misses.length}
		<div class="misses" bind:clientWidth={width}>
			<h3>To practice</h3>
			<ul>
				{#each misses.slice(0, SHOWN) as m, i (i)}
					<li title={`You typed ${m.typed || 'nothing'}`}><b>{m.word}</b><span class="sr-only">, you typed {m.typed || 'nothing'}</span></li>
				{/each}
				{#if misses.length > SHOWN}<li class="more">+{misses.length - SHOWN} more</li>{/if}
			</ul>
		</div>
	{/if}

	<div class="actions">{@render actions()}</div>
</section>

<style>
	.run-result {
		display: grid;
		gap: var(--space-20);
		width: min(100%, 720px); /* off-scale: one readable column for the summary */
		margin: auto;
		padding: clamp(var(--space-20), 3vw, var(--space-32));
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	header h2 {
		font-size: var(--fs-title);
		line-height: var(--lh-snug);
	}
	header p {
		margin-top: var(--space-4);
		color: var(--ink-2);
	}
	.hero {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-16);
	}
	.score {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-6) var(--space-10);
	}
	.points {
		font-size: clamp(48px, 9vw, 80px); /* off-scale: the run's one big number */
		font-weight: var(--fw-bold);
		line-height: var(--lh-tight);
		font-variant-numeric: tabular-nums;
	}
	.unit {
		font-size: var(--fs-18);
		color: var(--ink-2);
	}
	.record {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-3);
	}
	.record.new {
		padding: var(--space-4) var(--space-10);
		border-radius: var(--radius-pill);
		background: var(--reward-soft);
		color: var(--reward);
	}
	.reached {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-10) var(--space-20) var(--space-10) var(--space-12);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--level) 14%, transparent);
	}
	.reached span {
		display: grid;
	}
	.reached small {
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	.reached b {
		font-size: var(--fs-20);
		line-height: var(--lh-snug);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); /* off-scale: stat tile minimum */
		gap: var(--space-8);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.stats li {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: var(--space-2) var(--space-8);
		padding: var(--space-10) var(--space-12);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink-3);
	}
	.stats b {
		font-size: var(--fs-20);
		line-height: var(--lh-tight);
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.stats li span {
		grid-column: 1 / -1;
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	.split {
		display: grid;
		gap: var(--space-8);
	}
	.bar {
		display: flex;
		gap: var(--space-2);
		height: 8px;
		overflow: hidden;
		border-radius: var(--radius-pill);
		background: var(--surface-2);
	}
	.bar span {
		flex-basis: 0;
		min-width: 4px;
	}
	.split ul,
	.misses ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6) var(--space-16);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.split li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
	}
	.split b {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.misses {
		display: grid;
		gap: var(--space-8);
	}
	.misses h3 {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.misses ul {
		gap: var(--space-6);
	}
	.misses li {
		padding: var(--space-4) var(--space-10);
		border-radius: var(--radius-pill);
		border: 1px solid var(--line);
		background: var(--bg);
	}
	.misses li b {
		font-family: var(--font-mono);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.misses .more {
		border-style: dashed;
		color: var(--ink-3);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	@media (max-width: 560px) {
		.actions > :global(*) {
			flex: 1 1 auto;
			justify-content: center;
		}
	}
</style>
