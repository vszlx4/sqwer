<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import ResultReport from '#lib/results/ResultReport.svelte';
	import type { UploadOutcome } from '#lib/results/store.svelte.ts';
	import type { ResultRecord } from '#lib/results/types.ts';
	import { MIN_ACCURACY, TIERS, divisionLevel, nextTier, tierFor, tierRange } from '#lib/progress/competitive.ts';
	import { examXp } from '#lib/progress/xp.ts';
	import Confetti from '#lib/ui/Confetti.svelte';
	import CountUp from '#lib/ui/CountUp.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import RankEmblem from './RankEmblem.svelte';

	/**
	 * The result of a ranked test: the rank this result earns, how it compares with the player's
	 * best, the server's check and the new place on the leaderboard. The full report is one click away.
	 */
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
	const upcoming = $derived(nextTier(tierFor(Math.max(record.wpm, previousBest ?? 0))));
	const xp = $derived(examXp(record));

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
	<div class="stage">
		<div class="emblem-wrap rise" class:up={rankedUp}>
			<RankEmblem league={tier?.league ?? null} division={divisionLevel(tier)} size={210} glow={!!tier} />
		</div>
		<div class="headline rise" style:--i="1">
			<p class="kicker">Ranked result</p>
			<h2 id="ranked-title">{tier?.name ?? 'Unranked'}</h2>
			<p class="verdict" class:good={isBest}>{verdict}</p>
			{#if tier}<p class="range">{tierRange(tier)}</p>{/if}
		</div>
	</div>

	<dl class="numbers rise" style:--i="2">
		<div class="big"><dt>Speed</dt><dd data-testid="result-wpm"><CountUp value={record.wpm} /><small>WPM</small></dd></div>
		<div class="big" class:warn={record.accuracy < MIN_ACCURACY}><dt>Accuracy</dt><dd data-testid="result-acc"><CountUp value={record.accuracy} /><small>%</small></dd></div>
		<div><dt>Raw speed</dt><dd>{Math.round(record.raw ?? 0)}<small>WPM</small></dd></div>
		<div><dt>Consistency</dt><dd>{Math.round(record.consistency ?? 0)}<small>%</small></dd></div>
		<div>
			<dt>Versus best</dt>
			<dd class:up={previousBest != null && record.wpm > previousBest}>
				{previousBest == null ? 'First run' : `${record.wpm - previousBest >= 0 ? '+' : ''}${Math.round(record.wpm - previousBest)}`}<small>{previousBest == null ? '' : 'WPM'}</small>
			</dd>
		</div>
		{#if xp > 0}<div><dt>Experience</dt><dd class="violet">+{xp}<small>XP</small></dd></div>{/if}
	</dl>

	<div class="status rise" style:--i="3">
		<p class={`check ${check}`}>
			{#if check === 'pending'}<span class="spinner" aria-hidden="true"></span> Checking the result on the server…
			{:else if check === 'verified'}<Icon name="check" size={16} /> Verified{standing ? `. You are #${standing.position} of ${standing.players} on the leaderboard.` : '.'}
			{:else if check === 'rejected'}<Icon name="info" size={16} /> Not counted: this result did not pass the ranked checks (duration, accuracy and keystroke timing).
			{:else}<Icon name="info" size={16} /> {signedIn ? 'The result could not be saved. Your connection may have dropped.' : 'Sign in to save ranked results and appear on the leaderboard.'}{/if}
		</p>
		{#if upcoming && counts}
			<p class="next">
				<RankEmblem league={upcoming.league} division={divisionLevel(upcoming)} size={28} />
				<span><b>{Math.max(0, upcoming.from - Math.floor(Math.max(record.wpm, previousBest ?? 0)))} WPM</b> to {upcoming.name}</span>
			</p>
		{/if}
	</div>

	<div class="actions rise" style:--i="4">
		<button type="button" class="btn btn-primary btn-lg" onclick={onnext}><Icon name="play" size={18} /> Play again <kbd>Tab</kbd></button>
		<button type="button" class="btn btn-lg" onclick={onrepeat}><Icon name="repeat" size={18} /> Same words</button>
		<a class="btn btn-lg" href="/competitive#leaderboard"><Icon name="trophy" size={18} /> Leaderboard</a>
		<button type="button" class="btn btn-lg" aria-expanded={full} onclick={() => (full = !full)}><Icon name="chart" size={18} /> {full ? 'Hide' : 'Full'} report</button>
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
		gap: 18px;
		padding: clamp(22px, 4vw, 40px);
		border-radius: 3px;
		background:
			radial-gradient(70% 90% at 20% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 60%),
			radial-gradient(60% 80% at 100% 100%, rgb(122 82 224 / 0.16), transparent 60%),
			#070707;
		color: #f2f2ee;
		border: 1px solid #1f1f1f;
	}
	.stage {
		display: flex;
		align-items: center;
		gap: clamp(16px, 4vw, 40px);
	}
	.emblem-wrap.up {
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
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent);
	}
	h2 {
		font-size: clamp(40px, 6vw, 68px);
		line-height: 1;
	}
	.verdict {
		margin-top: 10px;
		font-size: 17px;
		color: #b9b9b3;
	}
	.verdict.good {
		color: #f2f2ee;
		font-weight: 600;
	}
	.range {
		margin-top: 4px;
		font-size: 14px;
		color: #8e8e88;
	}
	.numbers {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 8px;
	}
	.numbers div {
		padding: 12px 14px;
		border-radius: 3px;
		background: #121212;
		border: 1px solid #222;
	}
	.numbers .big {
		grid-column: span 1;
		background: #161616;
	}
	.numbers dt {
		font-size: 12px;
		color: #8e8e88;
	}
	.numbers dd {
		display: flex;
		align-items: baseline;
		gap: 4px;
		font-size: 24px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.numbers .big dd {
		font-family: var(--font-serif);
		font-weight: 400;
		font-size: 44px;
		line-height: 1;
	}
	.numbers small {
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		color: #8e8e88;
	}
	.numbers .warn dd {
		color: #ff8a8a;
	}
	.numbers dd.up {
		color: #2fc48a;
	}
	.violet {
		color: #a99cf5;
	}
	.status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 3px;
		background: #121212;
		border: 1px solid #262626;
		font-size: 14px;
		color: #b9b9b3;
	}
	.check.verified {
		border-color: rgb(47 196 138 / 0.5);
		color: #f2f2ee;
	}
	.check.verified :global(svg) {
		color: #2fc48a;
	}
	.check.rejected {
		border-color: rgb(255 92 92 / 0.5);
	}
	.spinner {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid #333;
		border-top-color: var(--accent);
		animation: spin 800ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.next {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: #b9b9b3;
	}
	.next b {
		color: #f2f2ee;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.actions .btn:not(.btn-primary) {
		border-color: #333;
		background: #121212;
		color: #f2f2ee;
	}
	.actions .btn:not(.btn-primary):hover {
		border-color: #f2f2ee;
	}
	.actions kbd {
		margin-left: 4px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.14);
		font-family: var(--font-mono);
		font-size: 11px;
	}
	.full {
		margin-top: 18px;
	}
	@media (max-width: 640px) {
		.stage {
			flex-direction: column;
			text-align: center;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.emblem-wrap.up,
		.spinner {
			animation: none;
		}
	}
</style>
