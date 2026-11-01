<script lang="ts">
	import { onMount } from 'svelte';
	import MetallicPaint from '#lib/bits/MetallicPaint.svelte';
	import { FLOAT } from '#lib/bits/ScrollFloat.svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	/* The name between the games and the ranks: a big cream wordmark with the curve's star perched on its last letter,
	   filled orange to violet under a grain. Scrubbed across the band, never held: the letters rise in and the star
	   spins in as the band arrives, both float away (Scroll Float) as it leaves. The star turns with the scroll only.
	   For a short stretch in the middle a band of light crosses the name and leaves polished metal behind (Metallic
	   Paint), then crosses again the same way and hands the cream letters back. */

	const LETTERS = [...'sqwer'];
	// A five-point star with curved sides, kin to the ✦ of the curved loop, on a 100 unit box: each side bows in
	// through a control point near the centre.
	const STAR = (() => {
		const at = (deg: number, r: number) => {
			const a = (deg * Math.PI) / 180;
			return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
		};
		let d = `M${at(-90, 50)}`;
		for (let k = 0; k < 5; k++) d += `Q${at(-90 + 72 * k + 36, 14)} ${at(-90 + 72 * (k + 1), 50)}`;
		return `${d}Z`;
	})();
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
	// The metal shows between these two fronts, 0 to 1 across the name; outside the window both sit off the left.
	const OFF = -0.4;
	const ON = 1.4;
	let sweep = $state({ lo: -1, hi: OFF });

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
		return { src: canvas.toDataURL(), light: token('--band-ink'), dark: token('--band-bg'), tint: `color-mix(in srgb, ${token('--violet')} 30%, white)` };
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
			// The two fronts of the metal pass, tweened below and copied out on every render, either direction.
			const front = { lo: -1, hi: OFF };
			const tl = motion().timeline({
				defaults: { ease: 'none' },
				onUpdate: () => {
					if (front.lo !== sweep.lo || front.hi !== sweep.hi) sweep = { lo: front.lo, hi: front.hi };
				},
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
			// Keeps turning slowly while the name rests, a fifth of a turn: point back on point.
			tl.to(star, { rotate: 72, duration: 0.08 }, 0.52);
			tl.to(letters, { ...FLOAT, scaleX: 1, transformOrigin: '50% 50%', stagger: { each: 0.02, from: 'center' }, duration: 0.3, ease: 'in-quick' }, 0.62);
			tl.to(star, { opacity: 0, filter: 'blur(16px)', scale: 1.6, rotate: 162, duration: 0.26, ease: 'in-quick' }, 0.6);
			// The metal pass: a light front crosses the name and leaves metal behind it, the cream letters hide once it has
			// passed, then a second front wipes the metal away the same way.
			tl.set(metalEl, { opacity: 1 }, 0.35);
			tl.to(front, { hi: ON, duration: 0.08, ease: 'power1.inOut' }, 0.36);
			tl.set(lettersEl, { opacity: 0 }, 0.44);
			tl.fromTo(front, { lo: OFF }, { lo: ON, duration: 0.08, ease: 'power1.inOut', immediateRender: false }, 0.5);
			tl.set(lettersEl, { opacity: 1 }, 0.5);
			tl.set(metalEl, { opacity: 0 }, 0.59);
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
				<MetallicPaint
					imageSrc={metal.src}
					active={metalOn}
					lightColor={metal.light}
					darkColor={metal.dark}
					tintColor={metal.tint}
					revealFrom={sweep.lo}
					revealTo={sweep.hi}
					speed={0.06}
					scale={7}
					contour={0.25}
					liquid={0.05}
					distortion={0.1}
					waveAmplitude={0.25}
					chromaticSpread={0.3}
					blur={0.006}
					patternSharpness={1.9}
					contrast={1.1}
					brightness={1.6}
				/>
			{/if}
		</span>
		<svg class="star" bind:this={star} viewBox="-20 -20 140 140" aria-hidden="true">
			<defs>
				<!-- One warm color easing into a rose, then down to a deep violet along the lower edge. -->
				<linearGradient id="{id}-fill" x1="0.8" y1="0" x2="0.2" y2="1">
					<stop offset="0" style:stop-color="var(--orange)" />
					<stop offset="0.55" style:stop-color="color-mix(in srgb, var(--orange) 55%, var(--violet))" />
					<stop offset="1" style:stop-color="color-mix(in srgb, var(--violet) 55%, var(--band-bg))" />
				</linearGradient>
				<!-- Grain: fractal noise turned into speckled alpha. -->
				<filter id="{id}-grain" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
					<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" stitchTiles="stitch" />
					<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.1" />
				</filter>
				<!-- The same grain in the star's warm color, for the speckles that drift past its edge. -->
				<filter id="{id}-dust" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
					<feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" stitchTiles="stitch" result="noise" />
					<feColorMatrix in="noise" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.3" result="dots" />
					<feFlood style:flood-color="color-mix(in srgb, var(--orange) 70%, var(--violet))" />
					<feComposite in2="dots" operator="in" />
				</filter>
				<filter id="{id}-soft" x="-20" y="-20" width="140" height="140" filterUnits="userSpaceOnUse">
					<feGaussianBlur stdDeviation="5" />
				</filter>
				<!-- Strong on the edge and fading a few units out: a blurred copy of the star. -->
				<mask id="{id}-spill" maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
					<path d={STAR} fill="white" filter="url(#{id}-soft)" />
				</mask>
				<clipPath id="{id}-clip"><path d={STAR} /></clipPath>
			</defs>
			<rect class="dust" x="-20" y="-20" width="140" height="140" filter="url(#{id}-dust)" mask="url(#{id}-spill)" />
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
		top: -0.33em;
		right: -0.39em;
		width: 0.62em;
		height: 0.62em;
		overflow: visible;
	}
	.grain {
		mix-blend-mode: soft-light;
		opacity: 0.85;
	}
	.dust {
		opacity: 0.55;
	}
</style>
