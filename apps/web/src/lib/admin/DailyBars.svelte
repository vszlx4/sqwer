<script lang="ts">
	import { formatDate, formatNumber } from '#lib/i18n/format.ts';
	/** Daily bars, stacked for two series. Days without data stay empty, not zero. Keyboard and table access. */
	interface Series {
		key: string;
		label: string;
		color: string;
		values: (number | null)[];
	}
	let { days, series, title }: { days: string[]; series: Series[]; title: string } = $props();

	/** Drawn at the measured width, so text stays at its real size. */
	let measured = $state(720);
	const W = $derived(Math.max(280, Math.round(measured)));
	const H = 180;
	const PAD = { l: 40, r: 8, t: 10, b: 24 };
	const plotW = $derived(W - PAD.l - PAD.r);
	const plotH = H - PAD.t - PAD.b;

	const totals = $derived(days.map((_, i) => series.reduce((n, s) => n + (s.values[i] ?? 0), 0)));
	const max = $derived(Math.max(1, ...totals));
	// A round maximum whose half is a whole number, so every tick label is exact.
	const niceMax = $derived.by(() => {
		if (max <= 4) return max <= 2 ? 2 : 4;
		const p = 10 ** Math.floor(Math.log10(max));
		const m = Math.ceil(max / p) * p;
		return m % 2 ? m + p : m;
	});
	const band = $derived(plotW / Math.max(1, days.length));
	const barW = $derived(Math.max(1, Math.min(28, band - 2)));
	const y = (v: number) => PAD.t + plotH - (v / niceMax) * plotH;
	const labelEvery = $derived(Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64)))));
	const labelled = (i: number) => (i === days.length - 1 ? true : i % labelEvery === 0 && days.length - 1 - i >= labelEvery);
	const fmtDay = (d: string) => formatDate(`${d}T00:00:00Z`, { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const fmt = (v: number | null) => (v == null ? 'No data' : formatNumber(v));

	let active = $state<number | null>(null);
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') active = Math.min(days.length - 1, (active ?? -1) + 1);
		else if (e.key === 'ArrowLeft') active = Math.max(0, (active ?? days.length) - 1);
		else return;
		e.preventDefault();
	}
</script>

<figure class="chart">
	<figcaption>
		<span class="title">{title}</span>
		{#if series.length > 1}
			<span class="legend">{#each series as s (s.key)}<span><i style:background={s.color}></i>{s.label}</span>{/each}</span>
		{/if}
	</figcaption>
	<div class="plot" bind:clientWidth={measured}>
		<!-- Focusable for arrow-key reading; the table repeats the data. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. Use the left and right arrow keys to read each day.`} tabindex="0" {onkeydown} onblur={() => (active = null)} onpointerleave={() => (active = null)}>
			{#each [0, niceMax / 2, niceMax] as t (t)}
				<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
				<text class="tick" x={PAD.l - 6} y={y(t) + 4} text-anchor="end">{Math.round(t)}</text>
			{/each}
			{#each days as d, i (d)}
				{@const cx = PAD.l + band * i + band / 2}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<g onpointerenter={() => (active = i)}>
					<rect class="hit" x={PAD.l + band * i} y={PAD.t} width={band} height={plotH} />
					{#each series as s, si (s.key)}
						{@const below = series.slice(0, si).reduce((n, t) => n + (t.values[i] ?? 0), 0)}
						{@const v = s.values[i]}
						{#if v}
							{@const gap = below + v < totals[i]! ? 2 : 0}
							<!-- A 2px gap separates a segment from the one stacked above it; bars stay on the baseline. -->
							<rect x={cx - barW / 2} y={y(below + v) + gap} width={barW} height={Math.max(1, y(below) - y(below + v) - gap)} rx="2" fill={s.color} opacity={active === null || active === i ? 1 : 0.55} />
						{/if}
					{/each}
				</g>
				{#if labelled(i)}
					<text class="tick" x={cx} y={H - 6} text-anchor={i === days.length - 1 && days.length > 1 ? 'end' : 'middle'}>{fmtDay(d)}</text>
				{/if}
			{/each}
		</svg>
		{#if active !== null}
			<div class="tip" style:left={`${((PAD.l + band * active + band / 2) / W) * 100}%`} role="status">
				<b>{fmtDay(days[active]!)}</b>
				{#each series as s (s.key)}<span><i style:background={s.color}></i>{s.label}: {fmt(s.values[active] ?? null)}</span>{/each}
			</div>
		{/if}
	</div>
	<details class="table">
		<summary>Show as a table</summary>
		<div class="scroll">
			<table>
				<thead><tr><th scope="col">Day</th>{#each series as s (s.key)}<th scope="col" class="num">{s.label}</th>{/each}</tr></thead>
				<tbody>
					{#each days as d, i (d)}
						<tr><th scope="row">{fmtDay(d)}</th>{#each series as s (s.key)}<td class="num">{fmt(s.values[i] ?? null)}</td>{/each}</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</figure>

<style>
	.chart {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin: 0;
	}
	figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 6px 16px;
	}
	.title {
		font-weight: 600;
	}
	.legend {
		display: flex;
		gap: 14px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.legend span,
	.tip span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	i {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}
	.plot {
		position: relative;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	svg:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 4px;
	}
	.hit {
		fill: transparent;
	}
	.grid {
		stroke: var(--chart-grid);
	}
	.tick {
		font-size: 11px;
		fill: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.tip {
		position: absolute;
		top: 0;
		transform: translateX(-50%);
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 140px;
		padding: 8px 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow);
		font-size: 12.5px;
		color: var(--ink-2);
		pointer-events: none;
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}
	.tip b {
		color: var(--ink);
	}
	.table summary {
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.scroll {
		max-height: 260px;
		overflow: auto;
		margin-top: 8px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		padding: 6px 8px;
		text-align: left;
		border-bottom: 1px solid var(--line);
	}
	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
</style>
