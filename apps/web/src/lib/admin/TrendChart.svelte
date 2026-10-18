<script lang="ts">
	/**
	 * Daily values as lines on one axis, for measures of the same kind (counts). Days with no data
	 * collected yet are gaps (null), never drawn as zero. A crosshair and tooltip follow the
	 * pointer or the arrow keys; the same numbers are available as a table.
	 */
	interface Series {
		key: string;
		label: string;
		color: string;
		values: (number | null)[];
	}
	let { days, series, title, unit = '' }: { days: string[]; series: Series[]; title: string; unit?: string } = $props();

	/** Drawn at the measured width, so text stays at its real size. */
	let measured = $state(720);
	const W = $derived(Math.max(280, Math.round(measured)));
	const H = 220;
	const PAD = { l: 44, r: 12, t: 12, b: 26 };
	const plotW = $derived(W - PAD.l - PAD.r);
	const plotH = H - PAD.t - PAD.b;

	const max = $derived(Math.max(1, ...series.flatMap((s) => s.values.filter((v): v is number => v != null))));
	const niceMax = $derived.by(() => {
		// Round, with a whole-number half, so every tick label is exact.
		if (max <= 4) return max <= 2 ? 2 : 4;
		const p = 10 ** Math.floor(Math.log10(max));
		const m = Math.ceil(max / p) * p;
		return m % 2 ? m + p : m;
	});
	const x = (i: number) => PAD.l + (days.length <= 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
	const y = (v: number) => PAD.t + plotH - (v / niceMax) * plotH;

	/** A path that lifts the pen over missing days. */
	function path(values: (number | null)[]): string {
		let d = '';
		let pen = false;
		values.forEach((v, i) => {
			if (v == null) {
				pen = false;
				return;
			}
			d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
			pen = true;
		});
		return d;
	}
	const ticks = $derived([0, niceMax / 2, niceMax]);
	const labelEvery = $derived(Math.max(1, Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64)))));
	const labelled = (i: number) => (i === days.length - 1 ? true : i % labelEvery === 0 && days.length - 1 - i >= labelEvery);
	const fmtDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const fmt = (v: number | null) => (v == null ? 'No data' : `${Math.round(v).toLocaleString('en-GB')}${unit}`);

	let active = $state<number | null>(null);
	let svg: SVGSVGElement | undefined = $state();
	function onmove(e: PointerEvent) {
		if (!svg || !days.length) return;
		const box = svg.getBoundingClientRect();
		const px = ((e.clientX - box.left) / box.width) * W;
		active = Math.max(0, Math.min(days.length - 1, Math.round(((px - PAD.l) / plotW) * (days.length - 1))));
	}
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
			<span class="legend">
				{#each series as s (s.key)}<span><i style:background={s.color}></i>{s.label}</span>{/each}
			</span>
		{/if}
	</figcaption>
	<div class="plot" bind:clientWidth={measured}>
		<!-- The chart is focusable so the arrow keys can read it day by day; the table below has the same numbers. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<svg
			bind:this={svg}
			viewBox={`0 0 ${W} ${H}`}
			role="img"
			aria-label={`${title}. Use the left and right arrow keys to read each day.`}
			tabindex="0"
			onpointermove={onmove}
			onpointerleave={() => (active = null)}
			{onkeydown}
			onblur={() => (active = null)}
		>
			{#each ticks as t (t)}
				<line class="grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
				<text class="tick" x={PAD.l - 6} y={y(t) + 4} text-anchor="end">{Math.round(t).toLocaleString('en-GB')}</text>
			{/each}
			{#each days as d, i (d)}
				{#if labelled(i)}
					<text class="tick" x={x(i)} y={H - 6} text-anchor={i === days.length - 1 && days.length > 1 ? 'end' : 'middle'}>{fmtDay(d)}</text>
				{/if}
			{/each}
			{#each series as s (s.key)}
				<path d={path(s.values)} fill="none" stroke={s.color} stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
				{#if days.length <= 45}
					{#each s.values as v, i (i)}
						{#if v != null && (s.values[i - 1] == null || s.values[i + 1] == null)}
							<circle cx={x(i)} cy={y(v)} r="3" fill={s.color} />
						{/if}
					{/each}
				{/if}
			{/each}
			{#if active !== null}
				<line class="cross" x1={x(active)} x2={x(active)} y1={PAD.t} y2={PAD.t + plotH} />
				{#each series as s (s.key)}
					{#if s.values[active] != null}
						<circle cx={x(active)} cy={y(s.values[active]!)} r="4.5" fill={s.color} stroke="var(--bg)" stroke-width="2" />
					{/if}
				{/each}
			{/if}
		</svg>
		{#if active !== null}
			<div class="tip" style:left={`${(x(active) / W) * 100}%`} role="status">
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
		flex-wrap: wrap;
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
		overflow: visible;
		touch-action: pan-y;
	}
	svg:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 4px;
	}
	.grid {
		stroke: var(--chart-grid);
		stroke-width: 1;
	}
	.cross {
		stroke: var(--ink-3);
		stroke-width: 1;
		stroke-dasharray: 3 3;
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
		min-width: 150px;
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
		max-height: 280px;
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
