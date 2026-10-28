<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { EXAMS, examById } from '#lib/exams.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Dialog from '#lib/ui/Dialog.svelte';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { wordHighlights } from '#lib/usage/types.ts';
	import type { PageProps } from './$types';
	import { formatDate, formatNumber } from '#lib/i18n/format.ts';

	let { data }: PageProps = $props();
	let confirmDelete = $state(false);
	let message = $state<string | null>(null);

	// Send this device's latest figures first, so the page includes the current visit.
	onMount(async () => {
		await usage.load();
		await usage.save();
		await usage.sync();
		await invalidate('app:usage');
	});

	const u = $derived(data.usage);
	const words = $derived(wordHighlights(u.words));
	const activeDays = $derived(Object.keys(u.days).filter((k) => u.days[k]! > 0).sort());
	const streak = $derived.by(() => {
		let best = 0;
		let run = 0;
		let prev: number | null = null;
		for (const d of activeDays) {
			const t = new Date(`${d}T00:00:00`).getTime();
			run = prev !== null && t - prev <= 26 * 3600 * 1000 ? run + 1 : 1;
			best = Math.max(best, run);
			prev = t;
		}
		return best;
	});
	const peakHour = $derived(u.hours.indexOf(Math.max(...u.hours)));
	const sections = $derived(Object.entries(u.sections).sort((a, b) => b[1] - a[1]));
	const maxSection = $derived(Math.max(1, ...sections.map(([, v]) => v)));
	const completionRate = $derived(u.tests.started ? (u.tests.completed / u.tests.started) * 100 : 0);
	const takenExams = $derived(EXAMS.filter((e) => e.id !== 'finger-map' && ((u.tests.byExam[e.id]?.started ?? 0) > 0 || data.byExam[e.id])));
	const errorRate = $derived(u.typing.keystrokes ? (u.typing.incorrect / u.typing.keystrokes) * 100 : 0);

	const dur = (ms: number) => {
		const s = Math.round(ms / 1000);
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		return h ? `${h} h ${m} min` : m ? `${m} min ${s % 60} s` : `${s} s`;
	};
	const n = (v: number) => formatNumber(Math.round(v));
	const date = (t: number) => formatDate(t, { dateStyle: 'long' });

	async function remove() {
		await fetch('/api/usage', { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
		await usage.reset();
		confirmDelete = false;
		message = 'Your usage statistics have been deleted.';
		await invalidate('app:usage');
	}
</script>

<Seo title="Statistics" description="How you use sqwer: time, tests and typing." noindex />

<div class="stack">
	<header class="page-head">
		<h1>Statistics</h1>
		<p class="lede">
			Usage statistics recorded across {Math.max(1, data.devices)} {data.devices > 1 ? 'devices' : 'device'} since {date(u.firstSeen)}.
			They describe how sqwer is used and do not include personal information.
		</p>
	</header>
	{#if message}<p class="form-alert success" role="status">{message}</p>{/if}

	<dl class="highlights">
		<div><dt>Active time</dt><dd>{dur(u.activeMs)}</dd></div>
		<div><dt>Tests completed</dt><dd>{n(u.tests.completed)}</dd></div>
		<div><dt>Words typed</dt><dd>{n(u.typing.words)}</dd></div>
		<div><dt>Keystroke accuracy</dt><dd>{u.typing.keystrokes ? `${(100 - errorRate).toFixed(1)}%` : '—'}</dd></div>
	</dl>

	<section aria-labelledby="time-title">
		<h2 id="time-title">Time</h2>
		<dl class="tiles three">
			<div><dt>Active time on sqwer</dt><dd>{dur(u.activeMs)}</dd></div>
			<div><dt>Time typing in tests</dt><dd>{dur(u.tests.ms)}</dd></div>
			<div><dt>Active days</dt><dd>{activeDays.length}</dd></div>
			<div><dt>Longest run of consecutive days</dt><dd>{streak}</dd></div>
			<div><dt>Visits</dt><dd>{n(u.visits)}</dd></div>
			<div><dt>Most active hour</dt><dd>{u.activeMs ? `${String(peakHour).padStart(2, '0')}:00–${String((peakHour + 1) % 24).padStart(2, '0')}:00` : '—'}</dd></div>
		</dl>
		{#if sections.length}
			<table class="bars">
				<caption>Time by section</caption>
				<tbody>
					{#each sections as [name, ms] (name)}
						<tr>
							<th scope="row">{name}</th>
							<td><span class="bar"><span style:width={`${(ms / maxSection) * 100}%`}></span></span></td>
							<td class="num">{dur(ms)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>

	<section aria-labelledby="tests-title">
		<h2 id="tests-title">Tests</h2>
		<dl class="tiles">
			<div><dt>Started</dt><dd>{n(u.tests.started)}</dd></div>
			<div><dt>Completed</dt><dd>{n(u.tests.completed)}</dd></div>
			<div><dt>Not completed</dt><dd>{n(u.tests.abandoned)}</dd></div>
			<div><dt>Completion rate</dt><dd>{Math.round(completionRate)}%</dd></div>
		</dl>
		{#if !takenExams.length}
			<p class="empty">No tests yet. <a href="/test?exam=timed" data-sveltekit-reload>Take a timed test</a> and your figures appear here.</p>
		{:else}
		<table>
			<thead>
				<tr>
					<th scope="col">Examination</th>
					<th scope="col" class="num">Started</th>
					<th scope="col" class="num">Completed</th>
					<th scope="col" class="num">Not completed</th>
					<th scope="col" class="num">Time</th>
					<th scope="col" class="num">Best</th>
					<th scope="col" class="num">Average</th>
				</tr>
			</thead>
			<tbody>
				{#each takenExams as e (e.id)}
					{@const t = u.tests.byExam[e.id]}
					{@const r = data.byExam[e.id]}
					<tr>
						<th scope="row">{examById(e.id)?.title}</th>
						<td class="num">{t?.started ?? 0}</td>
						<td class="num">{t?.completed ?? 0}</td>
						<td class="num">{t?.abandoned ?? 0}</td>
						<td class="num">{dur(t?.ms ?? 0)}</td>
						<td class="num">{r ? `${Math.round(r.best)} WPM` : '—'}</td>
						<td class="num">{r ? `${Math.round(r.average)} WPM · ${Math.round(r.accuracy)}%` : '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{/if}
	</section>

	<section aria-labelledby="typing-title">
		<h2 id="typing-title">Typing</h2>
		<dl class="tiles">
			<div><dt>Keystrokes</dt><dd>{n(u.typing.keystrokes)}</dd></div>
			<div><dt>Incorrect keystrokes</dt><dd>{n(u.typing.incorrect)} ({errorRate.toFixed(1)}%)</dd></div>
			<div><dt>Deletions</dt><dd>{n(u.typing.backspaces)}</dd></div>
			<div><dt>Words typed</dt><dd>{n(u.typing.words)}</dd></div>
			<div><dt>Words typed correctly</dt><dd>{u.typing.words ? Math.round((u.typing.correctWords / u.typing.words) * 100) : 0}%</dd></div>
			<div><dt>Different words</dt><dd>{n(Object.keys(u.words).length)}</dd></div>
			<div><dt>Finger map entries</dt><dd>{n(u.mapping.entries)}</dd></div>
			<div><dt>Keystroke accuracy</dt><dd>{u.typing.keystrokes ? `${(100 - errorRate).toFixed(1)}%` : '—'}</dd></div>
		</dl>
	</section>

	<section aria-labelledby="words-title">
		<h2 id="words-title">Words</h2>
		<dl class="tiles">
			<div><dt>Most typed word</dt><dd>{words.mostTyped ? `${words.mostTyped.word} (${words.mostTyped.n}×)` : '—'}</dd></div>
			<div><dt>Fastest word</dt><dd>{words.fastest ? `${words.fastest.word} · ${Math.round(words.fastest.wpm)} WPM` : '—'}</dd></div>
			<div><dt>Slowest word (average)</dt><dd>{words.slowest ? `${words.slowest.word} · ${Math.round(words.slowest.wpm)} WPM` : '—'}</dd></div>
			<div><dt>Least accurate word</dt><dd>{words.leastAccurate ? `${words.leastAccurate.word} · ${Math.round(words.leastAccurate.accuracy)}%` : '—'}</dd></div>
		</dl>
		<p class="note">Speeds use words of three or more letters. The slowest and least accurate words require at least three attempts.</p>
	</section>

	<section class="manage" aria-labelledby="manage-title">
		<h2 id="manage-title">Manage statistics</h2>
		<p>Deleting usage statistics removes the figures above from your account and this browser. Your results history is not affected.</p>
		<button type="button" class="btn" onclick={() => (confirmDelete = true)}>Delete usage statistics</button>
	</section>
</div>

<Dialog open={confirmDelete} title="Delete usage statistics?" alert onclose={() => (confirmDelete = false)}>
	This permanently deletes the usage statistics stored in your account and in this browser.
	{#snippet actions()}
		<button type="button" class="btn" data-autofocus onclick={() => (confirmDelete = false)}>Cancel</button>
		<button type="button" class="btn btn-danger" onclick={remove}>Delete statistics</button>
	{/snippet}
</Dialog>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 32px;
	}
	h1 {
		font-size: clamp(28px, 3.2vw, 36px);
	}
	.lede {
		margin-top: 8px;
		max-width: 680px;
		font-size: 15.5px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	h2 {
		font-size: 20px;
		margin-bottom: 12px;
	}
	/* Figures sit in one panel divided by hairlines; column counts match each group, so no cell is empty. */
	.highlights,
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		margin: 0;
		overflow: hidden;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--line);
	}
	.tiles.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.highlights div,
	.tiles div {
		padding: 14px 16px;
		background: var(--surface);
	}
	.highlights dd {
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.empty {
		padding: 18px;
		border-radius: 3px;
		border: 1px dashed var(--line-strong);
		color: var(--ink-2);
	}
	.empty a {
		color: var(--ink);
		font-weight: 600;
	}
	dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	dd {
		margin-top: 4px;
		font-size: 18px;
		font-weight: 700;
		overflow-wrap: anywhere;
	}
	table {
		width: 100%;
		margin-top: 14px;
		border-collapse: collapse;
		font-size: 14.5px;
	}
	caption {
		text-align: left;
		font-weight: 600;
		padding-bottom: 6px;
	}
	th,
	td {
		padding: 9px 8px;
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	thead th {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.bars td:nth-child(2) {
		width: 60%;
	}
	.bar {
		display: block;
		height: 10px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--chart-wpm);
	}
	.note,
	.manage p {
		margin-top: 10px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.manage .btn {
		margin-top: 12px;
	}
	@media (max-width: 760px) {
		table {
			font-size: 13px;
		}
		.highlights,
		.tiles,
		.tiles.three {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
