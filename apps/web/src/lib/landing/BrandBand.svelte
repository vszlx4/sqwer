<script lang="ts">
	import { onMount } from 'svelte';
	import MetallicPaint from '#lib/bits/MetallicPaint.svelte';
	import { FLOAT } from '#lib/bits/ScrollFloat.svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	/* The name between the games and the ranks: a big cream wordmark with the curve's star perched on its last letter,
	   filled orange to violet under a grain. Scrubbed across the band, never held: the letters rise in and the star
	   spins in as the band arrives, both float away (Scroll Float) as it leaves. The star also turns slowly on its own.
	   For a short stretch in the middle the letters turn to liquid metal (Metallic Paint) and back. */

	const LETTERS = [...'sqwer'];
	// Four-point star, the ✦ of the curved loop, drawn on a 100 unit box.
	const STAR = 'M50 0C55 33 67 45 100 50C67 55 55 67 50 100C45 67 33 55 0 50C33 45 45 33 50 0Z';
	const id = $props.id();
	// How far the metal layer reaches past the letters' box, in em, so no glyph is cut at its edge.
	const PAD = 0.3;

	let band: HTMLElement;
	let word: HTMLElement;
	let lettersEl: HTMLElement;
	let metalEl: HTMLElement;
	let star: SVGSVGElement;
	// The metal pass: the wordmark drawn to an image once the band is near, and whether its shader runs.
	let metal = $state<{ src: string; light: string; dark: string; tint: string }>();
	let metalOn = $state(false);

	/** The letters as laid out, drawn black on clear at twice their size, for Metallic Paint to shape. */
	function drawWord() {
		const css = getComputedStyle(word);
		// Room for descenders and overhangs past the line box; .metal reaches out by the same PAD.
		const pad = parseFloat(css.fontSize) * PAD;
		const scale = Math.min(2, 2000 / Math.max(word.offsetWidth + 2 * pad, 1));
		const canvas = document.createElement('canvas');
		canvas.width = Math.round((word.offsetWidth + 2 * pad) * scale);
		canvas.height = Math.round((word.offsetHeight + 2 * pad) * scale);
		const ctx = canvas.getContext('2d')!;
		ctx.font = `${css.fontWeight} ${parseFloat(css.fontSize) * scale}px ${css.fontFamily}`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'alphabetic';
		ctx.fillStyle = 'black';
		// Each letter at its own box (offsets ignore the scroll tweens) and on the same baseline the page uses: the
		// line box splits its leading evenly around the font's ascent and descent.
		const m = ctx.measureText('sqwer');
		const ascent = m.fontBoundingBoxAscent;
		const lineHeight = parseFloat(css.lineHeight) * scale;
		for (const el of lettersEl.querySelectorAll<HTMLElement>('.letter')) {
			const top = (el.offsetTop + pad) * scale;
			const baseline = top + (lineHeight - (ascent + m.fontBoundingBoxDescent)) / 2 + ascent;
			ctx.fillText(el.textContent ?? '', (el.offsetLeft + pad) * scale, baseline);
		}
		const token = (name: string) => getComputedStyle(band).getPropertyValue(name).trim();
		return { src: canvas.toDataURL(), light: token('--band-ink'), dark: token('--band-bg'), tint: token('--violet') };
	}

	onMount(() => {
		const mm = whenMotion(() => {
			// The shader shapes its image once (a heavy pass), so only when the band is a screen away.
			const near = new IntersectionObserver(
				([e]) => {
					if (!e!.isIntersecting) return;
					near.disconnect();
					document.fonts.ready.then(() => (metal = drawWord()));
				},
				{ rootMargin: '100% 0px' }
			);
			near.observe(band);
			const letters = word.querySelectorAll('.letter');
			const tl = motion().timeline({
				defaults: { ease: 'none' },
				scrollTrigger: {
					trigger: band,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 0.8,
					// The shader only runs around its window.
					onUpdate: (st) => (metalOn = st.progress > 0.3 && st.progress < 0.62)
				}
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
			// The metal pass: cream gives way to liquid metal and comes back before the float.
			tl.fromTo(metalEl, { opacity: 0 }, { opacity: 1, duration: 0.07, ease: 'out-soft' }, 0.36);
			tl.fromTo(lettersEl, { opacity: 1 }, { opacity: 0, duration: 0.07, ease: 'out-soft' }, 0.36);
			tl.to(metalEl, { opacity: 0, duration: 0.07, ease: 'in-quick' }, 0.5);
			tl.to(lettersEl, { opacity: 1, duration: 0.07, ease: 'in-quick' }, 0.5);
			return () => near.disconnect();
		});
		return () => mm.revert();
	});
</script>

<div class="brand-band band on-dark" bind:this={band}>
	<p class="word" bind:this={word} role="img" aria-label="sqwer">
		<span class="letters" bind:this={lettersEl}>
			{#each LETTERS as l, i (i)}
				<span class="letter" aria-hidden="true">{l}</span>
			{/each}
		</span>
		<span class="metal" bind:this={metalEl} aria-hidden="true">
			{#if metal}
				<MetallicPaint imageSrc={metal.src} active={metalOn} lightColor={metal.light} darkColor={metal.dark} tintColor={metal.tint} speed={0.25} />
			{/if}
		</span>
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
	.letters {
		display: flex;
	}
	.letter {
		display: inline-block;
	}
	/* Over the letters exactly; hidden until its window in the scroll. */
	.metal {
		position: absolute;
		inset: -0.3em;
		opacity: 0;
		pointer-events: none;
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
