<script lang="ts">
	import { FINGERS, handOf, kindOf, type Finger } from '@sqwer/layouts';
	import { standouts } from '#lib/assessment.ts';
	import Hands, { type LegendItem } from '#lib/hands/Hands.svelte';
	import type { FingerScore } from '#lib/results/types.ts';

	let { fingers }: { fingers: Partial<Record<Finger, FingerScore>> } = $props();

	const NAMES: Record<string, string> = { pinky: 'Little finger', ring: 'Ring finger', middle: 'Middle finger', index: 'Index finger', thumb: 'Thumb' };
	const marks = $derived(standouts(fingers));
	const max = $derived(Math.max(1, ...Object.values(fingers).map((s) => s?.wpm ?? 0)));
	const hands = [
		{ name: 'Left hand', list: FINGERS.filter((f) => handOf(f) === 'left') },
		{ name: 'Right hand', list: FINGERS.filter((f) => handOf(f) === 'right').reverse() }
	];
	// Color strength follows speed relative to the fastest finger; fingers without data stay uncoloured.
	const tone = $derived(
		Object.fromEntries(FINGERS.map((f) => [f, fingers[f] ? 0.2 + 0.8 * (fingers[f]!.wpm / max) : 0])) as Record<Finger, number>
	);
	const legend = $derived(
		Object.fromEntries(
			FINGERS.map((f): [Finger, LegendItem] => [f, { value: fingers[f] ? String(Math.round(fingers[f]!.wpm)) : '–', strong: marks?.fastest[0] === f }])
		) as Record<Finger, LegendItem>
	);
	const summary = $derived(
		`Speed of each finger: ${FINGERS.map((f) => `${handOf(f)} ${NAMES[kindOf(f)]!.toLowerCase()} ${fingers[f] ? `${Math.round(fingers[f]!.wpm)} words per minute` : 'no data'}`).join(', ')}.`
	);
	const tag = (f: Finger) => (marks?.fastest[0] === f ? 'Fastest' : marks?.slowest[0] === f ? 'Slowest' : null);
</script>

<figure class="figure">
	<Hands label={summary} {tone} {legend} />
	<figcaption>
		Words per minute for each finger. A stronger color means a faster finger, and the fastest finger is shown in bold.
	</figcaption>
</figure>

<div class="scores">
	{#each hands as hand (hand.name)}
		<table>
			<caption>{hand.name}</caption>
			<thead>
				<tr><th scope="col">Finger</th><th scope="col">Speed</th><th scope="col" class="num">Accuracy</th></tr>
			</thead>
			<tbody>
				{#each hand.list as f (f)}
					{@const s = fingers[f]}
					<tr class={tag(f)?.toLowerCase() ?? ''}>
						<th scope="row">
							<span class="dot" style:background={`var(--f-${kindOf(f)})`} aria-hidden="true"></span>
							{NAMES[kindOf(f)]}
							{#if tag(f)}<span class="tag">{tag(f)}</span>{/if}
						</th>
						<td>
							{#if s}
								<span class="bar" aria-hidden="true"><span style:width={`${(s.wpm / max) * 100}%`}></span></span>
								<b>{Math.round(s.wpm)}</b> WPM
							{:else}
								<span class="muted">No data</span>
							{/if}
						</td>
						<td class="num">{s ? `${Math.round(s.accuracy)}%` : '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/each}
</div>
<p class="note">Speed is calculated from the time between keystrokes made by each finger. Thumbs are measured on the space bar.</p>

<style>
	.figure {
		max-width: 540px;
		margin: 0 auto 24px;
	}
	figcaption {
		margin-top: 10px;
		text-align: center;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.scores {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14.5px;
	}
	caption {
		text-align: left;
		font-family: var(--font-serif);
		font-size: 22px;
		padding-bottom: 8px;
	}
	th,
	td {
		padding: 9px 8px;
		text-align: left;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	thead th {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	tbody th {
		font-weight: 600;
		white-space: nowrap;
	}
	td {
		width: 55%;
	}
	td.num,
	th.num {
		width: auto;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
		margin-right: 6px;
	}
	.bar {
		display: inline-block;
		width: calc(100% - 80px);
		height: 10px;
		margin-right: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		vertical-align: middle;
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink-2);
	}
	.fastest .bar span {
		background: var(--accent);
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.2);
	}
	.slowest .bar span {
		background: var(--error);
	}
	.tag {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		font-size: 11.5px;
		font-weight: 600;
		border: 1px solid var(--line-strong);
	}
	.fastest .tag {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
	}
	.slowest .tag {
		color: var(--error);
		border-color: var(--error);
	}
	.muted {
		color: var(--ink-2);
	}
	.note {
		margin-top: 10px;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	@media (max-width: 760px) {
		.scores {
			grid-template-columns: 1fr;
		}
	}
</style>
