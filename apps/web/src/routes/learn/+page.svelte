<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { CHAPTERS, FIRST_LESSON, LESSONS, PARTS, keyList, partOf } from '#lib/courses/catalog.ts';
	import { learnerNextStep, learnerOnboarded } from '#lib/courses/learner.svelte.ts';
	import { chapterProgress, RANKS } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import RankPanel from '#lib/courses/RankPanel.svelte';
	import Stars from '#lib/courses/Stars.svelte';
	import { STEP_INFO, lessonGames, lessonMinutes } from '#lib/courses/stepInfo.ts';
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

	// The chapter shown in the explorer: the recommended one, until the learner picks another.
	let picked = $state<number | null>(null);
	const selected = $derived(CHAPTERS.find((c) => c.number === (picked ?? nextChapter)) ?? CHAPTERS[0]!);
	const selectedPart = $derived(partOf(selected.number));
	const sp = $derived(chapterProgress(selected.number, courses.progress));
	let detail: HTMLElement | undefined = $state();

	function pick(n: number) {
		picked = n;
		// On narrow screens the lessons sit below the chapters; bring them into view.
		if (matchMedia('(max-width: 960px)').matches) untrack(() => detail?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
	title="Courses"
	description={`The sqwer typing course: ${LESSONS.length} lessons in ${CHAPTERS.length} chapters, from your first two keys to fluent typing, with games and ranks.`}
/>

<div class="learn">
	<header class="hero">
		<div class="hero-copy">
			<p class="kicker">The sqwer course</p>
			<h1>From your first two keys to fluent typing.</h1>
			<p class="lede">
				{LESSONS.length} short lessons in {CHAPTERS.length} chapters and four parts. Each lesson adds a little, with drills and
				games: key hunts, races, echo, falling letters, rhythm and listening.
			</p>
		</div>
		{#if loaded && signedIn}
			<RankPanel />
		{:else}
			<dl class="facts" aria-label="The course in numbers">
				<div><dt>Lessons</dt><dd>{LESSONS.length}</dd></div>
				<div><dt>Chapters</dt><dd>{CHAPTERS.length}</dd></div>
				<div><dt>Games</dt><dd>6</dd></div>
				<div><dt>Ranks</dt><dd>{RANKS.length}</dd></div>
			</dl>
		{/if}
	</header>

	{#if loaded}
		{#if next && next.stage !== 'welcome' && (signedIn || next.stage !== 'course' || next.lesson?.id === FIRST_LESSON.id)}
			<section class="next" aria-labelledby="next-title">
				<div class="next-copy">
					<p class="label">{next.stage === 'course' ? 'Up next' : next.stage === 'complete' ? 'Complete' : 'Before the course'}</p>
					<h2 id="next-title">{next.title}</h2>
					<p>{next.text}</p>
					{#if next.lesson}
						<p class="meta">
							Chapter {next.lesson.chapter} · {stepCount(next.lesson.steps.length)} · about {lessonMinutes(next.lesson)} min
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
					<p>An account saves every lesson, your stars, rank and daily streak, on any device. You can try the first lesson without one.</p>
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
					<span class="way-icon green"><Icon name="flag" size={20} /></span>
					<span class="way-title">Start from the beginning</span>
					<span class="way-body">For new typists: F and J first, then one or two keys at a time.</span>
				</a>
				<a class="way" href="/learn/start">
					<span class="way-icon blue"><Icon name="route" size={20} /></span>
					<span class="way-title">Choose a chapter</span>
					<span class="way-body">Each chapter says who it suits, so you can pick your own level.</span>
				</a>
				<a class="way" href={onboarded ? '/learn/start#level' : '/start'}>
					<span class="way-icon violet"><Icon name="gauge" size={20} /></span>
					<span class="way-title">Find my level</span>
					<span class="way-body">A one-minute placement test recommends the right chapter.</span>
				</a>
			</section>
		{/if}
	{/if}

	<section class="explorer" aria-labelledby="explorer-title">
		<div class="section-head">
			<h2 id="explorer-title">Chapters</h2>
			<p>Every chapter is open. Choose one to see its lessons.</p>
		</div>

		<div class="panes">
			<!-- The selected chapter and its lessons. -->
			<article class="detail" bind:this={detail} aria-labelledby="chapter-title" style:--part={`var(--${selectedPart.colour})`} style:--part-soft={`var(--${selectedPart.colour}-soft)`}>
				{#key selected.number}
					<header class="detail-head rise">
						<p class="part-tag">{selectedPart.title}</p>
						<h3 id="chapter-title"><span class="ch-num">Chapter {selected.number}</span>{selected.title}</h3>
						<p class="ch-summary">{selected.summary}</p>
						<p class="ready"><Icon name="info" size={15} /> <span><b>Suits you if:</b> {selected.readyIf}</span></p>
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

			<!-- Every chapter, grouped by part. -->
			<div class="parts">
				{#each PARTS as part (part.id)}
					<section class="part" aria-labelledby={`part-${part.id}`} style:--part={`var(--${part.colour})`} style:--part-soft={`var(--${part.colour}-soft)`}>
						<header class="part-head">
							<h3 id={`part-${part.id}`}>{part.title}</h3>
							<p>{part.summary}</p>
						</header>
						<div class="cards">
							{#each part.chapters as n (n)}
								{@const chapter = CHAPTERS[n - 1]!}
								{@const cp = chapterProgress(n, courses.progress)}
								<button
									type="button"
									class="card"
									class:active={selected.number === n}
									class:finished={cp.done === cp.total}
									aria-pressed={selected.number === n}
									onclick={() => pick(n)}
								>
									<span class="card-top">
										<span class="card-num">{n}</span>
										{#if n === nextChapter && loaded}<span class="here">You are here</span>{:else if cp.done === cp.total}<Icon name="check" size={16} />{/if}
									</span>
									<span class="card-title">{chapter.title}</span>
									<span class="card-foot">
										<span class="card-bar" aria-hidden="true"><span style:transform={`scaleX(${cp.done / cp.total})`}></span></span>
										<span class="card-count">{cp.done}/{cp.total}</span>
									</span>
								</button>
							{/each}
						</div>
					</section>
				{/each}
			</div>
		</div>
	</section>

	<section class="ranks" aria-labelledby="ranks-title" use:reveal>
		<div class="section-head">
			<h2 id="ranks-title">Ranks along the way</h2>
			<p>Points come from completed lessons and their stars. Replaying a lesson can raise its stars, never lower them.</p>
		</div>
		<ol class="ladder">
			{#each RANKS as r (r.level)}
				{@const reached = signedIn && courses.rank.points >= r.min}
				<li class:reached class:current={signedIn && courses.rank.rank.level === r.level}>
					<RankBadge rank={r} size={56} locked={!reached} />
					<span class="r-name">{r.name}</span>
					<span class="r-min">{r.min.toLocaleString('en')} points</span>
				</li>
			{/each}
		</ol>
	</section>
</div>

<style>
	.learn {
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		align-items: end;
		gap: 32px;
	}
	.hero:has(:global(.panel)) {
		grid-template-columns: 1fr;
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
		max-width: 620px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	h2 {
		font-size: clamp(24px, 2.8vw, 32px);
		line-height: 1.15;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.facts div {
		padding: 16px 18px;
	}
	.facts div + div {
		border-left: 1px solid var(--line);
	}
	.facts dt {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.facts dd {
		font-family: var(--font-serif);
		font-size: 34px;
		line-height: 1.1;
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
		background:
			radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 55%),
			#0b0b0b;
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
	.way-icon {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
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
	.way-title {
		font-size: 17px;
		font-weight: 700;
	}
	.way-body {
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--ink-2);
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 20px;
		flex-wrap: wrap;
		margin-bottom: 18px;
	}
	.section-head p {
		font-size: 15px;
		color: var(--ink-2);
	}

	/* Explorer: lessons of the chosen chapter on the left, every chapter on the right. */
	.panes {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: 24px;
		align-items: start;
	}
	.detail {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 24px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background:
			linear-gradient(to bottom, var(--part-soft), transparent 220px),
			var(--surface);
		box-shadow: inset 0 3px 0 var(--part);
		scroll-margin-top: 90px;
	}
	.detail-head {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.part-tag {
		align-self: flex-start;
		padding: 3px 8px;
		border-radius: 3px;
		background: var(--part-soft);
		color: var(--part);
		font-size: 12.5px;
		font-weight: 700;
	}
	h3 {
		font-family: var(--font-serif);
		font-weight: 400;
	}
	#chapter-title {
		display: flex;
		flex-direction: column;
		font-size: clamp(28px, 3vw, 38px);
		line-height: 1.1;
	}
	.ch-num {
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.ch-summary {
		font-size: 16px;
		color: var(--ink-2);
	}
	.ready {
		display: flex;
		gap: 8px;
		align-items: flex-start;
		font-size: 14px;
		color: var(--ink-2);
	}
	.ready :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
		color: var(--part);
	}
	.ready b {
		color: var(--ink);
	}
	.ch-stats {
		display: flex;
		gap: 28px;
		margin-top: 4px;
	}
	.ch-stats dt {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.ch-stats dd {
		font-size: 24px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.ch-stats small {
		font-size: 14px;
		font-weight: 500;
		color: var(--ink-2);
	}
	.ch-stats .amber {
		color: var(--amber);
	}
	.ch-bar,
	.card-bar {
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.ch-bar span,
	.card-bar span {
		display: block;
		height: 100%;
		background: var(--part);
		transform-origin: left;
		transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.lessons {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.lesson {
		display: grid;
		grid-template-columns: 36px minmax(0, 1fr) auto;
		align-items: start;
		gap: 14px;
		padding: 14px;
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
		transform: translateX(3px);
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
		font-size: 14px;
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
		gap: 4px;
		min-width: 0;
	}
	.l-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 650;
	}
	.l-summary {
		font-size: 14px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.l-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 7px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 12px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.chip.game {
		background: var(--part-soft);
		color: var(--part);
	}
	.dur {
		font-size: 12px;
		color: var(--ink-3);
	}
	.l-best {
		font-size: 12.5px;
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

	.parts {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	.part-head {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin-bottom: 8px;
		padding-left: 10px;
		border-left: 3px solid var(--part);
	}
	.part-head h3 {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 700;
	}
	.part-head p {
		font-size: 13px;
		color: var(--ink-2);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 128px;
		padding: 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition:
			transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
			border-color 200ms ease,
			box-shadow 200ms ease,
			background-color 200ms ease;
	}
	.card:hover {
		transform: translateY(-2px);
		border-color: var(--part);
		box-shadow: var(--lift);
	}
	.card.active {
		border-color: var(--part);
		background: var(--part-soft);
		box-shadow: inset 0 0 0 1px var(--part);
	}
	.card-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--part);
	}
	.card-num {
		font-family: var(--font-serif);
		font-size: 26px;
		line-height: 1;
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
	.card-title {
		flex: 1;
		font-size: 14px;
		font-weight: 650;
		line-height: 1.3;
	}
	.card-foot {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.card-bar {
		flex: 1;
	}
	.card-count {
		font-size: 12px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
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
		padding: 18px 10px 14px;
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
		font-size: 15px;
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

	@media (max-width: 960px) {
		.hero,
		.panes {
			grid-template-columns: 1fr;
		}
		/* Chapters first, then the lessons of the chosen one. */
		.parts {
			order: -1;
		}
	}
	@media (max-width: 640px) {
		.ways,
		.facts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.facts div:nth-child(3) {
			border-left: 0;
		}
		.facts div:nth-child(n + 3) {
			border-top: 1px solid var(--line);
		}
		.ways {
			grid-template-columns: 1fr;
		}
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.ladder {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.detail {
			padding: 18px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lesson.next .tile {
			animation: none;
		}
	}
</style>
