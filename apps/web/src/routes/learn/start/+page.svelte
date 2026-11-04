<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CHAPTERS, FIRST_LESSON } from '#lib/courses/catalog.ts';
	import { pathInput } from '#lib/courses/learner.svelte.ts';
	import { chapterProgress, recommendedChapter } from '#lib/courses/progression.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import PlacementStart from '#lib/courses/PlacementStart.svelte';
	import { results } from '#lib/results/store.svelte.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';

	onMount(() => results.load());

	const placement = $derived(pathInput().placement);
	const recommended = $derived(placement ? recommendedChapter(placement.wpm, placement.accuracy) : null);

	async function startAt(lessonId: string) {
		await courses.setStart(lessonId);
		await goto(`/learn/${lessonId}`);
	}
</script>

<Seo title="Choose where to start" description="Start the sqwer course from the beginning, choose a chapter that suits you, or let a placement test decide." />

<Breadcrumbs items={[{ href: '/learn', label: 'Learning path' }, { href: '/learn/start', label: 'Choose where to start' }]} />

<div class="choose">
	<header>
		<h1>Choose where to start</h1>
		<p class="lede">
			Every chapter is open. Start at the beginning, pick the chapter that matches what you can already do, or let a
			one-minute test decide. You can change your starting point at any time.
		</p>
	</header>

	<section id="level" class="level" aria-labelledby="level-title">
		<div>
			<h2 id="level-title">Find my level</h2>
			{#if placement && recommended}
				<p>
					Your latest placement test: <b>{Math.round(placement.wpm)} WPM at {Math.round(placement.accuracy)}% accuracy</b>.
					The recommended start is <b>chapter {recommended}</b>.
				</p>
			{:else}
				<p>The placement test takes one minute. Your speed and accuracy decide the recommended chapter.</p>
			{/if}
		</div>
		{#if placement && recommended}
			<div class="apply">
				<PlacementStart chapter={recommended} />
				<a class="retake" href="/test?exam=placement">Take the placement test again</a>
			</div>
		{:else}
			<a class="btn btn-primary" href="/test?exam=placement">Take the placement test <Icon name="arrow" size={16} /></a>
		{/if}
	</section>

	<section aria-labelledby="chapters-title">
		<h2 id="chapters-title">Or choose a chapter yourself</h2>
		<ol class="list">
			{#each CHAPTERS as c (c.number)}
				{@const cp = chapterProgress(c.number, courses.progress)}
				<li class:recommended={c.number === recommended}>
					<span class="num" aria-hidden="true">{c.number}</span>
					<div class="text">
						<p class="title">{c.title} {#if c.number === recommended}<span class="tag">Recommended</span>{/if}</p>
						<p class="summary">{c.summary}</p>
						<p class="ready"><Icon name="check" size={14} /> Suits you if: {c.readyIf}</p>
					</div>
					<div class="side">
						{#if cp.done}<span class="count">{cp.done}/{cp.total} done</span>{/if}
						<button type="button" class="btn" onclick={() => startAt(c.lessons[0]!.id)} aria-label={`Start here: chapter ${c.number}, ${c.title}`}>
							Start here
						</button>
					</div>
				</li>
			{/each}
		</ol>
	</section>

	<p class="foot">
		New to typing? <button type="button" class="inline" onclick={() => startAt(FIRST_LESSON.id)}>Start from the very first lesson</button>.
	</p>
</div>

<style>
	.apply {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-10);
		max-width: 360px;
	}
	.retake {
		font-size: var(--fs-14);
	}
	.choose {
		display: flex;
		flex-direction: column;
		gap: var(--space-40);
		max-width: var(--w-wide);
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	.lede {
		margin-top: var(--space-12);
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	h2 {
		font-size: var(--fs-28);
		margin-bottom: var(--space-16);
	}
	.level {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-20);
		flex-wrap: wrap;
		padding: var(--space-24) var(--space-24);
		border-radius: var(--radius);
		border: 1px solid var(--ink);
		background: var(--surface);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.level h2 {
		margin-bottom: var(--space-6);
	}
	.level p {
		max-width: var(--w-narrow);
		color: var(--ink-2);
		line-height: var(--lh-body);
	}
	.level b {
		color: var(--ink);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	.list li {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-16) var(--space-20);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.list li.recommended {
		border-color: var(--ink);
	}
	.num {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		background: var(--bg);
		border: 1px solid var(--line-strong);
		font-family: var(--font-serif);
		font-size: var(--fs-24);
	}
	.recommended .num {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
	}
	.title {
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
	}
	.tag {
		margin-left: var(--space-6);
		padding: var(--space-2) var(--space-6);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
		vertical-align: middle;
	}
	.summary {
		font-size: var(--fs-15);
		color: var(--ink-2);
	}
	.ready {
		display: flex;
		align-items: flex-start;
		gap: var(--space-6);
		margin-top: var(--space-6);
		font-size: var(--fs-14);
		color: var(--ink);
	}
	.ready :global(svg) {
		flex-shrink: 0;
		margin-top: var(--space-2);
	}
	.side {
		display: flex;
		align-items: center;
		gap: var(--space-12);
	}
	.count {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.foot {
		color: var(--ink-2);
	}
	.inline {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		font-weight: var(--fw-semibold);
		color: var(--ink);
		cursor: pointer;
	}
	@media (max-width: 560px) {
		.list li {
			grid-template-columns: 44px minmax(0, 1fr);
		}
		.side {
			grid-column: 1 / -1;
		}
	}
</style>
