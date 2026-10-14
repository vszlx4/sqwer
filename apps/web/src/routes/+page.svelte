<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { buildProfile } from '@sqwer/fingermap';
	import { qwertyAnsi, type Finger } from '@sqwer/layouts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import Hands from '#lib/hands/Hands.svelte';
	import { buildJourney } from '#lib/journey.ts';
	import MapPreview from '#lib/landing/MapPreview.svelte';
	import { results } from '#lib/results/store.svelte.ts';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { reveal } from '#lib/ui/reveal.ts';

	let ready = $state(false);
	onMount(() => {
		fingerMap.load();
		results.load();
		ready = true;
	});

	// Returning typists are offered their next step instead of starting again.
	const steps = $derived(buildJourney(results.list, buildProfile(fingerMap.observations, qwertyAnsi('pc'))));
	const started = $derived(ready && (results.list.length > 0 || fingerMap.observations.length > 0));
	const nextIndex = $derived(steps.findIndex((s) => s.status === 'current' || s.status === 'in-progress'));
	const next = $derived(started ? steps[nextIndex === -1 ? steps.length - 1 : nextIndex]! : null);

	// An illustrative result of the finger speed assessment for the hero figure.
	const SPEEDS: Record<Finger, number> = { lp: 41, lr: 48, lm: 66, li: 78, lt: 92, rt: 95, ri: 81, rm: 63, rr: 52, rp: 38 };
	const heroTone = Object.fromEntries(Object.entries(SPEEDS).map(([f, v]) => [f, 0.25 + 0.75 * (v / 95)])) as Record<Finger, number>;
	const heroLegend = Object.fromEntries(Object.entries(SPEEDS).map(([f, v]) => [f, { value: String(v), strong: f === 'rt' }]));

	const JOURNEY = [
		{ title: 'Establish your baseline', body: 'A placement test records your speed, accuracy and rhythm.', meta: '1 minute', icon: 'flag' },
		{ title: 'Map your technique', body: 'Indicate which finger presses each key, including habits that depend on the neighbouring key.', meta: 'About 10 minutes, in sessions', icon: 'hand' },
		{ title: 'Assess each finger', body: 'Four short stages measure the speed and accuracy of every finger separately.', meta: '80 seconds', icon: 'gauge' },
		{ title: 'Measure your progress', body: 'Retake the placement test under the same conditions to see what has changed.', meta: 'Whenever you are ready', icon: 'chart' }
	] as const;

	const SAMPLE = [
		{ label: 'WPM', value: '78', hint: 'Counts only words typed correctly.' },
		{ label: 'Accuracy', value: '96%', hint: 'Counts every incorrect keystroke, including corrected ones.' },
		{ label: 'Raw', value: '83', hint: 'Counts all typed characters, including errors.' },
		{ label: 'Consistency', value: '81%', hint: 'Measures how evenly speed was maintained.' }
	];

	const site = $derived(page.data.siteUrl ?? '');
	const jsonLd = $derived([
		{ '@context': 'https://schema.org', '@type': 'Organization', name: 'sqwer', url: site, logo: `${site}/favicon.svg`, email: CONTACT_EMAIL },
		{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'sqwer', url: site },
		{
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: 'sqwer',
			url: site,
			applicationCategory: 'EducationalApplication',
			operatingSystem: 'Any',
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
			description: 'A guided typing course that measures speed, maps which finger is used for each key and assesses each finger.'
		}
	]);
</script>

<Seo
	description="Learn to type better by understanding how you type now: a guided journey of placement tests, finger mapping and per-finger assessment."
	{jsonLd}
/>

<div class="landing">
	<section class="hero" aria-labelledby="hero-title">
		<div class="hero-copy">
			<h1 id="hero-title" class="rise">Understand how your hands <span class="mark">really</span> type.</h1>
			<p class="lede rise" style:--d="80ms">
				sqwer measures your speed, records which finger you use for each key and identifies the fingers that hold you
				back. Then it shows you what to practise.
			</p>
			<div class="hero-action rise" style:--d="160ms">
				{#if next}
					<p class="resume"><span class="step-no">Step {nextIndex === -1 ? steps.length : nextIndex + 1} of {steps.length}</span> {next.title}</p>
					<a class="btn btn-primary btn-lg" href={next.href}>{next.action} <Icon name="arrow" size={18} /></a>
				{:else}
					<a class="btn btn-primary btn-lg" href="/test?exam=placement">Take the placement test <Icon name="arrow" size={18} /></a>
				{/if}
				<a class="link-arrow quiet" href="#journey">How the journey works <Icon name="chevron" size={16} class="down" /></a>
			</div>
			<ul class="facts rise" style:--d="240ms" aria-label="Key facts">
				<li><Icon name="clock" size={16} /> One minute to begin</li>
				<li><Icon name="user" size={16} /> No account required</li>
				<li><Icon name="lock" size={16} /> No tracking</li>
			</ul>
		</div>
		<figure class="hero-figure">
			<Hands label="Illustration of two hands with the typing speed of each finger" tone={heroTone} legend={heroLegend} animate />
			<figcaption>Words per minute for each finger, from the finger speed assessment. Illustrative example.</figcaption>
		</figure>
	</section>

	<section id="journey" class="journey" aria-labelledby="journey-title">
		<header class="section-head" use:reveal>
			<p class="kicker">Your journey</p>
			<h2 id="journey-title">Four steps, from your first test to your weakest finger.</h2>
			<p>Each step builds on the one before. Your progress is saved as you go, so you can stop and return at any time.</p>
		</header>
		<ol class="steps">
			{#each JOURNEY as step, i (step.title)}
				<li class="step" use:reveal={{ delay: i * 90 }}>
					<div class="step-top">
						<span class="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
						<Icon name={step.icon} size={22} />
					</div>
					<h3>{step.title}</h3>
					<p>{step.body}</p>
					<p class="meta"><Icon name="clock" size={14} /> {step.meta}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section class="split" aria-labelledby="map-title">
		<div class="copy" use:reveal>
			<p class="kicker">Finger mapping</p>
			<h2 id="map-title">A finger map based on your own technique.</h2>
			<p>
				Conventional typing tutors assume standard touch-typing technique. sqwer asks which finger you used after each
				keystroke and builds a map of how you actually type.
			</p>
			<ul class="checks">
				<li><Icon name="check" size={18} /> Keys you type with a non-standard finger</li>
				<li><Icon name="check" size={18} /> Habits that depend on the neighbouring key</li>
				<li><Icon name="check" size={18} /> Which Shift key you use, and with which hand</li>
				<li><Icon name="check" size={18} /> A file you can export at any time</li>
			</ul>
		</div>
		<div class="visual card" use:reveal={{ delay: 120 }}>
			<MapPreview />
		</div>
	</section>

	<section class="split reverse" aria-labelledby="stats-title">
		<div class="copy" use:reveal>
			<p class="kicker">Examinations</p>
			<h2 id="stats-title">Results that explain your performance.</h2>
			<p>
				Each examination reports speed, accuracy and rhythm separately, shows how they changed second by second and
				recommends what to work on next.
			</p>
		</div>
		<div class="visual" use:reveal={{ delay: 120 }}>
			<dl class="sample" aria-label="Illustrative example of a test result">
				{#each SAMPLE as m (m.label)}
					<div class="tile">
						<dt>{m.label}</dt>
						<dd>{m.value}</dd>
						<dd class="hint">{m.hint}</dd>
					</div>
				{/each}
			</dl>
			<p class="sample-note">Illustrative example</p>
		</div>
	</section>

	<section class="principles" aria-labelledby="principles-title" use:reveal>
		<h2 id="principles-title" class="sr-only">Commitments</h2>
		<div class="principle">
			<Icon name="user" size={22} />
			<h3>Free, without an account</h3>
			<p>Every examination works in your browser. An account only adds saving across devices.</p>
		</div>
		<div class="principle">
			<Icon name="shield" size={22} />
			<h3>Your data stays yours</h3>
			<p>No advertising or tracking. Export or delete everything at any time.</p>
		</div>
		<div class="principle">
			<Icon name="info" size={22} />
			<h3>Clear definitions</h3>
			<p>Every figure is defined, and the same rules are applied to every result.</p>
		</div>
	</section>
</div>

<style>
	.landing {
		display: flex;
		flex-direction: column;
		gap: clamp(88px, 12vw, 148px);
		padding-bottom: clamp(24px, 4vw, 48px);
	}

	/* ---------- Hero ---------- */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
		align-items: center;
		gap: clamp(32px, 5vw, 72px);
		min-height: min(calc(100dvh - 160px), 720px);
		padding-top: clamp(8px, 3vh, 32px);
	}
	.hero-copy {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	h1 {
		font-size: clamp(42px, 5.2vw, 72px);
		line-height: 1;
		letter-spacing: -0.025em;
		max-width: 12ch;
	}
	/* Emphasis is carried by weight alone. */
	.mark {
		font-weight: 800;
	}
	.lede {
		margin-top: 24px;
		max-width: 520px;
		font-size: clamp(17px, 1.5vw, 19px);
		line-height: 1.6;
		color: var(--ink-2);
	}
	.hero-action {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
		margin-top: 32px;
	}
	.resume {
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.step-no {
		font-weight: 700;
		color: var(--ink);
		margin-right: 4px;
	}
	.quiet {
		font-size: 15px;
		color: var(--ink-2);
	}
	.quiet:hover {
		color: var(--ink);
	}
	.quiet :global(.down) {
		transform: rotate(90deg);
	}
	.quiet:hover :global(.down) {
		transform: rotate(90deg) translateX(3px);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		margin-top: 36px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
		font-size: 14px;
		color: var(--ink-2);
	}
	.facts li {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	.hero-figure {
		width: 100%;
		max-width: 560px;
		justify-self: center;
	}
	.hero-figure figcaption {
		margin-top: 14px;
		text-align: center;
		font-size: 13px;
		color: var(--ink-3);
	}
	/* Hero copy rises in on first paint; this needs no script. */
	.rise {
		animation: rise 700ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
		animation-delay: var(--d, 0ms);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
	}

	/* ---------- Sections ---------- */
	.kicker {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h2 {
		margin-top: 10px;
		font-size: clamp(30px, 4vw, 48px);
		line-height: 1.08;
		letter-spacing: -0.015em;
	}
	.section-head {
		max-width: 680px;
	}
	.section-head > p:last-child {
		margin-top: 14px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}

	/* ---------- Journey ---------- */
	.steps {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin-top: 36px;
		counter-reset: step;
	}
	.step {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 22px 20px 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	/* A connecting line between consecutive steps on wide screens. */
	.step:not(:last-child)::after {
		content: '';
		position: absolute;
		top: 36px;
		right: -13px;
		width: 14px;
		height: 1px;
		background: var(--line-strong);
	}
	.step-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: var(--ink-2);
		margin-bottom: 8px;
	}
	.num {
		font-family: var(--font-serif);
		font-size: 30px;
		line-height: 1;
		color: var(--ink);
	}
	.step:first-child .num {
		padding: 2px 6px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.step h3 {
		font-size: 18px;
		font-weight: 600;
	}
	.step p {
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.step .meta {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: auto;
		padding-top: 10px;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}

	/* ---------- Feature splits ---------- */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: clamp(28px, 5vw, 64px);
		align-items: center;
	}
	.split.reverse .copy {
		order: 2;
	}
	.copy {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.copy > p:not(.kicker) {
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.checks {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 4px;
	}
	.checks li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 16px;
		font-weight: 500;
	}
	.checks :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
		padding: 2px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: clamp(18px, 2.4vw, 28px);
	}
	.sample {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.tile {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition:
			transform 220ms ease,
			box-shadow 220ms ease;
	}
	.tile:hover {
		transform: translateY(-2px);
		box-shadow: var(--lift);
	}
	dt {
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink-2);
	}
	dd {
		font-size: clamp(38px, 4.4vw, 52px);
		font-weight: 600;
		letter-spacing: -0.03em;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}
	.tile .hint {
		margin-top: 6px;
		font-weight: 400;
		letter-spacing: 0;
		font-size: 14px;
		line-height: 1.45;
		color: var(--ink-2);
	}
	.sample-note {
		margin-top: 10px;
		font-size: 13px;
		color: var(--ink-3);
		text-align: right;
	}

	/* ---------- Commitments ---------- */
	.principles {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.principle {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 32px clamp(16px, 2.4vw, 32px);
		color: var(--ink-2);
	}
	.principle + .principle {
		border-left: 1px solid var(--line);
	}
	.principle h3 {
		margin-top: 6px;
		font-size: 18px;
		font-weight: 600;
		color: var(--ink);
	}
	.principle p {
		font-size: 15px;
		line-height: 1.55;
	}

	@media (max-width: 1000px) {
		.steps {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.step:nth-child(2)::after {
			display: none;
		}
	}
	@media (max-width: 900px) {
		.hero {
			grid-template-columns: 1fr;
			min-height: 0;
		}
		.hero-figure {
			max-width: 480px;
		}
		.split {
			grid-template-columns: 1fr;
		}
		.split.reverse .copy {
			order: 0;
		}
		.principles {
			grid-template-columns: 1fr;
		}
		.principle + .principle {
			border-left: 0;
			border-top: 1px solid var(--line);
		}
	}
	@media (max-width: 560px) {
		.steps {
			grid-template-columns: 1fr;
		}
		.step::after {
			display: none;
		}
		.hero-action,
		.hero-action :global(.btn) {
			width: 100%;
		}
		.tile {
			padding: 14px;
		}
	}
</style>
