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
					<p><b>Lesson 1 · {FIRST_LESSON.title}</b><br />{FIRST_LESSON.steps.length} short steps, including a rhythm game.</p>
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
				<h2 id="path-title">Begin at chapter {chapter.number}: {chapter.title}.</h2>
				<p class="body">
					Your placement test: <b>{Math.round(placement.wpm)} WPM at {Math.round(placement.accuracy)}% accuracy</b>.
					{chapter.summary} This chapter suits typists who can say: “{chapter.readyIf}”
				</p>
				<div class="actions">
					<button type="button" class="btn btn-primary btn-lg" onclick={() => startAt(chapter.lessons[0]!.id)}>
						Start chapter {chapter.number} <Icon name="arrow" size={18} />
					</button>
					{#if chapter.number > 1}
						<button type="button" class="btn btn-lg" onclick={() => startAt(FIRST_LESSON.id)}>Start from the beginning</button>
					{/if}
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
		gap: 40px;
		max-width: 920px;
		margin: 0 auto;
		padding-top: clamp(8px, 3vh, 32px);
	}
	.intro {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.kicker {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		margin-top: 10px;
		font-size: clamp(36px, 5.2vw, 64px);
		line-height: 1.04;
		max-width: 20ch;
	}
	.lede {
		margin-top: 18px;
		max-width: 600px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.steps {
		display: flex;
		gap: 8px;
		margin-top: 28px;
	}
	.steps li {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px 6px 6px;
		border-radius: 3px;
		border: 1px solid var(--line);
		font-size: 14px;
		color: var(--ink-2);
	}
	.steps span {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 3px;
		background: var(--surface-2);
		font-weight: 700;
	}
	.steps li.on {
		border-color: var(--ink);
		color: var(--ink);
		font-weight: 600;
	}
	.steps li.on span,
	.steps li.done span {
		background: var(--accent);
		color: var(--on-accent);
	}
	h2 {
		font-size: clamp(26px, 3.2vw, 36px);
		line-height: 1.15;
		text-align: center;
	}
	.options {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
		margin-top: 24px;
	}
	.options li {
		display: flex;
	}
	.option {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font: inherit;
		color: inherit;
		text-align: left;
		cursor: pointer;
		animation: rise 600ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: calc(var(--i) * 90ms);
		transition:
			transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
			border-color 220ms ease,
			box-shadow 220ms ease;
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
		padding: 10px 12px 0;
		border-radius: 3px;
		background: var(--bg);
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.option-title {
		font-size: 18px;
		font-weight: 700;
	}
	.option-body {
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.option :global(.go) {
		position: absolute;
		right: 18px;
		bottom: 20px;
		color: var(--ink-3);
		transition: transform 200ms ease;
	}
	.option:hover :global(.go) {
		transform: translateX(4px);
		color: var(--ink);
	}
	.path {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: clamp(28px, 4vw, 44px);
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		text-align: center;
		animation: rise 500ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.answer {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px 6px 12px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
		font-size: 14px;
		font-weight: 600;
	}
	.change {
		padding: 4px 8px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}
	.body {
		max-width: 600px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.body b {
		color: var(--ink);
	}
	.preview {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 18px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
		text-align: left;
	}
	.cap {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 4px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 24px;
		font-weight: 600;
	}
	.preview p {
		margin-left: 8px;
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.preview b {
		color: var(--ink);
	}
	.actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 6px;
	}
	.note {
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.note a {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
	@media (max-width: 820px) {
		.options {
			grid-template-columns: 1fr;
		}
		.option {
			display: grid;
			grid-template-columns: 120px 1fr;
			align-items: center;
		}
		.art {
			padding: 6px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.option,
		.path {
			animation: none;
		}
	}
</style>
