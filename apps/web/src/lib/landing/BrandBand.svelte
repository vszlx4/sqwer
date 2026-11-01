<script lang="ts">
	import { onMount } from 'svelte';
	import { FLOAT } from '#lib/bits/ScrollFloat.svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	/* The name between the games and the ranks: a big cream wordmark with the curve's star perched on its last letter,
	   filled orange to violet under a grain. Scrubbed across the band, never held: the letters rise in and the star
	   spins in as the band arrives, both float away (Scroll Float) as it leaves. The star also turns slowly on its own. */

	const LETTERS = [...'sqwer'];
	// Four-point star, the ✦ of the curved loop, drawn on a 100 unit box.
	const STAR = 'M50 0C55 33 67 45 100 50C67 55 55 67 50 100C45 67 33 55 0 50C33 45 45 33 50 0Z';
	const id = $props.id();

	let band: HTMLElement;
	let word: HTMLElement;
	let star: SVGSVGElement;

	onMount(() => {
		const mm = whenMotion(() => {
			const letters = word.querySelectorAll('.letter');
			const tl = motion().timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.8 }
			});
			// Drifts up a little faster than the page, so the band feels alive without ever stopping.
			tl.fromTo(word, { y: '14vh' }, { y: '-14vh', duration: 1 }, 0);
			tl.fromTo(
				letters,
				{ yPercent: 110, opacity: 0, filter: 'blur(12px)' },
				{ yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.3, stagger: 0.025, ease: 'out-soft' },
				0.05
			);
			tl.fromTo(star, { scale: 0, rotate: -160, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.3, ease: 'spring-soft' }, 0.22);
			tl.to(letters, { ...FLOAT, scaleX: 1, transformOrigin: '50% 50%', stagger: { each: 0.02, from: 'center' }, duration: 0.3, ease: 'in-quick' }, 0.62);
			tl.to(star, { opacity: 0, filter: 'blur(16px)', scale: 1.6, rotate: 90, duration: 0.26, ease: 'in-quick' }, 0.6);
		});
		return () => mm.revert();
	});
</script>

<div class="brand-band band on-dark" bind:this={band}>
	<p class="word" bind:this={word} role="img" aria-label="sqwer">
		{#each LETTERS as l, i (i)}
			<span class="letter" aria-hidden="true">{l}</span>
		{/each}
		<svg class="star" bind:this={star} viewBox="0 0 100 100" aria-hidden="true">
			<defs>
				<linearGradient id="{id}-fill" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0" style:stop-color="var(--orange)" />
					<stop offset="1" style:stop-color="var(--violet)" />
				</linearGradient>
				<!-- Grain: fractal noise turned into speckled alpha, laid over the gradient inside the star only. -->
				<filter id="{id}-grain" x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" stitchTiles="stitch" />
					<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" />
				</filter>
				<clipPath id="{id}-clip"><path d={STAR} /></clipPath>
			</defs>
			<g clip-path="url(#{id}-clip)">
				<rect width="100" height="100" fill="url(#{id}-fill)" />
				<rect class="grain" width="100" height="100" filter="url(#{id}-grain)" />
			</g>
		</svg>
	</p>
</div>

<style>
	/* Same ground as the games band above: the band color and its dot grid, nothing else. */
	.brand-band {
		--band:
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 24px 24px,
			var(--band-bg);
		display: grid;
		place-items: center;
		min-height: 100vh;
		min-height: 100svh;
		color: var(--band-ink);
	}
	.word {
		position: relative;
		display: flex;
		font-family: var(--font-sans);
		font-size: clamp(120px, 26vw, 400px);
		font-weight: 600;
		line-height: 0.9;
		letter-spacing: -0.05em;
	}
	.letter {
		display: inline-block;
	}
	/* Perched over the last letter, like a mark on the name. */
	.star {
		position: absolute;
		top: -0.24em;
		right: -0.3em;
		width: 0.44em;
		height: 0.44em;
		overflow: visible;
	}
	.grain {
		mix-blend-mode: soft-light;
		opacity: 0.85;
	}
	/* A slow turn of its own, on the inner group so it never fights the scroll tween on the svg. */
	@media (prefers-reduced-motion: no-preference) {
		.star g {
			transform-origin: 50px 50px;
			animation: turn 24s linear infinite;
		}
	}
	@keyframes turn {
		to {
			transform: rotate(360deg);
		}
	}
</style>
