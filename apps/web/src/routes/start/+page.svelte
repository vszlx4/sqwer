<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { FINGERS } from '@sqwer/layouts';
	import { CHAPTERS, FIRST_LESSON } from '#lib/courses/catalog.ts';
	import { pathInput } from '#lib/courses/learner.svelte.ts';
	import { recommendedChapter } from '#lib/courses/progression.ts';
	import { LEVEL_TEXT, LEVELS, type Level } from '#lib/courses/state.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import Hands from '#lib/hands/Hands.svelte';
	import PlacementStart from '#lib/courses/PlacementStart.svelte';
	import { results } from '#lib/results/store.svelte.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';

	let ready = $state(false);
	let editing = $state(false);
	onMount(() => {
		results.load();
		ready = true;
	});

	const signedIn = $derived(!!page.data.user);
	const input = $derived(pathInput());
	const level = $derived(ready ? courses.level : null);
	const showChoice = $derived(!level || editing);
	const placement = $derived(input.placement);
	const chapter = $derived(placement ? CHAPTERS.find((c) => c.number === recommendedChapter(placement.wpm, placement.accuracy))! : null);

	// Each answer is illustrated by hands with more of their fingers in use.
	const TONES: Record<Level, Record<string, number>> = {
		new: { li: 1, ri: 1 },
		some: { lm: 0.8, li: 1, lt: 0.6, rt: 0.6, ri: 1, rm: 0.8 },
		confident: Object.fromEntries(FINGERS.map((f) => [f, 1]))
	};

	async function choose(l: Level) {
		await courses.setLevel(l);
		editing = false;
		requestAnimationFrame(() => document.getElementById('your-path')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}

	async function startAt(lessonId: string) {
		await courses.setStart(lessonId);
		await goto(`/learn/${lessonId}`);
	}
</script>

<Seo title="Get started" description="Answer one question and sqwer recommends where your typing course should begin." />

<div class="start">
	<header class="intro">
		<p class="kicker">Getting started</p>
		<h1>Welcome. Let us find where you begin.</h1>
		<p class="lede">
			sqwer is a course: a long road of short lessons, from your first two keys to fluent typing. It takes a minute to find
			the right place to start, and you only do this once.
		</p>
		<ol class="steps" aria-label="Getting started steps">
			<li class:on={showChoice} class:done={!showChoice}><span>1</span> How you type today</li>
			<li class:on={!showChoice}><span>2</span> Where you begin</li>
		</ol>
	</header>

	{#if showChoice}
		<section class="choice" aria-labelledby="choice-title">
			<h2 id="choice-title">How would you describe your typing today?</h2>
			<ul class="options">
				{#each LEVELS as l, i (l)}
					<li>
					<button type="button" class="option" class:selected={level === l} aria-pressed={level === l} onclick={() => choose(l)} style:--i={i}>
						<span class="art"><Hands label="" tone={TONES[l]} /></span>
						<span class="text">
							<span class="option-title">{LEVEL_TEXT[l].title}</span>
							<span class="option-body">{LEVEL_TEXT[l].body}</span>
						</span>
						<Icon name="arrow" size={18} class="go" />
					</button>
					</li>
				{/each}
			</ul>
		</section>
	{:else if level}
		<section id="your-path" class="path" aria-labelledby="path-title">
			<p class="answer">
				<Icon name="check" size={16} /> {LEVEL_TEXT[level].title}
				<button type="button" class="change" onclick={() => (editing = true)}>Change</button>
			</p>

			{#if level === 'new'}
				<h2 id="path-title">You begin with two keys: F and J.</h2>
				<p class="body">
					The first lesson shows where your fingers rest and why F and J have small bumps. Each lesson then adds one or two
					keys, with games along the way. Lessons take about five minutes.
				</p>
				<div class="preview">
					<span class="cap">F</span><span class="cap">J</span>
					<p><b>Lesson 1 · {FIRST_LESSON.title}</b><br />{FIRST_LESSON.steps.length} short steps, with games along the way.</p>
				</div>
				<div class="actions">
					<button type="button" class="btn btn-primary btn-lg" onclick={() => startAt(FIRST_LESSON.id)}>
						Start lesson 1 <Icon name="arrow" size={18} />
					</button>
				</div>
				{#if !signedIn}
					<p class="note">The first lesson works without an account. <a href="/signup">Create a free account</a> to save your progress and continue the course.</p>
				{/if}
			{:else if !placement}
				<h2 id="path-title">One minute of typing shows your level.</h2>
				<p class="body">
					The placement test measures your speed and accuracy. sqwer then recommends the chapter where the course will
					stretch you without repeating what you already know.
				</p>
				<div class="actions">
					<a class="btn btn-primary btn-lg" href="/test?exam=placement">Take the placement test <Icon name="arrow" size={18} /></a>
				</div>
				<p class="note">Prefer to decide yourself? <a href="/learn/start">Choose a chapter</a> with a short description of who it suits.</p>
			{:else if chapter}
				<h2 id="path-title">Begin at chapter&nbsp;{chapter.number}: {chapter.title}.</h2>
				<p class="body">
					Your placement test: <b>{Math.round(placement.wpm)}&nbsp;WPM at {Math.round(placement.accuracy)}%&nbsp;accuracy</b>.
					{chapter.summary} It suits typists who can say: “{chapter.readyIf}”
				</p>
				<div class="actions">
					<PlacementStart chapter={chapter.number} large centred>
						{#if chapter.number > 1}
							<button type="button" class="btn btn-lg" onclick={() => startAt(FIRST_LESSON.id)}>Start from the beginning</button>
						{/if}
					</PlacementStart>
				</div>
				<p class="note">
					{#if level === 'some'}Your own fingering may hide slow habits. The <a href="/map">finger map</a> records them whenever you are ready.{:else}You can also <a href="/learn/start">choose a different chapter</a>.{/if}
				</p>
			{/if}
		</section>
	{/if}
</div>

<style>
	.start {
		display: flex;
		flex-direction: column;
		gap: var(--space-40);
		max-width: var(--w-wide);
		margin: 0 auto;
		padding-top: clamp(var(--space-8), 3vh, var(--space-32));
	}
	.intro {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.kicker {
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		margin-top: var(--space-10);
		font-size: var(--fs-hero);
		line-height: var(--lh-snug);
		max-width: 20ch;
	}
	.lede {
		margin-top: var(--space-20);
		max-width: var(--w-narrow);
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.steps {
		display: flex;
		gap: var(--space-8);
		margin-top: var(--space-32);
	}
	.steps li {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-16) var(--space-6) var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.steps span {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius);
		background: var(--surface-2);
		font-weight: var(--fw-bold);
	}
	.steps li.on {
		border-color: var(--ink);
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	.steps li.on span,
	.steps li.done span {
		background: var(--accent);
		color: var(--on-accent);
	}
	h2 {
		font-size: var(--fs-title);
		line-height: var(--lh-snug);
		text-align: center;
		text-wrap: balance;
	}
	.options {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-16);
		margin-top: var(--space-24);
	}
	.options li {
		display: flex;
	}
	.option {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		padding: var(--space-20);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		animation: rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: calc(var(--i) * 90ms);
		transition:
			transform var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out),
			box-shadow var(--dur-base) var(--ease-out);
	}
	.option:hover {
		transform: translateY(-3px);
		border-color: var(--ink);
		box-shadow: var(--lift);
	}
	.option.selected {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}
	.art {
		display: block;
		padding: var(--space-10) var(--space-12) 0;
		border-radius: var(--radius);
		background: var(--bg);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.option-title {
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
	}
	.option-body {
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.option :global(.go) {
		position: absolute;
		right: 18px;
		bottom: 20px;
		color: var(--ink-3);
		transition: transform var(--dur-base) var(--ease-out);
	}
	.option:hover :global(.go) {
		transform: translateX(4px);
		color: var(--ink);
	}
	.path {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-16);
		padding: clamp(var(--space-32), 4vw, var(--space-48));
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		text-align: center;
		animation: rise 500ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.answer {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-8) var(--space-6) var(--space-12);
		border-radius: var(--radius);
		background: var(--bg);
		border: 1px solid var(--line);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
	}
	.change {
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font: inherit;
		font-size: var(--fs-13);
		color: var(--ink);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease-out),
			background-color var(--dur-fast) var(--ease-out);
	}
	.change:hover {
		border-color: var(--ink);
		background: var(--bg);
	}
	.change:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.body {
		max-width: var(--w-narrow);
		text-wrap: pretty;
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.body b {
		color: var(--ink);
	}
	.preview {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		padding: var(--space-16) var(--space-20);
		border-radius: var(--radius);
		background: var(--bg);
		border: 1px solid var(--line);
		text-align: left;
	}
	.cap {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: var(--radius);
		border: 1px solid var(--key-edge);
		border-bottom-width: 4px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: var(--fs-24);
		font-weight: var(--fw-semibold);
	}
	.preview p {
		margin-left: var(--space-8);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.preview b {
		color: var(--ink);
	}
	.actions {
		display: flex;
		gap: var(--space-10);
		flex-wrap: wrap;
		justify-content: center;
		margin-top: var(--space-6);
	}
	.note {
		font-size: var(--fs-15);
		color: var(--ink-2);
	}
	.note a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
		text-decoration: none;
		transition: color var(--dur-fast) var(--ease-out);
	}
	.note a:hover {
		color: var(--rank);
	}
	@media (max-width: 760px) {
		.options {
			grid-template-columns: 1fr;
		}
		.option {
			display: grid;
			grid-template-columns: 120px 1fr;
			align-items: center;
		}
		.art {
			padding: var(--space-6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.option,
		.path {
			animation: none;
		}
	}
</style>
