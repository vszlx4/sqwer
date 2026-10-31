<script lang="ts">
	import { navigating, page } from '$app/state';
	import PeriodControls from '#lib/admin/PeriodControls.svelte';
	import { CHANNEL_LABELS, CLIENT_EVENTS, EVENT_LABELS, SERVER_EVENTS, type Channel } from '#lib/analytics/shared.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';
	import { formatDateTime, formatNumber } from '#lib/i18n/format.ts';

	/** Admin event browser: filter, paginate, follow a visit, CSV export. No account or visitor ids. */
	let { data }: PageProps = $props();

	const fmtTime = (iso: string) =>
		formatDateTime(iso, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
	const fmt = (n: number) => formatNumber(n);
	const dur = (ms: number) => {
		const s = Math.round(ms / 1000);
		return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
	};
	const busy = $derived(!!navigating.to && navigating.to.url.pathname === page.url.pathname);

	const link = (changes: Record<string, string | null>) => {
		const q = new URLSearchParams(page.url.search);
		q.delete('after');
		for (const [k, v] of Object.entries(changes)) {
			if (v === null) q.delete(k);
			else q.set(k, v);
		}
		return `?${q}`;
	};
	const nextHref = $derived(data.next ? link({ after: `${data.next.at}|${data.next.id}` }) : null);
	const exportHref = $derived.by(() => {
		const q = new URLSearchParams(page.url.search);
		q.delete('after');
		return `/admin/analytics/export?${q}`;
	});
	/** Short, readable details of an event's properties. */
	const details = (props: Record<string, unknown> | null) =>
		props
			? Object.entries(props)
					.filter(([, v]) => v !== null && v !== undefined && v !== '')
					.map(([k, v]) => `${k}: ${String(v)}`)
					.join(', ')
			: '';
	const chips = $derived(
		[
			data.filters.name && { key: 'event', label: `Event: ${EVENT_LABELS[data.filters.name] ?? data.filters.name}` },
			data.filters.source && { key: 'source', label: data.filters.source === 'server' ? 'Server events' : 'Browser events' },
			data.filters.session && { key: 'session', label: 'One visit' },
			data.filters.browser && { key: 'browser', label: `Browser: ${data.filters.browser}` },
			data.filters.os && { key: 'os', label: `System: ${data.filters.os}` },
			data.filters.referrer && { key: 'referrer', label: `From: ${data.filters.referrer}` }
		].filter(Boolean) as { key: string; label: string }[]
	);
</script>

<Seo title="Analytics events" description="Individual analytics events for sqwer administrators." noindex />

<header class="head">
	<div>
		<h1>Events</h1>
		<p>Every recorded event in the period, newest first. Select a visit to see the pages it included.</p>
	</div>
	<a class="btn" href={exportHref} download>Export CSV</a>
</header>

<PeriodControls
	period={data.period}
	filters={data.filters}
	routes={data.routes}
	hidden={{ session: data.filters.session, browser: data.filters.browser, os: data.filters.os, referrer: data.filters.referrer }}
>
	{#snippet extra()}
		<label>
			<span>Event</span>
			<select name="event">
				<option value="">All events</option>
				<optgroup label="Browser">
					{#each CLIENT_EVENTS as e (e)}<option value={e} selected={data.filters.name === e}>{EVENT_LABELS[e]}</option>{/each}
				</optgroup>
				<optgroup label="Server">
					{#each Object.entries(SERVER_EVENTS) as [e, label] (e)}<option value={e} selected={data.filters.name === e}>{label}</option>{/each}
				</optgroup>
			</select>
		</label>
		<label>
			<span>Source</span>
			<select name="source">
				<option value="">Browser and server</option>
				<option value="client" selected={data.filters.source === 'client'}>Browser</option>
				<option value="server" selected={data.filters.source === 'server'}>Server</option>
			</select>
		</label>
	{/snippet}
</PeriodControls>

{#if chips.length}
	<ul class="chips" aria-label="Other filters">
		{#each chips as c (c.key)}
			<li><a href={link({ [c.key]: null })} data-sveltekit-noscroll aria-label={`Remove filter ${c.label}`}>{c.label} <span aria-hidden="true">×</span></a></li>
		{/each}
	</ul>
{/if}

{#if data.error}
	<div class="form-alert" role="alert"><b>{data.error}</b> <a href={page.url.pathname + page.url.search}>Reload the page</a>.</div>
{:else}
	<section class="results" aria-busy={busy} class:busy>
		<p class="count" role="status">
			{#if data.total === 0}
				No events match.
			{:else}
				{data.capped ? 'More than 10,000' : fmt(data.total)} {data.total === 1 ? 'event' : 'events'}{data.cursor ? ', continued' : ''}
			{/if}
		</p>
		{#if data.events.length}
			<div class="scroll">
				<table>
					<thead>
						<tr>
							<th scope="col">Time (UTC)</th>
							<th scope="col">Event</th>
							<th scope="col">Page</th>
							<th scope="col">Source</th>
							<th scope="col">Client</th>
							<th scope="col">Visitor</th>
							<th scope="col">Details</th>
						</tr>
					</thead>
					<tbody>
						{#each data.events as e (e.id)}
							<tr>
								<td class="time">{fmtTime(e.occurredAt)}</td>
								<td><a href={link({ event: e.name })} data-sveltekit-noscroll>{EVENT_LABELS[e.name] ?? e.name}</a></td>
								<td class="path">{#if e.route ?? e.path}{e.route ?? e.path}{:else}<span class="dim">Not a page</span>{/if}</td>
								<td>
									{#if e.channel}{CHANNEL_LABELS[e.channel as Channel] ?? e.channel}{#if e.referrerHost}<span class="sub">{e.referrerHost}</span>{/if}{:else}<span class="dim">{e.source === 'server' ? 'Server' : 'Same visit'}</span>{/if}
								</td>
								<td>{#if e.device}{e.browser ?? 'Unknown'}<span class="sub">{e.os ?? 'Unknown'} · {e.device}</span>{:else}<span class="dim">Not recorded</span>{/if}</td>
								<td>
									{e.authenticated ? 'Signed in' : 'Not signed in'}
									{#if e.sessionId && data.filters.session !== e.sessionId}<a class="sub" href={link({ session: e.sessionId })} data-sveltekit-noscroll>View this visit</a>{/if}
								</td>
								<td class="details">{e.durationMs != null ? `Visible ${dur(e.durationMs)}` : ''}{e.durationMs != null && e.props ? ', ' : ''}{details(e.props)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<nav class="pager" aria-label="Pages of events">
				{#if data.cursor}<a class="btn" href={link({ after: null })} data-sveltekit-noscroll>Back to newest</a>{/if}
				{#if nextHref}<a class="btn" href={nextHref} data-sveltekit-noscroll>Older events</a>{/if}
			</nav>
		{:else}
			<div class="empty">
				<p>No events match this period and these filters. Try a longer period or remove a filter.</p>
			</div>
		{/if}
	</section>
{/if}

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px 24px;
	}
	h1 {
		font-size: clamp(30px, 3.6vw, 42px);
	}
	.head p {
		margin-top: 6px;
		max-width: 64ch;
		color: var(--ink-2);
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.chips a {
		display: inline-flex;
		gap: 6px;
		padding: 5px 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}
	.chips a:hover {
		background: var(--surface-2);
	}
	.results {
		display: flex;
		flex-direction: column;
		gap: 12px;
		transition: opacity 160ms ease;
	}
	.busy {
		opacity: 0.55;
		pointer-events: none;
	}
	.count {
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.scroll {
		overflow-x: auto;
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	table {
		width: 100%;
		min-width: 900px;
		border-collapse: collapse;
		font-size: 13.5px;
	}
	th,
	td {
		padding: 9px 12px;
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid var(--line);
	}
	th {
		position: sticky;
		top: 0;
		background: var(--surface);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tbody tr:hover {
		background: var(--surface);
	}
	td a {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
	td a:hover {
		color: var(--rank);
	}
	.time {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		color: var(--ink-2);
	}
	.path {
		font-family: var(--font-mono);
		font-size: 12.5px;
		overflow-wrap: anywhere;
	}
	.sub {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-2);
	}
	a.sub {
		color: var(--ink-2);
	}
	.dim {
		font-family: var(--font-sans);
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.details {
		max-width: 260px;
		font-size: 12.5px;
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}
	.pager {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	}
	.empty {
		padding: 24px;
		border-radius: 3px;
		border: 1px dashed var(--line-strong);
		color: var(--ink-2);
	}
	.form-alert a {
		color: var(--ink);
		font-weight: 600;
	}
</style>
