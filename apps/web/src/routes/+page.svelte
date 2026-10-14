<script lang="ts">
	import { page } from '$app/state';
	import MapPreview from '#lib/landing/MapPreview.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Icon from '#lib/ui/Icon.svelte';

	const sample = [
		{ label: 'WPM', value: '78', hint: 'Counts only words typed correctly.' },
		{ label: 'Accuracy', value: '96%', hint: 'Counts every incorrect keystroke, including corrected ones.' },
		{ label: 'Raw', value: '83', hint: 'Counts all typed characters, including errors.' },
		{ label: 'Consistency', value: '81%', hint: 'Measures how evenly speed was maintained.' }
	];

	const site = $derived(page.data.siteUrl ?? '');
	const jsonLd = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'Organization',
			name: 'sqwer',
			url: site,
			logo: `${site}/favicon.svg`,
			email: CONTACT_EMAIL
		},
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
		<h1 id="hero-title">Understand how your hands <span class="mark">really</span> type.</h1>
		<p class="lede">
			sqwer teaches you to type better by first understanding how you type now. A guided journey measures your speed,
			records which finger you use for each key and identifies the fingers that hold you back.
		</p>
		<div class="ctas">
			<a class="btn btn-primary big" href="/journey">Begin your journey <Icon name="arrow" size={18} /></a>
			<a class="btn big" href="/exams">Browse examinations</a>
		</div>
		<p class="assurance">Free to use. No account is required to begin.</p>
	</section>

	<section class="split" aria-labelledby="map-title">
		<div class="copy">
			<p class="kicker">Finger mapping</p>
			<h2 id="map-title">A finger map based on your own technique.</h2>
			<p>
				Conventional typing tutors assume standard touch-typing technique. sqwer asks which finger you used after each
				keystroke and builds a map of your actual technique.
			</p>
			<ul class="checks">
				<li><Icon name="check" size={18} /> Identify keys you type with a non-standard finger</li>
				<li><Icon name="check" size={18} /> Detect habits that depend on the neighbouring key</li>
				<li><Icon name="check" size={18} /> Record which Shift key you use, and with which hand</li>
				<li><Icon name="check" size={18} /> Export your map as a file at any time</li>
			</ul>
			<a class="text-link" href="/map">Open the finger map <Icon name="arrow" size={16} /></a>
		</div>
		<div class="visual card">
			<MapPreview />
		</div>
	</section>

	<section class="split reverse" aria-labelledby="stats-title">
		<div class="copy">
			<p class="kicker">Examinations</p>
			<h2 id="stats-title">Results that explain your performance.</h2>
			<p>
				Each examination reports speed, accuracy and rhythm separately, explains what the result means and recommends
				what to work on next.
			</p>
			<a class="text-link" href="/about#metrics">Read the metric definitions <Icon name="arrow" size={16} /></a>
		</div>
		<div class="visual">
			<dl class="sample" aria-label="Illustrative example of a test result">
				{#each sample as m (m.label)}
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

	<section class="final" aria-labelledby="final-title">
		<h2 id="final-title">Start with a one-minute placement test.</h2>
		<p>It establishes your baseline. Every later step builds on it.</p>
		<div class="ctas">
			<a class="btn dark big" href="/journey">Begin your journey <Icon name="arrow" size={18} /></a>
			<a class="btn ghost big" href="/signup">Create an account</a>
		</div>
	</section>
</div>

<div class="sticky-cta">
	<a class="btn btn-primary btn-block" href="/journey">Begin your journey</a>
</div>

<style>
	.landing {
		display: flex;
		flex-direction: column;
		gap: clamp(72px, 11vw, 132px);
	}
	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding-top: clamp(16px, 6vh, 64px);
	}
	h1 {
		font-size: clamp(42px, 7.4vw, 92px);
		line-height: 1;
		letter-spacing: -0.025em;
		max-width: 19ch;
	}
	/* Emphasis is carried by weight alone. */
	.mark {
		font-weight: 800;
	}
	.lede {
		margin-top: 24px;
		max-width: 620px;
		font-size: clamp(17px, 1.6vw, 20px);
		line-height: 1.55;
		color: var(--ink-2);
	}
	.ctas {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 30px;
	}
	.big {
		min-height: 52px;
		padding: 0 24px;
		font-size: 16px;
	}
	.assurance {
		margin-top: 16px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.btn.dark {
		background: #111;
		color: #fff;
		border-color: transparent;
	}
	.btn.ghost {
		background: transparent;
		color: var(--on-accent);
		border-color: rgb(0 0 0 / 0.45);
	}
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
		margin: 4px 0 6px;
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
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		width: fit-content;
		padding: 6px 0;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}
	.text-link:hover :global(svg) {
		transform: translateX(3px);
	}
	.text-link :global(svg) {
		transition: transform 140ms ease;
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
		color: var(--ink-2);
		text-align: right;
	}
	.final {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 10px;
		padding: clamp(40px, 7vw, 80px) 24px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.final h2 {
		margin-top: 0;
	}
	.final p {
		font-size: 17px;
	}
	.final .ctas {
		margin-top: 18px;
	}
	.sticky-cta {
		display: none;
	}
	@media (max-width: 900px) {
		.split {
			grid-template-columns: 1fr;
		}
		.split.reverse .copy {
			order: 0;
		}
	}
	@media (max-width: 640px) {
		/* A persistent call to action on phones. */
		.sticky-cta {
			display: block;
			position: fixed;
			left: 0;
			right: 0;
			bottom: 0;
			z-index: 30;
			padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
			background: color-mix(in srgb, var(--bg) 80%, transparent);
			-webkit-backdrop-filter: blur(14px);
			backdrop-filter: blur(14px);
			border-top: 1px solid var(--line-strong);
		}
		.landing {
			padding-bottom: 64px;
		}
		.big {
			width: 100%;
		}
		.sample {
			grid-template-columns: 1fr 1fr;
		}
		.tile {
			padding: 14px;
		}
	}
</style>
