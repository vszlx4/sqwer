<script lang="ts">
	import { onMount } from 'svelte';
	import { buildProfile } from '@sqwer/fingermap';
	import { fingerLabel, qwertyAnsi } from '@sqwer/layouts';
	import { standouts } from '#lib/assessment.ts';
	import ExamVisual from '#lib/exams/ExamVisual.svelte';
	import { ASSESSMENT_COVERAGE, CATEGORIES, EXAMS, type Exam } from '#lib/exams.ts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import { learnerNextStep } from '#lib/courses/learner.svelte.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import type { ExamId } from '#lib/results/types.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { reveal } from '#lib/motion/actions.ts';
	import { GAMES, loadRecords, type EndlessRecord, type GameId } from '#lib/games/endless.ts';

	let mounted = $state(false);
	let records = $state<Partial<Record<GameId, EndlessRecord>>>({});
	onMount(() => {
		fingerMap.load();
		results.load();
		records = loadRecords();
		mounted = true;
	});

	const profile = $derived(buildProfile(fingerMap.observations, qwertyAnsi('pc')));
	const coverage = $derived(profile.core.mapped / profile.core.total);

	// The placement test is recommended while it is the learner's next step; afterwards the course leads.
	const recommended = $derived.by<Exam['id'] | null>(() => {
		if (!mounted || !courses.loaded) return null;
		const stage = learnerNextStep().stage;
		return stage === 'placement' || stage === 'welcome' ? 'placement' : null;
	});

	interface Status {
		/** Short facts from previous attempts, if any. */
		facts: { label: string; value: string }[];
		action: string;
		href: string;
		locked: boolean;
	}

	function status(exam: Exam): Status {
		const locked = mounted && exam.id === 'finger-speed' && coverage < ASSESSMENT_COVERAGE;
		if (locked) return { facts: [], action: 'Continue mapping', href: profile.samples ? '/map' : '/map/session', locked };
		if (exam.id === 'finger-map') {
			const started = mounted && profile.samples > 0;
			return {
				facts: started ? [{ label: 'Core keys mapped', value: `${Math.round(coverage * 100)}%` }, { label: 'Entries', value: String(profile.samples) }] : [],
				action: started ? 'Continue mapping' : 'Start mapping',
				href: started ? '/map' : '/map/session',
				locked
			};
		}
		const list = mounted ? results.forExam(exam.id as ExamId) : [];
		const start = exam.id === 'finger-speed' ? 'Begin the assessment' : 'Start test';
		if (!list.length) return { facts: [], action: exam.id === 'placement' ? 'Take the placement test' : start, href: exam.href, locked };
		const last = list[list.length - 1]!;
		if (exam.id === 'finger-speed') {
			const s = last.fingers ? standouts(last.fingers) : null;
			return {
				facts: [
					{ label: 'Average', value: `${Math.round(last.wpm)} WPM` },
					...(s ? [{ label: 'Slowest', value: fingerLabel(s.slowest[0]).replace('pinky', 'little') }] : [])
				],
				action: 'Retake the assessment',
				href: exam.href,
				locked
			};
		}
		return {
			facts: [
				{ label: 'Best', value: `${Math.round(Math.max(...list.map((r) => r.wpm)))} WPM` },
				{ label: 'Last', value: `${Math.round(last.wpm)} WPM · ${Math.round(last.accuracy)}%` },
				{ label: 'Attempts', value: String(list.length) }
			],
			action: 'Take it again',
			href: exam.href,
			locked
		};
	}
</script>

<Seo
	title="Practice"
	description="Placement, speed, accuracy, endurance and technique examinations, each with a clear purpose and your own statistics."
/>

<Breadcrumbs items={[{ href: '/exams', label: 'Practice' }]} />

<div class="exams">
	<header class="intro">
		<h1>Practice</h1>
		<p class="lede">
			Courses teach; examinations measure. Each one measures one thing and explains its result. Signed in, every
			completed test earns XP toward your account level: longer, faster and more accurate tests earn more.
		</p>
		<nav class="shortcuts" aria-label="Practice tools">
			<a href="/history"><Icon name="history" size={16} /> History and replays</a>
			<a href="/map"><Icon name="hand" size={16} /> Finger map</a>
			<a href="/competitive"><Icon name="trophy" size={16} /> Competitive test</a>
			<a href="#games"><Icon name="play" size={16} /> Endless games</a>
		</nav>
	</header>

	{#each CATEGORIES as category, ci (category.name)}
		{@const exams = EXAMS.filter((e) => e.category === category.name)}
		<section aria-labelledby={`cat-${ci}`} class={`category cat-${ci}`}>
			<div class="cat-head" use:reveal>
				<h2 id={`cat-${ci}`}>{category.name}</h2>
				<p>{category.description}</p>
			</div>
			<div class="cards" class:single={exams.length === 1} class:pair={exams.length === 2}>
				{#each exams as exam, i (exam.id)}
					{@const s = status(exam)}
					{@const isNext = recommended === exam.id && !s.locked}
					<article class="exam-card" class:locked={s.locked} class:next={isNext} use:reveal={{ delay: i * 0.07 }}>
						<div class="art">
							<ExamVisual exam={exam.id} />
							{#if isNext}<span class="badge">Recommended</span>{/if}
							{#if s.locked}<span class="badge muted"><Icon name="lock" size={13} /> Locked</span>{/if}
						</div>
						<div class="body">
							<h3><a href={s.href} class="stretched">{exam.title}</a></h3>
							<p class="purpose">{exam.purpose}</p>
							<p class="meta">
								<span><Icon name="clock" size={14} /> {exam.duration}</span>
								<span class="measures">{exam.measures.join(' · ')}</span>
							</p>
							{#if s.locked}
								<div class="unlock">
									<p>
										Unlocks at {Math.round(ASSESSMENT_COVERAGE * 100)}% of core keys mapped. You have mapped
										<b>{Math.round(coverage * 100)}%</b>.
									</p>
									<span class="meter" aria-hidden="true"><span style:width={`${Math.min(100, (coverage / ASSESSMENT_COVERAGE) * 100)}%`}></span></span>
								</div>
							{:else if s.facts.length}
								<dl class="facts">
									{#each s.facts as f (f.label)}<div><dt>{f.label}</dt><dd>{f.value}</dd></div>{/each}
								</dl>
							{/if}
							<span class="go" aria-hidden="true">{s.action} <Icon name="arrow" size={16} /></span>
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/each}

	<section id="games" aria-labelledby="games-title" class="category games">
		<div class="cat-head" use:reveal>
			<h2 id="games-title">Endless games</h2>
			<p>The course games, round after round, at a fixed level or one that adapts to you.</p>
		</div>
		<ul class="game-list">
			{#each GAMES as g, i (g.id)}
				<li use:reveal={{ delay: i * 0.05 }}>
					<a href={`/play/${g.id}`}>
						<span class="game-icon" aria-hidden="true"><Icon name={g.icon} size={18} /></span>
						<span class="game-title">{g.title}</span>
						<span class="game-summary">{g.summary}</span>
						<span class="game-best">{records[g.id]?.best ? `Best ${records[g.id]!.best}` : ''}</span>
						<span class="game-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	/* One panel, one row per game: titles, descriptions and scores line up down the list. */
	.game-list {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.game-list li + li {
		border-top: 1px solid var(--line);
	}
	.game-list a {
		display: grid;
		grid-template-columns: 36px 150px minmax(0, 1fr) auto 20px;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-16) var(--space-20);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.game-list a:hover {
		background: var(--surface-2);
	}
	.game-list a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	.game-icon {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}
	.game-list a:hover .game-icon {
		border-color: var(--ink);
		background: var(--accent);
		color: var(--on-accent);
	}
	.game-title {
		font-weight: var(--fw-bold);
	}
	.game-summary {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.game-best {
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.game-go {
		color: var(--ink-3);
		transition: transform var(--dur-fast) var(--ease-out);
	}
	.game-list a:hover .game-go {
		color: var(--ink);
		transform: translateX(3px);
	}
	@media (max-width: 760px) {
		.game-list a {
			grid-template-columns: 36px minmax(0, 1fr) 20px;
			row-gap: var(--space-2);
		}
		.game-title {
			grid-column: 2;
		}
		.game-summary {
			grid-column: 2;
			grid-row: 2;
		}
		.game-best {
			grid-column: 2;
			grid-row: 3;
		}
		.game-best:empty {
			display: none;
		}
		.game-go {
			grid-column: 3;
			grid-row: 1;
		}
		.game-icon {
			grid-row: 1 / span 2;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.game-list a,
		.game-go {
			transition: none;
		}
	}
	.exams {
		display: flex;
		flex-direction: column;
		gap: clamp(var(--space-48), 6vw, var(--space-64));
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	.lede {
		margin-top: var(--space-16);
		max-width: var(--w-text);
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.cat-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-8) var(--space-20);
		flex-wrap: wrap;
		margin-bottom: var(--space-16);
	}
	h2 {
		font-size: var(--fs-title);
	}
	.cat-head p {
		font-size: var(--fs-15);
		color: var(--ink-2);
	}

	/* ---------- Grid ---------- */
	.cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-16);
	}
	.cards.pair {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.cards.single {
		grid-template-columns: 1fr;
	}

	/* ---------- Card ---------- */
	.exam-card {
		position: relative;
		display: flex;
		flex-direction: column;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
		overflow: hidden;
		transition:
			transform var(--dur-base) var(--ease-out),
			box-shadow var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out);
	}
	.exam-card:hover {
		transform: translateY(-3px);
		box-shadow: var(--lift);
		border-color: var(--line-strong);
	}
	.exam-card:focus-within {
		border-color: var(--ink);
	}
	.exam-card.next {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	.exam-card.next:hover {
		box-shadow:
			inset 0 3px 0 var(--accent),
			var(--lift);
	}
	.exam-card.locked {
		background: var(--bg);
		border-style: dashed;
	}
	.art {
		position: relative;
		height: 150px;
		background: var(--bg);
		border-bottom: 1px solid var(--line);
	}
	.locked .art {
		opacity: 0.55;
		filter: grayscale(0.6);
	}
	.badge {
		position: absolute;
		top: 12px;
		left: 12px;
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
	}
	.badge.muted {
		background: var(--surface-2);
		color: var(--ink-2);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		flex: 1;
		padding: var(--space-20) var(--space-20) var(--space-20);
	}
	h3 {
		font-size: var(--fs-20);
		font-weight: var(--fw-semibold);
		line-height: var(--lh-base);
	}
	h3 a {
		color: inherit;
		text-decoration: none;
	}
	/* The whole card is the link target; the title remains the accessible name. */
	.stretched::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
	}
	.stretched:focus-visible {
		outline: none;
		box-shadow: none;
	}
	.stretched:focus-visible::after {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
		box-shadow: inset 0 0 0 5px var(--accent);
		border-radius: var(--radius);
	}
	.purpose {
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4) var(--space-16);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
	}
	.measures {
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8) var(--space-20);
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
	}
	dt {
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	dd {
		font-size: var(--fs-15);
		font-weight: var(--fw-bold);
		font-variant-numeric: tabular-nums;
	}
	.unlock {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.unlock b {
		color: var(--ink);
	}
	.meter {
		height: 6px;
		border-radius: var(--radius);
		background: var(--surface-2);
		overflow: hidden;
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--ink);
	}
	.go {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		margin-top: auto;
		padding-top: var(--space-6);
		font-size: var(--fs-15);
		font-weight: var(--fw-bold);
	}
	.go :global(svg) {
		transition: transform var(--dur-base) var(--ease-out);
	}
	.exam-card:hover .go :global(svg) {
		transform: translateX(4px);
	}
	.exam-card.next .go {
		align-self: flex-start;
		padding: var(--space-10) var(--space-16);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
	}

	/* A single examination is shown as a wide feature card. */
	.single .exam-card {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
	}
	.single .art {
		height: auto;
		min-height: 220px;
		border-bottom: 0;
		border-right: 1px solid var(--line);
	}
	.single .body {
		padding: var(--space-32) var(--space-32);
		justify-content: center;
	}
	.single h3 {
		font-family: var(--font-serif);
		font-weight: var(--fw-regular);
		font-size: var(--fs-title);
	}
	.pair .art {
		height: 180px;
	}

	@media (max-width: 1100px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 760px) {
		.cards,
		.cards.pair {
			grid-template-columns: 1fr;
		}
		.single .exam-card {
			grid-template-columns: 1fr;
		}
		.single .art {
			min-height: 160px;
			border-right: 0;
			border-bottom: 1px solid var(--line);
		}
		.single .body {
			padding: var(--space-20);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.exam-card:hover {
			transform: none;
		}
	}
	.shortcuts {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
		margin-top: var(--space-16);
	}
	.shortcuts a {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		text-decoration: none;
		transition: border-color var(--dur-fast) var(--ease-out);
	}
	.shortcuts a:hover {
		border-color: var(--ink);
	}
</style>
