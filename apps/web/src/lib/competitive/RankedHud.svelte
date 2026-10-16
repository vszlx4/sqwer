<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { MIN_ACCURACY, divisionLevel, tierFor } from '#lib/progress/competitive.ts';
	import { saveSettings, settings } from '#lib/settings.svelte.ts';
	import RankEmblem from './RankEmblem.svelte';

	/**
	 * The heads-up display of the ranked test: a countdown ring and live readouts of speed,
	 * accuracy, the rank the current pace would earn and the gap to the player's best. Each readout
	 * can be switched off; the choice is kept with the other test settings.
	 */
	interface Props {
		started: boolean;
		remaining: number;
		total: number;
		wpm: number;
		accuracy: number;
		best: number | null;
	}
	let { started, remaining, total, wpm, accuracy, best }: Props = $props();

	const bestTier = $derived(tierFor(best));
	const qualifies = $derived(accuracy >= MIN_ACCURACY);
	const projected = $derived(started && qualifies ? tierFor(wpm) : null);
	const delta = $derived(best != null && started ? Math.round(wpm - best) : null);
	const share = $derived(total ? remaining / total : 1);

	const TOGGLES = [
		{ key: 'speed', label: 'Speed' },
		{ key: 'accuracy', label: 'Accuracy' },
		{ key: 'rank', label: 'Live rank' },
		{ key: 'versusBest', label: 'Versus best' }
	] as const;
	function toggle(key: (typeof TOGGLES)[number]['key']) {
		settings.ranked[key] = !settings.ranked[key];
		saveSettings();
	}
</script>

<div class="hud">
	<div class="row">
		<div class="best">
			<RankEmblem league={bestTier?.league ?? null} division={divisionLevel(bestTier)} size={44} />
			<span>
				<small>Your rank</small>
				<b>{bestTier?.name ?? 'Unranked'}</b>
				<small>{best != null ? `Best ${Math.round(best)} WPM` : 'No ranked result yet'}</small>
			</span>
		</div>

		<div class="clock" role="timer" aria-label={`${remaining} seconds left`}>
			<svg viewBox="0 0 64 64" aria-hidden="true">
				<circle cx="32" cy="32" r="28" class="track" />
				<circle cx="32" cy="32" r="28" class="left" class:low={remaining <= 10 && started} style:stroke-dashoffset={`${(1 - share) * 175.9}`} />
			</svg>
			<span class="secs">{remaining}</span>
		</div>

		<div class="readouts" aria-live="off">
			{#if settings.ranked.speed}
				<div class="stat"><small>Speed</small><b>{started ? wpm : 0}<i>WPM</i></b></div>
			{/if}
			{#if settings.ranked.accuracy}
				<div class="stat" class:warn={started && !qualifies}><small>Accuracy</small><b>{started ? Math.round(accuracy) : 100}<i>%</i></b></div>
			{/if}
			{#if settings.ranked.rank}
				<div class="stat rank">
					<small>Live rank</small>
					{#if projected}
						<b class="proj"><RankEmblem league={projected.league} division={divisionLevel(projected)} size={26} />{projected.name}</b>
					{:else}
						<b class="muted">{started && !qualifies ? `Below ${MIN_ACCURACY}%` : started ? 'Under 50 WPM' : 'Waiting'}</b>
					{/if}
				</div>
			{/if}
			{#if settings.ranked.versusBest && best != null}
				<div class="stat" class:up={delta != null && delta > 0} class:down={delta != null && delta < 0}>
					<small>Versus best</small><b>{delta == null ? '0' : delta > 0 ? `+${delta}` : delta}<i>WPM</i></b>
				</div>
			{/if}
		</div>
	</div>

	<div class="controls" role="group" aria-label="Live readouts">
		<Icon name="eye" size={14} />
		{#each TOGGLES as t (t.key)}
			<button type="button" aria-pressed={settings.ranked[t.key]} onclick={() => toggle(t.key)}>{t.label}</button>
		{/each}
		<span class="rule">Ranked · {total} seconds · at least {MIN_ACCURACY}% accuracy</span>
	</div>
</div>

<style>
	.hud {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 14px 16px;
		border-radius: 3px;
		background:
			radial-gradient(80% 140% at 50% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
			#0a0a0a;
		color: #f2f2ee;
		border: 1px solid #1f1f1f;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1.4fr);
		align-items: center;
		gap: 18px;
	}
	.best {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}
	.best span {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.best b {
		font-size: 15px;
	}
	small {
		font-size: 11.5px;
		color: #8e8e88;
	}
	.clock {
		position: relative;
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
	}
	.clock svg {
		position: absolute;
		inset: 0;
		transform: rotate(-90deg);
	}
	.track {
		fill: none;
		stroke: #1f1f1f;
		stroke-width: 5;
	}
	.left {
		fill: none;
		stroke: var(--accent);
		stroke-width: 5;
		stroke-linecap: round;
		stroke-dasharray: 175.9;
		transition:
			stroke-dashoffset 100ms linear,
			stroke 200ms ease;
	}
	.left.low {
		stroke: #ff5c5c;
	}
	.secs {
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.readouts {
		display: flex;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 8px;
	}
	.stat {
		display: flex;
		flex-direction: column;
		min-width: 88px;
		padding: 6px 10px;
		border-radius: 3px;
		background: #141414;
		border: 1px solid #222;
	}
	.stat b {
		display: flex;
		align-items: baseline;
		gap: 3px;
		font-size: 22px;
		font-variant-numeric: tabular-nums;
	}
	.stat i {
		font-style: normal;
		font-size: 11px;
		font-weight: 600;
		color: #8e8e88;
	}
	.stat.warn {
		border-color: #ff5c5c;
	}
	.stat.warn b {
		color: #ff8a8a;
	}
	.stat.up b {
		color: #2fc48a;
	}
	.stat.down b {
		color: #ff8a8a;
	}
	.stat.rank {
		min-width: 150px;
	}
	.proj {
		align-items: center !important;
		gap: 6px !important;
		font-size: 15px !important;
		white-space: nowrap;
	}
	.muted {
		font-size: 14px !important;
		color: #8e8e88;
	}
	.controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		padding-top: 8px;
		border-top: 1px solid #1a1a1a;
		color: #8e8e88;
	}
	.controls button {
		padding: 3px 9px;
		border-radius: 3px;
		border: 1px solid #2c2c2c;
		background: none;
		color: #8e8e88;
		font: inherit;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
	}
	.controls button[aria-pressed='true'] {
		border-color: color-mix(in srgb, var(--accent) 60%, transparent);
		color: #f2f2ee;
		background: rgb(204 249 0 / 0.08);
	}
	.rule {
		margin-left: auto;
		font-size: 12px;
	}
	@media (max-width: 760px) {
		.row {
			grid-template-columns: auto 1fr;
		}
		.readouts {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
		.rule {
			margin-left: 0;
		}
	}
</style>
