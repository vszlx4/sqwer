<script lang="ts">
	import { FINGERS, kindOf, type Finger } from '@sqwer/layouts';
	import Hands from '#lib/hands/Hands.svelte';

	/** A small illustration of what each examination measures. Decorative: the card text carries the meaning. */
	let { exam }: { exam: string } = $props();

	const RING = 2 * Math.PI * 34;
	const BARS = [62, 66, 64, 70, 68, 71, 69, 73, 70, 72, 74, 71, 73, 75, 72, 74, 76, 73, 75, 77, 74, 76];
	const WORDS = ['steady', 'rhythm', 'beats', 'bursts'];
	const KEYS = ['⇧', '7', '&', ';', '?'];
	// A miniature keyboard coloured by finger, three rows of ten keys.
	const ROW: Finger[] = ['lp', 'lr', 'lm', 'li', 'li', 'ri', 'ri', 'rm', 'rr', 'rp'];
	const MAPPED = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26]);
	const speedTone = Object.fromEntries(FINGERS.map((f, i) => [f, 0.35 + 0.65 * Math.abs(Math.sin(i * 1.3 + 0.4))]));
</script>

<div class="visual" aria-hidden="true">
	{#if exam === 'placement'}
		<svg viewBox="0 0 320 140" class="chart" preserveAspectRatio="xMidYMid meet">
			{#each [30, 60, 90, 120] as y (y)}<line x1="0" x2="320" y1={y} y2={y} class="gridline" />{/each}
			<polyline points="24,104 70,98 116,84 162,80 208,62 254,52 300,34" class="future" />
			<polyline points="24,104 70,98" class="past" />
			<circle cx="24" cy="104" r="9" class="halo" />
			<circle cx="24" cy="104" r="4.5" class="dot" />
			<text x="38" y="124" class="label">Your baseline</text>
		</svg>
	{:else if exam === 'timed'}
		<div class="timed">
			<svg viewBox="0 0 80 80" class="timer-ring">
				<circle cx="40" cy="40" r="34" class="track" />
				<circle cx="40" cy="40" r="34" class="arc" stroke-dasharray={RING} stroke-dashoffset={RING * 0.25} />
				<text x="40" y="45" text-anchor="middle" class="ring-text">0:30</text>
			</svg>
			<ul class="chips">
				{#each [15, 30, 60, 120] as s (s)}<li class:on={s === 30}>{s}</li>{/each}
			</ul>
		</div>
	{:else if exam === 'words'}
		<div class="words">
			<p>
				{#each WORDS as w, i (w)}<span class:done={i < 2} class:current={i === 2}>{w}</span>{' '}{/each}
			</p>
			<span class="count">12<small>/25</small></span>
		</div>
	{:else if exam === 'symbols'}
		<div class="keys">
			{#each KEYS as k, i (k)}<span class="key" class:wide={i === 0} style:--i={i}>{k}</span>{/each}
		</div>
	{:else if exam === 'endurance'}
		<div class="bars">
			{#each BARS as h, i (i)}<span style:height={`${h}%`} style:--i={i}></span>{/each}
			<span class="time">2:00</span>
		</div>
	{:else if exam === 'finger-map'}
		<div class="kbd">
			{#each [0, 1, 2] as row (row)}
				<div class="kbd-row" style:padding-left={`${row * 9}px`}>
					{#each ROW as f, i (i)}
						{@const n = row * 10 + i}
						<span class="k" class:pending={!MAPPED.has(n)} style:--c={`var(--f-${kindOf(f)})`}></span>
					{/each}
				</div>
			{/each}
		</div>
	{:else if exam === 'finger-speed'}
		<div class="hands">
			<Hands label="" tone={speedTone} />
		</div>
	{/if}
</div>

<style>
	.visual {
		position: relative;
		display: grid;
		place-items: center;
		height: 100%;
		min-height: 140px;
		overflow: hidden;
		color: var(--ink);
	}

	/* Placement: a baseline from which progress is measured. */
	.chart {
		width: 100%;
		height: 100%;
	}
	.gridline {
		stroke: var(--line);
		stroke-width: 1;
	}
	.future {
		fill: none;
		stroke: var(--ink-3);
		stroke-width: 2;
		stroke-dasharray: 4 6;
		transition: stroke-dashoffset 900ms ease;
	}
	:global(.exam-card:hover) .future {
		stroke-dashoffset: -40;
	}
	.past {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2.5;
	}
	.halo {
		fill: var(--accent);
		opacity: 0.55;
		transform-box: fill-box;
		transform-origin: center;
		animation: pulse 2.4s ease-in-out infinite;
	}
	.dot {
		fill: var(--ink);
	}
	.label {
		font-family: var(--font-mono);
		font-size: 9px;
		fill: var(--ink-2);
	}
	@keyframes pulse {
		50% {
			transform: scale(1.5);
			opacity: 0.2;
		}
	}

	/* Timed: a countdown ring and the four durations. */
	.timed {
		display: flex;
		align-items: center;
		gap: 22px;
	}
	.timer-ring {
		width: 92px;
		height: 92px;
		transform: rotate(-90deg);
	}
	.track {
		fill: none;
		stroke: var(--line);
		stroke-width: 6;
	}
	.arc {
		fill: none;
		stroke: var(--accent);
		stroke-width: 6;
		stroke-linecap: round;
		transition: stroke-dashoffset 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	:global(.exam-card:hover) .arc {
		stroke-dashoffset: 0;
	}
	.ring-text {
		transform: rotate(90deg);
		transform-origin: 40px 40px;
		font-family: var(--font-mono);
		font-size: 15px;
		font-weight: 600;
		fill: var(--ink);
	}
	.chips {
		display: grid;
		grid-template-columns: repeat(2, 44px);
		gap: 6px;
	}
	.chips li {
		padding: 4px 0;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		font-family: var(--font-mono);
		font-size: 12.5px;
		text-align: center;
		color: var(--ink-2);
	}
	.chips li.on {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--bg);
	}

	/* Word count: a passage with a fixed number of words. */
	.words {
		display: flex;
		align-items: flex-end;
		gap: 16px;
		padding: 0 20px;
	}
	.words p {
		font-family: var(--font-mono);
		font-size: 17px;
		line-height: 1.5;
		color: var(--untyped);
	}
	.words .done {
		color: var(--ink);
	}
	.words .current {
		color: var(--ink);
		box-shadow: inset 2px 0 0 var(--accent);
		padding-left: 3px;
	}
	.count {
		font-family: var(--font-serif);
		font-size: 40px;
		line-height: 1;
	}
	.count small {
		font-size: 18px;
		color: var(--ink-2);
	}

	/* Punctuation and numbers: the keys that need Shift and longer reaches. */
	.keys {
		display: flex;
		gap: 6px;
	}
	.key {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 3px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 17px;
		transition: transform 260ms cubic-bezier(0.2, 0.7, 0.2, 1);
		transition-delay: calc(var(--i) * 40ms);
	}
	.key.wide {
		width: 56px;
	}
	:global(.exam-card:hover) .key {
		transform: translateY(-4px);
	}

	/* Endurance: speed held steady second after second. */
	.bars {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 84px;
		padding: 0 20px;
	}
	.bars span:not(.time) {
		width: 7px;
		border-radius: 2px;
		background: var(--ink-3);
		opacity: 0.55;
		transform-origin: bottom;
		transition: transform 400ms ease;
		transition-delay: calc(var(--i) * 18ms);
	}
	.bars span:nth-last-child(2) {
		background: var(--accent);
		opacity: 1;
	}
	:global(.exam-card:hover) .bars span:not(.time) {
		transform: scaleY(1.12);
	}
	.time {
		align-self: center;
		margin-left: 12px;
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
	}

	/* Finger mapping: keys coloured by the finger that presses them. */
	.kbd {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.kbd-row {
		display: flex;
		gap: 4px;
	}
	.k {
		width: 20px;
		height: 20px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--c) 55%, var(--key));
		border: 1px solid color-mix(in srgb, var(--c) 60%, var(--key-edge));
		transition: background-color 300ms ease;
	}
	.k.pending {
		background: repeating-linear-gradient(135deg, var(--key), var(--key) 3px, var(--surface-2) 3px, var(--surface-2) 6px);
		border-color: var(--key-edge);
	}

	/* Finger speed: each finger measured separately. */
	.hands {
		width: min(100%, 250px);
	}

	@media (prefers-reduced-motion: reduce) {
		.halo {
			animation: none;
		}
	}
</style>
