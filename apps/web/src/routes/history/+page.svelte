<script lang="ts">
	import { onMount } from 'svelte';
	import { EXAMS, examById } from '#lib/exams.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';

	onMount(() => results.load());

	let exam = $state('all');
	let status = $state('all');
	let shown = $state(50);

	const all = $derived([...results.list].sort((a, b) => b.at - a.at));
	const filtered = $derived(
		all.filter((r) => (exam === 'all' || r.exam === exam) && (status === 'all' || (r.status ?? 'completed') === status))
	);
	const completed = $derived(all.filter((r) => r.status !== 'abandoned' && r.exam !== 'finger-speed'));
	const abandoned = $derived(all.filter((r) => r.status === 'abandoned').length);
	const recent = $derived(completed.slice(0, 10));
	const avg = (list: number[]) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
	const typingSeconds = $derived(all.reduce((s, r) => s + r.seconds, 0));

	const fmtTime = (s: number) => {
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		return h ? `${h} h ${m} min` : `${m} min ${Math.round(s % 60)} s`;
	};
	const when = (t: number) => new Date(t).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
</script>

<Seo title="History" description="Every test you have taken, with full results." noindex />
<Breadcrumbs items={[{ href: '/history', label: 'History' }]} />

<div class="history">
	<header>
		<h1>History</h1>
		<p class="lede">Every test you have taken, including attempts that were not completed. Select a result to view its full report and replay.</p>
	</header>

	{#if !results.loaded}
		<p class="muted">Loading your results…</p>
	{:else if !all.length}
		<section class="empty">
			<h2>No results yet</h2>
			<p>Results appear here after your first test.</p>
			<a class="btn btn-primary" href="/exams">Browse examinations</a>
		</section>
	{:else}
		<dl class="summary">
			<div><dt>Completed tests</dt><dd>{completed.length}</dd></div>
			<div><dt>Not completed</dt><dd>{abandoned}</dd></div>
			<div><dt>Time typing</dt><dd>{fmtTime(typingSeconds)}</dd></div>
			<div><dt>Best speed</dt><dd>{completed.length ? Math.round(Math.max(...completed.map((r) => r.wpm))) : 0} WPM</dd></div>
			<div><dt>Average of last 10</dt><dd>{Math.round(avg(recent.map((r) => r.wpm)))} WPM · {Math.round(avg(recent.map((r) => r.accuracy)))}%</dd></div>
		</dl>

		<div class="filters">
			<label>
				Examination
				<select bind:value={exam}>
					<option value="all">All examinations</option>
					{#each EXAMS.filter((e) => e.id !== 'finger-map') as e (e.id)}<option value={e.id}>{e.title}</option>{/each}
				</select>
			</label>
			<label>
				Status
				<select bind:value={status}>
					<option value="all">All</option>
					<option value="completed">Completed</option>
					<option value="abandoned">Not completed</option>
				</select>
			</label>
			<p class="count">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</p>
		</div>

		<table>
			<thead>
				<tr>
					<th scope="col">Date</th>
					<th scope="col">Examination</th>
					<th scope="col">Status</th>
					<th scope="col" class="num">WPM</th>
					<th scope="col" class="num">Accuracy</th>
					<th scope="col" class="num">Time</th>
				</tr>
			</thead>
			<tbody>
				{#each filtered.slice(0, shown) as r (r.id)}
					<tr>
						<td><a href={`/history/${r.id}`}>{when(r.at)}</a></td>
						<td>{examById(r.exam)?.title ?? r.exam}</td>
						<td>{#if r.status === 'abandoned'}<span class="badge">Not completed</span>{:else}Completed{/if}</td>
						<td class="num">{Math.round(r.wpm)}</td>
						<td class="num">{Math.round(r.accuracy)}%</td>
						<td class="num">{Math.round(r.seconds)} s</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{#if filtered.length > shown}
			<button type="button" class="btn" onclick={() => (shown += 50)}>Show more results</button>
		{/if}
	{/if}
</div>

<style>
	.history {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	h1 {
		font-size: clamp(36px, 5vw, 56px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 12px;
		max-width: 680px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.summary {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
	}
	.summary div {
		padding: 14px 16px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	dd {
		margin-top: 4px;
		font-size: 19px;
		font-weight: 700;
	}
	.filters {
		display: flex;
		align-items: flex-end;
		gap: 14px;
		flex-wrap: wrap;
	}
	.filters label {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13.5px;
		font-weight: 600;
	}
	select {
		height: 40px;
		padding: 0 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-weight: 400;
	}
	.count {
		margin-left: auto;
		font-size: 14px;
		color: var(--ink-2);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 15px;
	}
	th,
	td {
		padding: 11px 10px;
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	thead th {
		font-size: 13px;
		color: var(--ink-2);
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	td a {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
	td a:hover {
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
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		padding: 24px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.muted,
	.empty p {
		color: var(--ink-2);
	}
	@media (max-width: 860px) {
		.summary {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		table {
			font-size: 13.5px;
		}
	}
</style>
