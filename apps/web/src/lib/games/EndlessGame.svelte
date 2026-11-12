<script lang="ts">
	import { onMount } from 'svelte';
	import Echo from '#lib/courses/steps/Echo.svelte';
	import FallingGame from '#lib/courses/steps/FallingGame.svelte';
	import KeyHunt from '#lib/courses/steps/KeyHunt.svelte';
	import ListenType from '#lib/courses/steps/ListenType.svelte';
	import ListenVoice from '#lib/voice/ListenVoice.svelte';
	import SoundSettings from '#lib/voice/SoundSettings.svelte';
	import Race from '#lib/courses/steps/Race.svelte';
	import type { StepResult } from '#lib/courses/types.ts';
	import { sound } from '#lib/voice/audio.svelte.ts';
	import { summarize, type Answer } from './listen-run.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import { isWordListId, WORD_LISTS } from '@sqwer/content';
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
		type GameInfo,
		type WordSource
	} from './endless.ts';

	/** Endless mode: pick difficulty, play rounds. Round score = level; three failures end the run. */
	let { game }: { game: GameInfo } = $props();

	let phase = $state<'setup' | 'loading' | 'playing' | 'between' | 'over'>('setup');
	let difficulty = $state<DifficultyId>('adaptive');
	let source = $state<WordSource>('levels');
	let loadError = $state(false);
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
	/** Listen and type runs without rounds or tries: one word after another until the player stops. */
	const continuous = $derived(game.id === 'listen');
	let stats = $state(summarize([]));
	let startedAt = 0;
	let seconds = $state(0);

	onMount(() => {
		const saved = loadRecords()[game.id];
		if (saved) {
			difficulty = saved.difficulty;
			if (saved.source && isWordListId(saved.source)) source = saved.source;
			adaptiveLevel = saved.level;
			best = saved.best;
		}
	});

	const choice = $derived(DIFFICULTIES.find((d) => d.id === difficulty)!);
	const startLevel = $derived(choice.level ?? adaptiveLevel);
	const settings = $derived(roundSettings(game.id, level));
	const usesWords = $derived(game.id === 'race' || game.id === 'falling-words' || game.id === 'listen' || game.id === 'echo');

	async function load(at: number) {
		level = at;
		if (usesWords) {
			phase = 'loading';
			loadError = false;
			try {
				words = await wordsForLevel(at, source);
			} catch {
				loadError = true;
				phase = 'setup';
				return;
			}
		}
		round++;
		phase = 'playing';
	}

	/** Word pools per level, loaded once a run. */
	const pools = new Map<number, Promise<string[]>>();
	function poolFor(at: number): Promise<string[]> {
		let p = pools.get(at);
		if (!p) {
			p = wordsForLevel(at, source);
			p.catch(() => pools.delete(at));
			pools.set(at, p);
		}
		return p;
	}

	function begin() {
		if (continuous) {
			// The click allows audio, so the first word can play by itself once it is ready.
			void sound.unlock();
			pools.clear();
			stats = summarize([]);
			newBest = false;
			level = startLevel;
			startedAt = Date.now();
			round++;
			phase = 'playing';
			return;
		}
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
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty, source });
		phase = ended ? 'over' : 'between';
		requestAnimationFrame(() => nextButton?.focus());
	}

	function answered(all: Answer[], at: number) {
		stats = summarize(all);
		level = at;
		if (choice.level === null) adaptiveLevel = at;
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty, source });
	}

	/** Ends a continuous run and shows its statistics. */
	function stop() {
		seconds = Math.round((Date.now() - startedAt) / 1000);
		score = stats.score;
		if (score > best) {
			best = score;
			newBest = true;
		}
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty, source });
		phase = 'over';
		requestAnimationFrame(() => nextButton?.focus());
	}
	const duration = (s: number) => (s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`);

	/** Ends the run at the player's request, keeping the score of the rounds cleared so far. */
	function endRun() {
		strikes = STRIKES;
		if (score > best) {
			best = score;
			newBest = true;
		}
		saveRecord(game.id, { best, level: adaptiveLevel, difficulty, source });
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
		<div class="setup">
			<aside class="rules" aria-labelledby="rules-title">
				<h2 id="rules-title">How a run works</h2>
				{#if continuous}
				<ol>
					<li><b>Word after word.</b> It plays until you press Stop; there are no rounds or tries.</li>
					<li><b>Adapts as you go.</b> The level moves up when you get words right and eases when you miss them.</li>
					<li><b>Score.</b> Each right word scores its level. Stop whenever you like to see your statistics.</li>
				</ol>
				{:else}
				<ol>
					<li><b>Round after round.</b> Each round is one game at a level from 1 to {MAX_LEVEL}.</li>
					<li><b>{STRIKES} tries.</b> A failed round uses one; the run ends when they are gone.</li>
					<li><b>Score.</b> A cleared round scores its level, so harder rounds count for more.</li>
				</ol>
				{/if}
				<p class="record">
					{#if best}Best run <b>{best}&nbsp;points</b>{:else}No run yet{/if}
				</p>
			</aside>

			<section class="difficulty" aria-labelledby="difficulty-title">
				<h2 id="difficulty-title">Difficulty</h2>
				<fieldset>
					<legend class="sr-only">Choose the difficulty</legend>
					{#each DIFFICULTIES.filter((d) => d.level === null) as d (d.id)}
						<label class="adaptive" class:on={difficulty === d.id}>
							<input type="radio" name="difficulty" value={d.id} bind:group={difficulty} />
							<span class="mark" aria-hidden="true"></span>
							<span class="adaptive-text">
								<span class="adaptive-title">{d.label} <span class="tag">Recommended</span></span>
								<span class="adaptive-note">{d.note} Next start: level {adaptiveLevel}.</span>
							</span>
						</label>
					{/each}
					<p class="or">Or a fixed level</p>
					<div class="levels">
						{#each DIFFICULTIES.filter((d) => d.level !== null) as d (d.id)}
							<label class="level" class:on={difficulty === d.id}>
								<input type="radio" name="difficulty" value={d.id} bind:group={difficulty} />
								<span class="level-name">{d.label}</span>
								<span class="level-num">Level {d.level}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				{#if usesWords}
					<label class="source">
						<span class="source-label">Words</span>
						<select bind:value={source}>
							<option value="levels">By level (recommended)</option>
							{#each ['English', 'Themed'] as group (group)}
								<optgroup label={group}>
									{#each WORD_LISTS.filter((l) => l.group === group) as l (l.id)}
										<option value={l.id}>{l.name}{l.mature ? ' · mature' : ''}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
					</label>
					{#if source !== 'levels' && WORD_LISTS.find((l) => l.id === source)?.mature}
						<p class="source-note">This list includes profanity and other mature words. <a href="/copyright#word-lists">About the word lists</a></p>
					{/if}
				{/if}
				{#if game.id === 'listen'}<SoundSettings compact /><ListenVoice set={source === 'levels' ? 'course' : source} />{/if}
				{#if loadError}<p class="source-note" role="alert">The words could not be loaded. Check your connection and start again.</p>{/if}
				<p class="chosen" aria-live="polite">{choice.level === null ? (continuous ? 'Adapts to you as you play.' : 'Adapts to you after every round.') : choice.note}</p>
				<button type="button" class="btn btn-primary btn-lg start" onclick={begin}>
					Start at level {startLevel} <Icon name="arrow" size={18} />
				</button>
			</section>
		</div>
	{:else if continuous}
		{#if phase === 'playing'}
			<div class="hud">
				<span><small>Level</small><b>{level}</b> {levelName(level)}</span>
				<span><small>Words</small><b>{stats.words}</b></span>
				<span><small>Right</small><b>{stats.accuracy}%</b></span>
				<span><small>Streak</small><b>{stats.streak}</b></span>
				<span><small>Score</small><b>{stats.score}</b></span>
				<button type="button" class="btn stop" onclick={stop}><Icon name="flag" size={16} /> Stop</button>
			</div>
			{#key round}
				<ListenType pool={LETTERS} focus="" feed={{ level, adaptive: choice.level === null, words: poolFor, onanswer: answered }} />
			{/key}
		{:else}
			<section class="result" aria-labelledby="round-title">
				<span class="badge" aria-hidden="true"><Icon name="flag" size={26} /></span>
				<h2 id="round-title">Run complete</h2>
				<p>{stats.words ? `${stats.words} ${stats.words === 1 ? 'word' : 'words'} in ${duration(seconds)}.` : 'You stopped before the first word.'}</p>
				<dl class="totals stats">
					<div><dt>Score</dt><dd>{stats.score}</dd></div>
					<div><dt>Right</dt><dd>{stats.accuracy}%</dd></div>
					<div><dt>Best streak</dt><dd>{stats.bestStreak}</dd></div>
					<div><dt>Highest level</dt><dd>{stats.topLevel || '–'}</dd></div>
					<div><dt>Exact</dt><dd>{stats.exact}</dd></div>
					<div><dt>Accepted</dt><dd>{stats.accepted}</dd></div>
					<div><dt>Missed</dt><dd>{stats.missed}</dd></div>
					<div><dt>Plays per word</dt><dd>{stats.plays || '–'}</dd></div>
				</dl>
				{#if stats.misses.length}
					<div class="misses">
						<h3>Words to practice</h3>
						<ul>
							{#each stats.misses as m, i (i)}<li><b>{m.word}</b> <span>you typed {m.typed}</span></li>{/each}
						</ul>
					</div>
				{/if}
				<p class="best">{newBest ? 'A new best run.' : best ? `Your best run: ${best} points.` : ''}</p>
				<div class="row">
					<button bind:this={nextButton} type="button" class="btn btn-primary btn-lg" onclick={begin}>
						<Icon name="repeat" size={18} /> Play again
					</button>
					<button type="button" class="btn btn-lg" onclick={() => (phase = 'setup')}>Change difficulty</button>
				</div>
			</section>
		{/if}
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
			<div class="loading">
				<SkeletonRegion label="Preparing the round…">
					<Skeleton lines={2} />
					<Skeleton height="clamp(140px, 24vw, 220px)" />
				</SkeletonRegion>
			</div>
		{:else if phase === 'playing'}
			{#key round}
				{#if game.id === 'race'}
					<Race pool={LETTERS} focus="" {words} count={settings.count!} pacerWpm={settings.pacerWpm!} oncomplete={done} />
				{:else if game.id === 'falling-words'}
					<FallingGame items="words" pool={LETTERS} focus="" {words} target={settings.target!} pace={settings.pace} oncomplete={done} />
				{:else if game.id === 'falling-letters'}
					<FallingGame items="letters" pool={LETTERS} focus="" target={settings.target!} pace={settings.pace} oncomplete={done} />
				{:else if game.id === 'echo'}
					<Echo pool={LETTERS} start={settings.start!} target={settings.target!} showMs={settings.showMs} {words} oncomplete={done} />
				{:else if game.id === 'listen'}
					<ListenType pool={LETTERS} focus="" {words} count={settings.count!} target={settings.target!} oncomplete={done} />
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
		gap: var(--space-20);
	}
	.setup {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
		gap: clamp(var(--space-20), 4vw, var(--space-48));
		align-items: start;
	}
	h2 {
		font-size: var(--fs-24);
	}
	.rules {
		padding-top: var(--space-4);
	}
	.rules ol {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		margin: var(--space-16) 0 0;
		padding: 0;
		list-style: none;
		counter-reset: rule;
	}
	.rules li {
		position: relative;
		padding-left: var(--space-40);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
		counter-increment: rule;
	}
	.rules li::before {
		content: counter(rule);
		position: absolute;
		left: 0;
		top: 0;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
	}
	.rules b {
		color: var(--ink);
	}
	.record {
		margin-top: var(--space-24);
		padding-top: var(--space-16);
		border-top: 1px solid var(--line);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.record b {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.difficulty {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding: clamp(var(--space-20), 3vw, var(--space-32));
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	fieldset {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	input[type='radio'] {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.adaptive,
	.level {
		position: relative;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease-out),
			background-color var(--dur-fast) var(--ease-out);
	}
	.adaptive:hover,
	.level:hover {
		border-color: var(--ink-3);
	}
	.adaptive:has(input:focus-visible),
	.level:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.adaptive {
		display: flex;
		align-items: flex-start;
		gap: var(--space-12);
		padding: var(--space-16) var(--space-16);
	}
	.mark {
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		margin-top: var(--space-2);
		border-radius: 50%;
		border: 1.5px solid var(--ink-3);
	}
	.adaptive.on .mark {
		border: 5px solid var(--ink);
	}
	.adaptive-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.adaptive-title {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		font-weight: var(--fw-bold);
	}
	.tag {
		padding: 1px var(--space-8);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
	}
	.adaptive-note {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.or {
		margin-top: var(--space-6);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-3);
	}
	.levels {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-6);
	}
	.level {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-10) var(--space-6);
		text-align: center;
	}
	.level-name {
		font-size: var(--fs-14);
		font-weight: var(--fw-bold);
	}
	.level-num {
		font-size: var(--fs-12);
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	.adaptive.on,
	.level.on {
		border-color: var(--ink);
		background: var(--surface-2);
	}
	.source {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-10);
		font-size: var(--fs-14);
	}
	.source-label {
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-3);
	}
	.source select {
		padding: var(--space-8) var(--space-10);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--fs-14);
	}
	.source-note {
		font-size: var(--fs-14);
		color: var(--ink-3);
	}
	.source-note a {
		color: var(--ink-2);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.chosen {
		min-height: 1.5em;
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.start {
		align-self: flex-start;
	}
	@media (max-width: 760px) {
		.setup {
			grid-template-columns: 1fr;
		}
		/* On narrow screens the choice and the start button come first. */
		.difficulty {
			order: -1;
		}
	}
	@media (max-width: 560px) {
		.levels {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.start {
			align-self: stretch;
			justify-content: center;
		}
	}
	.hud {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-8) var(--space-24);
		padding: var(--space-10) var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: var(--fs-14);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.hud > span {
		display: inline-flex;
		align-items: baseline;
		gap: var(--space-6);
	}
	.hud small {
		font-size: var(--fs-12);
		color: var(--ink-3);
	}
	.hud b {
		font-size: var(--fs-18);
		color: var(--ink);
	}
	.strikes {
		align-items: center !important;
	}
	.strike {
		width: 12px;
		height: 12px;
		border-radius: var(--radius);
		background: var(--ink);
		transition: opacity var(--dur-base) var(--ease-out);
	}
	.strike.used {
		opacity: 0.15;
	}
	.stop {
		margin-left: auto;
		min-height: 36px;
		padding: 0 var(--space-12);
		font-size: var(--fs-14);
	}
	.totals.stats {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-16) var(--space-32);
	}
	.misses {
		width: min(100%, var(--w-form));
		margin-top: var(--space-8);
		text-align: left;
	}
	.misses h3 {
		font-size: var(--fs-15);
		color: var(--ink);
	}
	.misses ul {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6) var(--space-16);
		margin: var(--space-8) 0 0;
		padding: 0;
		list-style: none;
		font-size: var(--fs-14);
		color: var(--ink-3);
	}
	.misses b {
		font-family: var(--font-mono);
		color: var(--ink);
	}
	@media (max-width: 560px) {
		.totals.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.mode {
		margin-left: auto;
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.loading {
		padding: var(--space-24) 0;
		font-size: var(--fs-20);
	}
	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-40) var(--space-24);
		text-align: center;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
	}
	.badge {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink);
	}
	.result.passed .badge {
		background: var(--accent);
		color: var(--on-accent);
	}
	.result h2 {
		font-size: var(--fs-32);
		text-wrap: balance;
	}
	.result p {
		max-width: 52ch;
		color: var(--ink-2);
		line-height: var(--lh-body);
		text-wrap: pretty;
	}
	.totals {
		display: flex;
		gap: var(--space-32);
		margin-top: var(--space-4);
	}
	.totals div {
		display: flex;
		flex-direction: column;
	}
	.totals dt {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.totals dd {
		font-size: var(--fs-32);
		font-weight: var(--fw-bold);
		font-variant-numeric: tabular-nums;
	}
	.best {
		font-weight: var(--fw-semibold);
		color: var(--ink) !important;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-10);
		margin-top: var(--space-4);
	}
	.row kbd {
		margin-left: var(--space-6);
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		background: var(--track);
		font-family: var(--font-mono);
		font-size: var(--fs-12);
	}
</style>
