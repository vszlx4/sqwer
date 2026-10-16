<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { CHAPTERS, FIRST_LESSON, LESSONS, PARTS, keyList, partOf } from '#lib/courses/catalog.ts';
	import { learnerNextStep, learnerOnboarded } from '#lib/courses/learner.svelte.ts';
	import { chapterProgress } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import Stars from '#lib/courses/Stars.svelte';
	import { STEP_INFO, lessonGames, lessonMinutes } from '#lib/courses/stepInfo.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';

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

	// The chapter shown in the explorer: the recommended one, until the learner picks another.
	let picked = $state<number | null>(null);
	const selected = $derived(CHAPTERS.find((c) => c.number === (picked ?? nextChapter)) ?? CHAPTERS[0]!);
	const selectedPart = $derived(partOf(selected.number));
	const sp = $derived(chapterProgress(selected.number, courses.progress));
	let detail: HTMLElement | undefined = $state();

	function pick(n: number) {
		picked = n;
		// On narrow screens the lessons sit below the chapters; bring them into view.
		if (matchMedia('(max-width: 900px)').matches) untrack(() => detail?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}

	const totals = $derived.by(() => {
		const all = Object.values(courses.progress);
		return {
			done: all.filter((p) => p.stars > 0).length,
			stars: all.reduce((s, p) => s + p.stars, 0)
		};
	});
	const stepCount = (n: number) => `${n} ${n === 1 ? 'step' : 'steps'}`;
</script>

<Seo
	title="Learning path"
	description={`The sqwer typing course: ${LESSONS.length} lessons in ${CHAPTERS.length} chapters, from your first two keys to fluent typing, with games and ranks.`}
/>

<div class="learn">
	<header class="top">
		<div class="title">
			<p class="kicker">Learning path</p>
			<h1>From your first two keys to fluent typing.</h1>
			<p class="lede">{LESSONS.length} lessons of five to eight minutes in {CHAPTERS.length} chapters: one a day, with drills and six games.</p>
		</div>

		{#if loaded && signedIn}
			{@const status = courses.rank}
			<section class="rank" aria-labelledby="rank-title">
				<RankBadge rank={status.rank} size={56} />
				<div class="rank-body">
					<div class="rank-line">
						<h2 id="rank-title">{status.rank.name}</h2>
						<span class="rank-meta">{status.points.toLocaleString('en')} points · <span class="amber">{totals.stars} stars</span> · {totals.done}/{LESSONS.length} lessons · <span class="orange">{courses.streak}-day streak</span></span>
					</div>
					{#if status.next}
						<div class="rank-bar" role="progressbar" aria-label={`Progress to ${status.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(status.progress * 100)}>
							<span style:transform={`scaleX(${status.progress})`}></span>
						</div>
						<p class="rank-next">
							{#if status.next.level === 10}
								Three stars in 95% of the lessons for <b>{status.next.name}</b>
							{:else}
								<b>{Math.max(0, status.next.min - status.points).toLocaleString('en')}</b> points to <b>{status.next.name}</b>
							{/if}
						</p>
					{:else}
						<p class="rank-next">The highest rank. Every lesson can still be replayed.</p>
					{/if}
				</div>
			</section>
		{:else}
			<dl class="facts" aria-label="The course in numbers">
				<div><dt>Lessons</dt><dd>{LESSONS.length}</dd></div>
				<div><dt>Chapters</dt><dd>{CHAPTERS.length}</dd></div>
				<div><dt>Games</dt><dd>6</dd></div>
				<div><dt>Minutes a day</dt><dd>5–8</dd></div>
			</dl>
		{/if}
	</header>

	{#if loaded}
		{#if next && next.stage !== 'welcome' && (signedIn || next.stage !== 'course' || next.lesson?.id === FIRST_LESSON.id)}
			<section class="next" aria-labelledby="next-title">
				<div class="next-copy">
					<p class="label">{next.stage === 'course' ? 'Up next' : next.stage === 'complete' ? 'Complete' : 'Before the course'}</p>
					<h2 id="next-title">{next.title}</h2>
					{#if next.lesson}
						<p class="meta">
							Chapter {next.lesson.chapter} · {stepCount(next.lesson.steps.length)} · about {lessonMinutes(next.lesson)} min
							{#if next.lesson.newKeys.length}· New: {keyList(next.lesson.newKeys)}{/if}
						</p>
					{:else}
						<p class="meta">{next.text}</p>
					{/if}
				</div>
				<a class="btn btn-primary" href={next.href}>{next.action} <Icon name="arrow" size={18} /></a>
			</section>
		{/if}

		{#if !signedIn || !courses.started}
			<section class="ways" aria-labelledby="ways-title">
				<h2 id="ways-title" class="sr-only">Ways to start</h2>
				<a class="way" href={`/learn/${FIRST_LESSON.id}`}>
					<span class="way-icon green"><Icon name="flag" size={18} /></span>
					<span><span class="way-title">Start from the beginning</span><span class="way-body">F and J first, then one or two keys at a time.</span></span>
				</a>
				<a class="way" href="/learn/start">
					<span class="way-icon blue"><Icon name="route" size={18} /></span>
					<span><span class="way-title">Choose a chapter</span><span class="way-body">Each chapter says who it suits.</span></span>
				</a>
				<a class="way" href={onboarded ? '/learn/start#level' : '/start'}>
					<span class="way-icon violet"><Icon name="gauge" size={18} /></span>
					<span><span class="way-title">Find my level</span><span class="way-body">A one-minute placement test.</span></span>
				</a>
				{#if !signedIn}
					<a class="way account" href="/signup">
						<span class="way-icon ink"><Icon name="user" size={18} /></span>
						<span><span class="way-title">Create a free account</span><span class="way-body">Saves every lesson, star and streak. Lesson 1 works without one.</span></span>
					</a>
				{/if}
			</section>
		{/if}
	{/if}

	<section class="explorer" aria-labelledby="explorer-title">
		<h2 id="explorer-title" class="sr-only">Chapters and lessons</h2>

		<!-- Every chapter, grouped by part. -->
		<nav class="chapters" aria-label="Chapters">
			{#each PARTS as part, pi (part.id)}
				<div class="part" style:--part={`var(--${part.colour})`} style:--part-soft={`var(--${part.colour}-soft)`}>
					<p class="part-name">{part.title}</p>
					<ol>
						{#each part.chapters as n, ci (n)}
							{@const chapter = CHAPTERS[n - 1]!}
							{@const cp = chapterProgress(n, courses.progress)}
							<li class="rise" style:--i={pi * 3 + ci}>
								<button
									type="button"
									class="card"
									class:active={selected.number === n}
									class:finished={cp.done === cp.total}
									aria-pressed={selected.number === n}
									onclick={() => pick(n)}
								>
									<span class="card-num">{n}</span>
									<span class="card-text">
										<span class="card-title">{chapter.title}</span>
										<span class="card-foot">
											<span class="card-bar" aria-hidden="true"><span style:transform={`scaleX(${cp.done / cp.total})`}></span></span>
											<span class="card-count">{cp.done}/{cp.total}</span>
										</span>
									</span>
									{#if n === nextChapter && loaded}<span class="here">Now</span>{:else if cp.done === cp.total}<Icon name="check" size={16} />{/if}
								</button>
							</li>
						{/each}
					</ol>
				</div>
			{/each}
		</nav>

		<!-- The selected chapter and its lessons. -->
		<article class="detail" bind:this={detail} aria-labelledby="chapter-title" style:--part={`var(--${selectedPart.colour})`} style:--part-soft={`var(--${selectedPart.colour}-soft)`}>
			{#key selected.number}
				<header class="detail-head rise">
					<div class="detail-title">
						<p class="part-tag">{selectedPart.title} · Chapter {selected.number}</p>
						<h3 id="chapter-title">{selected.title}</h3>
						<p class="ch-summary">{selected.summary} <span class="ready"><b>Suits you if:</b> {selected.readyIf}</span></p>
					</div>
					<dl class="ch-stats">
						<div><dt>Lessons</dt><dd>{sp.done}<small>/{sp.total}</small></dd></div>
						<div><dt>Stars</dt><dd class="amber">{sp.stars}<small>/{sp.maxStars}</small></dd></div>
						<div><dt>Time</dt><dd>{selected.lessons.reduce((m, l) => m + lessonMinutes(l), 0)}<small> min</small></dd></div>
					</dl>
					<div class="ch-bar" role="progressbar" aria-label={`Chapter ${selected.number} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((sp.done / sp.total) * 100)}>
						<span style:transform={`scaleX(${sp.done / sp.total})`}></span>
					</div>
				</header>
				<ol class="lessons">
					{#each selected.lessons as lesson, i (lesson.id)}
						{@const p = courses.progress[lesson.id]}
						{@const stars = p?.stars ?? 0}
						{@const locked = loaded && !signedIn && lesson.id !== FIRST_LESSON.id}
						{@const games = lessonGames(lesson)}
						<li class="rise" style:--i={i + 1}>
							<a
								class="lesson"
								class:done={stars > 0}
								class:next={lesson.id === nextId}
								class:locked
								href={`/learn/${lesson.id}`}
								aria-label={`Lesson ${lesson.order}: ${lesson.title}${stars > 0 ? `, ${stars} of 3 stars` : ''}${lesson.id === nextId ? ', recommended next' : ''}${locked ? ', requires an account' : ''}`}
							>
								<span class="tile">
								{#if locked}<Icon name="lock" size={14} />{:else if stars > 0}<Icon name="check" size={16} />{:else}{lesson.order}{/if}
								</span>
								<span class="l-text">
								<span class="l-title">
									{lesson.title}
									{#if lesson.id === nextId}<span class="next-tag">Next</span>{/if}
								</span>
								<span class="l-summary">{lesson.summary}</span>
								<span class="l-meta">
									{#each lesson.steps.filter((s, si, all) => all.findIndex((x) => x.kind === s.kind) === si) as s (s.kind)}
										<span class="chip" class:game={STEP_INFO[s.kind].game}><Icon name={STEP_INFO[s.kind].icon} size={12} /> {STEP_INFO[s.kind].label}</span>
									{/each}
									<span class="dur">{lessonMinutes(lesson)} min</span>
								</span>
								{#if p && p.attempts > 0}
									<span class="l-best">Best {Math.round(p.bestAccuracy)}% accuracy{p.bestWpm ? ` · ${Math.round(p.bestWpm)} WPM` : ''} · {p.attempts} {p.attempts === 1 ? 'attempt' : 'attempts'}</span>
								{:else if games.length}
									<span class="sr-only">Games: {games.join(', ')}</span>
								{/if}
								</span>
								<span class="l-end">
								{#if stars > 0}<Stars {stars} size={14} />{:else}<Icon name="arrow" size={16} />{/if}
								</span>
							</a>
						</li>
					{/each}
				</ol>
			{/key}
		</article>
	</section>
</div>

<style>
	.learn {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	/* Title and progress share one compact row. */
	.top {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
		align-items: end;
		gap: 24px;
	}
	.kicker,
	.label {
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		margin-top: 6px;
		font-size: clamp(30px, 3.6vw, 44px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 8px;
		font-size: 16px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.rank {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.rank-body {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.rank-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 4px 12px;
	}
	.rank h2 {
		font-family: var(--font-sans);
		font-size: 20px;
		font-weight: 700;
	}
	.rank-meta {
		font-size: 13px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.amber {
		color: var(--amber);
		font-weight: 600;
	}
	.orange {
		color: var(--orange);
		font-weight: 600;
	}
	.rank-bar {
		height: 10px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.rank-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--violet), var(--accent));
		transform-origin: left;
		transition: transform 700ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.rank-next {
		font-size: 13px;
		color: var(--ink-2);
	}
	.rank-next b {
		color: var(--ink);
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.facts div {
		padding: 12px 14px;
	}
	.facts div + div {
		border-left: 1px solid var(--line);
	}
	.facts dt {
		font-size: 12px;
		color: var(--ink-2);
	}
	.facts dd {
		font-family: var(--font-serif);
		font-size: 28px;
		line-height: 1.1;
	}

	/* Up next: one slim dark row. */
	.next {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		padding: 14px 18px;
		border-radius: 3px;
		background:
			radial-gradient(120% 160% at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%),
			#0b0b0b;
		color: #f2f2ee;
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.next .label {
		color: var(--accent);
	}
	.next h2 {
		font-size: 22px;
		line-height: 1.2;
	}
	.next .meta {
		font-size: 13px;
		color: #9e9e98;
	}

	.ways {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 8px;
	}
	.way {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		transition:
			border-color 180ms ease,
			transform 180ms ease;
	}
	.way:hover {
		transform: translateY(-2px);
		border-color: var(--ink);
	}
	.way-icon {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border-radius: 3px;
	}
	.way-icon.green {
		background: var(--green-soft);
		color: var(--green);
	}
	.way-icon.blue {
		background: var(--blue-soft);
		color: var(--blue);
	}
	.way-icon.violet {
		background: var(--violet-soft);
		color: var(--violet);
	}
	.way-icon.ink {
		background: var(--accent);
		color: var(--on-accent);
	}
	.way-title {
		display: block;
		font-size: 14.5px;
		font-weight: 700;
	}
	.way-body {
		display: block;
		font-size: 13px;
		color: var(--ink-2);
	}

	/* Chapters on the left, the lessons of the chosen one on the right, wider. */
	.explorer {
		display: grid;
		grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
		gap: 20px;
		align-items: start;
	}
	.chapters {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.part-name {
		margin-bottom: 6px;
		padding-left: 8px;
		border-left: 3px solid var(--part);
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.part ol {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
			border-color 180ms ease,
			background-color 180ms ease;
	}
	.card:hover {
		transform: translateX(3px);
		border-color: var(--part);
	}
	.card.active {
		border-color: var(--part);
		background: var(--part-soft);
		box-shadow: inset 3px 0 0 var(--part);
	}
	.card-num {
		flex-shrink: 0;
		width: 26px;
		font-family: var(--font-serif);
		font-size: 22px;
		line-height: 1;
		color: var(--part);
		text-align: center;
	}
	.card-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card-title {
		font-size: 14px;
		font-weight: 650;
		line-height: 1.25;
	}
	.card-foot {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.card-bar,
	.ch-bar {
		flex: 1;
		height: 5px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.card-bar span,
	.ch-bar span {
		display: block;
		height: 100%;
		background: var(--part);
		transform-origin: left;
		transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.card-count {
		font-size: 11.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.card :global(svg) {
		color: var(--part);
	}
	.here {
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 10.5px;
		font-weight: 800;
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 18px 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background:
			linear-gradient(to bottom, var(--part-soft), transparent 160px),
			var(--surface);
		box-shadow: inset 0 3px 0 var(--part);
		scroll-margin-top: 90px;
	}
	.detail-head {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 10px 20px;
		align-items: end;
	}
	.part-tag {
		font-size: 12.5px;
		font-weight: 700;
		color: var(--part);
	}
	h3 {
		font-family: var(--font-serif);
		font-weight: 400;
	}
	#chapter-title {
		font-size: clamp(26px, 2.6vw, 34px);
		line-height: 1.1;
	}
	.ch-summary {
		margin-top: 4px;
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.ready b {
		color: var(--ink);
	}
	.ch-stats {
		display: flex;
		gap: 20px;
	}
	.ch-stats dt {
		font-size: 12px;
		color: var(--ink-2);
	}
	.ch-stats dd {
		font-size: 22px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.ch-stats small {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-2);
	}
	.ch-stats .amber {
		color: var(--amber);
	}
	.ch-bar {
		grid-column: 1 / -1;
	}
	.lessons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 8px;
	}
	.lesson {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		align-items: start;
		gap: 12px;
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
	.lesson:hover {
		transform: translateY(-2px);
		border-color: var(--ink);
		box-shadow: var(--lift);
	}
	.tile {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 13px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.lesson.done .tile {
		background: var(--part);
		color: var(--bg);
	}
	.lesson.next {
		border-color: var(--ink);
	}
	.lesson.next .tile {
		background: var(--accent);
		color: var(--on-accent);
		animation: beckon 2.2s ease-in-out infinite;
	}
	@keyframes beckon {
		50% {
			box-shadow: 0 0 0 6px color-mix(in srgb, var(--accent) 35%, transparent);
		}
	}
	.lesson.locked {
		color: var(--ink-2);
	}
	.l-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.l-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 15px;
		font-weight: 650;
	}
	.l-summary {
		font-size: 13px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.l-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		margin-top: 4px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 11.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.chip.game {
		background: var(--part-soft);
		color: var(--part);
	}
	.dur {
		font-size: 11.5px;
		color: var(--ink-3);
	}
	.l-best {
		font-size: 12px;
		color: var(--green);
		font-weight: 600;
	}
	.l-end {
		align-self: center;
		color: var(--ink-3);
	}
	.next-tag {
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 11px;
		font-weight: 800;
	}

	@media (max-width: 900px) {
		.top,
		.explorer {
			grid-template-columns: 1fr;
		}
		.detail-head {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.facts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.facts div:nth-child(3) {
			border-left: 0;
		}
		.facts div:nth-child(n + 3) {
			border-top: 1px solid var(--line);
		}
		.lessons {
			grid-template-columns: 1fr;
		}
		.detail {
			padding: 14px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lesson.next .tile {
			animation: none;
		}
	}
</style>
