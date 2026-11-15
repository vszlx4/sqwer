<script lang="ts">
	import { onMount } from 'svelte';
	import { stopSmoothScroll } from '#lib/motion/smooth-scroll.ts';
	import Echo from '#lib/courses/steps/Echo.svelte';
	import FallingGame from '#lib/courses/steps/FallingGame.svelte';
	import KeyHunt from '#lib/courses/steps/KeyHunt.svelte';
	import ListenType from '#lib/courses/steps/ListenType.svelte';
	import ListenVoice from '#lib/voice/ListenVoice.svelte';
	import SoundSettings from '#lib/voice/SoundSettings.svelte';
	import Race from '#lib/courses/steps/Race.svelte';
	import type { StepResult } from '#lib/courses/types.ts';
	import { sound } from '#lib/voice/audio.svelte.ts';
	import { summarize, type Answer } from './listen/run.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import { isWordListId, WORD_LISTS } from '@sqwer/content';
	import {
		DIFFICULTIES,
		LETTERS,
		STRIKES,
		loadRecords,
		roundSettings,
		saveRecord,
		startDifficulty,
		wordsForLevel,
		type DifficultyId,
		type GameInfo,
		type WordSource
	} from './endless.ts';
	import { nextDifficulty, ratingOf, roundPerformance, step, tierById } from './levels.ts';
	import LevelBadge from './LevelBadge.svelte';
	import LevelIcon from './LevelIcon.svelte';
	import RunBar from './RunBar.svelte';
	import RunResult from './RunResult.svelte';
	import StatIcon from './StatIcon.svelte';

	/** Endless mode: pick difficulty, play rounds. A round scores its difficulty step; three failures end the run. */
	/** `running` is true from the start of a run until the menu shows again; the page drops its title meanwhile. */
	let { game, running = $bindable(false) }: { game: GameInfo; running?: boolean } = $props();

	let phase = $state<'setup' | 'loading' | 'playing' | 'between' | 'over'>('setup');
	/** Listen and type: the run's missed words, practiced unscored after Stop. */
	let practicing = $state<string[] | null>(null);
	let difficulty = $state<DifficultyId>('adaptive');
	let source = $state<WordSource>('levels');
	let loadError = $state(false);
	/** Where adaptive difficulty starts the next run (levels.ts); saved as its rating. */
	let adaptiveLevel = $state(startDifficulty(undefined));
	let best = $state(0);
	/** The difficulty in play: a fixed level's, or the adaptive one as it moves. */
	let level = $state(startDifficulty(undefined));
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
			adaptiveLevel = startDifficulty(saved);
			best = saved.best;
		}
	});

	// Every screen change starts at the top: the menu's scroll position never carries into a run or its results.
	let shown = '';
	$effect(() => {
		const screen = `${phase}:${practicing ? 'practice' : ''}`;
		running = phase !== 'setup';
		if (shown && screen !== shown) {
			stopSmoothScroll();
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
		shown = screen;
	});

	const choice = $derived(DIFFICULTIES.find((d) => d.id === difficulty)!);
	const startLevel = $derived(choice.level ?? adaptiveLevel);
	const settings = $derived(roundSettings(game.id, level));
	/** The word set in play, named as in the menu. */
	const setName = $derived(source === 'levels' ? 'Graded words' : (WORD_LISTS.find((l) => l.id === source)?.name ?? ''));
	const hasSettings = $derived(game.id === 'listen' || game.id === 'race' || game.id === 'falling-words' || game.id === 'echo');
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

	/** Word pools per difficulty step, loaded once a run. */
	const pools = new Map<number, Promise<string[]>>();
	function poolFor(at: number): Promise<string[]> {
		const key = step(at);
		let p = pools.get(key);
		if (!p) {
			p = wordsForLevel(key, source);
			p.catch(() => pools.delete(key));
			pools.set(key, p);
		}
		return p;
	}
	const save = () => saveRecord(game.id, { best, rating: ratingOf(adaptiveLevel), difficulty, source });

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
		const next = choice.level === null ? nextDifficulty(level, roundPerformance(r.passed, r.accuracy)) : level;
		if (r.passed) {
			cleared++;
			score += step(level);
			topLevel = Math.max(topLevel, level);
		} else strikes++;
		last = { passed: r.passed, summary: r.summary, level, next };
		if (choice.level === null) adaptiveLevel = next;
		const ended = strikes >= STRIKES;
		if (ended && score > best) {
			best = score;
			newBest = true;
		}
		save();
		phase = ended ? 'over' : 'between';
		requestAnimationFrame(() => nextButton?.focus());
	}

	function answered(all: Answer[], at: number) {
		stats = summarize(all);
		level = at;
		if (choice.level === null) adaptiveLevel = at;
		save();
	}

	/** Ends a continuous run and shows its statistics. */
	function stop() {
		seconds = Math.round((Date.now() - startedAt) / 1000);
		score = stats.score;
		if (score > best) {
			best = score;
			newBest = true;
		}
		save();
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
		save();
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
		<!-- Three panels for every game: how it works, the level, and the game's own settings. -->
		<div class="setup" class:bare={!hasSettings}>
			<section class="panel pick" aria-labelledby="level-title">
				<h2 id="level-title">Level</h2>
				<fieldset>
					<legend class="sr-only">Choose the level</legend>
					<label class="adaptive" class:on={difficulty === 'adaptive'}>
						<input type="radio" name="difficulty" value="adaptive" bind:group={difficulty} />
						<StatIcon name="adaptive" size={22} />
						<span class="adaptive-text">
							<span class="adaptive-title">Adaptive <span class="tag">Recommended</span></span>
							<span class="adaptive-note">Next start <LevelBadge difficulty={adaptiveLevel} size={14} /></span>
						</span>
					</label>
					<div class="levels">
						{#each DIFFICULTIES.filter((d) => d.level !== null) as d (d.id)}
							<label class="level" class:on={difficulty === d.id} style:--level={`var(--level-${d.id})`}>
								<input type="radio" name="difficulty" value={d.id} bind:group={difficulty} />
								<LevelIcon id={d.id} size={18} />
								<span class="level-name">{d.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>
				<p class="chosen" aria-live="polite">{choice.note}</p>
				{#if loadError}<p class="source-note" role="alert">The words could not be loaded. Check your connection and start again.</p>{/if}
				<button type="button" class="btn btn-primary btn-lg start" onclick={begin}>
					Start at {tierById(difficulty)?.name ?? 'Adaptive'} <Icon name="arrow" size={18} />
				</button>
			</section>

			{#if hasSettings}
			<section class="panel tune" aria-labelledby="tune-title">
				<h2 id="tune-title">Settings</h2>
				{#if usesWords}
					<label class="source">
						<span class="source-label"><StatIcon name="set" size={14} /> Words</span>
						<select bind:value={source}>
							<option value="levels">Graded words (recommended)</option>
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
			</section>
			{/if}

			<aside class="panel guide" aria-labelledby="rules-title">
				<h2 id="rules-title">How it works</h2>
				{#if continuous}
					<ol>
						<li><b>Word after word</b> until you press Stop. No rounds, no tries.</li>
						<li><b>Adaptive climbs</b> when you get words right on the first play, eases when you miss, and has no top.</li>
						<li><b>Harder words score more.</b> Stop any time for your statistics.</li>
					</ol>
				{:else}
					<ol>
						<li><b>Round after round</b>, from Easy to Nightmare and past it.</li>
						<li><b>{STRIKES} tries.</b> A missed round uses one; the run ends when they are gone.</li>
						<li><b>Harder rounds score more.</b></li>
					</ol>
				{/if}
				<p class="record">
					<StatIcon name="score" size={14} />
					{#if best}Best run <b>{best}&nbsp;points</b>{:else}No run yet{/if}
				</p>
			</aside>
		</div>
	{:else if continuous}
		{#if phase === 'playing'}
			<div class="hud">
				<RunBar
					difficulty={level}
					adaptive={choice.level === null}
					set={setName}
					stats={[
						{ icon: 'words', label: 'Words', value: stats.words },
						{ icon: 'right', label: 'Right', value: `${stats.accuracy}%` },
						{ icon: 'streak', label: 'Streak', value: stats.streak },
						{ icon: 'score', label: 'Score', value: stats.score }
					]}
				>
					{#snippet actions()}<button type="button" class="btn stop" onclick={stop}><Icon name="flag" size={16} /> Stop</button>{/snippet}
				</RunBar>
			</div>
			<!-- Listen and type fills the rest of the screen, its stage centred in it. -->
			<div class="arena">
				{#key round}
					<ListenType pool={LETTERS} focus="" set={source === 'levels' ? 'course' : source} feed={{ level, adaptive: choice.level === null, words: poolFor, onanswer: answered }} />
				{/key}
			</div>
		{:else if practicing}
			<!-- The run's missed words, once more and unscored; then back to the run's results. -->
			<ListenType pool={LETTERS} focus="" words={practicing} count={practicing.length} target={0} practice set={source === 'levels' ? 'course' : source} oncomplete={() => (practicing = null)} />
		{:else}
			<RunResult
				summary={stats.words ? `${stats.words} ${stats.words === 1 ? 'word' : 'words'} in ${duration(seconds)}.` : 'You stopped before the first word.'}
				score={stats.score}
				{best}
				{newBest}
				top={stats.words ? stats.topLevel : 0}
				stats={[
					{ icon: 'right', label: 'Right', value: `${stats.accuracy}%` },
					{ icon: 'streak', label: 'Best streak', value: stats.bestStreak },
					{ icon: 'plays', label: 'Plays per word', value: stats.plays || '–' },
					{ icon: 'time', label: 'Time', value: duration(seconds) }
				]}
				split={[
					{ label: 'Exact', count: stats.exact, color: '--success' },
					{ label: 'Accepted', count: stats.accepted, color: '--info' },
					{ label: 'Close', count: stats.close, color: '--reward' },
					{ label: 'Missed', count: stats.missed, color: '--error' }
				]}
				misses={stats.misses}
			>
				{#snippet actions()}
					<button bind:this={nextButton} type="button" class="btn btn-primary btn-lg" onclick={begin}><Icon name="repeat" size={18} /> Play again</button>
					{#if stats.misses.length}
						<button type="button" class="btn btn-lg" onclick={() => (practicing = [...new Set(stats.misses.map((m) => m.word))])}>Practice these words</button>
					{/if}
					<button type="button" class="btn btn-lg" onclick={() => (phase = 'setup')}>Change difficulty</button>
				{/snippet}
			</RunResult>
		{/if}
	{:else}
		<div class="hud">
			<RunBar
				difficulty={level}
				adaptive={choice.level === null}
				set={usesWords ? setName : undefined}
				stats={[
					{ icon: 'round', label: 'Round', value: round },
					{ icon: 'score', label: 'Score', value: score }
				]}
			>
				{#snippet extra()}
					<li class="tries" data-tip="Tries left">
						{#each Array.from({ length: STRIKES }) as _, i (i)}<span class="try" class:used={i >= STRIKES - strikes}><StatIcon name="tries" size={16} /></span>{/each}
						<span class="sr-only">{STRIKES - strikes} of {STRIKES} tries left</span>
					</li>
				{/snippet}
			</RunBar>
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
		{:else if last && phase === 'over'}
			<RunResult
				summary={last.summary}
				{score}
				{best}
				{newBest}
				top={topLevel}
				stats={[
					{ icon: 'round', label: 'Rounds cleared', value: cleared },
					{ icon: 'tries', label: 'Rounds played', value: round }
				]}
			>
				{#snippet actions()}
					<button bind:this={nextButton} type="button" class="btn btn-primary btn-lg" onclick={begin}><Icon name="repeat" size={18} /> Play again</button>
					<button type="button" class="btn btn-lg" onclick={() => (phase = 'setup')}>Change difficulty</button>
				{/snippet}
			</RunResult>
		{:else if last}
			<section class="result" class:passed={last.passed} aria-labelledby="round-title">
				<span class="badge" aria-hidden="true"><Icon name={phase === 'over' ? 'flag' : last.passed ? 'check' : 'restart'} size={26} /></span>
				<h2 id="round-title">
					{phase === 'over' ? 'Run complete' : last.passed ? `Round ${round} cleared` : `Round ${round} missed`}
				</h2>
				<p>{last.summary}</p>
				{#if phase !== 'over'}
					<p class="next">
						Next round: <LevelBadge difficulty={last.next} />{choice.level === null && last.next > last.level ? ', a little harder' : choice.level === null && last.next < last.level ? ', a little easier' : ''}.
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
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr) minmax(0, 0.85fr);
		gap: var(--space-16);
		align-items: stretch;
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		min-width: 0;
		padding: var(--space-20);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	h2 {
		font-size: var(--fs-18);
	}
	.guide {
		background: transparent;
	}
	.guide ol {
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: rule;
	}
	.guide li {
		position: relative;
		padding-left: var(--space-32);
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
		counter-increment: rule;
	}
	.guide li::before {
		content: counter(rule);
		position: absolute;
		left: 0;
		top: var(--space-2);
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink);
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
	}
	.guide b {
		color: var(--ink);
	}
	.record {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin-top: auto;
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.record b {
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	fieldset {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
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
		display: flex;
		align-items: center;
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
		gap: var(--space-12);
		padding: var(--space-10) var(--space-12);
	}
	.adaptive-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.adaptive-title {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		font-weight: var(--fw-bold);
	}
	.tag {
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-11);
		font-weight: var(--fw-bold);
	}
	.adaptive-note {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); /* off-scale: fits "Nightmare" with its icon */
		gap: var(--space-6);
	}
	.level {
		gap: var(--space-8);
		padding: var(--space-8) var(--space-10);
	}
	.level-name {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
	}
	.adaptive.on,
	.level.on {
		border-color: var(--ink);
		background: var(--surface-2);
	}
	.level.on {
		border-color: var(--level);
		background: color-mix(in srgb, var(--level) 12%, var(--bg));
	}
	.source {
		display: grid;
		gap: var(--space-6);
		font-size: var(--fs-14);
	}
	.source-label {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}
	.source select {
		padding: var(--space-8) var(--space-10);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
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
		min-height: 3em;
		font-size: var(--fs-13);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.start {
		margin-top: auto;
		justify-content: center;
	}
	.setup.bare {
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
	}
	@media (max-width: 1100px) {
		.setup {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.setup:not(.bare) .guide {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 760px) {
		.setup {
			grid-template-columns: 1fr;
		}
	}
	.arena {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.arena > :global(.game) {
		flex: 1;
	}
	.arena :global(.game > .stage) {
		flex: 1;
	}
	.arena :global(.game > .stage > .layer) {
		align-self: center;
	}
	.tries {
		gap: var(--space-2) !important;
	}
	.try {
		display: inline-flex;
		color: var(--life);
		transition: opacity var(--dur-base) var(--ease-out);
	}
	.try.used {
		color: var(--ink-3);
		opacity: 0.35;
	}
	.stop {
		min-height: 36px;
		padding: 0 var(--space-12);
		font-size: var(--fs-14);
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
