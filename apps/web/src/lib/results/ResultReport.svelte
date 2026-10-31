<script lang="ts">
	import { page } from '$app/state';
	import { MIN_ACCURACY, tierFor } from '#lib/progress/competitive.ts';
	import { examXp } from '#lib/progress/xp.ts';
	import CountUp from '#lib/ui/CountUp.svelte';
	import { learnerNextStep } from '#lib/courses/learner.svelte.ts';
	import { examById } from '#lib/exams.ts';
	import { guidance } from '#lib/guidance.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import ResultChart from './ResultChart.svelte';
	import ResultReplay from './ResultReplay.svelte';
	import { results } from './store.svelte.ts';
	import type { ResultRecord } from './types.ts';
	import WordHeatmap from './WordHeatmap.svelte';
	import { formatDateTime } from '#lib/i18n/format.ts';

	interface Props {
		record: ResultRecord;
		/** Shown right after a test: start a new test. */
		onnext?: () => void;
		/** Shown right after a test: repeat the same words. */
		onrepeat?: () => void;
	}

	let { record, onnext, onrepeat }: Props = $props();

	const exam = $derived(examById(record.exam));
	const previous = $derived(results.previous(record));
	const d = $derived(record.detail);

	const fmt = (n: number) => Math.round(n).toString();
	const signed = (n: number, unit = '') => `${n > 0 ? '+' : ''}${Math.round(n)}${unit}`;

	const typedWords = $derived(d?.words ?? []);
	const correctWords = $derived(typedWords.filter((w) => w.ok));
	// Word speeds are only meaningful for correctly typed words of three or more letters.
	const ranked = $derived(correctWords.filter((w) => w.w.length >= 3).sort((a, b) => b.wpm - a.wpm));
	const fastest = $derived(ranked[0] ?? null);
	const slowest = $derived(ranked.length > 1 ? ranked[ranked.length - 1]! : null);
	const missed = $derived(
		Object.entries(d?.missedKeys ?? {})
			.sort((a, b) => b[1] - a[1])
			.slice(0, 5)
	);

	const advice = $derived.by(() => {
		const earlier = results.forExam(record.exam).filter((r) => r.id !== record.id && r.at < record.at);
		return {
			insights: guidance(
				{ wpm: record.wpm, raw: record.raw ?? record.wpm, accuracy: record.accuracy, consistency: record.consistency ?? 0 },
				{ previousBest: earlier.length ? Math.max(...earlier.map((r) => r.wpm)) : null }
			),
			// The same next step the rest of the site shows: getting started, then the course.
			next: learnerNextStep()
		};
	});

	const xp = $derived(examXp(record));
	// The tier shown here is a preview; the server confirms it when the result is saved.
	const tier = $derived(record.exam === 'competitive' && record.status === 'completed' && record.accuracy >= MIN_ACCURACY ? tierFor(record.wpm) : null);

	const keyName = (k: string) => (k === ' ' ? 'Space' : k);
	const when = $derived(formatDateTime(record.at, { dateStyle: 'medium', timeStyle: 'short' }));
</script>

<section class="report" aria-labelledby="report-title">
	<header class="head rise" style:--i="0">
		<h2 id="report-title">{exam?.title ?? 'Typing test'}</h2>
		<p class="meta">
			{record.label} · {when}
			{#if record.status === 'abandoned'}<span class="badge">Not completed</span>{/if}
		</p>
		{#if xp > 0 || tier}
			<p class="earned">
				{#if xp > 0}<span class="xp">+{xp} XP</span>{/if}
				{#if tier}<span class="tier" style:--league={tier.league.colour}>{tier.name}</span>{:else if record.exam === 'competitive' && record.status === 'completed'}<span class="hint">Reach 50 WPM with {MIN_ACCURACY}% accuracy for a tier</span>{/if}
				{#if !page.data.user}<span class="hint">Sign in to keep your XP{record.exam === 'competitive' ? ' and tier' : ''}.</span>{/if}
			</p>
		{/if}
	</header>

	<div class="top rise" style:--i="1">
		<div class="numbers">
			<div class="big">
				<span class="label">WPM</span>
				<span class="value" data-testid="result-wpm"><CountUp value={record.wpm} /></span>
				{#if previous}<span class="delta">{signed(record.wpm - previous.wpm)} on previous attempt</span>{/if}
			</div>
			<div class="big">
				<span class="label">Accuracy</span>
				<span class="value" data-testid="result-acc"><CountUp value={record.accuracy} /><small>%</small></span>
				{#if previous}<span class="delta">{signed(record.accuracy - previous.accuracy, ' points')} on previous attempt</span>{/if}
			</div>
			<dl class="mini">
				<div><dt>Raw speed</dt><dd>{fmt(record.raw ?? 0)} WPM</dd></div>
				<div><dt>Consistency</dt><dd>{fmt(record.consistency ?? 0)}%</dd></div>
				<div><dt>Time</dt><dd>{record.seconds.toFixed(record.seconds < 10 ? 1 : 0)} s</dd></div>
			</dl>
		</div>
		<div class="chart-panel">
			{#if d?.timeline.length}
				<ResultChart timeline={d.timeline} previous={previous?.detail?.timeline ?? null} />
			{:else}
				<p class="muted">No timeline is available for this result.</p>
			{/if}
		</div>
	</div>

	{#if d}
		<dl class="details rise" style:--i="2">
			<div>
				<dt>Characters</dt>
				<dd>
					<span>{d.chars.correct}</span> correct ·
					<span class:bad={d.chars.incorrect}>{d.chars.incorrect}</span> incorrect ·
					<span class:bad={d.chars.extra}>{d.chars.extra}</span> extra ·
					<span class:bad={d.chars.missed}>{d.chars.missed}</span> missed
				</dd>
			</div>
			<div>
				<dt>Keystrokes</dt>
				<dd>{d.keystrokes.total} total · {d.keystrokes.incorrect} incorrect · {d.keystrokes.backspaces} deletions</dd>
			</div>
			<div>
				<dt>Words</dt>
				<dd>{correctWords.length} of {typedWords.length} typed correctly</dd>
			</div>
			<div>
				<dt>Fastest word</dt>
				<dd>{fastest ? `${fastest.w} · ${fmt(fastest.wpm)} WPM` : '—'}</dd>
			</div>
			<div>
				<dt>Slowest word</dt>
				<dd>{slowest ? `${slowest.w} · ${fmt(slowest.wpm)} WPM` : '—'}</dd>
			</div>
			<div>
				<dt>Most frequent errors</dt>
				<dd>
					{#if missed.length}
						{#each missed as [k, n], i (k)}{i ? ' · ' : ''}<kbd>{keyName(k)}</kbd> {n}{/each}
					{:else}
						None
					{/if}
				</dd>
			</div>
		</dl>

		<section class="block" aria-labelledby="heat-title">
			<h3 id="heat-title">Word speed</h3>
			<WordHeatmap words={typedWords} />
		</section>

		<section class="block" aria-labelledby="replay-title">
			<h3 id="replay-title">Replay</h3>
			<ResultReplay detail={d} seconds={record.seconds} />
		</section>
	{/if}

	<div class="guidance rise" style:--i="3">
		<section class="insights" aria-labelledby="insights-title">
			<h3 id="insights-title">What this result shows</h3>
			<ul>
				{#each advice.insights as line, i (i)}<li>{line}</li>{/each}
			</ul>
		</section>
		<section class="next" aria-labelledby="next-title">
			<p class="next-kicker">Recommended next step</p>
			<h3 id="next-title">{advice.next.title}</h3>
			<p>{advice.next.text}</p>
			<a class="btn btn-primary" href={advice.next.href}>{advice.next.action}</a>
		</section>
	</div>

	<div class="actions rise" style:--i="4">
		{#if onnext}
			<button type="button" class="btn" onclick={onnext}>New test <Icon name="arrow" size={16} /></button>
		{/if}
		{#if onrepeat}
			<button type="button" class="btn" onclick={onrepeat}><Icon name="repeat" size={16} /> Repeat with the same words</button>
		{/if}
		{#if record.exam !== 'competitive' && record.exam !== 'finger-speed'}
			<a class="btn" href="/test?exam=competitive" data-sveltekit-reload><Icon name="trophy" size={16} /> Play ranked</a>
		{/if}
		<a class="link-arrow all" href="/history">View all results <Icon name="arrow" size={16} /></a>
	</div>
</section>

<style>
	.report {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.head h2 {
		font-size: clamp(28px, 3.6vw, 40px);
		line-height: 1.1;
	}
	.meta {
		margin-top: 6px;
		font-size: 14.5px;
		color: var(--ink-2);
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.earned {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
	}
	.xp {
		padding: 4px 10px;
		border-radius: 3px;
		background: var(--rank-soft);
		color: var(--rank);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		animation: xp-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) 400ms both;
	}
	@keyframes xp-pop {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.xp {
			animation: none;
		}
	}
	.tier {
		padding: 4px 10px;
		border-radius: 3px;
		border: 1px solid var(--league);
		color: var(--ink);
		font-weight: 700;
		box-shadow: inset 3px 0 0 var(--league);
	}
	.hint {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.badge {
		padding: 2px 8px;
		border-radius: 3px;
		border: 1px solid var(--error);
		color: var(--error);
		font-size: 12.5px;
		font-weight: 600;
	}
	.top {
		display: grid;
		grid-template-columns: minmax(220px, 0.32fr) minmax(0, 1fr);
		gap: 28px;
		align-items: start;
	}
	.numbers {
		display: flex;
		flex-direction: column;
		gap: 20px;
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
		font-size: 0.4em;
		font-weight: 600;
		color: var(--ink-2);
	}
	.delta {
		margin-top: 4px;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.mini {
		display: grid;
		grid-template-columns: 1fr;
		gap: 10px;
		padding-top: 14px;
		border-top: 1px solid var(--line);
	}
	.mini div {
		display: flex;
		justify-content: space-between;
		gap: 12px;
	}
	dt {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	dd {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.chart-panel {
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		min-width: 0;
	}
	.details {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}
	.details > div {
		padding: 14px 16px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.details dd {
		font-size: 15px;
		line-height: 1.5;
	}
	.bad {
		color: var(--error);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 13px;
		padding: 0 5px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	h3 {
		font-family: var(--font-serif);
		font-weight: 400;
		font-size: 24px;
	}
	.guidance {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: 12px;
	}
	.insights,
	.next {
		padding: 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.next {
		border-left: 4px solid var(--accent);
		align-items: flex-start;
	}
	.insights ul {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-left: 18px;
		list-style: disc;
	}
	.insights li,
	.next p {
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.next-kicker {
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.actions .all {
		margin-left: auto;
		padding: 8px 0;
	}
	.muted {
		font-size: 13px;
		color: var(--ink-2);
	}
	@media (max-width: 960px) {
		.top,
		.guidance {
			grid-template-columns: 1fr;
		}
		.details {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 560px) {
		.details {
			grid-template-columns: 1fr;
		}
	}
</style>
