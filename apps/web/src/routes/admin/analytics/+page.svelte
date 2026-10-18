<script lang="ts">
	import { navigating, page } from '$app/state';
	import BarList from '#lib/admin/BarList.svelte';
	import DailyBars from '#lib/admin/DailyBars.svelte';
	import PeriodControls from '#lib/admin/PeriodControls.svelte';
	import TrendChart from '#lib/admin/TrendChart.svelte';
	import { CHANNEL_LABELS, EVENT_LABELS, type Channel } from '#lib/analytics/shared.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	/**
	 * The analytics overview for administrators. Every number comes from recorded events; where a
	 * measure was not being collected, or cannot be derived for older days, the page says so
	 * instead of showing zero.
	 */
	let { data }: PageProps = $props();

	const fmt = (n: number) => Math.round(n).toLocaleString('en-GB');
	const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
	const dur = (ms: number) => {
		const s = Math.round(ms / 1000);
		return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
	};
	const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

	const periodLabel = $derived(
		{ '7d': 'the last 7 days', '30d': 'the last 30 days', '90d': 'the last 90 days', '12m': 'the last 12 months' }[data.period.preset as string] ??
			`${fmtDate(data.period.fromDay)} to ${fmtDate(data.period.toDay)}`
	);
	const filtered = $derived(!!(data.filters.route || data.filters.channel || data.filters.device || data.filters.auth));
	const busy = $derived(!!navigating.to && navigating.to.url.pathname === page.url.pathname);

	/* What was being collected during this period. */
	const rangeEnd = $derived(`${data.period.toDay}T23:59:59.999Z`);
	const clientCollected = $derived(!!data.coverage?.clientSince && data.coverage.clientSince <= rangeEnd);
	const serverCollected = $derived(!!data.coverage?.serverSince && data.coverage.serverSince <= rangeEnd);
	const partial = $derived(
		(clientCollected && data.coverage!.clientSince!.slice(0, 10) > data.period.fromDay) ||
			(serverCollected && data.coverage!.serverSince!.slice(0, 10) > data.period.fromDay)
	);
	const expired = $derived(!!data.coverage && data.coverage.rawCutoff.slice(0, 10) > data.period.fromDay);

	/* Daily series, with days before collection began as gaps rather than zeros. */
	const days = $derived(data.series.map((p) => p.day));
	const clientStart = $derived(data.coverage?.clientSince?.slice(0, 10) ?? '9999-12-31');
	const serverStart = $derived(data.coverage?.serverSince?.slice(0, 10) ?? '9999-12-31');
	const pick = (key: 'pageviews' | 'visitors' | 'sessions' | 'registrations' | 'signins' | 'signinFailures', start: string) =>
		data.series.map((p) => (p.day < start ? null : p[key]));

	interface Kpi {
		key: keyof NonNullable<typeof data.summary>;
		label: string;
		kind: 'client' | 'server';
		format: (n: number) => string;
		/** For rates the difference is shown in percentage points. */
		rate?: boolean;
		hint?: string;
	}
	const KPIS: Kpi[] = [
		{ key: 'visitors', label: 'Unique visitors', kind: 'client', format: fmt, hint: 'Browsers that allowed analytics' },
		{ key: 'pageviews', label: 'Page views', kind: 'client', format: fmt },
		{ key: 'sessions', label: 'Visits', kind: 'client', format: fmt, hint: 'A visit ends after 30 minutes without activity' },
		{ key: 'bounceRate', label: 'Single-page visits', kind: 'client', format: pct, rate: true },
		{ key: 'avgEngagementMs', label: 'Time per visit', kind: 'client', format: dur, hint: 'Average time a page was visible' },
		{ key: 'registrations', label: 'Registrations', kind: 'server', format: fmt },
		{ key: 'signins', label: 'Sign-ins', kind: 'server', format: fmt },
		{ key: 'signinFailures', label: 'Failed sign-ins', kind: 'server', format: fmt },
		{ key: 'activeUsers', label: 'Active members', kind: 'server', format: fmt, hint: 'Signed-in members with any recorded activity' },
		{ key: 'testsCompleted', label: 'Tests completed', kind: 'server', format: fmt }
	];

	function value(k: Kpi): { text: string; note?: string } {
		const s = data.summary!;
		const collected = k.kind === 'client' ? clientCollected : serverCollected;
		if (!collected) return { text: 'Not collected', note: 'Nothing was recorded in this period' };
		const v = s[k.key];
		if (v == null) return { text: 'Unavailable', note: k.key === 'bounceRate' || k.key === 'avgEngagementMs' ? 'No visits in this period' : 'Not kept for days past retention' };
		return { text: k.format(v) };
	}
	function delta(k: Kpi): { text: string; dir: 'up' | 'down' | 'flat' } | null {
		const c = data.changes?.[k.key];
		if (c == null) return null;
		if (k.rate) {
			const pts = ((data.summary![k.key] as number) - (data.previous![k.key] as number)) * 100;
			return { text: `${pts > 0 ? '+' : ''}${pts.toFixed(1)} pts`, dir: pts > 0.05 ? 'up' : pts < -0.05 ? 'down' : 'flat' };
		}
		return { text: `${c > 0 ? '+' : ''}${c.toFixed(c !== 0 && Math.abs(c) < 10 ? 1 : 0)}%`, dir: c > 0.05 ? 'up' : c < -0.05 ? 'down' : 'flat' };
	}

	/* Conversion: registrations per consenting visitor, only when it can be stated honestly. */
	const conversion = $derived(
		!filtered && data.summary && clientCollected && serverCollected && data.summary.visitors ? data.summary.registrations / data.summary.visitors : null
	);

	/* Links for drill-down, keeping the period. */
	const base = $derived.by(() => {
		const q = new URLSearchParams();
		q.set('range', data.period.preset);
		if (data.period.preset === 'custom') {
			q.set('from', data.period.fromDay);
			q.set('to', data.period.toDay);
		}
		return q;
	});
	const withFilters = (extra: Record<string, string>, path = '') => {
		const q = new URLSearchParams(page.url.search);
		q.delete('after');
		for (const [k, v] of Object.entries(extra)) q.set(k, v);
		return `${path || page.url.pathname}?${q}`;
	};
	const events = (extra: Record<string, string>) => {
		const q = new URLSearchParams(base);
		for (const k of ['page', 'channel', 'device', 'visitors']) {
			const v = page.url.searchParams.get(k);
			if (v) q.set(k, v);
		}
		for (const [k, v] of Object.entries(extra)) q.set(k, v);
		return `/admin/analytics/events?${q}`;
	};
	const DEVICE_LABELS: Record<string, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet' };
	const REASONS: Record<string, string> = {
		credentials: 'Wrong email or password',
		locked: 'Account temporarily locked',
		rate_limited: 'Too many attempts',
		blocked: 'Blocked as automated',
		verification: 'Verification failed',
		unknown: 'Not recorded'
	};
	const nothing = $derived(
		!!data.summary && data.summary.pageviews === 0 && data.top !== null && data.top.events.length === 0 && data.summary.registrations === 0
	);
</script>

<Seo title="Analytics" description="Site analytics for sqwer administrators." noindex />

<header class="head">
	<div>
		<h1>Analytics</h1>
		<p>How people found and used sqwer during {periodLabel}{filtered ? ', with the filters below' : ''}.</p>
	</div>
	<a class="btn" href={events({})}>Browse events</a>
</header>

<PeriodControls period={data.period} filters={data.filters} routes={data.routes} />

{#if data.error}
	<div class="form-alert" role="alert">
		<p><b>{data.error}</b></p>
		<p>The data is safe; only this view failed. <a href={page.url.pathname + page.url.search}>Reload the page</a>.</p>
	</div>
{:else if data.summary && data.coverage}
	<div class="body" aria-busy={busy} class:busy>
		{#if !data.coverage.clientSince && !data.coverage.serverSince}
			<section class="empty">
				<h2>No analytics recorded yet</h2>
				<p>
					Server events (registrations, sign-ins, completed tests) appear as soon as they happen. Page views and visitors appear once
					visitors allow analytics in the banner at the bottom of the site.
				</p>
			</section>
		{:else}
			{#if partial || expired || filtered}
				<ul class="notes">
					{#if partial}
						<li>
							Collection began during this period
							{#if data.coverage.clientSince}(visitor analytics on {fmtDate(data.coverage.clientSince.slice(0, 10))}){/if}. Earlier days show
							as gaps and comparisons with the previous period are not shown.
						</li>
					{/if}
					{#if expired}
						<li>
							Detailed events are kept for 13 months. Before {fmtDate(data.coverage.rawCutoff.slice(0, 10))} only daily totals remain, so unique
							visitors, single-page visits, time per visit and breakdowns cover the retained days only.
						</li>
					{/if}
					{#if filtered}
						<li>Filters apply to visitor analytics. Registrations, sign-ins and other server events are always site-wide.</li>
					{/if}
				</ul>
			{/if}

			{#if nothing}
				<section class="empty">
					<h2>Nothing recorded in this period</h2>
					<p>Try a longer period or clear the filters.</p>
				</section>
			{/if}

			<section class="figures" aria-label="Key figures">
				{#each [{ title: 'Visitors', kind: 'client' }, { title: 'Accounts and activity', kind: 'server' }] as group (group.kind)}
					<div class="group">
						<h2>{group.title}</h2>
						<div class="kpis">
							{#each KPIS.filter((k) => k.kind === group.kind) as k (k.key)}
								{@const v = value(k)}
								{@const d = delta(k)}
								<div class="kpi">
									<span class="label">{k.label}</span>
									<span class="value" class:muted={!!v.note}>{v.text}</span>
									{#if v.note}
										<span class="sub">{v.note}</span>
									{:else if d}
										<span class={`change ${d.dir}`}>
											<span aria-hidden="true">{d.dir === 'up' ? '▲' : d.dir === 'down' ? '▼' : '●'}</span>
											{d.text}
											<span class="vs">vs previous period</span>
										</span>
									{:else}
										<span class="sub">No comparison available</span>
									{/if}
									{#if k.hint}<span class="hint">{k.hint}</span>{/if}
								</div>
							{/each}
							{#if group.kind === 'server'}
								<div class="kpi">
									<span class="label">Visitor to registration</span>
									{#if conversion !== null}
										<span class="value">{pct(conversion)}</span>
										<span class="sub">Registrations per unique visitor</span>
										<span class="hint">Only visitors who allowed analytics are counted, so this overstates the true rate</span>
									{:else}
										<span class="value muted">Unavailable</span>
										<span class="sub">{filtered ? 'Not shown while filters are applied' : 'Needs visitors and registrations in this period'}</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</section>

			<section class="panel">
				<TrendChart
					title="Traffic"
					{days}
					series={[
						{ key: 'visitors', label: 'Unique visitors', color: 'var(--chart-wpm)', values: pick('visitors', clientStart) },
						{ key: 'pageviews', label: 'Page views', color: 'var(--chart-raw)', values: pick('pageviews', clientStart) }
					]}
				/>
			</section>

			<div class="pair">
				<section class="panel">
					<DailyBars title="Registrations" {days} series={[{ key: 'registrations', label: 'Registrations', color: 'var(--chart-acc)', values: pick('registrations', serverStart) }]} />
				</section>
				<section class="panel">
					<DailyBars
						title="Sign-in activity"
						{days}
						series={[
							{ key: 'signins', label: 'Successful', color: 'var(--chart-wpm)', values: pick('signins', serverStart) },
							{ key: 'failures', label: 'Failed', color: 'var(--chart-raw)', values: pick('signinFailures', serverStart) }
						]}
					/>
				</section>
			</div>

			{#if data.top}
				<div class="grid">
					<section class="panel">
						<BarList
							title="Pages"
							measure="Views"
							extraLabel="visitors"
							items={data.top.pages}
							href={(k) => withFilters({ page: k })}
						/>
					</section>
					<section class="panel">
						<BarList title="Referring sites" measure="Visitors" extraLabel="views" items={data.top.referrers} href={(k) => events({ event: 'pageview', referrer: k })} empty="No visits came from other sites in this period." />
					</section>
					<section class="panel">
						<BarList
							title="Channels"
							measure="Visitors"
							extraLabel="views"
							items={data.top.channels}
							label={(k) => CHANNEL_LABELS[k as Channel] ?? k}
							href={(k) => withFilters({ channel: k })}
						/>
					</section>
					<section class="panel">
						<BarList title="Devices" measure="Visitors" items={data.top.devices} label={(k) => DEVICE_LABELS[k] ?? k} href={(k) => withFilters({ device: k })} />
					</section>
					<section class="panel">
						<BarList title="Browsers" measure="Visitors" items={data.top.browsers} href={(k) => events({ event: 'pageview', browser: k })} />
					</section>
					<section class="panel">
						<BarList title="Operating systems" measure="Visitors" items={data.top.systems} href={(k) => events({ event: 'pageview', os: k })} />
					</section>
					<section class="panel">
						<BarList
							title="Account and product events"
							measure="Events"
							items={data.top.events}
							label={(k) => EVENT_LABELS[k] ?? k}
							href={(k) => events({ event: k, source: 'server' })}
							empty="No server events in this period."
						/>
					</section>
					<section class="panel">
						<BarList
							title="Failed sign-ins by reason"
							measure="Attempts"
							items={data.top.failureReasons}
							label={(k) => REASONS[k] ?? k}
							empty="No failed sign-ins in this period."
						/>
					</section>
				</div>
			{/if}
		{/if}
	</div>
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
	.body {
		display: flex;
		flex-direction: column;
		gap: 20px;
		transition: opacity 160ms ease;
	}
	.busy {
		opacity: 0.55;
		pointer-events: none;
	}
	.notes {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		padding: 12px 14px 12px 32px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: 14px;
		color: var(--ink-2);
	}
	.empty {
		padding: 28px;
		border-radius: 3px;
		border: 1px dashed var(--line-strong);
	}
	.empty h2 {
		font-size: 24px;
	}
	.empty p {
		margin-top: 8px;
		max-width: 64ch;
		color: var(--ink-2);
	}
	.form-alert p + p {
		margin-top: 4px;
	}
	.form-alert a {
		color: var(--ink);
		font-weight: 600;
	}
	.figures {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.group h2 {
		margin-bottom: 8px;
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.kpis {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: 10px;
	}
	.kpi {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 16px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		min-width: 0;
	}
	.label {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.value {
		font-size: 28px;
		font-weight: 700;
		line-height: 1.15;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}
	.value.muted {
		font-size: 18px;
		font-weight: 600;
		color: var(--ink-2);
		padding: 5px 0 2px;
	}
	.sub,
	.hint {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.hint {
		margin-top: auto;
		padding-top: 6px;
		color: var(--ink-2);
	}
	.change {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px;
		font-size: 13px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.change [aria-hidden] {
		font-size: 9px;
	}
	.change.up [aria-hidden] {
		color: var(--chart-acc);
	}
	.change.down [aria-hidden] {
		color: var(--chart-raw);
	}
	.change.flat [aria-hidden] {
		color: var(--ink-2);
	}
	.vs {
		font-weight: 500;
		color: var(--ink-2);
	}
	.panel {
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		min-width: 0;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px;
	}
	@media (max-width: 860px) {
		.pair,
		.grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 480px) {
		.panel {
			padding: 14px;
		}
		.kpis {
			grid-template-columns: 1fr 1fr;
		}
		.value {
			font-size: 22px;
		}
	}
</style>
