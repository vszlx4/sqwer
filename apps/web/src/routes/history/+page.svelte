<script lang="ts">
	import { onMount } from 'svelte';
	import { EXAMS, examById } from '#lib/exams.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import { formatDateTime } from '#lib/i18n/format.ts';

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
	const when = (t: number) => formatDateTime(t, { dateStyle: 'medium', timeStyle: 'short' });
</script>

<Seo title="History" description="Every test you have taken, with full results." noindex />
<Breadcrumbs items={[{ href: '/history', label: 'History' }]} />

<div class="history">
	<header>
		<h1>History</h1>
		<p class="lede">Every test you have taken, including attempts that were not completed. Select a result to view its full report and replay.</p>
	</header>

	{#if !results.loaded}
		<SkeletonRegion label="Loading your results…" gap="24px">
			<div class="summary">
				{#each Array.from({ length: 5 }) as _, i (i)}<div><Skeleton width="70%" height="12px" /><span class="bone-gap"></span><Skeleton width="45%" height="19px" /></div>{/each}
			</div>
			<div class="bone-rows">{#each Array.from({ length: 6 }) as _, i (i)}<Skeleton height="40px" />{/each}</div>
		</SkeletonRegion>
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
		gap: var(--space-32);
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	.lede {
		margin-top: var(--space-12);
		max-width: var(--w-text);
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.summary {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: var(--space-10);
	}
	.summary div {
		padding: var(--space-16) var(--space-16);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.bone-gap {
		display: block;
		height: 8px;
	}
	.bone-rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	dt {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	dd {
		margin-top: var(--space-4);
		font-size: var(--fs-20);
		font-weight: var(--fw-bold);
	}
	.filters {
		display: flex;
		align-items: flex-end;
		gap: var(--space-16);
		flex-wrap: wrap;
	}
	.filters label {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
	}
	select {
		height: 40px;
		padding: 0 var(--space-10);
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-weight: var(--fw-regular);
	}
	.count {
		margin-left: auto;
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--fs-15);
	}
	th,
	td {
		padding: var(--space-12) var(--space-10);
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
	}
	td a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
		text-decoration: none;
	}
	td a:hover {
		color: var(--ink-2);
	}
	.badge {
		padding: var(--space-2) var(--space-8);
		border-radius: 3px;
		border: 1px solid var(--error);
		color: var(--error);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-10);
		padding: var(--space-24);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.empty p {
		color: var(--ink-2);
	}
	@media (max-width: 900px) {
		.summary {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		table {
			font-size: var(--fs-14);
		}
	}
</style>
