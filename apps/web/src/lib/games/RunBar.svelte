<script lang="ts">
	import type { Snippet } from 'svelte';
	import LevelIcon from './LevelIcon.svelte';
	import StatIcon, { type StatIconName } from './StatIcon.svelte';
	import { levelChange, tierOf, tierProgress } from './levels.ts';

	export interface RunStat {
		icon: StatIconName;
		/** Named on hover and for screen readers; the bar itself shows only icon and value. */
		label: string;
		value: string | number;
	}

	/**
	 * The bar over a running game: the level (with its progress when adaptive), the word set, a row of icon-and-number
	 * statistics named on hover, and the run's actions on the right.
	 */
	let { difficulty, adaptive, set, stats, extra, actions }: { difficulty: number; adaptive: boolean; set?: string; stats: RunStat[]; extra?: Snippet; actions?: Snippet } = $props();
	const tier = $derived(tierOf(difficulty));
	const progress = $derived(tierProgress(difficulty));

	// A move into another level gets a short note under the chip; moves inside a level stay quiet.
	const NOTE_MS = 2200;
	let note = $state<{ text: string; key: number } | null>(null);
	let was: number | null = null;
	$effect(() => {
		const now = difficulty;
		const way = was === null ? null : levelChange(was, now);
		was = now;
		if (!way) return;
		note = { text: way === 'up' ? `Level up: ${tierOf(now).name}` : `Eased to ${tierOf(now).name}`, key: Date.now() };
		const timer = setTimeout(() => (note = null), NOTE_MS);
		return () => clearTimeout(timer);
	});
</script>

<div class="runbar" style:--level={`var(--level-${tier.id})`}>
	<div class="where">
		{#key tier.id}
			<span class="level" data-tip={adaptive ? 'Adaptive level' : 'Fixed level'}>
				<LevelIcon id={tier.id} size={20} />
				<span class="name">{tier.name}</span>
				<span class="sr-only">{adaptive ? ', adaptive' : ', fixed'}</span>
				{#if adaptive}
					<span class="meter" aria-hidden="true"><span style:transform={`scaleX(${progress})`}></span></span>
				{/if}
			</span>
		{/key}
		<span class="sr-only" aria-live="polite">{note?.text ?? ''}</span>
		{#if note}
			{#key note.key}<span class="note" aria-hidden="true">{note.text}</span>{/key}
		{/if}
		{#if set}<span class="set" data-tip="Word set"><StatIcon name="set" size={14} />{set}<span class="sr-only"> words</span></span>{/if}
	</div>
	<ul class="stats" aria-live="polite">
		{#each stats as s (s.label)}
			<li data-tip={s.label}><StatIcon name={s.icon} /><b>{s.value}</b><span class="sr-only"> {s.label}</span></li>
		{/each}
		{@render extra?.()}
	</ul>
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</div>

<style>
	.runbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-12) var(--space-24);
		padding: var(--space-8) var(--space-8) var(--space-8) var(--space-10);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.where {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-8);
		min-width: 0;
	}
	.level {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-12) var(--space-6) var(--space-8);
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--level) 14%, transparent);
	}
	.name {
		font-size: var(--fs-15);
		font-weight: var(--fw-bold);
		line-height: var(--lh-tight);
		color: var(--ink);
	}
	.meter {
		position: absolute;
		left: var(--space-12);
		right: var(--space-12);
		bottom: 3px; /* off-scale: hairline inset under the name */
		height: 2px;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--level) 22%, transparent);
	}
	.meter > span {
		display: block;
		height: 100%;
		border-radius: var(--radius-pill);
		background: var(--level);
		transform-origin: left;
		transition: transform var(--dur-slow) var(--ease-out);
	}
	.set {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-6) var(--space-10);
		border-radius: var(--radius-pill);
		border: 1px solid var(--line);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-tight);
		color: var(--ink-2);
		white-space: nowrap;
		position: relative;
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-6) var(--space-20);
		margin: 0 auto 0 0;
		padding: 0;
		list-style: none;
	}
	.stats :global(li) {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		color: var(--ink-3);
	}
	.stats b {
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
		line-height: var(--lh-tight);
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		margin-left: auto;
	}

	/* Names on hover: a small label under the item. */
	[data-tip]::after,
	.stats :global([data-tip])::after {
		content: attr(data-tip);
		position: absolute;
		top: calc(100% + var(--space-8));
		left: 50%;
		z-index: var(--z-overlay);
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--bg);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-snug);
		white-space: nowrap;
		pointer-events: none;
		opacity: 0;
		transform: translate(-50%, -2px);
		transition:
			opacity var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	[data-tip]:hover::after,
	.stats :global([data-tip]:hover)::after {
		opacity: 1;
		transform: translate(-50%, 0);
	}
	.note {
		position: absolute;
		top: calc(100% + var(--space-8));
		left: 0;
		z-index: var(--z-overlay);
		padding: var(--space-4) var(--space-10);
		border-radius: var(--radius-pill);
		border: 1px solid var(--level);
		background: color-mix(in srgb, var(--level) 16%, var(--surface));
		color: var(--ink);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		white-space: nowrap;
		pointer-events: none;
		animation: note-out var(--dur-slow) var(--ease-out) 1.8s forwards; /* off-scale: fades as the 2.2 s note ends */
	}
	@media (prefers-reduced-motion: no-preference) {
		.level {
			animation: level-in var(--dur-slow) var(--ease-spring);
		}
		.note {
			animation:
				note-in var(--dur-base) var(--ease-spring),
				note-out var(--dur-slow) var(--ease-out) 1.8s forwards; /* off-scale: as above */
		}
	}
	@keyframes note-in {
		from {
			transform: translateY(-4px);
			opacity: 0;
		}
	}
	@keyframes note-out {
		to {
			opacity: 0;
		}
	}
	@keyframes level-in {
		from {
			transform: scale(0.92);
			opacity: 0.4;
		}
	}
</style>
