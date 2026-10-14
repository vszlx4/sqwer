<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { autofocus } from '#lib/ui/autofocus.ts';
	import Dialog from '#lib/ui/Dialog.svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import { chapterOf, lessonAfter } from './catalog.ts';
	import { drillTokens, seeded } from './generate.ts';
	import LessonComplete from './LessonComplete.svelte';
	import { lessonStars, rankFor } from './progression.ts';
	import FallingGame from './steps/FallingGame.svelte';
	import KeyIntro from './steps/KeyIntro.svelte';
	import ListenType from './steps/ListenType.svelte';
	import RhythmGame from './steps/RhythmGame.svelte';
	import TypingDrill from './steps/TypingDrill.svelte';
	import { courses } from './store.svelte.ts';
	import type { Lesson, StepKind, StepResult } from './types.ts';

	let { lesson }: { lesson: Lesson } = $props();

	const STEP_INFO: Record<StepKind, { icon: IconName; label: string }> = {
		intro: { icon: 'hand', label: 'Meet the keys' },
		drill: { icon: 'keyboard', label: 'Practice' },
		falling: { icon: 'layers', label: 'Falling game' },
		rhythm: { icon: 'volume', label: 'Rhythm game' },
		listen: { icon: 'volume', label: 'Listen and type' },
		checkpoint: { icon: 'flag', label: 'Checkpoint' }
	};

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

	const step = $derived(lesson.steps[index]!);
	const chapter = $derived(chapterOf(lesson));
	const next = $derived(lessonAfter(lesson));
	// New text for every attempt, so a retry is practice rather than memorisation of one passage.
	const tokens = $derived.by(() => {
		attempt;
		if (step.kind === 'drill' || step.kind === 'checkpoint') return drillTokens(step.source, seeded(Date.now() % 1_000_000));
		return [];
	});

	function done(r: StepResult) {
		outcome = r;
	}

	async function proceed() {
		if (!outcome) return;
		if (!outcome.passed) {
			outcome = null;
			attempt++;
			return;
		}
		results = [...results, outcome];
		outcome = null;
		if (index + 1 < lesson.steps.length) {
			index++;
			attempt++;
			return;
		}
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
		complete = { stars, accuracy, wpm, before, after: courses.rank, bestBefore, saved };
	}

	function restart() {
		index = 0;
		attempt++;
		results = [];
		outcome = null;
		complete = null;
	}

	function onkeydown(e: KeyboardEvent) {
		if (outcome && e.key === 'Enter' && !(e.target as HTMLElement | null)?.closest('button, a')) {
			e.preventDefault();
			void proceed();
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
				</button>
				<p class="enter">or press <kbd>Enter</kbd></p>
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
						<FallingGame items={step.items} pool={step.pool} focus={step.focus} words={step.words} seconds={step.seconds} target={step.target} oncomplete={done} />
					{:else if step.kind === 'rhythm'}
						<RhythmGame keys={step.keys} bpm={step.bpm} notes={step.notes} oncomplete={done} />
					{:else if step.kind === 'listen'}
						<ListenType pool={step.pool} focus={step.focus} words={step.words} count={step.count} target={step.target} oncomplete={done} />
					{/if}
				</section>
			{/key}
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
	.track li.current .dot,
	.track li.done .dot {
		background: var(--accent);
		color: var(--on-accent);
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
		width: 64px;
		height: 64px;
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
		font-size: 30px;
	}
	.outcome p {
		color: var(--ink-2);
		line-height: 1.55;
	}
	.advice {
		font-size: 14.5px;
	}
	.enter {
		font-size: 13px;
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
