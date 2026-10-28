<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { autofocus } from '#lib/ui/autofocus.ts';
	import { swap } from '#lib/ui/transition.ts';
	import Dialog from '#lib/ui/Dialog.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { chapterOf, fingerName, lessonAfter } from './catalog.ts';
	import { drillTokens, seeded } from './generate.ts';
	import LessonComplete from './LessonComplete.svelte';
	import { lessonStars, rankFor } from './progression.ts';
	import FallingGame from './steps/FallingGame.svelte';
	import KeyIntro from './steps/KeyIntro.svelte';
	import Echo from './steps/Echo.svelte';
	import KeyHunt from './steps/KeyHunt.svelte';
	import ListenType from './steps/ListenType.svelte';
	import Race from './steps/Race.svelte';
	import TypingDrill from './steps/TypingDrill.svelte';
	import { STEP_INFO } from './stepInfo.ts';
	import { results as examResults } from '#lib/results/store.svelte.ts';
	import { pace } from './pace.svelte.ts';
	import { weakKeys, type WeakKeys } from './weak.ts';
	import { courses } from './store.svelte.ts';
	import type { Lesson, StepResult, StepSpec } from './types.ts';

	let { lesson }: { lesson: Lesson } = $props();


	let index = $state(0);
	let attempt = $state(0);
	let results = $state<StepResult[]>([]);
	let outcome = $state<StepResult | null>(null);
	// Hints start on in the alphabet chapters; the learner can switch them off at any time.
	let hints = $state(untrack(() => lesson.chapter <= 3));
	let leaving = $state(false);
	let complete = $state<null | {
		stars: number;
		accuracy: number;
		wpm: number;
		before: ReturnType<typeof rankFor>;
		after: ReturnType<typeof rankFor>;
		bestBefore: number;
		saved: boolean;
	}>(null);

	/** Failed attempts at the current step; after two, help and a skip are offered. */
	let fails = $state(0);

	/* `weak` steps: weakest fingers from recent exams, picked once per lesson; little and ring by default. */
	function weakPoolOf(s: StepSpec): string | null {
		if (!('weak' in s) || !s.weak) return null;
		if (s.kind === 'drill') return 'pool' in s.source ? s.source.pool : null;
		return 'pool' in s ? s.pool : null;
	}
	const weakPool = untrack(() => lesson.steps.map(weakPoolOf).find((p) => !!p) ?? null);
	let weak = $state<WeakKeys | null>(null);
	onMount(() => {
		if (!weakPool) return;
		weak = weakKeys(weakPool, examResults.list);
		void examResults.load().then(() => {
			// Results may arrive after the first step has started; only refine before any typing.
			if (index === 0 && !outcome) weak = weakKeys(weakPool, examResults.list);
		});
	});

	const raw = $derived(lesson.steps[index]!);
	/** The current step with weak-finger keys filled in and the drill goal adapted to the pace. */
	const step = $derived.by(() => {
		const s = raw;
		const focus = weak?.keys ?? '';
		const letters = [...focus].filter((c) => /[a-z]/.test(c)).join('');
		const easier = Math.round(Math.max(0, 1 - pace.value) * 10);
		if (s.kind === 'drill') {
			const source = s.weak && weak ? (s.source.type === 'patterns' ? { ...s.source, focus } : s.source.type === 'words' ? { ...s.source, focus: letters } : s.source) : s.source;
			return { ...s, source, minAccuracy: Math.max(75, s.minAccuracy - easier) };
		}
		if ((s.kind === 'keyhunt' || s.kind === 'falling') && s.weak && weak) return { ...s, focus };
		if (s.kind === 'echo' && s.weak && weak) return { ...s, pool: focus.length >= 3 ? focus : s.pool };
		return s;
	});
	/** Share of the lesson done: completed steps, counting a step as soon as it is passed. */
	const progress = $derived(complete ? 1 : (index + (outcome?.passed ? 1 : 0)) / lesson.steps.length);
	const chapter = $derived(chapterOf(lesson));
	const next = $derived(lessonAfter(lesson));
	// New text for every attempt, so a retry is practice rather than memorisation of one passage.
	const tokens = $derived.by(() => {
		attempt;
		if (step.kind === 'drill' || step.kind === 'checkpoint') return drillTokens(step.source, seeded(Date.now() % 1_000_000));
		return [];
	});

	function done(r: StepResult) {
		pace.record(r);
		if (!r.passed) fails++;
		swap(() => (outcome = r));
	}

	async function proceed() {
		if (!outcome) return;
		const current = outcome;
		if (!current.passed) {
			swap(() => {
				outcome = null;
				attempt++;
			});
			return;
		}
		if (index + 1 < lesson.steps.length) {
			swap(() => {
				results = [...results, current];
				outcome = null;
				index++;
				attempt++;
				fails = 0;
			});
			return;
		}
		results = [...results, current];
		await finish();
	}

	async function finish() {
		const stars = lessonStars(results);
		const graded = results.filter((r) => r.graded !== false);
		const accuracy = graded.length ? graded.reduce((s, r) => s + r.accuracy, 0) / graded.length : 100;
		const wpm = Math.max(0, ...results.map((r) => r.wpm ?? 0));
		const before = courses.rank;
		const bestBefore = courses.progress[lesson.id]?.stars ?? 0;
		const saved = await courses.record(lesson.id, stars, accuracy, wpm);
		swap(() => {
			outcome = null;
			complete = { stars, accuracy, wpm, before, after: courses.rank, bestBefore, saved };
		});
	}

	/**
	 * Games can be skipped after one failure, other steps (except chapter checks) after two. Skipped steps earn
	 * no stars.
	 */
	const isGame = $derived(['falling', 'keyhunt', 'race', 'echo'].includes(step.kind));
	const canSkip = $derived(step.kind !== 'checkpoint' && (isGame ? fails >= 1 : fails >= 2));
	function skipStep() {
		outcome = { passed: true, graded: false, accuracy: 0, summary: isGame ? 'Game skipped.' : 'Step skipped.' };
		void proceed();
	}
	/** Lowers the pace and tries again, with hints on for typing steps. */
	function easier() {
		pace.ease();
		hints = true;
		void proceed();
	}

	function restart() {
		index = 0;
		attempt++;
		results = [];
		outcome = null;
		complete = null;
	}

	let restarted = $state(0);

	/** Restarts the current exercise; earlier steps are kept. */
	function restartStep() {
		attempt++;
		restarted++;
	}

	function onkeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (outcome && e.key === 'Enter' && !target?.closest('button, a')) {
			e.preventDefault();
			void proceed();
			return;
		}
		// Tab restarts the running exercise; elsewhere Tab and Shift+Tab move focus.
		if (e.key === 'Tab' && !e.shiftKey && !outcome && !complete && !leaving) {
			const inExercise = !target || target === document.body || target === document.documentElement || !!target.closest('[data-tab-restart]');
			if (inExercise) {
				e.preventDefault();
				restartStep();
			}
		}
	}

	const inProgress = $derived(!complete && (index > 0 || outcome !== null));
	function leave() {
		if (inProgress) leaving = true;
		else void goto('/learn');
	}
</script>

<svelte:window {onkeydown} />

<div class="player">
	<header class="head">
		<button type="button" class="leave" onclick={leave}><Icon name="close" size={16} /> Leave lesson</button>
		<div class="title">
			<p class="where">Chapter {chapter.number} · Lesson {lesson.order}</p>
			<h1>{lesson.title}</h1>
		</div>
		<ol class="track" aria-label="Lesson steps">
			{#each lesson.steps as s, i (i)}
				{@const info = STEP_INFO[s.kind]}
				<li class:done={i < index || !!complete} class:current={i === index && !complete} aria-current={i === index && !complete ? 'step' : undefined}>
					<span class="dot"><Icon name={i < index || complete ? 'check' : info.icon} size={14} /></span>
					<span class="label">{info.label}</span>
				</li>
			{/each}
		</ol>
		<div class="lesson-progress">
			<div class="lesson-bar" role="progressbar" aria-label="Lesson progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
				<span style:transform={`scaleX(${progress})`}></span>
			</div>
			<span class="lesson-count">{complete ? 'Complete' : `Step ${index + 1} of ${lesson.steps.length}`}</span>
			<span class="pace" title="The pace adapts to how each step goes">Pace: {pace.label}</span>
		</div>
		{#if weak && !complete}
			<p class="weak-note">
				<Icon name="hand" size={16} />
				<span>
					Practicing your {weak.fingers.map(fingerName).join(' and ')}
					{weak.basis === 'data' ? ', chosen from your results.' : '. These are the weakest for most typists; take a few examinations and this lesson will choose yours.'}
				</span>
			</p>
		{/if}
	</header>

	<div class="body">
		{#if complete}
			<LessonComplete {lesson} {next} result={complete} onrepeat={restart} />
		{:else if outcome}
			<section class="outcome" class:passed={outcome.passed} aria-live="polite">
				<span class="badge" aria-hidden="true"><Icon name={outcome.passed ? 'check' : 'restart'} size={30} /></span>
				<h2>{outcome.passed ? (index + 1 < lesson.steps.length ? 'Step complete' : 'Last step complete') : 'Not quite yet'}</h2>
				<p>{outcome.summary}</p>
				{#if !outcome.passed}
					<p class="advice">
						{#if step.kind === 'drill' || step.kind === 'checkpoint'}Slow down a little: accuracy matters more than speed while the movements are new.{:else}Each attempt is different. Keep your fingers resting on the home row between keys.{/if}
					</p>
				{/if}
				<button type="button" class="btn btn-primary btn-lg" onclick={proceed} use:autofocus>
					{outcome.passed ? (index + 1 < lesson.steps.length ? 'Continue' : 'See your result') : 'Try again'}
					<Icon name={outcome.passed ? 'arrow' : 'restart'} size={18} />
					<kbd aria-hidden="true">Enter</kbd>
				</button>
				{#if !outcome.passed && fails >= 2}
					<div class="help" role="group" aria-label="Help with this step">
						<p><b>Need a hand?</b> This step has been hard twice. You can slow the pace down, or move on and come back to it later.</p>
						<div class="help-actions">
							<button type="button" class="btn" onclick={easier}><Icon name="gauge" size={16} /> Make it easier</button>
							{#if canSkip}<button type="button" class="btn" onclick={skipStep}>Skip this step</button>{/if}
						</div>
						{#if step.kind === 'checkpoint'}<p class="help-note">The chapter check cannot be skipped. The weak fingers lesson just before it is good preparation.</p>{/if}
					</div>
				{:else if !outcome.passed && canSkip}
					<button type="button" class="skip-game" onclick={skipStep}>Continue without this game</button>
				{/if}
			</section>
		{:else}
			{#key attempt}
				<section class="step" aria-label={STEP_INFO[step.kind].label}>
					{#if step.kind === 'intro'}
						<KeyIntro keys={step.keys} tip={step.tip} oncomplete={done} />
					{:else if step.kind === 'drill'}
						<h2 class="step-title">{step.title}</h2>
						<TypingDrill {tokens} minAccuracy={step.minAccuracy} bind:hints oncomplete={done} />
					{:else if step.kind === 'checkpoint'}
						<h2 class="step-title">Checkpoint</h2>
						<TypingDrill {tokens} seconds={step.seconds} minAccuracy={step.minAccuracy} minWpm={step.minWpm} bind:hints oncomplete={done} />
					{:else if step.kind === 'falling'}
						<FallingGame items={step.items} pool={step.pool} focus={step.focus} words={step.words} target={step.target} pace={pace.value} oncomplete={done} />
					{:else if step.kind === 'keyhunt'}
						<KeyHunt pool={step.pool} focus={step.focus} target={step.target} pace={pace.value} oncomplete={done} />
					{:else if step.kind === 'race'}
						<Race pool={step.pool} focus={step.focus} words={step.words} sentences={step.sentences} count={step.count} pacerWpm={Math.max(6, Math.round(step.pacerWpm * pace.value))} oncomplete={done} />
					{:else if step.kind === 'echo'}
						<Echo pool={step.pool} start={step.start} target={pace.value < 0.85 ? Math.max(step.start, step.target - 1) : step.target} oncomplete={done} />
					{:else if step.kind === 'listen'}
						<ListenType pool={step.pool} focus={step.focus} words={step.words} count={step.count} target={step.target} oncomplete={done} />
					{/if}
				</section>
			{/key}
			<p class="restart-hint">
				<kbd>Tab</kbd> Restart this exercise
				<span class="sr-only" aria-live="polite">{restarted ? `Exercise restarted (${restarted})` : ''}</span>
			</p>
		{/if}
	</div>
</div>

<Dialog open={leaving} title="Leave this lesson?" alert onclose={() => (leaving = false)}>
	<p>Your progress in this attempt will not be saved. You can start the lesson again at any time.</p>
	{#snippet actions()}
		<button type="button" class="btn" data-autofocus onclick={() => (leaving = false)}>Keep going</button>
		<a class="btn btn-danger" href="/learn">Leave lesson</a>
	{/snippet}
</Dialog>

<style>
	.player {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.head {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 12px 24px;
	}
	.leave {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
		cursor: pointer;
	}
	.leave:hover {
		color: var(--ink);
		border-color: var(--ink-3);
	}
	.where {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(28px, 3.4vw, 40px);
		line-height: 1.1;
	}
	.track {
		grid-column: 1 / -1;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.track li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px 6px 6px;
		border-radius: 3px;
		border: 1px solid var(--line);
		font-size: 13px;
		color: var(--ink-2);
		transition:
			border-color 200ms ease,
			background-color 200ms ease;
	}
	.dot {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 3px;
		background: var(--surface-2);
	}
	.track li.current {
		border-color: var(--ink);
		color: var(--ink);
		font-weight: 600;
	}
	.track li.current .dot {
		background: var(--accent);
		color: var(--on-accent);
	}
	.track li.done .dot {
		background: var(--green);
		color: var(--bg);
	}
	.lesson-progress {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.lesson-bar {
		flex: 1;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.lesson-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--green), var(--accent));
		transform-origin: left;
		transition: transform 600ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.pace {
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--blue-soft);
		color: var(--blue);
		font-size: 12.5px;
		font-weight: 700;
		white-space: nowrap;
	}
	.weak-note {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 3px;
		background: var(--orange-soft);
		color: var(--ink);
		font-size: 14px;
	}
	.weak-note :global(svg) {
		flex-shrink: 0;
		color: var(--orange);
	}
	.help {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 520px;
		margin-top: 8px;
		padding: 14px 16px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--blue-soft);
		color: var(--ink);
		text-align: left;
		font-size: 14.5px;
	}
	.help-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.help-note {
		font-size: 13px;
		color: var(--ink-2);
	}
	.lesson-count {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.body {
		min-height: 420px;
	}
	.step {
		display: flex;
		flex-direction: column;
		gap: 16px;
		animation: step-in 360ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	@keyframes step-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
	}
	.restart-hint {
		margin-top: 22px;
		text-align: center;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.step-title {
		font-size: 26px;
	}
	.outcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		max-width: 560px;
		margin: 24px auto;
		padding: 36px 28px;
		text-align: center;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		animation: step-in 300ms ease;
	}
	.outcome .badge {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 3px;
		background: var(--surface-2);
		color: var(--ink);
	}
	.outcome.passed .badge {
		background: var(--accent);
		color: var(--on-accent);
		animation: pop 420ms cubic-bezier(0.3, 1.6, 0.5, 1);
	}
	@keyframes pop {
		from {
			transform: scale(0.5);
		}
	}
	.outcome h2 {
		font-size: 32px;
		text-wrap: balance;
	}
	.outcome p {
		max-width: 52ch;
		color: var(--ink-2);
		line-height: 1.55;
		text-wrap: pretty;
	}
	.outcome .btn {
		margin-top: 4px;
	}
	.outcome kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.12);
		font-family: var(--font-mono);
		font-size: 12px;
	}
	@media (prefers-reduced-motion: reduce) {
		.outcome.passed .badge {
			animation: none;
		}
	}
	.advice {
		font-size: 14.5px;
	}
	.skip-game {
		padding: 6px 10px;
		border: 0;
		border-radius: 3px;
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}
	.skip-game:hover {
		color: var(--ink-2);
	}
	kbd {
		padding: 1px 6px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		font-family: var(--font-mono);
		font-size: 12px;
	}
	@media (max-width: 640px) {
		.track .label {
			display: none;
		}
		.track li {
			padding: 4px;
		}
	}
</style>
