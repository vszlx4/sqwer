<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { CHAPTERS, FIRST_LESSON } from '#lib/courses/catalog.ts';
	import { pathInput } from '#lib/courses/learner.svelte.ts';
	import { chapterProgress, recommendedChapter } from '#lib/courses/progression.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
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
			<button type="button" class="btn btn-primary" onclick={() => startAt(CHAPTERS[recommended - 1]!.lessons[0]!.id)}>
				Start chapter {recommended} <Icon name="arrow" size={16} />
			</button>
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
						<button type="button" class="btn" onclick={() => startAt(c.lessons[0]!.id)} aria-label={`Start chapter ${c.number}: ${c.title}`}>
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
	.choose {
		display: flex;
		flex-direction: column;
		gap: 36px;
		max-width: 920px;
	}
	h1 {
		font-size: clamp(34px, 4.6vw, 54px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 12px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	h2 {
		font-size: 26px;
		margin-bottom: 14px;
	}
	.level {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
		padding: 22px 24px;
		border-radius: 3px;
		border: 1px solid var(--ink);
		background: var(--surface);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.level h2 {
		margin-bottom: 6px;
	}
	.level p {
		max-width: 560px;
		color: var(--ink-2);
		line-height: 1.55;
	}
	.level b {
		color: var(--ink);
	}
	.list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.list li {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		border-radius: 3px;
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
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line-strong);
		font-family: var(--font-serif);
		font-size: 22px;
	}
	.recommended .num {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
	}
	.title {
		font-size: 17px;
		font-weight: 700;
	}
	.tag {
		margin-left: 6px;
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 11.5px;
		font-weight: 800;
		vertical-align: middle;
	}
	.summary {
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.ready {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-top: 6px;
		font-size: 13.5px;
		color: var(--ink);
	}
	.ready :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.side {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.count {
		font-size: 13px;
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
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
	}
	@media (max-width: 640px) {
		.list li {
			grid-template-columns: 44px minmax(0, 1fr);
		}
		.side {
			grid-column: 1 / -1;
		}
	}
</style>
