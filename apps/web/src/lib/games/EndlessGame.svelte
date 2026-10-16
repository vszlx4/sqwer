<script lang="ts">
	import { onMount } from 'svelte';
	import Echo from '#lib/courses/steps/Echo.svelte';
	import FallingGame from '#lib/courses/steps/FallingGame.svelte';
	import KeyHunt from '#lib/courses/steps/KeyHunt.svelte';
	import ListenType from '#lib/courses/steps/ListenType.svelte';
	import Race from '#lib/courses/steps/Race.svelte';
	import RhythmGame from '#lib/courses/steps/RhythmGame.svelte';
	import type { StepResult } from '#lib/courses/types.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import {
		DIFFICULTIES,
		LETTERS,
		MAX_LEVEL,
		STRIKES,
		levelName,
		loadRecords,
		nextLevel,
		roundSettings,
		saveRecord,
		wordsForLevel,
		type DifficultyId,
		type GameInfo
	} from './endless.ts';

	/**
	 * One game in endless mode: choose the difficulty, then play round after round. The score of a
	 * round is its level, so harder rounds count for more; the run ends after three failed rounds.
	 */
	let { game }: { game: GameInfo } = $props();

	let phase = $state<'setup' | 'loading' | 'playing' | 'between' | 'over'>('setup');
	let difficulty = $state<DifficultyId>('adaptive');
	let adaptiveLevel = $state(3);
	let best = $state(0);
	let level = $state(3);
	let round = $state(0);
	let words = $state<string[]>([]);
	let cleared = $state(0);
	let strikes = $state(0);
	let score = $state(0);
	let topLevel = $state(0);
	let last = $state<{ passed: boolean; summary: string; level: number; next: number } | null>(null);
	let newBest = $state(false);
	let nextButton: HTMLButtonElement | undefined = $state();

	onMount(() => {
		const saved = loadRecords()[game.id];
		if (saved) {
			difficulty = saved.difficulty;
			adaptiveLevel = saved.level;
			best = saved.best;
		}
	});

	const choice = $derived(DIFFICULTIES.find((d) => d.id === difficulty)!);
	const startLevel = $derived(choice.level ?? adaptiveLevel);
	const settings = $derived(roundSettings(game.id, level));
	const usesWords = $derived(game.id === 'race' || game.id === 'falling-words' || game.id === 'listen');

	async function load(at: number) {
		level = at;
		if (usesWords) {
			phase = 'loading';
			words = await wordsForLevel(at);
		}
		round++;
		phase = 'playing';
	}

	function begin() {
		cleared = 0;
		strikes = 0;
		score = 0;
		topLevel = 0;
		round = 0;
		newBest = false;
		last = null;
		void load(startLevel);
	}

	function done(r: StepResult) {
		const next = choice.level === null ? nextLevel(level, r.passed) : level;
		if (r.passed) {
			cleared++;
			score += level;
			topLevel = Math.max(topLevel, level);
		} else strikes++;
		last = { passed: r.passed, summary: r.summary, level, next };
		if (choice.level === null) adaptiveLevel = next;
		const ended = strikes >= STRIKES;
		if (ended && score > best) {
			best = score;
			newBest = true;
		}
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty });
		phase = ended ? 'over' : 'between';
		requestAnimationFrame(() => nextButton?.focus());
	}

	/** Ends the run at the player's request, keeping the score of the rounds cleared so far. */
	function endRun() {
		strikes = STRIKES;
		if (score > best) {
			best = score;
			newBest = true;
		}
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty });
		last = { passed: false, summary: `You ended the run after ${round} ${round === 1 ? 'round' : 'rounds'}.`, level, next: level };
		phase = 'over';
		requestAnimationFrame(() => nextButton?.focus());
	}

	function onkeydown(e: KeyboardEvent) {
		if (phase !== 'between' || e.key !== 'Enter' || (e.target as HTMLElement | null)?.closest('a, input')) return;
		e.preventDefault();
		void load(last!.next);
	}
</script>

<svelte:window {onkeydown} />

<div class="endless">
	{#if phase === 'setup'}
		<section class="setup" aria-labelledby="difficulty-title">
			<h2 id="difficulty-title">Choose the difficulty</h2>
			<p class="lede">
				Rounds follow one another until {STRIKES} have been failed. Each cleared round scores its level, from 1 to
				{MAX_LEVEL}.{#if best} Your best run: <b>{best}&nbsp;points</b>.{/if}
			</p>
			<div class="choices" role="radiogroup" aria-labelledby="difficulty-title">
				{#each DIFFICULTIES as d (d.id)}
					<label class="choice" class:on={difficulty === d.id}>
						<input type="radio" name="difficulty" value={d.id} bind:group={difficulty} />
						<span class="name">
							{d.label}
							<small>{d.level === null ? `Starts at level ${adaptiveLevel}` : `Level ${d.level}`}</small>
						</span>
						<span class="note">{d.note}</span>
					</label>
				{/each}
			</div>
			<button type="button" class="btn btn-primary btn-lg" onclick={begin}>
				Start at level {startLevel} <Icon name="arrow" size={18} />
			</button>
		</section>
	{:else}
		<div class="hud" aria-live="polite">
			<span><small>Level</small><b>{level}</b> {levelName(level)}</span>
			<span><small>Round</small><b>{round}</b></span>
			<span><small>Score</small><b>{score}</b></span>
			<span class="strikes" aria-label={`${STRIKES - strikes} of ${STRIKES} tries left`}>
				<small>Tries</small>
				{#each Array.from({ length: STRIKES }) as _, i (i)}<span class="strike" class:used={i < strikes}></span>{/each}
			</span>
			<span class="mode">{choice.level === null ? 'Adaptive difficulty' : 'Fixed difficulty'}</span>
		</div>

		{#if phase === 'loading'}
			<p class="loading" role="status">Preparing the round…</p>
		{:else if phase === 'playing'}
			{#key round}
				{#if game.id === 'race'}
					<Race pool={LETTERS} focus="" {words} count={settings.count!} pacerWpm={settings.pacerWpm!} oncomplete={done} />
				{:else if game.id === 'falling-words'}
					<FallingGame items="words" pool={LETTERS} focus="" {words} target={settings.target!} pace={settings.pace} oncomplete={done} />
				{:else if game.id === 'falling-letters'}
					<FallingGame items="letters" pool={LETTERS} focus="" target={settings.target!} pace={settings.pace} oncomplete={done} />
				{:else if game.id === 'echo'}
					<Echo pool={LETTERS} start={settings.start!} target={settings.target!} oncomplete={done} />
				{:else if game.id === 'listen'}
					<ListenType pool={LETTERS} focus="" {words} count={settings.count!} target={settings.target!} oncomplete={done} />
				{:else if game.id === 'rhythm'}
					<RhythmGame keys={['f', 'j', 'd', 'k']} pool={LETTERS} bpm={settings.bpm!} target={settings.target!} oncomplete={done} />
				{:else}
					<KeyHunt pool={LETTERS} focus="" target={settings.target!} pace={settings.pace} oncomplete={done} />
				{/if}
			{/key}
		{:else if last}
			<section class="result" class:passed={last.passed} aria-labelledby="round-title">
				<span class="badge" aria-hidden="true"><Icon name={phase === 'over' ? 'flag' : last.passed ? 'check' : 'restart'} size={26} /></span>
				<h2 id="round-title">
					{phase === 'over' ? 'Run complete' : last.passed ? `Round ${round} cleared` : `Round ${round} missed`}
				</h2>
				<p>{last.summary}</p>
				{#if phase === 'over'}
					<dl class="totals">
						<div><dt>Score</dt><dd>{score}</dd></div>
						<div><dt>Rounds cleared</dt><dd>{cleared}</dd></div>
						<div><dt>Highest level</dt><dd>{topLevel || '–'}</dd></div>
					</dl>
					<p class="best">{newBest ? 'A new best run.' : best ? `Your best run: ${best} points.` : ''}</p>
					<div class="row">
						<button bind:this={nextButton} type="button" class="btn btn-primary btn-lg" onclick={begin}>
							<Icon name="repeat" size={18} /> Play again
						</button>
						<button type="button" class="btn btn-lg" onclick={() => (phase = 'setup')}>Change difficulty</button>
					</div>
				{:else}
					<p class="next">
						{#if choice.level === null}
							{last.next > last.level ? `Next round: level ${last.next}, a step harder.` : last.next < last.level ? `Next round: level ${last.next}, a step easier.` : `Next round: level ${last.next}.`}
						{:else}
							Next round: level {last.next}.
						{/if}
						{STRIKES - strikes} {STRIKES - strikes === 1 ? 'try' : 'tries'} left.
					</p>
					<div class="row">
						<button bind:this={nextButton} type="button" class="btn btn-primary btn-lg" onclick={() => load(last!.next)}>
							Next round <Icon name="arrow" size={18} /> <kbd aria-hidden="true">Enter</kbd>
						</button>
						<button type="button" class="btn btn-lg" onclick={endRun}>
							End the run
						</button>
					</div>
				{/if}
			</section>
		{/if}
	{/if}
</div>

<style>
	.endless {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.setup {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 16px;
	}
	.setup h2 {
		font-size: 24px;
	}
	.lede {
		max-width: 64ch;
		color: var(--ink-2);
		line-height: 1.55;
	}
	.lede b {
		color: var(--ink);
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: 10px;
		width: 100%;
	}
	.choice {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 16px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		cursor: pointer;
		transition:
			border-color 140ms ease,
			box-shadow 140ms ease;
	}
	.choice:hover {
		border-color: var(--ink-3);
	}
	.choice.on {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	.choice:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.choice input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.name {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
		font-weight: 700;
	}
	.name small {
		font-weight: 500;
		font-size: 12.5px;
		color: var(--ink-3);
	}
	.note {
		font-size: 13.5px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.hud {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 22px;
		padding: 10px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: 14px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.hud > span {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}
	.hud small {
		font-size: 12px;
		color: var(--ink-3);
	}
	.hud b {
		font-size: 18px;
		color: var(--ink);
	}
	.strikes {
		align-items: center !important;
	}
	.strike {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		background: var(--ink);
		transition: opacity 200ms ease;
	}
	.strike.used {
		opacity: 0.15;
	}
	.mode {
		margin-left: auto;
		font-weight: 600;
		color: var(--ink);
	}
	.loading {
		padding: 48px 0;
		text-align: center;
		color: var(--ink-2);
	}
	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 36px 24px;
		text-align: center;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
	}
	.badge {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 3px;
		background: var(--surface-2);
		color: var(--ink);
	}
	.result.passed .badge {
		background: var(--accent);
		color: var(--on-accent);
	}
	.result h2 {
		font-size: 32px;
		text-wrap: balance;
	}
	.result p {
		max-width: 52ch;
		color: var(--ink-2);
		line-height: 1.55;
		text-wrap: pretty;
	}
	.totals {
		display: flex;
		gap: 28px;
		margin-top: 4px;
	}
	.totals div {
		display: flex;
		flex-direction: column;
	}
	.totals dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	.totals dd {
		font-size: 30px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.best {
		font-weight: 600;
		color: var(--ink) !important;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
		margin-top: 4px;
	}
	.row kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.12);
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
