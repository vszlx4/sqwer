<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { dots, INDEX, LEVEL, RESULTS, WORD_COUNT, type Screen } from './mock.ts';

	/** Version B: framed console. Sound on the left, answer and explanation on the right; stacked on phones. */
	let { screen, area }: { screen: Screen; area: 'learn' | 'games' } = $props();

	const result = $derived(screen === 'listening' ? null : RESULTS[screen]);
	const SYMBOL = { same: '', extra: '+', missing: '−', wrong: '×', variant: '≈' } as const;
	const KIND = { close: 'Spelled by sound', accepted: 'British spelling' } as const;
</script>

<div class="console">
	<ol class="track" aria-label={`Word ${INDEX + 1} of ${WORD_COUNT}`}>
		{#each dots(screen) as dot, i (i)}
			<li class="seg {dot}" aria-hidden="true"></li>
		{/each}
	</ol>

	<header class="head">
		<p class="title">{area === 'games' ? 'Endless · Level 3' : 'Lesson 12 · Listen and type'}</p>
		<p class="count">{INDEX + 1}<span>/{WORD_COUNT}</span></p>
	</header>

	<div class="body">
		<div class="sound" class:done={!!result}>
			<div class="pill" class:quiet={!!result} aria-hidden="true">
				{#each LEVEL as level, i (i)}
					<span style:--level={result ? 0.1 : level}></span>
				{/each}
			</div>
			<p class="voice">
				<span class="chip">Supertonic</span>
				{result ? 'Done' : 'Playing'}
			</p>
			<div class="controls">
				<button type="button" class="ctl"><Icon name="repeat" size={18} /><span>Again</span><kbd>R</kbd></button>
				<button type="button" class="ctl"><Icon name="clock" size={18} /><span>Slow</span><kbd>S</kbd></button>
			</div>
			<label class="volume">
				<Icon name="volume" size={18} />
				<span class="sr-only">Volume</span>
				<input type="range" min="0" max="100" value="70" />
			</label>
			{#if area === 'games'}<p class="replays">2 of 3 replays left</p>{/if}
		</div>

		<div class="side">
			<label class="answer">
				<span class="label">Type what you hear</span>
				<input type="text" value={result?.typed ?? 'nic'} disabled={!!result} autocomplete="off" spellcheck="false" />
			</label>

			{#if result}
				<section class="panel {screen}" aria-labelledby="grade-b">
					<div class="verdict">
						<p class="grade" id="grade-b">{result.grade}</p>
						<p class="score">+{result.credit === 1 ? '1' : '½'}</p>
					</div>
					<p class="kind">{KIND[screen as 'close' | 'accepted']}</p>

					<p class="sr-only">{result.spoken}</p>
					<div class="tiles" aria-hidden="true" style:--n={result.slots.length}>
						{#each result.slots as s, i (i)}<span class="tile typed {s.mark}">{s.typed}</span>{/each}
						{#each result.slots as s, i (i)}<span class="tile word {s.mark}">{s.word}</span>{/each}
						{#each result.slots as s, i (i)}<span class="sym {s.mark}">{SYMBOL[s.mark]}</span>{/each}
					</div>
					<p class="legend" aria-hidden="true">
						{#if screen === 'close'}<span><b class="extra">+</b> extra</span><span><b class="missing">−</b> missing</span>
						{:else}<span><b class="variant">≈</b> spelling variant</span>{/if}
					</p>

					<p class="why">{result.note}</p>

					<div class="rate" role="group" aria-label="Rate this voice clip">
						<span>How clear was the voice?</span>
						<div>
							{#each [1, 2, 3, 4, 5] as n (n)}
								<button type="button" class="star" class:on={n <= 4} aria-label={`${n} of 5`}><Icon name="star" size={16} /></button>
							{/each}
						</div>
					</div>
					<button type="button" class="btn btn-primary next">Continue <kbd>Enter</kbd></button>
				</section>
			{:else}
				<ul class="keys">
					<li><kbd>Enter</kbd> Check</li>
					<li><kbd>R</kbd> Hear again</li>
					<li><kbd>S</kbd> Slow</li>
				</ul>
			{/if}
		</div>
	</div>
</div>

<style>
	.console {
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
		overflow: hidden;
	}
	.track {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: var(--space-2);
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.seg {
		height: 6px;
		background: var(--surface-2);
	}
	.seg.exact,
	.seg.accepted {
		background: var(--ink);
	}
	.seg.close {
		background: var(--streak);
	}
	.seg.wrong {
		background: var(--error);
	}
	.seg.now {
		background: var(--accent);
	}
	.head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-12);
		padding: var(--space-16) var(--space-24);
		border-bottom: 1px solid var(--line);
	}
	.title {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.count {
		font-family: var(--font-mono);
		font-size: var(--fs-20);
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.count span {
		color: var(--ink-2);
		font-size: var(--fs-14);
	}

	.body {
		display: grid;
		grid-template-columns: 5fr 7fr;
	}
	.sound {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-16);
		padding: var(--space-40) var(--space-24);
		border-right: 1px solid var(--line);
		background: var(--bg);
	}
	.pill {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		max-width: 260px;
		height: 120px;
		padding-inline: var(--space-20);
		border-radius: var(--radius);
		/* Fixed dark in both themes so the hue bars read the same. */
		background: var(--on-hue);
	}
	.pill span {
		flex: 1;
		height: calc(6px + var(--level) * 80px);
		border-radius: var(--radius);
		background: var(--accent);
	}
	.pill.quiet span {
		background: var(--untyped);
	}
	.voice {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.chip {
		padding: var(--space-2) var(--space-8);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		color: var(--ink);
		font-size: var(--fs-12);
	}
	.controls {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-8);
		width: 100%;
		max-width: 260px;
	}
	.ctl {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		min-height: 44px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: var(--fs-14);
		cursor: pointer;
	}
	.volume {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		width: 100%;
		max-width: 260px;
		min-height: 44px;
		color: var(--ink-2);
	}
	.volume input {
		flex: 1;
		accent-color: var(--ink);
	}
	.replays {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
		padding: var(--space-32) var(--space-32);
	}
	.answer {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.label {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.answer input {
		width: 100%;
		height: 60px;
		padding: 0 var(--space-16);
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-28);
	}
	.answer input:disabled {
		border-color: var(--line-strong);
		color: var(--ink-2);
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8) var(--space-16);
		list-style: none;
		padding: 0;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		padding: var(--space-20);
		border-radius: var(--radius);
		border-left: 4px solid var(--streak);
		background: var(--bg);
	}
	.panel.accepted {
		border-left-color: var(--success);
	}
	.verdict {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.grade {
		font-family: var(--font-serif);
		font-size: var(--fs-32);
		line-height: var(--lh-tight);
		color: var(--ink);
	}
	.score {
		font-family: var(--font-mono);
		font-size: var(--fs-20);
		color: var(--streak);
	}
	.accepted .score {
		color: var(--success);
	}
	.kind {
		margin-top: calc(var(--space-6) * -1);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(var(--n), 40px);
		gap: var(--space-4);
		margin-top: var(--space-8);
	}
	.tile {
		display: grid;
		place-items: center;
		height: 44px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-20);
		color: var(--ink);
	}
	.tile:empty {
		border-style: dashed;
		background: transparent;
	}
	.tile.typed.extra {
		border-color: var(--error);
		background: var(--error-soft);
	}
	.tile.word.missing {
		border-color: var(--streak);
		background: var(--streak-soft);
	}
	.tile.variant {
		border-color: var(--success);
		background: var(--success-soft);
	}
	.tile.word:not(:empty) {
		font-weight: var(--fw-semibold);
	}
	.sym {
		font-family: var(--font-mono);
		font-size: var(--fs-16);
		font-weight: var(--fw-bold);
		text-align: center;
	}
	.extra {
		color: var(--error);
	}
	.missing {
		color: var(--streak);
	}
	.variant {
		color: var(--success);
	}
	.legend {
		display: flex;
		gap: var(--space-16);
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	.legend b {
		font-family: var(--font-mono);
		margin-right: var(--space-4);
	}
	.why {
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.rate {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-8);
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.star {
		width: 32px;
		height: 44px;
		border: 0;
		background: none;
		color: var(--line-strong);
		cursor: pointer;
	}
	.star.on {
		color: var(--ink);
	}
	.next {
		width: 100%;
		justify-content: center;
	}
	kbd {
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	.btn-primary kbd {
		background: transparent;
		border-color: currentColor;
		color: inherit;
	}

	@media (max-width: 760px) {
		.body {
			grid-template-columns: 1fr;
		}
		.sound {
			padding: var(--space-24) var(--space-16);
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}
		.pill {
			height: 88px;
		}
		.side {
			padding: var(--space-20) var(--space-16);
		}
		/* Answered: the sound pane shrinks so the explanation stays in view. */
		.sound.done {
			flex-direction: row;
			padding-block: var(--space-12);
		}
		.sound.done .pill {
			max-width: 120px;
			height: 40px;
		}
		.sound.done :is(.controls, .volume, .replays) {
			display: none;
		}
		.head {
			padding: var(--space-12) var(--space-16);
		}
	}
	@media (max-width: 420px) {
		.tiles {
			grid-template-columns: repeat(var(--n), 36px);
		}
	}
</style>
