<script lang="ts">
	import { flushSync, onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import { CHAPTERS, LESSONS, PARTS } from '#lib/courses/catalog.ts';
	import { learnerNextStep } from '#lib/courses/learner.svelte.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import CardSwap from '#lib/bits/CardSwap.svelte';
	import GradualBlur from '#lib/bits/GradualBlur.svelte';
	import EchoPreview from '#lib/landing/games/EchoPreview.svelte';
	import FallingLetters from '#lib/landing/games/FallingLetters.svelte';
	import FallingWords from '#lib/landing/games/FallingWords.svelte';
	import KeyHuntPreview from '#lib/landing/games/KeyHuntPreview.svelte';
	import ListenPreview from '#lib/landing/games/ListenPreview.svelte';
	import RacePreview from '#lib/landing/games/RacePreview.svelte';
	import MapPreview from '#lib/landing/MapPreview.svelte';
	import { partKeys, partLessons, ROWS } from '#lib/landing/partKeys.ts';
	import RankTimeline from '#lib/landing/RankTimeline.svelte';
	import { heroTakeover } from '#lib/landing/takeover.ts';
	import BrandBand from '#lib/landing/BrandBand.svelte';
	import CurvedLoop from '#lib/bits/CurvedLoop.svelte';
	import TextPressure from '#lib/bits/TextPressure.svelte';
	import { parallax, reveal, stagger } from '#lib/motion/actions.ts';
	import { motion, ScrollTrigger, whenMotion } from '#lib/motion/gsap.ts';
	import { scrollSpeed } from '#lib/motion/smooth-scroll.ts';
	import { DURATIONS, STAGGER } from '#lib/motion/tokens.ts';
	import { LESSON_MINUTES, roughTime } from '#lib/courses/journey.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import { areaRgb } from '#lib/site/areas.ts';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Icon from '#lib/ui/Icon.svelte';

	let ready = $state(false);
	let hero: HTMLElement;
	let heroCopy: HTMLElement;
	// Bound inside {#if}/{#each} blocks, so they are state.
	let heroButton = $state<HTMLElement>()!;
	let portal = $state<HTMLElement>()!;
	let portalLabel = $state<HTMLElement>()!;
	let portalLine = $state<HTMLElement>()!;
	let veil = $state<HTMLElement>()!;
	// The hero becomes a scroll track for the takeover only while motion is allowed; otherwise it stays one screen.
	let takeover = $state(false);
	let pressure = $state(0);
	// The course part at the front of the deck, and the time until the next one comes forward (0 to 1).
	let part = $state(0);
	let wait = $state(0);
	onMount(() => {
		results.load();
		ready = true;
		// three.js loads in its own chunk after the page is up.
		import('#lib/bits/Dither.svelte').then((m) => (Dither = m.default));
		const mm = whenMotion(() => {
			const entrance = enterHero(heroCopy);
			// The track has to be tall before the timeline measures it.
			flushSync(() => (takeover = true));
			const { remeasure, recolor, speed } = heroTakeover({
				track: hero,
				button: heroButton,
				portal,
				label: portalLabel,
				line: portalLine,
				veil,
				fade: [...heroCopy.querySelectorAll('h1, .lede, .resume, .quiet, .facts')],
				onPressure: (p) => (pressure = p)
			});
			// Every trigger below was measured before the hero grew into a track; measure them again.
			ScrollTrigger.refresh();
			// Web fonts move the button once they swap in.
			document.fonts?.ready.then(() => ScrollTrigger.refresh());
			// The wheel speeds through the takeover's phases (takeover.ts, PACE).
			scrollSpeed(speed);
			// Leaving the hero, the portal takes the button's rect again.
			const leave = () => {
				if (window.scrollY > 1) return;
				// The entrance still lifting the button would offset the portal.
				entrance?.progress(1);
				remeasure();
			};
			const opts = { capture: true, passive: true } as const;
			for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.addEventListener(type, leave, opts);
			// The portal blends resolved colors: take them again when the theme changes.
			const themed = new MutationObserver(recolor);
			themed.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
			const scheme = matchMedia('(prefers-color-scheme: dark)');
			scheme.addEventListener('change', recolor);
			return () => {
				themed.disconnect();
				scheme.removeEventListener('change', recolor);
				scrollSpeed();
				for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.removeEventListener(type, leave, opts);
				takeover = false;
			};
		});
		return () => mm.revert();
	});

	// Hero copy rises in on load. CSS holds it hidden until then; skip if its fallback already showed it.
	function enterHero(copy: HTMLElement): gsap.core.Tween | undefined {
		const parts = copy.children;
		const shown = getComputedStyle(parts[0]).opacity === '1';
		copy.dataset.entered = '';
		if (shown) return;
		return motion().fromTo(
			parts,
			{ opacity: 0, y: 14 },
			{ opacity: 1, y: 0, duration: DURATIONS.reveal, ease: 'out-soft', stagger: STAGGER.base, clearProps: 'transform' }
		);
	}
	let Dither = $state<Component<{ waveColors?: [number, number, number][]; colorNum?: number; pixelSize?: number; waveSpeed?: number; waveAmplitude?: number; enableMouseInteraction?: boolean; disableAnimation?: boolean; clouds?: boolean }>>();

	// Returning learners are offered their next step instead of starting again.
	const next = $derived(ready && courses.loaded ? learnerNextStep() : null);
	const returning = $derived(next !== null && next.stage !== 'welcome');
	const cta = $derived(returning && next ? { href: next.href, label: next.action } : { href: '/start', label: 'Get started' });

	// A returning learner's button changes label and moves down under the resume line once progress loads; the
	// takeover measures the button, so measure again after that render.
	$effect(() => {
		void cta.label;
		void returning;
		if (takeover) tick().then(() => ScrollTrigger.refresh());
	});

	const GAMES = [
		{ kind: 'falling', Preview: FallingLetters, title: 'Falling letters', body: 'Letters drop from the top. Type each one before it lands.' },
		{ kind: 'words', Preview: FallingWords, title: 'Falling words', body: 'Whole words fall instead of letters. Type each before it lands; they speed up as you go.' },
		{ kind: 'listen', Preview: ListenPreview, title: 'Listen and type', body: 'Hear a word and type it, without seeing it first.' },
		{ kind: 'keyhunt', Preview: KeyHuntPreview, title: 'Key hunt', body: 'A key lights up. Find it by touch before its light runs out.' },
		{ kind: 'race', Preview: RacePreview, title: 'Race', body: 'Type a passage before the pacer reaches the finish line.' },
		{ kind: 'echo', Preview: EchoPreview, title: 'Echo', body: 'The letters of a word light up one at a time and fade. Type the word from memory.' }
	] as const;

	// Site colors that pass over a few letters of the journey line.
	// Ink variants: the line sits on the band, light or dark.
	const ACCENTS = ['var(--lime-ink)', 'var(--cyan-ink)', 'var(--orange-ink)', 'var(--violet-ink)', 'var(--amber-ink)'];

	// Phrases on the curve, each led by a star with wide gaps either side (the loop trims trailing space).
	const GAP = '\u00a0'.repeat(4);
	const DRIFT = ['Your hands already know the way', 'Accuracy first, speed follows', 'A few minutes, every day', 'Eyes on the words, not the keys']
		.map((w) => `${GAP}✦${GAP}${w}`)
		.join('');

	// What a learner types by the end of each part: the typed run, then what is still ahead of the caret.
	const SAMPLES: Record<(typeof PARTS)[number]['id'], [string, string]> = {
		letters: ['a glad lass asks', ' for jars of salsa'],
		marks: ['Dear Sam, the train', ' leaves at 9:45. Ready?'],
		words: ['the river runs past', ' the old mill at dawn'],
		mastery: ['if (x > 0) { ret', 'urn [x, y]; } // 92 wpm']
	};
	const KEYS = PARTS.map((_, i) => partKeys(i));
	const KEY_LABEL: Record<string, string> = { 'shift-l': 'shift', 'shift-r': 'shift' };

	// One mark per course part in the window bars: circle, square, triangle, diamond.
	const SHAPES = [
		'<circle cx="6" cy="6" r="5.5"/>',
		'<rect x="1" y="1" width="10" height="10" rx="1.5"/>',
		'<path d="M6 .5 11.5 11h-11z"/>',
		'<path d="M6 0 12 6 6 12 0 6z"/>'
	];

	const site = $derived(page.data.siteUrl ?? '');
	const jsonLd = $derived([
		{ '@context': 'https://schema.org', '@type': 'Organization', name: 'sqwer', url: site, logo: `${site}/favicon.svg`, email: CONTACT_EMAIL },
		{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'sqwer', url: site },
		{
			'@context': 'https://schema.org',
			'@type': 'Course',
			name: 'The sqwer typing course',
			description: `A free touch-typing course of ${LESSONS.length} lessons in ${CHAPTERS.length} chapters, from the home row to fluent typing.`,
			provider: { '@type': 'Organization', name: 'sqwer', url: site },
			isAccessibleForFree: true
		}
	]);
</script>

<Seo
	description={`Learn to type properly, one key at a time: a free course of ${LESSONS.length} short lessons with games, from your first two keys to fluent typing.`}
	{jsonLd}
/>

<div class="landing">
	<!-- Hero: centered copy over the dither field. With motion, scrolling grows the button into the road band (takeover.ts). -->
	<section class="hero" bind:this={hero} data-takeover={takeover || undefined} aria-labelledby="hero-title">
		<div class="hero-stage band">
			<div class="hero-field">
				{#if Dither}
					<Dither waveColors={areaRgb()} colorNum={4} pixelSize={2} waveSpeed={0.04} waveAmplitude={0.3} clouds={false} enableMouseInteraction={false} />
				{/if}
			</div>
			<div class="hero-copy" bind:this={heroCopy}>
				<h1 id="hero-title">Stop looking down. Start typing <span class="mark">for real</span>.</h1>
				<p class="lede">
					Short lessons, games and a clear road from your first two keys to fluent typing. Built for complete beginners, and
					for self-taught typists who want to do it right.
				</p>
				<div class="hero-action">
					{#if returning && next}
						<p class="resume"><Icon name="route" size={16} /> {next.title}</p>
					{/if}
					<!-- One button for both states: the takeover holds on to this element, so it must never be swapped. -->
					<a class="btn btn-primary btn-lg" href={cta.href} bind:this={heroButton}>{cta.label} <Icon name="arrow" size={18} /></a>
					<a class="link-arrow quiet" href="#road">See the whole course <Icon name="chevron" size={16} class="down" /></a>
				</div>
				<ul class="facts" aria-label="Key facts">
					<li><Icon name="check" size={16} /> Free</li>
					<li><Icon name="flag" size={16} /> Starts from zero</li>
				</ul>
			</div>
			{#if takeover}
				<div class="hero-veil" bind:this={veil} aria-hidden="true"></div>
				<div class="portal" bind:this={portal} aria-hidden="true">
					<span class="portal-label btn-lg" bind:this={portalLabel}>
						{cta.label} <Icon name="arrow" size={18} />
					</span>
					<span class="portal-line" bind:this={portalLine}>
						<TextPressure text="Your journey" {pressure} accents={ACCENTS} />
						<TextPressure text="starts here" pressure={Math.min(1, pressure * 1.15)} accents={ACCENTS.slice(2)} />
					</span>
				</div>
			{/if}
		</div>
	</section>

	<!-- The course road: one window per course part; idle windows take turns at the front. -->
	<section id="road" class="road band on-band" data-area="learn" aria-labelledby="road-title">
		<div class="road-stage">
			<header class="section-head" use:stagger>
				<p class="kicker">The course</p>
				<h2 id="road-title">One long road, {CHAPTERS.length} chapters, {LESSONS.length} lessons.</h2>
				<p class="road-lede">
					Four parts, each built on the one before. Start at the beginning, or let a one-minute test find your chapter.
				</p>
				<div class="road-progress">
					<span class="count" aria-hidden="true">{String(part + 1).padStart(2, '0')} / {String(PARTS.length).padStart(2, '0')}</span>
					<span class="ticks" aria-hidden="true">
						{#each PARTS as q, i (q.id)}
							<span class:done={i < part} class:on={i === part} style:--part="var(--{q.colour})" style:--fill={i === part ? wait : 0}></span>
						{/each}
					</span>
				</div>
				<p class="road-end"><a class="link-arrow" href="/learn">Open the full roadmap <Icon name="arrow" size={16} /></a></p>
			</header>
			<div class="road-deck" use:reveal={{ y: 40 }}>
				<div class="deck-anchor">
					<CardSwap
						items={[...PARTS]}
						bind:current={part}
						bind:wait
						width="var(--card-w)"
						height="var(--card-h)"
						spreadX={0.06}
						spreadY={0.11}
						rotateX={6}
						rotateY={10}
						perspective={2400}
						interval={6}
						label="Course parts"
					>
						{#snippet card(q, i)}
							<div class="window" style:--part="var(--{q.colour})" style:--part-ink="var(--{q.colour}-ink)">
								<div class="window-bar">
									<span class="shapes" aria-hidden="true">
										{#each PARTS as _, j (j)}
											<svg class="shape" class:lit={j <= i} viewBox="0 0 12 12">{@html SHAPES[j]}</svg>
										{/each}
									</span>
									<h3>{q.title}</h3>
								</div>
								<div class="window-body">
									<div class="w-head">
										<span class="w-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
										<p class="window-summary">{q.summary}</p>
									</div>
									<p class="w-type" aria-hidden="true"><span class="typed">{SAMPLES[q.id][0]}</span><span class="caret"></span><span class="ahead">{SAMPLES[q.id][1]}</span></p>
									<div class="w-board" aria-hidden="true">
										{#each ROWS as row, r (r)}
											<div class="w-row" style:--indent={r}>
												{#each row as k (k)}
													<span class="w-key {KEYS[i]!.get(k)}" class:wide={k.startsWith('shift')}>{KEY_LABEL[k] ?? k}</span>
												{/each}
											</div>
										{/each}
									</div>
									<dl class="w-stats">
										<div><dt>Chapters</dt><dd>{q.chapters.length}</dd></div>
										<div><dt>Lessons</dt><dd>{partLessons(q)}</dd></div>
										<div><dt>Course time</dt><dd>{roughTime(partLessons(q) * LESSON_MINUTES)}</dd></div>
									</dl>
								</div>
							</div>
						{/snippet}
					</CardSwap>
				</div>
				<GradualBlur position="bottom" height="var(--drop)" strength={2.4} divCount={8} curve="bezier" zIndex={20} />
			</div>
		</div>
	</section>

	<!-- Between the road and the games: a curved line of encouragement, drifting on its own. -->
	<div class="drift band on-band">
		<CurvedLoop text={DRIFT} speed={45} curveAmount={-48} interactive={false} />
	</div>

	<!-- Games: a band with live previews. -->
	<section class="games band on-band" data-area="games" aria-labelledby="games-title">
		<header class="section-head" use:reveal>
			<p class="kicker">Learn by playing</p>
			<h2 id="games-title">Practice that feels like a game.</h2>
			<p>Every lesson mixes short drills with games, so repetition never feels like repetition.</p>
		</header>
		<div class="game-grid">
			{#each GAMES as g, i (g.kind)}
				<!-- Stagger per row of three; each card triggers on its own, so phones never wait. -->
				<article class="game" use:reveal={{ delay: (i % 3) * STAGGER.base }}>
					<div class="preview" aria-hidden="true"><g.Preview /></div>
					<h3>{g.title}</h3>
					<p>{g.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- The name on the games' ground, between the games and the ranks. -->
	<BrandBand />

	<!-- Ranks: motivation without competition. -->
	<section class="ranks band" data-area="competitive" aria-labelledby="ranks-title">
		<header class="section-head center" use:reveal>
			<p class="kicker">Ranks and streaks</p>
			<h2 id="ranks-title">Watch yourself grow.</h2>
			<p>Earn stars in every lesson and climb ten ranks, from Novice to Legend. Your progress is measured against yourself, never against others.</p>
		</header>
		<RankTimeline />
	</section>

	<!-- For typists who already type. -->
	<section class="split band technique" data-area="map" aria-labelledby="map-title">
		<div class="copy" use:reveal>
			<p class="kicker">Already type?</p>
			<h2 id="map-title">See how your hands really type.</h2>
			<p>
				Self-taught typists often use their own fingering. The finger map records which finger you use for every key, and
				the finger speed assessment measures each finger, so you know exactly what to retrain.
			</p>
			<ul class="checks">
				<li><Icon name="check" size={18} /> Keys you type with a non-standard finger</li>
				<li><Icon name="check" size={18} /> Habits that depend on the neighboring key</li>
				<li><Icon name="check" size={18} /> The speed and accuracy of each finger</li>
			</ul>
		</div>
		<div class="visual" use:parallax={{ distance: -40 }}>
			<div class="card" use:reveal={{ delay: STAGGER.base }}>
				<MapPreview />
			</div>
		</div>
	</section>

</div>

<style>
	.landing {
		display: flex;
		flex-direction: column;
		/* The last band runs down to the footer: no strip of page and no second border between them. */
		margin-bottom: calc(-1 * var(--main-bottom));
	}
	.kicker {
		font-size: 13px;
		font-weight: 700;
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
	.section-head.center {
		margin: 0 auto;
		text-align: center;
	}
	.section-head > p:last-child {
		margin-top: 14px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}

	/* ---------- Hero ---------- */
	.hero {
		/* A soft wash of the page color keeps the copy readable over the field. */
		--band: radial-gradient(ellipse 46% 52% at 50% 50%, var(--bg) 30%, color-mix(in srgb, var(--bg) 70%, transparent) 60%, transparent 100%);
		/* Starts at the page top, under the floating header and over main's top padding. */
		margin-top: calc(-1 * (var(--header-h) + var(--main-top)));
	}
	/* The takeover track: the stage holds still for 1.8 screens of scroll while the button grows. */
	.hero[data-takeover] {
		height: 280vh;
		height: 280svh;
	}
	.hero-stage {
		display: grid;
		place-items: center;
		/* Fills the first screen; svh keeps it steady while mobile toolbars move. */
		min-height: 100vh;
		min-height: 100svh;
		padding: calc(var(--header-h) + clamp(48px, 10vh, 112px)) 0 clamp(48px, 10vh, 112px);
	}
	.hero[data-takeover] .hero-stage {
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100svh;
	}
	/* Corners blur and fall into a vignette as the portal opens. */
	.hero-veil {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		z-index: 1;
		visibility: hidden;
		pointer-events: none;
		background: radial-gradient(ellipse 72% 68% at 50% 50%, transparent 38%, color-mix(in srgb, var(--band-bg) 72%, transparent) 100%);
		-webkit-backdrop-filter: blur(14px);
		backdrop-filter: blur(14px);
		mask-image: radial-gradient(ellipse 72% 68% at 50% 50%, transparent 32%, #000 92%);
	}
	/* The band that grows out of the button; GSAP clips it to the button first. */
	.portal {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		z-index: 2;
		display: grid;
		place-items: center;
		visibility: hidden;
		pointer-events: none;
		background: var(--band-bg);
		color: var(--band-ink);
	}
	.portal-label,
	.portal-line {
		grid-area: 1 / 1;
	}
	.portal-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
		white-space: nowrap;
	}
	.portal-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		visibility: hidden;
		line-height: 0.92;
		letter-spacing: -0.02em;
	}
	/* Full-bleed dither field, under the wash. */
	.hero-field {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		z-index: -2;
		overflow: hidden;
		/* Fades out at the bottom so the road band below meets no hard edge. */
		mask-image: linear-gradient(to bottom, #000 72%, transparent);
		animation: field-in 1200ms ease-out both;
	}
	@keyframes field-in {
		from {
			opacity: 0;
		}
	}
	/* The field reads louder on cream than on black. */
	:global(:root:not([data-theme='dark'])) .hero-field {
		opacity: 0.7;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .hero-field {
			opacity: 1;
		}
	}
	.hero-copy {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 820px;
	}
	h1 {
		font-size: clamp(42px, 6vw, 84px);
		line-height: 1;
		letter-spacing: -0.025em;
		max-width: 15ch;
	}
	/* Emphasis is carried by weight alone. */
	.mark {
		font-weight: 800;
	}
	.lede {
		margin-top: 22px;
		max-width: 520px;
		font-size: clamp(17px, 1.5vw, 19px);
		line-height: 1.6;
		color: var(--ink-2);
	}
	.hero-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		margin-top: 30px;
	}
	.resume {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink-2);
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
		justify-content: center;
		margin-top: 34px;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		font-size: 14px;
		color: var(--ink-2);
	}
	.facts li {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	/* Held until enterHero runs; shown anyway after 2s if scripts never do. */
	@media (prefers-reduced-motion: no-preference) {
		.hero-copy:not([data-entered]) > * {
			opacity: 0;
			animation: hero-fallback 0s 2s forwards;
		}
	}
	@keyframes hero-fallback {
		to {
			opacity: 1;
		}
	}

	/* ---------- The road ---------- */
	/* A band. Its top padding fades in from the page, so the hero runs into it without a seam. */
	.road {
		padding-top: 28svh;
		color: var(--band-ink);
	}
	.road::before {
		background: linear-gradient(
			to bottom,
			transparent,
			color-mix(in srgb, var(--band-bg) 20%, transparent) 6svh,
			color-mix(in srgb, var(--band-bg) 65%, transparent) 15svh,
			var(--band-bg) 28svh
		);
	}
	.road .kicker {
		color: var(--accent-ink);
	}
	.road .link-arrow {
		color: var(--band-ink);
	}
	/* After the takeover the page is already the band: the road starts solid, without the fade from the hero. */
	.landing:has(.hero[data-takeover]) .road {
		padding-top: clamp(64px, 9vw, 112px);
	}
	.landing:has(.hero[data-takeover]) .road::before {
		background: var(--band-bg);
	}
	.road-stage {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		align-items: center;
		gap: 48px;
		margin-right: calc(50% - 50vw);
	}
	.road-stage .section-head {
		margin: 0;
		text-align: left;
	}
	.road-lede {
		margin-top: 14px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--band-ink-2);
	}
	.road-progress {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 28px;
	}
	.count {
		font-variant-numeric: tabular-nums;
		font-size: 14px;
		color: var(--band-ink-2);
	}
	.ticks {
		display: flex;
		gap: 6px;
	}
	/* One bar per part: parts behind are filled, the one in front fills up until the next card comes forward. */
	.ticks span {
		position: relative;
		width: 40px;
		height: 4px;
		overflow: hidden;
		border-radius: 1px;
		background: color-mix(in srgb, var(--band-ink) 15%, transparent);
	}
	.ticks span::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--part);
		transform: scaleX(var(--fill));
		transform-origin: left;
	}
	.ticks span.done::after {
		transform: none;
		opacity: 0.45;
	}
	/* Without the clock (reduced motion, no scripts) the front part just shows as filled. */
	@media (prefers-reduced-motion: reduce) {
		.ticks span.on::after {
			transform: none;
		}
	}
	.road-end {
		margin-top: 24px;
	}
	/* Deck column runs to the screen edge; windows bleed off its right and bottom. The blur covers the bottom strip. */
	.road-deck {
		--card-w: max(64rem, 58vw);
		--card-h: min(740px, 82svh);
		--drop: 220px;
		position: relative;
		display: flex;
		align-items: flex-end;
		/* The front window plus the strips of the three behind it, less what bleeds off the bottom. */
		height: calc(var(--card-h) * 1.3);
		overflow: clip;
		/* The last strip fades into the band, so the blur's bottom edge never shows the page behind the screen edge. */
		mask-image: linear-gradient(to bottom, #000 calc(100% - var(--drop) * 0.45), transparent);
	}
	.deck-anchor {
		--card-radius: 18px;
		margin-bottom: calc(var(--card-h) * -0.04);
	}
	.road-deck :global(.deck > ol > li) {
		border-color: color-mix(in srgb, var(--band-ink) 16%, transparent);
		background: var(--band-bg);
	}
	/* A window: title bar in the part's colour with the four part marks, body tinted by the part. */
	.window {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: color-mix(in srgb, var(--part) 10%, var(--band-bg-deep));
	}
	.window-bar {
		display: flex;
		align-items: center;
		gap: 18px;
		height: 64px;
		flex: none;
		padding: 0 24px;
		background: var(--part);
		color: var(--on-hue);
	}
	.shapes {
		display: flex;
		gap: 8px;
	}
	.shape {
		width: 13px;
		height: 13px;
		fill: color-mix(in srgb, var(--on-hue) 28%, transparent);
	}
	.shape.lit {
		fill: var(--white);
		filter: drop-shadow(0 1px 1.5px color-mix(in srgb, var(--on-hue) 45%, transparent));
	}
	.window-bar h3 {
		overflow: hidden;
		font-size: 19px;
		font-weight: 700;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	.window-body {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 30px 34px;
		transition: opacity 400ms ease;
	}
	.window-summary {
		max-width: 22ch;
		font-family: var(--font-serif);
		font-size: clamp(26px, 2.6vw, 38px);
		line-height: 1.15;
		color: var(--band-ink);
	}
	.w-head {
		display: flex;
		align-items: baseline;
		gap: 22px;
	}
	.w-num {
		font-family: var(--font-mono);
		font-size: clamp(36px, 3.4vw, 52px);
		font-weight: 300;
		line-height: 1;
		color: var(--part-ink);
	}
	/* A line as the learner types it by the end of the part, the caret where the hands are. */
	.w-type {
		font-family: var(--font-mono);
		font-size: clamp(15px, 1.25vw, 19px);
		white-space: nowrap;
		color: var(--band-ink-3);
	}
	.w-type .typed {
		color: var(--band-ink);
	}
	.caret {
		display: inline-block;
		width: 0.6em;
		height: 1.15em;
		margin: 0 1px -0.2em;
		background: var(--part);
		animation: caret 1.1s steps(1) infinite;
	}
	@keyframes caret {
		50% {
			opacity: 0;
		}
	}
	/* The part's keys on a small board: new ones in the part color, earlier ones dim, the rest outlined. */
	.w-board {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.w-row {
		display: flex;
		gap: 5px;
		padding-left: calc(var(--indent) * 14px);
	}
	.w-key {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		border: 1px solid color-mix(in srgb, var(--band-ink) 14%, transparent);
		font-family: var(--font-mono);
		font-size: 12px;
		color: color-mix(in srgb, var(--band-ink) 35%, transparent);
	}
	.w-key.wide {
		width: 48px;
		font-size: 10px;
	}
	.w-key.known {
		border-color: color-mix(in srgb, var(--part) 30%, transparent);
		background: color-mix(in srgb, var(--part) 12%, transparent);
		color: var(--band-ink-2);
	}
	.w-key.new {
		border-color: var(--part);
		background: var(--part);
		color: var(--on-hue);
		font-weight: 600;
	}
	.w-stats {
		display: flex;
		gap: 36px;
		padding-top: 18px;
		border-top: 1px solid color-mix(in srgb, var(--part) 25%, transparent);
	}
	.w-stats dt {
		font-size: 12px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--band-ink-3);
	}
	.w-stats dd {
		margin-top: 4px;
		font-family: var(--font-mono);
		font-size: 20px;
		color: var(--band-ink);
	}
	/* Behind the front window only the title bars read; their bodies stay empty. */
	.road-deck :global(.deck > ol > li:not([aria-current]) .window-body) {
		opacity: 0;
	}

	/* ---------- Drift ---------- */
	/* Clear air above and below the curve, so the road and the games each get their own room. */
	.drift {
		--band: var(--band-bg);
		padding: clamp(140px, 18vw, 280px) 0 clamp(120px, 15vw, 240px);
		color: var(--band-ink);
	}
	.drift :global(.curved) {
		width: 100vw;
		margin-inline: calc(50% - 50vw);
		font-family: var(--font-serif);
		font-size: 30px;
		letter-spacing: 0.01em;
		color: var(--band-ink-2);
	}

	/* ---------- Games ---------- */
	.games {
		padding: clamp(64px, 9vw, 112px) 0;
		color: var(--band-ink);
	}
	.games::before {
		background:
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 24px 24px,
			var(--band-bg);
	}
	.games .kicker {
		color: var(--accent-ink);
	}
	.games .section-head > p:last-child {
		color: var(--band-ink-2);
	}
	.game-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
		margin-top: 40px;
	}
	.game {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 14px 14px 20px;
		border-radius: 3px;
		border: 1px solid var(--band-line);
		background: var(--band-surface);
	}
	.game h3 {
		margin-top: 8px;
		font-size: 18px;
		font-weight: 700;
	}
	.game p {
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--band-ink-2);
	}
	.preview {
		position: relative;
		height: 170px;
		overflow: hidden;
		border-radius: 3px;
		background:
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 16px 16px,
			var(--band-bg);
		border: 1px solid var(--band-line);
	}
	/* ---------- Ranks ---------- */
	.ranks {
		padding: clamp(64px, 9vw, 112px) 0;
	}

	/* ---------- Technique ---------- */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: clamp(28px, 5vw, 64px);
		align-items: center;
	}
	.technique {
		--band: var(--surface);
		padding: clamp(64px, 9vw, 112px) 0;
	}
	.technique::before {
		border-top: 1px solid var(--line);
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
	.visual .card {
		background: var(--bg);
		padding: clamp(18px, 2.4vw, 28px);
	}

	@media (max-width: 1000px) {
		.game-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 900px) {
		.hero {
			--band: radial-gradient(ellipse 95% 48% at 50% 50%, var(--bg) 40%, color-mix(in srgb, var(--bg) 70%, transparent) 70%, transparent 100%);
		}
		.split {
			grid-template-columns: 1fr;
		}
		/* The road stacks: copy over the deck. */
		.road-stage {
			grid-template-columns: minmax(0, 1fr);
			gap: 28px;
		}
		.road-stage .section-head {
			padding-right: 16px;
		}
		.road-lede {
			font-size: 15px;
		}
		.road-progress {
			margin-top: 16px;
		}
		.road-end {
			margin-top: 12px;
		}
		.road-deck {
			--card-w: 100vw;
			--card-h: min(520px, 62svh);
			--drop: 120px;
		}
		.deck-anchor {
			--card-radius: 14px;
		}
		.window-bar {
			height: 50px;
			gap: 12px;
			padding: 0 16px;
		}
		.window-bar h3 {
			font-size: 16px;
		}
		.window-body {
			gap: 18px;
			padding: 22px 20px;
		}
		.window-summary {
			font-size: 24px;
		}
		.w-key {
			width: 22px;
			height: 22px;
			font-size: 10px;
		}
		.w-key.wide {
			width: 36px;
		}
		.w-row {
			gap: 3px;
			padding-left: calc(var(--indent) * 8px);
		}
		.w-board {
			gap: 3px;
		}
		.w-stats {
			gap: 22px;
		}
	}
	@media (max-width: 560px) {
		/* The curve scales with the screen; on phones its type needs more viewBox units to stay readable. */
		.drift :global(.curved) {
			font-size: 64px;
		}
		.game-grid {
			grid-template-columns: 1fr;
		}
		.hero-action,
		.hero-action :global(.btn) {
			width: 100%;
		}
	}
</style>
