<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import type { Component } from 'svelte';
	import { CHAPTERS, LESSONS } from '#lib/courses/catalog.ts';
	import { learnerNextStep } from '#lib/courses/learner.svelte.ts';
	import { RANKS } from '#lib/courses/progression.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import { courses } from '#lib/courses/store.svelte.ts';
	import CardSwap from '#lib/bits/CardSwap.svelte';
	import GradualBlur from '#lib/bits/GradualBlur.svelte';
	import MapPreview from '#lib/landing/MapPreview.svelte';
	import { motion, ScrollTrigger, whenMotion } from '#lib/motion/gsap.ts';
	import { DURATIONS, STAGGER } from '#lib/motion/tokens.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import { areaRgb } from '#lib/site/areas.ts';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { reveal } from '#lib/ui/reveal.ts';

	let ready = $state(false);
	let heroCopy: HTMLElement;
	let roadTrack: HTMLElement;
	// Chapter at the front of the road deck; scrolling through the track moves it.
	let chapter = $state(0);
	let roadScrolls = $state(false);
	onMount(() => {
		results.load();
		ready = true;
		// three.js loads in its own chunk after the page is up.
		import('#lib/bits/Dither.svelte').then((m) => (Dither = m.default));
		const mm = whenMotion(() => enterHero(heroCopy));
		let road: ScrollTrigger | undefined;
		roadScrolls = true;
		tick().then(() => (road = roadScroll(roadTrack)));
		return () => {
			mm.revert();
			road?.kill();
		};
	});

	// The track gets one scroll step per chapter (CSS, behind data-scroll) while its stage stays stuck.
	// Without scripts it stays one screen tall and shows the first chapter.
	function roadScroll(track: HTMLElement) {
		motion();
		const last = CHAPTERS.length - 1;
		return ScrollTrigger.create({
			trigger: track,
			start: 'top top',
			end: 'bottom bottom',
			onUpdate: (st) => (chapter = Math.round(st.progress * last))
		});
	}

	// Hero copy rises in on load. CSS holds it hidden until then; skip if its fallback already showed it.
	function enterHero(copy: HTMLElement) {
		const parts = copy.children;
		const shown = getComputedStyle(parts[0]).opacity === '1';
		copy.dataset.entered = '';
		if (shown) return;
		motion().fromTo(
			parts,
			{ opacity: 0, y: 14 },
			{ opacity: 1, y: 0, duration: DURATIONS.reveal, ease: 'out-soft', stagger: STAGGER.base, clearProps: 'transform' }
		);
	}
	let Dither = $state<Component<{ waveColors?: [number, number, number][]; colorNum?: number; pixelSize?: number; waveSpeed?: number; waveAmplitude?: number; enableMouseInteraction?: boolean }>>();

	// Returning learners are offered their next step instead of starting again.
	const next = $derived(ready && courses.loaded ? learnerNextStep() : null);
	const returning = $derived(next !== null && next.stage !== 'welcome');

	const GAMES = [
		{ kind: 'falling', title: 'Falling letters', body: 'Letters drop from the top. Type each one before it lands.' },
		{ kind: 'words', title: 'Falling words', body: 'Whole words fall instead of letters. Type each before it lands; they speed up as you go.' },
		{ kind: 'listen', title: 'Listen and type', body: 'Hear a word and type it, without seeing it first.' },
		{ kind: 'keyhunt', title: 'Key hunt', body: 'A key lights up. Find it by touch before its light runs out.' },
		{ kind: 'race', title: 'Race', body: 'Type a passage before the pacer reaches the finish line.' },
		{ kind: 'echo', title: 'Echo', body: 'The letters of a word light up one at a time and fade. Type the word from memory.' }
	] as const;

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
	<!-- Hero: centered copy over the dither field. -->
	<section class="hero band" aria-labelledby="hero-title">
		<div class="hero-field">
			{#if Dither}
				<Dither waveColors={areaRgb()} colorNum={4} pixelSize={2} waveSpeed={0.03} waveAmplitude={0.3} enableMouseInteraction={false} />
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
					<a class="btn btn-primary btn-lg" href={next.href}>{next.action} <Icon name="arrow" size={18} /></a>
				{:else}
					<a class="btn btn-primary btn-lg" href="/start">Get started <Icon name="arrow" size={18} /></a>
				{/if}
				<a class="link-arrow quiet" href="#road">See the whole course <Icon name="chevron" size={16} class="down" /></a>
			</div>
			<ul class="facts" aria-label="Key facts">
				<li><Icon name="check" size={16} /> Free</li>
				<li><Icon name="flag" size={16} /> Starts from zero</li>
				<li><Icon name="lock" size={16} /> No ads or tracking</li>
			</ul>
		</div>
	</section>

	<!-- The course road: one card per chapter, swapped by scrolling through the section. -->
	<section id="road" class="road band" data-area="learn" aria-labelledby="road-title">
		<div class="road-track" bind:this={roadTrack} data-scroll={roadScrolls || undefined} style:--steps={CHAPTERS.length - 1}>
			<div class="road-stage">
				<header class="section-head">
					<p class="kicker">The course</p>
					<h2 id="road-title">One long road, {CHAPTERS.length} chapters, {LESSONS.length} lessons.</h2>
					<p>
						Each chapter adds a few keys or one skill, and gives you everything the next chapter needs. Start at the beginning,
						or let a one-minute test find your chapter.
					</p>
					<div class="road-progress" aria-hidden="true">
						<span class="count">{String(chapter + 1).padStart(2, '0')} / {CHAPTERS.length}</span>
						<span class="ticks">
							{#each CHAPTERS as c, i (c.number)}
								<span class:on={i <= chapter}></span>
							{/each}
						</span>
					</div>
					<p class="road-end"><a class="link-arrow" href="/learn">Open the full roadmap <Icon name="arrow" size={16} /></a></p>
				</header>
				<div class="road-deck">
					<CardSwap items={CHAPTERS} active={chapter} width="min(400px, (100vw - 40px) / 1.36)" height="var(--card-h)" label="Course chapters">
						{#snippet card(c)}
							<div class="chapter">
								<h3>{c.title}</h3>
								<p>{c.summary}</p>
							</div>
						{/snippet}
					</CardSwap>
					<GradualBlur position="bottom" height="var(--drop)" strength={2} divCount={6} curve="bezier" zIndex={20} />
				</div>
			</div>
		</div>
	</section>

	<!-- Games: a dark band with live previews. -->
	<section class="games band on-dark" data-area="games" aria-labelledby="games-title">
		<header class="section-head" use:reveal>
			<p class="kicker">Learn by playing</p>
			<h2 id="games-title">Practice that feels like a game.</h2>
			<p>Every lesson mixes short drills with games, so repetition never feels like repetition.</p>
		</header>
		<div class="game-grid">
			{#each GAMES as g, i (g.kind)}
				<article class="game" use:reveal={{ delay: i * 80 }}>
					<div class={`preview p-${g.kind}`} aria-hidden="true">
						{#if g.kind === 'falling'}
							{#each ['f', 'j', 'k', 'd', 'g'] as l, n (l)}<span class="fl" style:left={`${10 + n * 19}%`} style:--n={n}>{l}</span>{/each}
							<span class="pop"></span>
							<span class="floor"></span>
						{:else if g.kind === 'words'}
							{#each ['steady', 'hand', 'river', 'quiet'] as w, n (w)}<span class="fl fw" style:left={`${6 + n * 23}%`} style:--n={n}>{w}</span>{/each}
							<span class="floor"></span>
						{:else if g.kind === 'listen'}
							<span class="speaker"><span class="wave">{#each [0, 1, 2, 3, 4, 5, 6, 7, 8] as n (n)}<span style:--n={n}></span>{/each}</span></span>
							<span class="typed">steady<span class="caret"></span></span>
						{:else if g.kind === 'keyhunt'}
							<span class="mini-kb">
								{#each ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'] as row, r (row)}
									<span class="kb-row" style:--r={r}>{#each [...row] as k (k)}<span class="mk" class:target={k === 'j'}>{k}</span>{/each}</span>
								{/each}
							</span>
							<span class="fuse"></span>
						{:else if g.kind === 'race'}
							{#each ['me', 'pace'] as who (who)}
								<span class="race-lane">
									<span class="trail {who}"></span>
									<span class="runner {who}"></span>
									<span class="flag"></span>
								</span>
							{/each}
							<span class="race-text">the quick <b>r</b><span>ace</span></span>
						{:else}
							<span class="echo-label">Watch, then repeat</span>
							<span class="echo-row">{#each ['s', 'k', 'd', 'l'] as k, n (n)}<span class="ek" style:--n={n}>{k}</span>{/each}</span>
						{/if}
					</div>
					<h3>{g.title}</h3>
					<p>{g.body}</p>
				</article>
			{/each}
		</div>
	</section>

	<!-- Ranks: motivation without competition. -->
	<section class="ranks band" data-area="competitive" aria-labelledby="ranks-title">
		<header class="section-head center" use:reveal>
			<p class="kicker">Ranks and streaks</p>
			<h2 id="ranks-title">Watch yourself grow.</h2>
			<p>Earn stars in every lesson and climb ten ranks, from Novice to Legend. Your progress is measured against yourself, never against others.</p>
		</header>
		<ol class="ladder" use:reveal>
			{#each RANKS as r, i (r.level)}
				<li style:--i={i}><RankBadge rank={r} size={i === RANKS.length - 1 ? 64 : 48} /><span>{r.name}</span></li>
			{/each}
		</ol>
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
		<div class="visual card" use:reveal={{ delay: 120 }}>
			<MapPreview />
		</div>
	</section>

	<section class="principles" data-area="practice" aria-labelledby="principles-title" use:reveal>
		<h2 id="principles-title" class="sr-only">Commitments</h2>
		<div class="principle">
			<Icon name="user" size={22} />
			<h3>Free to learn</h3>
			<p>The whole course is free. An account saves your progress, stars and rank on every device.</p>
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
		display: grid;
		place-items: center;
		/* Fills the first screen; svh keeps it steady while mobile toolbars move. */
		min-height: 100vh;
		min-height: 100svh;
		/* Starts at the page top, under the floating header and over main's top padding. */
		margin-top: calc(-1 * (var(--header-h) + var(--main-top)));
		padding: calc(var(--header-h) + clamp(48px, 10vh, 112px)) 0 clamp(48px, 10vh, 112px);
	}
	/* Full-bleed dither field, under the wash. */
	.hero-field {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		z-index: -2;
		overflow: hidden;
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
	.road {
		padding: clamp(64px, 9vw, 112px) 0;
	}
	/* A survey-map ground: area-tinted light from the top over the surface. */
	.road::before {
		background:
			radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%),
			radial-gradient(ellipse 45% 35% at 100% 100%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%),
			var(--surface);
		border-block: 1px solid var(--line);
	}
	/* Map grid with key-sized cells, fading out toward the edges. */
	.road::after {
		content: '';
		position: absolute;
		inset: 0 calc(50% - 50vw);
		z-index: -1;
		pointer-events: none;
		--grid: color-mix(in srgb, var(--ink) 7%, transparent);
		background:
			linear-gradient(var(--grid) 1px, transparent 1px) 50% 0 / 40px 40px,
			linear-gradient(90deg, var(--grid) 1px, transparent 1px) 50% 0 / 40px 40px;
		mask-image: radial-gradient(ellipse 75% 65% at 50% 35%, #000 25%, transparent 100%);
	}
	.road-track[data-scroll] {
		height: calc(100svh + var(--steps) * 38svh);
	}
	.road-stage {
		position: sticky;
		top: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		align-items: center;
		gap: 48px;
		min-height: 100svh;
		padding-top: var(--header-h);
	}
	.road-stage .section-head {
		margin: 0;
		text-align: left;
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
		color: var(--ink-2);
	}
	.ticks {
		display: flex;
		gap: 4px;
	}
	.ticks span {
		width: 14px;
		height: 4px;
		border-radius: 1px;
		background: color-mix(in srgb, var(--ink) 15%, transparent);
		transition: background-color 220ms ease;
	}
	.ticks span.on {
		background: var(--accent);
	}
	.road-end {
		margin-top: 24px;
	}
	/* Room for the stack's offsets; the blur covers where the front card drops out. */
	.road-deck {
		--card-h: 210px;
		--drop: 96px;
		position: relative;
		display: grid;
		place-items: end start;
		padding: 40px 0 var(--drop);
		overflow: clip;
	}
	.chapter {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		gap: 8px;
		height: 100%;
		padding: 24px 26px;
	}
	/* Only the front card shows its text; the stack behind reads as paper. */
	.road-deck :global(li:not([aria-current]) .chapter) {
		opacity: 0;
	}
	.chapter {
		transition: opacity 300ms ease;
	}
	.chapter h3 {
		font-family: var(--font-serif);
		font-size: 26px;
		font-weight: 400;
		line-height: 1.15;
	}
	.chapter p {
		font-size: 15px;
		line-height: 1.5;
		color: var(--ink-2);
	}

	/* ---------- Games ---------- */
	.games {
		padding: clamp(64px, 9vw, 112px) 0;
		color: var(--band-ink);
	}
	.games::before {
		background:
			radial-gradient(ellipse 50% 60% at 85% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 24px 24px,
			var(--band-bg);
	}
	.games .kicker {
		color: var(--accent);
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
		transition:
			transform 220ms ease,
			border-color 220ms ease;
	}
	.game:hover {
		transform: translateY(-3px);
		border-color: var(--band-line-strong);
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
			radial-gradient(120% 90% at 50% 120%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 60%),
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 16px 16px,
			var(--band-bg);
		border: 1px solid var(--band-line);
	}
	.game:hover .preview {
		border-color: var(--band-line-strong);
	}
	/* Falling letters: keycaps drop, and one bursts as it is typed. */
	.fl {
		position: absolute;
		top: -36px;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 3px;
		border-bottom: 3px solid var(--band-ink-3);
		background: var(--band-ink);
		color: var(--band-bg);
		font-family: var(--font-mono);
		font-weight: 600;
		animation: fall 3.4s linear infinite;
		animation-delay: calc(var(--n) * -0.68s);
	}
	@keyframes fall {
		to {
			transform: translateY(190px);
		}
	}
	.pop {
		position: absolute;
		left: 46%;
		top: 52%;
		width: 44px;
		height: 44px;
		border-radius: 3px;
		border: 3px solid var(--accent);
		animation: pop-burst 1.7s ease-out infinite;
	}
	@keyframes pop-burst {
		0%,
		60% {
			opacity: 0;
			transform: scale(0.4) rotate(0deg);
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: scale(1.6) rotate(45deg);
		}
	}
	.floor {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 14px;
		background: color-mix(in srgb, var(--accent) 26%, var(--band-bg));
		border-top: 2px solid var(--accent);
		box-shadow: 0 -10px 24px -8px color-mix(in srgb, var(--accent) 50%, transparent);
	}
	/* Falling words: whole words drop in place of letters. */
	.fw {
		width: auto;
		padding: 0 8px;
		font-size: 13px;
		animation-duration: 4.4s;
		animation-delay: calc(var(--n) * -1.1s);
	}
	/* Listening: a voice wave and the word appearing as it is typed. */
	.p-listen,
	.p-keyhunt,
	.p-echo,
	.p-race {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 14px;
		padding: 0 18px;
	}
	.speaker {
		display: grid;
		place-items: center;
		width: 120px;
		height: 56px;
		border-radius: 3px;
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
	}
	.wave {
		display: flex;
		align-items: center;
		gap: 5px;
		height: 36px;
	}
	.wave span {
		width: 4px;
		height: 100%;
		border-radius: 2px;
		background: var(--accent);
		animation: wave 1.1s ease-in-out infinite;
		animation-delay: calc(var(--n) * -0.13s);
	}
	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.2);
		}
		50% {
			transform: scaleY(1);
		}
	}
	.typed {
		font-family: var(--font-mono);
		font-size: 20px;
		color: var(--band-ink);
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 2px;
		vertical-align: -0.12em;
		background: var(--accent);
		animation: blink 1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
	/* Key hunt: a small keyboard with one key lit and its fuse running out. */
	.mini-kb {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.kb-row {
		display: flex;
		gap: 4px;
		margin-left: calc(var(--r) * 9px);
	}
	.mk {
		display: grid;
		place-items: center;
		width: 20px;
		height: 22px;
		border-radius: 3px;
		border: 1px solid var(--band-line);
		border-bottom-width: 2px;
		background: var(--band-surface);
		color: var(--band-ink-3);
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
	}
	.mk.target {
		border-color: var(--accent);
		background: var(--accent);
		color: var(--on-accent);
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 60%, transparent);
		animation: hunt 2.4s ease-in-out infinite;
	}
	@keyframes hunt {
		0%,
		100% {
			transform: translateY(0);
		}
		80% {
			transform: translateY(0);
		}
		88% {
			transform: translateY(2px);
		}
	}
	.fuse {
		width: 120px;
		height: 4px;
		border-radius: 3px;
		background: linear-gradient(90deg, var(--accent), var(--violet));
		transform-origin: left;
		animation: fuse 2.4s linear infinite;
	}
	@keyframes fuse {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	/* Race: two lanes, trails, a checkered finish and the passage being typed. */
	.race-lane {
		position: relative;
		width: 100%;
		height: 22px;
		border-radius: 3px;
		background: var(--band-surface-2);
	}
	.trail {
		position: absolute;
		left: 0;
		top: 50%;
		height: 3px;
		margin-top: -1.5px;
		border-radius: 3px;
		animation: trail 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
	}
	.trail.me {
		background: linear-gradient(90deg, transparent, var(--accent));
	}
	.trail.pace {
		background: linear-gradient(90deg, transparent, var(--violet));
		animation-duration: 4.4s;
	}
	@keyframes trail {
		from {
			width: 0;
		}
		to {
			width: calc(100% - 26px);
		}
	}
	.runner {
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: 3px;
		animation: run 3.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
	}
	.runner.me {
		background: var(--accent);
		box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 60%, transparent);
	}
	.runner.pace {
		background: var(--violet);
		animation-duration: 4.4s;
	}
	@keyframes run {
		to {
			left: calc(100% - 28px);
		}
	}
	.flag {
		position: absolute;
		top: 0;
		right: 0;
		width: 8px;
		height: 100%;
		background: conic-gradient(var(--band-ink) 25%, var(--band-bg) 0 50%, var(--band-ink) 0 75%, var(--band-bg) 0) 0 0 / 4px 4px;
		border-radius: 0 3px 3px 0;
	}
	.race-text {
		align-self: flex-start;
		font-family: var(--font-mono);
		font-size: 16px;
		color: var(--band-ink);
	}
	.race-text b {
		color: var(--accent);
	}
	.race-text span {
		color: var(--band-ink-4);
	}
	/* Echo: keys light up in turn, then turn green as they are repeated. */
	.echo-label {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--band-ink-3);
	}
	.echo-row {
		display: flex;
		gap: 8px;
	}
	.ek {
		display: grid;
		place-items: center;
		width: 38px;
		height: 40px;
		border-radius: 3px;
		border: 1px solid var(--band-line-strong);
		border-bottom-width: 3px;
		background: var(--band-surface-2);
		color: var(--band-ink-3);
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 600;
		text-transform: uppercase;
		animation: echo 3.6s ease infinite;
		animation-delay: calc(var(--n) * 0.35s);
	}
	@keyframes echo {
		0%,
		24% {
			background: var(--band-surface-2);
		}
		8% {
			background: var(--accent);
			border-color: var(--accent);
			color: var(--on-accent);
			box-shadow: 0 0 14px color-mix(in srgb, var(--accent) 50%, transparent);
		}
		58%,
		100% {
			background: color-mix(in srgb, var(--lime) 30%, var(--band-surface-2));
			border-color: var(--lime);
			color: var(--band-ink);
		}
	}
	/* ---------- Ranks ---------- */
	.ranks {
		--band: radial-gradient(ellipse 60% 70% at 50% 100%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 70%);
		padding: clamp(64px, 9vw, 112px) 0;
	}
	.ladder {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		flex-wrap: wrap;
		gap: 18px 10px;
		margin-top: 40px;
	}
	.ladder li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		width: 96px;
		text-align: center;
		font-size: 12.5px;
		font-weight: 700;
		line-height: 1.25;
		transform: translateY(calc(var(--i) * -3px));
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
		border-block: 1px solid var(--line);
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
	.visual.card {
		background: var(--bg);
		padding: clamp(18px, 2.4vw, 28px);
	}

	/* ---------- Commitments ---------- */
	.principles {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin: clamp(56px, 8vw, 96px) 0 clamp(24px, 4vw, 48px);
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
		.principles {
			grid-template-columns: 1fr;
		}
		.principle + .principle {
			border-left: 0;
			border-top: 1px solid var(--line);
		}
		/* The road stacks: copy over the deck. */
		.road-stage {
			grid-template-columns: minmax(0, 1fr);
			align-content: center;
			gap: 8px;
		}
		.road-stage .section-head > p:not(.kicker) {
			font-size: 15px;
		}
		.road-progress {
			margin-top: 16px;
		}
		.road-end {
			margin-top: 12px;
		}
		.road-deck {
			--card-h: 180px;
			--drop: 64px;
			padding-top: 20px;
		}
		.chapter {
			padding: 18px 20px;
		}
		.chapter h3 {
			font-size: 22px;
		}
	}
	@media (max-width: 560px) {
		.game-grid {
			grid-template-columns: 1fr;
		}
		.hero-action,
		.hero-action :global(.btn) {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.fl,
		.wave span,
		.caret,
		.pop,
		.mk.target,
		.fuse,
		.trail,
		.ek,
		.runner {
			animation: none;
		}
		.fl {
			top: 40px;
		}
	}
</style>
