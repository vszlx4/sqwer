<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { dots, INDEX, LEVEL, RESULTS, WORD_COUNT, type Screen } from './mock.ts';

	/** Version A: open stage. No frame; the voice pill sits in the middle, the answer under it, dots on top. */
	let { screen, area }: { screen: Screen; area: 'learn' | 'games' } = $props();

	const result = $derived(screen === 'listening' ? null : RESULTS[screen]);
	const MARK_LABEL = { same: '', extra: 'extra', missing: 'missing', wrong: 'wrong', variant: 'British' } as const;
</script>

<div class="stage">
	<header class="top">
		<ol class="dots" aria-label={`Word ${INDEX + 1} of ${WORD_COUNT}`}>
			{#each dots(screen) as dot, i (i)}
				<li class="dot {dot}" aria-hidden="true"></li>
			{/each}
		</ol>
		<p class="meta">
			<span>Word {INDEX + 1} of {WORD_COUNT}</span>
			{#if area === 'games'}<span>· Level 3</span><span>· 2 replays left</span>{:else}<span>· Goal 9</span>{/if}
		</p>
	</header>

	<div class="pill" class:quiet={!!result} aria-hidden="true">
		{#each LEVEL as level, i (i)}
			<span style:--level={result ? 0.12 : level}></span>
		{/each}
	</div>
	<p class="state">
		{#if result}Heard once · normal speed{:else}<span class="live"></span>Playing · normal speed{/if}
	</p>

	{#if !result}
		<div class="controls">
			<button type="button" class="ctl">
				<Icon name="repeat" size={18} /> Again <kbd>R</kbd>
			</button>
			<button type="button" class="ctl">
				<Icon name="clock" size={18} /> Slow <kbd>S</kbd>
			</button>
			<label class="volume">
				<Icon name="volume" size={18} />
				<span class="sr-only">Volume</span>
				<input type="range" min="0" max="100" value="70" />
			</label>
		</div>
	{/if}

	<label class="answer">
		<span class="sr-only">Your answer</span>
		<input type="text" value={result?.typed ?? 'nic'} disabled={!!result} autocomplete="off" spellcheck="false" />
	</label>

	{#if result}
		<section class="panel" aria-labelledby="grade-a">
			<p class="grade {screen}" id="grade-a">
				<span class="mark" aria-hidden="true"><Icon name={screen === 'accepted' ? 'check' : 'target'} size={16} /></span>
				{result.grade}
				<span class="credit">{result.credit === 1 ? 'Full point' : 'Half a point'}</span>
			</p>

			<p class="sr-only">{result.spoken}</p>
			<div class="compare" aria-hidden="true" style:--n={result.slots.length}>
				<span class="row-label">You</span>
				{#each result.slots as s, i (i)}<span class="cell typed {s.mark}">{s.typed || '·'}</span>{/each}
				<span class="row-label">Word</span>
				{#each result.slots as s, i (i)}<span class="cell word {s.mark}">{s.word || '·'}</span>{/each}
				<span></span>
				{#each result.slots as s, i (i)}<span class="note-mark {s.mark}">{MARK_LABEL[s.mark]}</span>{/each}
			</div>

			<p class="why">{result.note}</p>

			<div class="foot">
				<div class="rate" role="group" aria-label="Rate this voice clip">
					<span>Voice clip</span>
					{#each [1, 2, 3, 4, 5] as n (n)}
						<button type="button" class="star" class:on={n <= 4} aria-label={`${n} of 5`}><Icon name="star" size={16} /></button>
					{/each}
				</div>
				<button type="button" class="btn btn-primary">Continue <kbd>Enter</kbd></button>
			</div>
		</section>
	{:else}
		<p class="help"><kbd>Enter</kbd> check · <kbd>R</kbd> hear again · <kbd>S</kbd> slow</p>
	{/if}
</div>

<style>
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-20);
		text-align: center;
	}
	.top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-10);
		margin-bottom: var(--space-24);
	}
	.dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-6);
		list-style: none;
		padding: 0;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-pill);
		background: var(--surface-2);
	}
	.dot.exact,
	.dot.accepted {
		background: var(--ink);
	}
	.dot.close {
		background: var(--streak);
	}
	.dot.wrong {
		background: var(--error);
	}
	.dot.now {
		width: 26px;
		background: var(--accent);
		outline: 1px solid var(--ink);
		outline-offset: 1px;
	}
	.meta {
		display: flex;
		gap: var(--space-6);
		font-size: var(--fs-13);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	.pill {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		width: 232px;
		height: 88px;
		padding-inline: var(--space-24);
		border-radius: var(--radius-pill);
		/* Fixed dark in both themes so the hue bars read the same. */
		background: var(--on-hue);
		transition: opacity var(--dur-base) var(--ease-out);
	}
	.pill span {
		flex: 1;
		height: calc(8px + var(--level) * 48px);
		border-radius: var(--radius-pill);
		background: var(--accent);
	}
	.pill.quiet {
		opacity: 0.55;
	}
	.state {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		margin-top: calc(var(--space-8) * -1);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.live {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--accent-ink);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-8);
	}
	.ctl,
	.volume {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		min-height: 44px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-size: var(--fs-14);
		cursor: pointer;
	}
	.volume input {
		width: 96px;
		accent-color: var(--ink);
	}

	.answer input {
		width: min(var(--w-form), 100%);
		height: 64px;
		padding: 0 var(--space-16);
		border: 0;
		border-bottom: 2px solid var(--ink);
		border-radius: 0;
		background: transparent;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-32);
		text-align: center;
	}
	.answer input:disabled {
		color: var(--ink-2);
		border-bottom-color: var(--line-strong);
	}
	.answer {
		width: min(var(--w-form), 100%);
	}

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-16);
		width: 100%;
		max-width: var(--w-narrow);
		padding: var(--space-24) var(--space-20);
		border-top: 1px solid var(--line);
	}
	.grade {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-family: var(--font-serif);
		font-size: var(--fs-28);
		color: var(--ink);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-pill);
	}
	.close .mark {
		background: var(--streak-soft);
		color: var(--streak);
	}
	.accepted .mark {
		background: var(--success-soft);
		color: var(--success);
	}
	.credit {
		font-family: var(--font-sans);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}

	.compare {
		display: grid;
		grid-template-columns: auto repeat(var(--n), 40px);
		gap: var(--space-4) var(--space-4);
		align-items: center;
	}
	.row-label {
		padding-right: var(--space-8);
		font-size: var(--fs-12);
		color: var(--ink-2);
		text-align: right;
	}
	.cell {
		display: grid;
		place-items: center;
		height: 44px;
		font-family: var(--font-mono);
		font-size: var(--fs-24);
		color: var(--ink);
	}
	.cell.word {
		border-top: 1px solid var(--line);
	}
	.cell.typed.extra {
		color: var(--error);
		text-decoration: line-through;
	}
	.cell.word.missing {
		font-weight: var(--fw-bold);
		color: var(--streak);
	}
	.cell.typed.missing,
	.cell.word.extra {
		color: var(--untyped);
	}
	.cell.variant {
		font-weight: var(--fw-bold);
		color: var(--success);
	}
	.note-mark {
		min-height: 16px;
		font-size: var(--fs-11);
		text-align: center;
		color: var(--ink-2);
	}
	.note-mark.extra {
		color: var(--error);
	}
	.note-mark.missing {
		color: var(--streak);
	}
	.note-mark.variant {
		color: var(--success);
	}

	.why {
		max-width: var(--w-form);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-16);
		width: 100%;
		padding-top: var(--space-8);
	}
	.rate {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.rate > span {
		margin-right: var(--space-6);
	}
	.star {
		display: grid;
		place-items: center;
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

	.help {
		font-size: var(--fs-13);
		color: var(--ink-2);
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

	@media (max-width: 560px) {
		.compare {
			grid-template-columns: auto repeat(var(--n), 32px);
		}
		.cell {
			font-size: var(--fs-20);
		}
		.foot {
			flex-direction: column-reverse;
		}
		.foot .btn {
			width: 100%;
		}
	}
</style>
