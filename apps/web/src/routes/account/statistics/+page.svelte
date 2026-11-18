<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { EXAMS, examById } from '#lib/exams.ts';
	import PageHead from '#lib/account/PageHead.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { wordHighlights } from '#lib/usage/types.ts';
	import type { PageProps } from './$types';
	import { formatDate, formatNumber } from '#lib/i18n/format.ts';

	let { data }: PageProps = $props();

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

</script>

<Seo title="Statistics" description="How you use sqwer: time, tests and typing." noindex />

<div class="stack">
	<PageHead title="Statistics" line={`From ${Math.max(1, data.devices)} ${data.devices > 1 ? 'devices' : 'device'} since ${date(u.firstSeen)}. No personal information.`} />

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
			<p class="empty">No tests yet. <a href="/practice/test/timed" data-sveltekit-reload>Take a timed test</a> and your figures appear here.</p>
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

	<p class="note">To clear these figures, go to <a href="/account/data">Your data</a>. Your results history is kept.</p>
</div>



<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-32);
	}
	.stack > :global(.head) {
		margin-bottom: calc(-1 * var(--space-8));
	}
	h2 {
		font-size: var(--fs-16);
		font-weight: var(--fw-semibold);
		margin-bottom: var(--space-12);
	}
	/* Figures sit in one panel divided by hairlines; column counts match each group, so no cell is empty. */
	.highlights,
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1px;
		margin: 0;
		overflow: hidden;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--line);
	}
	.tiles.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.highlights div,
	.tiles div {
		padding: var(--space-16) var(--space-16);
		background: var(--surface);
	}
	.highlights dd {
		font-size: var(--fs-28);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-tight);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		padding: var(--space-20);
		border-radius: var(--radius);
		border: 1px dashed var(--line-strong);
		color: var(--ink-2);
	}
	.empty a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	dt {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	dd {
		margin-top: var(--space-4);
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
		overflow-wrap: anywhere;
	}
	table {
		width: 100%;
		margin-top: var(--space-16);
		border-collapse: collapse;
		font-size: var(--fs-15);
	}
	caption {
		text-align: left;
		font-weight: var(--fw-semibold);
		padding-bottom: var(--space-6);
	}
	th,
	td {
		padding: var(--space-10) var(--space-8);
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	thead th {
		font-size: var(--fs-13);
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
		border-radius: var(--radius);
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--chart-wpm);
	}
	.note {
		margin-top: var(--space-10);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.note a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	@media (max-width: 760px) {
		table {
			font-size: var(--fs-13);
		}
		.highlights,
		.tiles,
		.tiles.three {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
