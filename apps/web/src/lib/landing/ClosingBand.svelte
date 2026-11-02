<script lang="ts">
	import { onMount } from 'svelte';
	import TextPressure from '#lib/bits/TextPressure.svelte';
	import { reveal, stagger } from '#lib/motion/actions.ts';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';
	import { STAGGER } from '#lib/motion/tokens.ts';
	import { AREAS } from '#lib/site/areas.ts';
	import Icon from '#lib/ui/Icon.svelte';

	/* The page ends where the hero's takeover leaves off: on the dark, with the journey line and the same button. The
	   line thickens as the band scrolls up to the middle of the screen (Text Pressure, scrubbed), then the button and
	   the way in for typists rise under it. Returning learners are told to pick up where they left off. */

	type Props = {
		/** The hero's button: Get started, or a returning learner's next step. */
		cta: { href: string; label: string };
		returning: boolean;
	};
	let { cta, returning }: Props = $props();

	const ACCENTS = Object.values(AREAS).map((a) => `var(--${a.hue})`);
	const lines = $derived(returning ? ['Pick up where', 'you left off'] : ['Your journey', 'starts here']);

	let band: HTMLElement;
	let line: HTMLElement;
	// Heavy as rendered (no-JS, reduced motion); the scrub takes it back to light before the band is in view.
	let pressure = $state(1);

	onMount(() => {
		const mm = whenMotion(() => {
			const p = { v: 0 };
			const tl = motion().timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: band, start: 'top 90%', end: 'center 55%', scrub: 0.6 }
			});
			tl.fromTo(line, { opacity: 0, filter: 'blur(10px)', yPercent: 12 }, { opacity: 1, filter: 'blur(0px)', yPercent: 0, duration: 0.35, ease: 'out-soft' }, 0);
			tl.fromTo(p, { v: 0 }, { v: 1, duration: 1, onUpdate: () => (pressure = p.v) }, 0);
			return () => (pressure = 1);
		});
		return () => mm.revert();
	});
</script>

<section class="closing band on-dark" data-area="learn" bind:this={band} aria-labelledby="closing-title">
	<h2 id="closing-title" class="line" bind:this={line} aria-label={lines.join(' ')}>
		<TextPressure text={lines[0]!} {pressure} accents={ACCENTS} />
		<TextPressure text={lines[1]!} pressure={Math.min(1, pressure * 1.15)} accents={ACCENTS.slice(2)} />
	</h2>
	<div class="action" use:reveal={{ delay: STAGGER.base }}>
		<a class="btn btn-primary btn-lg" href={cta.href}>{cta.label} <Icon name="arrow" size={18} /></a>
		<a class="link-arrow quiet" href="/test">Already type? Take a typing test <Icon name="arrow" size={16} /></a>
	</div>
	<ul class="facts" aria-label="Key facts" use:stagger>
		<li><Icon name="check" size={16} /> Free</li>
		<li><Icon name="flag" size={16} /> Starts from zero</li>
		<li><Icon name="lock" size={16} /> No ads or tracking</li>
	</ul>
</section>

<style>
	/* Same ground as the games band: the band color and its dot grid. */
	.closing {
		--band:
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 24px 24px,
			var(--band-bg);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		min-height: 100svh;
		padding: clamp(72px, 12vh, 128px) 0;
		color: var(--band-ink);
		text-align: center;
	}
	/* Sized so the longer row spans most of the column, like the journey line at the end of the takeover. */
	.line {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: clamp(40px, 10.5vw, 150px);
		line-height: 0.92;
		letter-spacing: -0.02em;
	}
	.action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		margin-top: clamp(36px, 6vh, 56px);
	}
	.quiet {
		font-size: 15px;
		color: var(--band-ink-2);
	}
	.quiet:hover {
		color: var(--band-ink);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 20px;
		justify-content: center;
		margin-top: 34px;
		padding-top: 18px;
		border-top: 1px solid color-mix(in srgb, var(--band-ink) 14%, transparent);
		font-size: 14px;
		color: var(--band-ink-2);
	}
	.facts li {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
</style>
