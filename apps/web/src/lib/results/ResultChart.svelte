<script lang="ts">
	import type { TimelineSample } from './types.ts';

	interface Props {
		timeline: TimelineSample[];
		/** The previous completed attempt at the same examination, for comparison. */
		previous?: TimelineSample[] | null;
	}

	let { timeline, previous = null }: Props = $props();

	let width = $state(640);
	let active = $state<number | null>(null);

	const M = { l: 42, r: 12, t: 10, b: 24 };
	const MAIN_H = 220;
	const ACC_H = 84;
	const GAP = 30;
	const HEIGHT = M.t + MAIN_H + GAP + ACC_H + M.b;

	const plotW = $derived(Math.max(120, width - M.l - M.r));
	const maxS = $derived(Math.max(timeline[timeline.length - 1]?.s ?? 1, previous?.[previous.length - 1]?.s ?? 0, 1));

	function niceStep(range: number) {
		const raw = range / 4;
		const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
		return [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
	}

	const speedValues = $derived([...timeline.flatMap((p) => [p.wpm, p.raw]), ...(previous ?? []).map((p) => p.wpm)]);
	const yStep = $derived(niceStep(Math.max(10, ...speedValues)));
	const yTop = $derived(Math.ceil((Math.max(10, ...speedValues) * 1.05) / yStep) * yStep);
	const yTicks = $derived(Array.from({ length: Math.round(yTop / yStep) + 1 }, (_, i) => i * yStep));

	const accLow = $derived(Math.max(0, Math.floor((Math.min(100, ...timeline.map((p) => p.acc)) - 2) / 5) * 5));
	const accTicks = $derived([accLow, Math.round((accLow + 100) / 2), 100]);

	const xStep = $derived([1, 2, 5, 10, 15, 30, 60].find((s) => maxS / s <= 8) ?? 60);
	const xTicks = $derived(Array.from({ length: Math.floor(maxS / xStep) + 1 }, (_, i) => i * xStep));

	const x = (s: number) => M.l + (s / maxS) * plotW;
	const yMain = (v: number) => M.t + MAIN_H - (v / yTop) * MAIN_H;
	const accTop = M.t + MAIN_H + GAP;
	const yAcc = (v: number) => accTop + ACC_H - ((v - accLow) / (100 - accLow || 1)) * ACC_H;

	/** Monotone cubic interpolation: smooth curves that never overshoot the data. */
	function curve(pts: [number, number][]): string {
		const n = pts.length;
		if (!n) return '';
		if (n === 1) return `M${pts[0]![0]},${pts[0]![1]}`;
		const dx: number[] = [];
		const m: number[] = [];
		for (let i = 0; i < n - 1; i++) {
			dx.push(pts[i + 1]![0] - pts[i]![0] || 1e-6);
			m.push((pts[i + 1]![1] - pts[i]![1]) / dx[i]!);
		}
		const t = pts.map((_, i) => (i === 0 ? m[0]! : i === n - 1 ? m[n - 2]! : m[i - 1]! * m[i]! <= 0 ? 0 : (m[i - 1]! + m[i]!) / 2));
		for (let i = 0; i < n - 1; i++) {
			if (m[i] === 0) {
				t[i] = 0;
				t[i + 1] = 0;
				continue;
			}
			const a = t[i]! / m[i]!;
			const b = t[i + 1]! / m[i]!;
			const h = a * a + b * b;
			if (h > 9) {
				const k = 3 / Math.sqrt(h);
				t[i] = k * a * m[i]!;
				t[i + 1] = k * b * m[i]!;
			}
		}
		let d = `M${pts[0]![0].toFixed(1)},${pts[0]![1].toFixed(1)}`;
		for (let i = 0; i < n - 1; i++) {
			const [x0, y0] = pts[i]!;
			const [x1, y1] = pts[i + 1]!;
			const h = dx[i]! / 3;
			d += `C${(x0 + h).toFixed(1)},${(y0 + t[i]! * h).toFixed(1)} ${(x1 - h).toFixed(1)},${(y1 - t[i + 1]! * h).toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
		}
		return d;
	}

	const wpmPath = $derived(curve(timeline.map((p) => [x(p.s), yMain(p.wpm)])));
	const rawPath = $derived(curve(timeline.map((p) => [x(p.s), yMain(p.raw)])));
	const prevPath = $derived(previous ? curve(previous.map((p) => [x(p.s), yMain(p.wpm)])) : '');
	const accPath = $derived(curve(timeline.map((p) => [x(p.s), yAcc(p.acc)])));

	const point = $derived(active === null ? null : timeline[active]!);
	const prevPoint = $derived(point && previous ? (previous.find((p) => Math.abs(p.s - point.s) < 0.51) ?? null) : null);

	function nearest(s: number) {
		let best = 0;
		for (let i = 1; i < timeline.length; i++) if (Math.abs(timeline[i]!.s - s) < Math.abs(timeline[best]!.s - s)) best = i;
		return best;
	}

	function onmove(e: PointerEvent) {
		const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
		active = nearest(((e.clientX - rect.left) / rect.width) * maxS);
	}

	function onkey(e: KeyboardEvent) {
		if (!timeline.length) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
			e.preventDefault();
			const i = active ?? (e.key === 'ArrowRight' ? -1 : timeline.length);
			active = Math.max(0, Math.min(timeline.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
		}
	}

	const fmtS = (s: number) => (Number.isInteger(s) ? `${s}s` : `${s.toFixed(1)}s`);
	const tipLeft = $derived(point ? Math.min(Math.max(x(point.s) + 12, 0), width - 180) : 0);
</script>

<div class="chart" bind:clientWidth={width}>
	<ul class="legend" aria-label="Chart legend">
		<li><i class="line wpm"></i>WPM</li>
		<li><i class="line raw"></i>Raw speed</li>
		<li><i class="line acc"></i>Accuracy</li>
		{#if previous}<li><i class="line prev"></i>Previous attempt (WPM)</li>{/if}
		<li><i class="dot err"></i>Errors</li>
	</ul>

	<svg {width} height={HEIGHT} role="img" aria-label="Speed, raw speed and accuracy over the course of the test">
		<!-- Speed plot -->
		{#each yTicks as v (v)}
			<line class="grid" x1={M.l} x2={M.l + plotW} y1={yMain(v)} y2={yMain(v)} />
			<text class="tick" x={M.l - 8} y={yMain(v)} text-anchor="end" dominant-baseline="middle">{v}</text>
		{/each}
		<text class="axis-label" x={M.l} y={M.t - 1}>WPM</text>

		<!-- Accuracy strip, on its own scale -->
		{#each accTicks as v (v)}
			<line class="grid" x1={M.l} x2={M.l + plotW} y1={yAcc(v)} y2={yAcc(v)} />
			<text class="tick" x={M.l - 8} y={yAcc(v)} text-anchor="end" dominant-baseline="middle">{v}%</text>
		{/each}
		<text class="axis-label" x={M.l} y={accTop - 8}>Accuracy</text>

		{#each xTicks as s (s)}
			<line class="grid v" x1={x(s)} x2={x(s)} y1={M.t} y2={accTop + ACC_H} />
			<text class="tick" x={x(s)} y={accTop + ACC_H + 16} text-anchor="middle">{s}s</text>
		{/each}

		{#if prevPath}<path d={prevPath} class="series prev" />{/if}
		<path d={rawPath} class="series raw" />
		<path d={wpmPath} class="series wpm" />
		<path d={accPath} class="series acc" />

		{#each timeline as p, i (i)}
			{#if p.err > 0}
				<circle class="err" cx={x(p.s)} cy={yMain(p.raw)} r={Math.min(7, 3 + p.err)} />
			{/if}
		{/each}

		{#if point}
			<line class="cross" x1={x(point.s)} x2={x(point.s)} y1={M.t} y2={accTop + ACC_H} />
			<circle class="mark wpm" cx={x(point.s)} cy={yMain(point.wpm)} r="4.5" />
			<circle class="mark raw" cx={x(point.s)} cy={yMain(point.raw)} r="4.5" />
			<circle class="mark acc" cx={x(point.s)} cy={yAcc(point.acc)} r="4.5" />
			{#if prevPoint}<circle class="mark prev" cx={x(point.s)} cy={yMain(prevPoint.wpm)} r="4" />{/if}
		{/if}

		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<rect
			class="hit"
			x={M.l}
			y={M.t}
			width={plotW}
			height={accTop + ACC_H - M.t}
			tabindex="0"
			role="img"
			aria-label="Use the left and right arrow keys to move through the seconds of the test"
			onpointermove={onmove}
			onpointerleave={() => (active = null)}
			onkeydown={onkey}
			onblur={() => (active = null)}
		/>
	</svg>

	{#if point}
		<div class="tip" style:left={`${tipLeft}px`} aria-live="polite">
			<p class="tip-title">At {fmtS(point.s)}</p>
			<p><i class="line wpm"></i>WPM <b>{Math.round(point.wpm)}</b></p>
			<p><i class="line raw"></i>Raw <b>{Math.round(point.raw)}</b></p>
			<p><i class="line acc"></i>Accuracy <b>{point.acc.toFixed(1)}%</b></p>
			{#if prevPoint}<p><i class="line prev"></i>Previous <b>{Math.round(prevPoint.wpm)}</b></p>{/if}
			<p><i class="dot err"></i>Errors this second <b>{point.err}</b></p>
		</div>
	{/if}

	<details class="table">
		<summary>View the chart data as a table</summary>
		<table>
			<thead>
				<tr><th scope="col">Time</th><th scope="col">WPM</th><th scope="col">Raw</th><th scope="col">Accuracy</th><th scope="col">Errors</th></tr>
			</thead>
			<tbody>
				{#each timeline as p, i (i)}
					<tr><td>{fmtS(p.s)}</td><td>{Math.round(p.wpm)}</td><td>{Math.round(p.raw)}</td><td>{p.acc.toFixed(1)}%</td><td>{p.err}</td></tr>
				{/each}
			</tbody>
		</table>
	</details>
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		margin-bottom: 10px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.legend li,
	.tip p {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.line {
		display: inline-block;
		width: 16px;
		height: 0;
		border-top: 2.5px solid;
	}
	.line.wpm {
		border-color: var(--chart-wpm);
	}
	.line.raw {
		border-color: var(--chart-raw);
	}
	.line.acc {
		border-color: var(--chart-acc);
	}
	.line.prev {
		border-color: var(--chart-prev);
		border-top-style: dashed;
	}
	.dot {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.dot.err {
		background: var(--error);
	}
	.grid {
		stroke: var(--chart-grid);
		stroke-width: 1;
	}
	.grid.v {
		stroke-dasharray: 2 4;
	}
	.tick,
	.axis-label {
		font-family: var(--font-sans);
		font-size: 11px;
		fill: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.axis-label {
		font-weight: 600;
	}
	.series {
		fill: none;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.series.wpm {
		stroke: var(--chart-wpm);
		stroke-width: 2.5;
	}
	.series.raw {
		stroke: var(--chart-raw);
	}
	.series.acc {
		stroke: var(--chart-acc);
	}
	.series.prev {
		stroke: var(--chart-prev);
		stroke-dasharray: 5 4;
	}
	.err {
		fill: var(--error);
		stroke: var(--bg);
		stroke-width: 2;
	}
	.cross {
		stroke: var(--ink-2);
		stroke-width: 1;
	}
	.mark {
		stroke: var(--bg);
		stroke-width: 2;
	}
	.mark.wpm {
		fill: var(--chart-wpm);
	}
	.mark.raw {
		fill: var(--chart-raw);
	}
	.mark.acc {
		fill: var(--chart-acc);
	}
	.mark.prev {
		fill: var(--chart-prev);
	}
	.hit {
		fill: transparent;
		cursor: crosshair;
	}
	.hit:focus-visible {
		outline: none;
		stroke: var(--ink);
		stroke-width: 1.5;
		box-shadow: none;
	}
	.tip {
		position: absolute;
		top: 40px;
		min-width: 168px;
		padding: 10px 12px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow);
		font-size: 13px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		pointer-events: none;
	}
	.tip-title {
		font-weight: 700;
	}
	.tip b {
		margin-left: auto;
		padding-left: 8px;
		font-variant-numeric: tabular-nums;
	}
	.table {
		margin-top: 8px;
		font-size: 13px;
	}
	.table summary {
		cursor: pointer;
		color: var(--ink-2);
	}
	table {
		width: 100%;
		margin-top: 8px;
		border-collapse: collapse;
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 4px 8px;
		text-align: right;
		border-bottom: 1px solid var(--line);
	}
	th:first-child,
	td:first-child {
		text-align: left;
	}
</style>
