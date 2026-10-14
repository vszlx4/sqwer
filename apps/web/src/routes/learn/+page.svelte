<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { CHAPTERS, FIRST_LESSON, LESSONS, keyList } from '#lib/courses/catalog.ts';
	import { learnerNextStep, learnerOnboarded } from '#lib/courses/learner.svelte.ts';
	import { chapterProgress, RANKS } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import RankPanel from '#lib/courses/RankPanel.svelte';
	import Stars from '#lib/courses/Stars.svelte';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { reveal } from '#lib/ui/reveal.ts';

	let ready = $state(false);
	onMount(() => {
		results.load();
		ready = true;
	});

	const signedIn = $derived(!!page.data.user);
	const loaded = $derived(ready && courses.loaded);
	const next = $derived(loaded ? learnerNextStep() : null);
	const onboarded = $derived(loaded && learnerOnboarded());
	const nextId = $derived(next?.lesson?.id ?? null);
	const nextChapter = $derived(next?.lesson?.chapter ?? 1);
	// Chapters the learner has open. The recommended chapter opens once progress is known.
	let opened = $state<boolean[]>(CHAPTERS.map((c) => c.number === 1));
	$effect(() => {
		const chapter = nextChapter;
		if (loaded) untrack(() => (opened[chapter - 1] = true));
	});
	const stepCount = (n: number) => `${n} ${n === 1 ? 'step' : 'steps'}`;
</script>

<Seo
	title="Courses"
	description={`The sqwer typing course: ${LESSONS.length} lessons in ${CHAPTERS.length} chapters, from your first two keys to fluent typing, with games and ranks.`}
/>

<div class="learn">
	<header class="hero">
		<div class="hero-copy">
			<p class="kicker">The sqwer course</p>
			<h1>From your first two keys to fluent typing.</h1>
			<p class="lede">
				{LESSONS.length} short lessons in {CHAPTERS.length} chapters. Each lesson adds a little, with drills, falling letters,
				rhythm keys and listening games, so that each chapter prepares you for the next.
			</p>
		</div>
		{#if loaded && signedIn}
			<RankPanel />
		{/if}
	</header>

	{#if loaded}
		<!-- The ways to start below cover a new visitor; this card appears once there is a concrete next step. -->
		{#if next && next.stage !== 'welcome' && (signedIn || next.stage !== 'course' || next.lesson?.id === FIRST_LESSON.id)}
			<section class="next" aria-labelledby="next-title">
				<div class="next-copy">
					<p class="label">{next.stage === 'course' ? 'Up next' : next.stage === 'complete' ? 'Complete' : 'Before the course'}</p>
					<h2 id="next-title">{next.title}</h2>
					<p>{next.text}</p>
					{#if next.lesson}
						<p class="meta">
							Chapter {next.lesson.chapter} · {stepCount(next.lesson.steps.length)}
							{#if next.lesson.newKeys.length}· New: {keyList(next.lesson.newKeys)}{/if}
						</p>
					{/if}
				</div>
				<a class="btn btn-primary btn-lg" href={next.href}>{next.action} <Icon name="arrow" size={18} /></a>
			</section>
		{/if}

		{#if !signedIn}
			<section class="guest" aria-labelledby="guest-title">
				<div>
					<h2 id="guest-title">The course is free with an account.</h2>
					<p>
						An account saves every lesson, your stars, rank and daily streak, on any device. You can try the first lesson
						without one.
					</p>
				</div>
				<div class="guest-actions">
					<a class="btn btn-primary" href="/signup">Create a free account</a>
					<a class="btn" href={`/learn/${FIRST_LESSON.id}`}>Try lesson 1</a>
				</div>
			</section>
		{/if}

		{#if !courses.started}
			<section class="ways" aria-labelledby="ways-title">
				<h2 id="ways-title" class="sr-only">Ways to start</h2>
				<a class="way" href={`/learn/${FIRST_LESSON.id}`}>
					<Icon name="flag" size={22} />
					<span class="way-title">Start from the beginning</span>
					<span class="way-body">For new typists: F and J first, then one or two keys at a time.</span>
				</a>
				<a class="way" href="/learn/start">
					<Icon name="route" size={22} />
					<span class="way-title">Choose a chapter</span>
					<span class="way-body">Each chapter says who it suits, so you can pick your own level.</span>
				</a>
				<a class="way" href={onboarded ? '/learn/start#level' : '/start'}>
					<Icon name="gauge" size={22} />
					<span class="way-title">Find my level</span>
					<span class="way-body">A one-minute placement test recommends the right chapter.</span>
				</a>
			</section>
		{/if}
	{/if}

	<section class="road" aria-labelledby="road-title">
		<div class="road-head">
			<h2 id="road-title">The road</h2>
			<p>Every chapter is open. The highlighted lesson is the one recommended next.</p>
		</div>
		<ol class="chapters">
			{#each CHAPTERS as chapter, ci (chapter.number)}
				{@const cp = chapterProgress(chapter.number, courses.progress)}
				{@const current = chapter.number === nextChapter}
				<li class="chapter" class:current class:finished={cp.done === cp.total} use:reveal>
					<details bind:open={opened[ci]}>
						<summary>
							<span class="num" aria-hidden="true">{chapter.number}</span>
							<span class="ch-text">
								<span class="ch-title">{chapter.title}</span>
								<span class="ch-summary">{chapter.summary}</span>
							</span>
							<span class="ch-progress">
								<span class="ch-count">{cp.done}/{cp.total}</span>
								<span class="mini-bar" aria-hidden="true"><span style:width={`${(cp.done / cp.total) * 100}%`}></span></span>
							</span>
							<Icon name="chevron" size={18} class="caret" />
						</summary>
						<p class="ready"><b>Suits you if:</b> {chapter.readyIf}</p>
						<ol class="lessons">
							{#each chapter.lessons as lesson (lesson.id)}
								{@const p = courses.progress[lesson.id]}
								{@const locked = loaded && !signedIn && lesson.id !== FIRST_LESSON.id}
								<li>
									<a
										class="node"
										class:done={(p?.stars ?? 0) > 0}
										class:next={lesson.id === nextId}
										class:locked
										href={`/learn/${lesson.id}`}
										aria-label={`Lesson ${lesson.order}: ${lesson.title}${(p?.stars ?? 0) > 0 ? `, ${p!.stars} of 3 stars` : ''}${lesson.id === nextId ? ', recommended next' : ''}${locked ? ', requires an account' : ''}`}
									>
										<span class="tile">
											{#if locked}<Icon name="lock" size={14} />{:else if (p?.stars ?? 0) > 0}<Icon name="check" size={16} />{:else}{lesson.order}{/if}
										</span>
										<span class="node-title">{lesson.title}</span>
										{#if (p?.stars ?? 0) > 0}<Stars stars={p!.stars} size={12} />{/if}
										{#if lesson.id === nextId}<span class="next-tag">Next</span>{/if}
									</a>
								</li>
							{/each}
						</ol>
					</details>
				</li>
			{/each}
		</ol>
	</section>

	<section class="ranks" aria-labelledby="ranks-title" use:reveal>
		<div class="road-head">
			<h2 id="ranks-title">Ranks along the way</h2>
			<p>Points come from completed lessons and their stars. Replaying a lesson can raise its stars, never lower them.</p>
		</div>
		<ol class="ladder">
			{#each RANKS as r (r.level)}
				{@const reached = signedIn && courses.rank.points >= r.min}
				<li class:reached class:current={signedIn && courses.rank.rank.level === r.level}>
					<RankBadge rank={r} size={52} locked={!reached} />
					<span class="r-name">{r.name}</span>
					<span class="r-min">{r.min} points</span>
				</li>
			{/each}
		</ol>
	</section>
</div>

<style>
	.learn {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}
	.hero {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.kicker,
	.label {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		margin-top: 8px;
		font-size: clamp(36px, 5vw, 60px);
		line-height: 1.04;
		max-width: 18ch;
	}
	.lede {
		margin-top: 14px;
		max-width: 660px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	h2 {
		font-size: clamp(24px, 2.8vw, 32px);
		line-height: 1.15;
	}

	/* Up next */
	.next {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		padding: 26px 28px;
		border-radius: 3px;
		background: #0b0b0b;
		color: #f2f2ee;
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.next .label {
		color: var(--accent);
	}
	.next-copy {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 640px;
	}
	.next-copy p {
		color: #b9b9b3;
		line-height: 1.55;
	}
	.next .meta {
		font-size: 13.5px;
		color: #8e8e88;
	}

	/* Guests */
	.guest {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
		padding: 22px 24px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
	}
	.guest h2 {
		font-size: 22px;
	}
	.guest p {
		margin-top: 6px;
		max-width: 560px;
		color: var(--ink-2);
		line-height: 1.55;
	}
	.guest-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	/* Ways to start */
	.ways {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	.way {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		transition:
			transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1),
			border-color 220ms ease,
			box-shadow 220ms ease;
	}
	.way:hover {
		transform: translateY(-3px);
		border-color: var(--ink);
		box-shadow: var(--lift);
	}
	.way-title {
		font-size: 17px;
		font-weight: 700;
	}
	.way-body {
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--ink-2);
	}

	/* The road */
	.road-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 20px;
		flex-wrap: wrap;
		margin-bottom: 16px;
	}
	.road-head p {
		font-size: 15px;
		color: var(--ink-2);
	}
	.chapters {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	/* A spine connecting the chapters into one road. */
	.chapters::before {
		content: '';
		position: absolute;
		left: 39px;
		top: 24px;
		bottom: 24px;
		width: 2px;
		background: repeating-linear-gradient(to bottom, var(--line-strong) 0 6px, transparent 6px 12px);
	}
	.chapter {
		position: relative;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.chapter.current {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	summary {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto 18px;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
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
	.current .num {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
	}
	.finished .num {
		background: var(--ink);
		color: var(--bg);
		border-color: transparent;
	}
	.ch-text {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.ch-title {
		font-size: 18px;
		font-weight: 700;
	}
	.ch-summary {
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.ch-progress {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.mini-bar {
		width: 80px;
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.mini-bar span {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	summary :global(.caret) {
		transform: rotate(90deg);
		transition: transform 200ms ease;
		color: var(--ink-2);
	}
	details[open] summary :global(.caret) {
		transform: rotate(-90deg);
	}
	.ready {
		margin: 0 18px 12px 78px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.ready b {
		color: var(--ink);
	}
	.lessons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 8px;
		padding: 0 18px 18px 78px;
	}
	.node {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
		height: 100%;
		padding: 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--bg);
		color: var(--ink);
		text-decoration: none;
		transition:
			transform 180ms ease,
			border-color 180ms ease,
			box-shadow 180ms ease;
	}
	.node:hover {
		transform: translateY(-2px);
		border-color: var(--ink);
		box-shadow: var(--lift);
	}
	.tile {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 14px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.node.done .tile {
		background: var(--ink);
		color: var(--bg);
	}
	.node.next {
		border-color: var(--ink);
	}
	.node.next .tile {
		background: var(--accent);
		color: var(--on-accent);
		animation: beckon 2.2s ease-in-out infinite;
	}
	@keyframes beckon {
		50% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 35%, transparent);
		}
	}
	.node.locked {
		color: var(--ink-2);
	}
	.node-title {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.3;
	}
	.next-tag {
		position: absolute;
		top: 10px;
		right: 10px;
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 11px;
		font-weight: 800;
	}

	/* Ranks */
	.ladder {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
	}
	.ladder li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 16px 10px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		text-align: center;
	}
	.ladder li.current {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	.r-name {
		font-size: 14.5px;
		font-weight: 700;
	}
	.ladder li:not(.reached) .r-name {
		color: var(--ink-2);
	}
	.r-min {
		font-size: 12.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	@media (max-width: 860px) {
		.ways {
			grid-template-columns: 1fr;
		}
		.ladder {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		summary {
			grid-template-columns: 44px minmax(0, 1fr) 18px;
		}
		.ch-progress {
			display: none;
		}
		.ready {
			margin: 0 18px 12px;
		}
		.lessons {
			padding: 0 18px 18px;
		}
		.chapters::before {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.node.next .tile {
			animation: none;
		}
	}
</style>
