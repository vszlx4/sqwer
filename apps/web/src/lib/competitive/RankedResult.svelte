<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import ResultReport from '#lib/results/ResultReport.svelte';
	import type { UploadOutcome } from '#lib/results/store.svelte.ts';
	import type { ResultRecord } from '#lib/results/types.ts';
	import { MIN_ACCURACY, TIERS, nextTier, tierFor, tierRange } from '#lib/progress/competitive.ts';
	import { examXp } from '#lib/progress/xp.ts';
	import Confetti from '#lib/ui/Confetti.svelte';
	import CountUp from '#lib/ui/CountUp.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import RankEmblem from './RankEmblem.svelte';

	/** Ranked result: earned rank, comparison with best, server check, leaderboard place. */
	interface Props {
		record: ResultRecord;
		/** Best verified speed before this result. */
		previousBest: number | null;
		upload: Promise<UploadOutcome | null> | null;
		onnext: () => void;
		onrepeat: () => void;
	}
	let { record, previousBest, upload, onnext, onrepeat }: Props = $props();

	const signedIn = $derived(!!page.data.user);
	const counts = $derived(record.status === 'completed' && record.accuracy >= MIN_ACCURACY);
	const tier = $derived(counts ? tierFor(record.wpm) : null);
	const before = $derived(tierFor(previousBest));
	const isBest = $derived(counts && (previousBest == null || record.wpm > previousBest));
	const rankedUp = $derived(isBest && !!tier && (!before || tier.index > before.index));
	const xp = $derived(examXp(record));
	/** Where this result sits between its rank and the next one, from 0 to 1. */
	const ladder = $derived.by(() => {
		if (!counts || record.status !== 'completed') return null;
		const next = nextTier(tier);
		if (!next) return null;
		const from = tier?.from ?? 0;
		return { from, next, share: Math.min(1, Math.max(0, (record.wpm - from) / (next.from - from))), gap: Math.max(0, next.from - Math.floor(record.wpm)) };
	});

	let check = $state<'pending' | 'verified' | 'rejected' | 'offline'>('pending');
	let standing = $state<{ position: number; players: number } | null>(null);
	let full = $state(false);

	onMount(() => {
		if (!signedIn || !upload) {
			check = 'offline';
			return;
		}
		void upload.then(async (outcome) => {
			if (!outcome) return void (check = 'offline');
			check = outcome.verified ? 'verified' : 'rejected';
			if (outcome.verified) {
				const res = await fetch('/api/competitive').catch(() => null);
				if (res?.ok) standing = ((await res.json()) as { standing: typeof standing }).standing;
			}
		});
	});

	const verdict = $derived.by(() => {
		if (record.status !== 'completed') return 'Not completed: ranked results need the full sixty seconds.';
		if (!counts) return `Accuracy under ${MIN_ACCURACY}%: this result does not count towards your rank.`;
		if (!tier) return `Under ${TIERS[0]!.from} WPM: reach ${TIERS[0]!.from} WPM to enter ${TIERS[0]!.name}.`;
		if (rankedUp) return before ? `Rank up: ${before.name} to ${tier.name}.` : `First rank: ${tier.name}.`;
		if (isBest) return `New personal best, still ${tier.name}.`;
		return `Your best remains ${Math.round(previousBest ?? 0)} WPM (${before?.name ?? 'Unranked'}).`;
	});
</script>

{#if rankedUp && check !== 'rejected'}<Confetti pieces={220} />{/if}

<section class="ranked" aria-labelledby="ranked-title">
	<header class="hero rise">
		<div class="emblem" class:up={rankedUp}>
			<RankEmblem league={tier?.league ?? null} size={156} />
		</div>
		<div class="title">
			<p class="kicker">Ranked result · {record.seconds.toFixed(0)} seconds</p>
			<h2 id="ranked-title">{tier?.name ?? 'Unranked'}</h2>
			<p class="verdict" class:good={isBest}>{verdict}</p>
			{#if tier}<p class="range">{tierRange(tier)}</p>{/if}
		</div>
	</header>

	{#if ladder}
		<div class="ladder rise" style:--i="1" style:--league={ladder.next.league.colour}>
			<div class="ends">
				<span>{tier?.name ?? 'Unranked'} <small>{ladder.from} WPM</small></span>
				<span class="to"><RankEmblem league={ladder.next.league} size={22} /> {ladder.next.name} <small>{ladder.next.from} WPM</small></span>
			</div>
			<div class="track" role="progressbar" aria-label={`Progress to ${ladder.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ladder.share * 100)}>
				<span style:transform={`scaleX(${ladder.share})`}></span>
			</div>
			<p class="gap"><b>{ladder.gap} WPM</b> more to reach {ladder.next.name}</p>
		</div>
	{/if}

	<div class="figures rise" style:--i="2">
		<div class="big">
			<span class="label">Speed</span>
			<span class="value" data-testid="result-wpm"><CountUp value={record.wpm} /><small>WPM</small></span>
		</div>
		<div class="big" class:warn={record.accuracy < MIN_ACCURACY}>
			<span class="label">Accuracy</span>
			<span class="value" data-testid="result-acc"><CountUp value={record.accuracy} /><small>%</small></span>
		</div>
		<dl class="mini">
			<div><dt>Raw speed</dt><dd>{Math.round(record.raw ?? 0)} WPM</dd></div>
			<div><dt>Consistency</dt><dd>{Math.round(record.consistency ?? 0)}%</dd></div>
			<div>
				<dt>Versus best</dt>
				<dd class:up={previousBest != null && record.wpm > previousBest}>
					{previousBest == null ? 'First run' : `${record.wpm - previousBest >= 0 ? '+' : ''}${Math.round(record.wpm - previousBest)} WPM`}
				</dd>
			</div>
			{#if xp > 0}<div><dt>Experience</dt><dd class="xp">+{xp} XP</dd></div>{/if}
		</dl>
	</div>

	<p class={`check rise ${check}`} style:--i="3">
		{#if check === 'pending'}<span class="spinner" aria-hidden="true"></span> Checking the result on the server…
		{:else if check === 'verified'}<Icon name="check" size={16} /> Verified{standing ? `. You are #${standing.position} of ${standing.players} on the leaderboard.` : '.'}
		{:else if check === 'rejected'}<Icon name="info" size={16} /> Not counted: this result did not pass the ranked checks (duration, accuracy and keystroke timing).
		{:else}<Icon name="info" size={16} /> {signedIn ? 'The result could not be saved. Your connection may have dropped.' : 'Sign in to save ranked results and appear on the leaderboard.'}{/if}
	</p>

	<div class="actions rise" style:--i="4">
		<button type="button" class="btn btn-primary" onclick={onnext}><Icon name="play" size={17} /> Play again <kbd>Tab</kbd></button>
		<button type="button" class="btn" onclick={onrepeat}><Icon name="repeat" size={17} /> Same words</button>
		<a class="btn" href="/competitive#leaderboard"><Icon name="trophy" size={17} /> Leaderboard</a>
		<button type="button" class="btn" aria-expanded={full} onclick={() => (full = !full)}><Icon name="chart" size={17} /> {full ? 'Hide' : 'Full'} report</button>
	</div>
</section>

{#if full}
	<div class="full rise">
		<ResultReport {record} onnext={onnext} onrepeat={onrepeat} />
	</div>
{/if}

<style>
	.ranked {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}
	.hero {
		display: flex;
		align-items: center;
		gap: clamp(18px, 4vw, 36px);
	}
	.emblem.up {
		animation: rank-up 900ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	@keyframes rank-up {
		from {
			transform: scale(0.5) rotate(-12deg);
			opacity: 0;
			filter: blur(10px);
		}
	}
	.kicker {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
	}
	h2 {
		margin-top: 2px;
		font-size: clamp(40px, 5.6vw, 64px);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
	}
	.verdict {
		margin-top: 12px;
		max-width: 60ch;
		font-size: 16.5px;
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.verdict.good {
		color: var(--ink);
		font-weight: 600;
	}
	.range {
		margin-top: 2px;
		font-size: 14px;
		color: var(--ink-3);
	}
	.ladder {
		display: flex;
		flex-direction: column;
		gap: 8px;
		max-width: 720px;
	}
	.ends {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		font-size: 14px;
		font-weight: 600;
	}
	.ends span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.ends small {
		font-weight: 500;
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	.track {
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.track span {
		display: block;
		height: 100%;
		background: var(--league);
		transform-origin: left;
		animation: grow 900ms cubic-bezier(0.2, 0.8, 0.2, 1) 300ms both;
	}
	@keyframes grow {
		from {
			transform: scaleX(0);
		}
	}
	.gap {
		font-size: 14px;
		color: var(--ink-2);
	}
	.gap b {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.figures {
		display: grid;
		grid-template-columns: auto auto minmax(0, 1fr);
		gap: clamp(20px, 5vw, 56px);
		align-items: end;
		padding-top: 24px;
		border-top: 1px solid var(--line);
	}
	.big {
		display: flex;
		flex-direction: column;
	}
	.label {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.value {
		font-size: clamp(56px, 7vw, 88px);
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}
	.value small {
		margin-left: 4px;
		font-size: 0.32em;
		font-weight: 600;
		letter-spacing: 0;
		color: var(--ink-2);
	}
	.big.warn .value {
		color: var(--error);
	}
	.mini {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 14px 24px;
	}
	.mini div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 14px;
		border-left: 1px solid var(--line);
	}
	.mini dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	.mini dd {
		font-size: 18px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.mini dd.up {
		color: var(--green);
	}
	.mini dd.xp {
		color: var(--violet);
	}
	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.check.verified {
		color: var(--ink);
	}
	.check.verified :global(svg) {
		color: var(--green);
	}
	.check.rejected :global(svg) {
		color: var(--error);
	}
	.spinner {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid var(--line-strong);
		border-top-color: var(--ink);
		animation: spin 800ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.actions kbd {
		margin-left: 4px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.12);
		font-family: var(--font-mono);
		font-size: 11px;
	}
	.full {
		margin-top: 36px;
		padding-top: 28px;
		border-top: 1px solid var(--line);
	}
	@media (max-width: 760px) {
		.figures {
			grid-template-columns: 1fr 1fr;
		}
		.mini {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 560px) {
		.hero {
			flex-direction: column;
			align-items: flex-start;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.emblem.up,
		.track span,
		.spinner {
			animation: none;
		}
	}
</style>
