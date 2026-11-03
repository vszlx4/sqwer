<script lang="ts">
	import { onMount } from 'svelte';
	import { FLOAT } from '#lib/bits/ScrollFloat.svelte';
	import { motion, REDUCED, whenMotion } from '#lib/motion/gsap.ts';
	import { AREAS } from '#lib/site/areas.ts';

	/* The name between the games and the ranks: a big cream wordmark with the curve's ✦ perched on its last letter.
	   Scrubbed across the band, never held: the letters rise in and the star spins in as the band arrives, then the
	   name widens until it has the logo's proportions and rests there. As the band leaves it keeps widening while the
	   letters float away from the middle out (Scroll Float, as the journey line leaves). The star turns with the
	   scroll and passes through the area colors as it goes. */

	const LETTERS = [...'sqwer'];
	// The logo's letters, x-height to the tail of the q, in LogoWordmark units.
	const LOGO_RATIO = 515.867 / 95.744;
	// How much wider again the name grows while it floats away.
	const OVERSHOOT = 1.7;
	// The ✦ of the curved loop on a 100 unit box: four points, each side bowing in through a control point near the
	// centre.
	const STAR = (() => {
		const at = (deg: number, r: number) => {
			const a = (deg * Math.PI) / 180;
			return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
		};
		let d = `M${at(-90, 50)}`;
		for (let k = 0; k < 4; k++) d += `Q${at(-90 + 90 * k + 45, 8)} ${at(-90 + 90 * (k + 1), 50)}`;
		return `${d}Z`;
	})();

	let band: HTMLElement;
	let word: HTMLElement;
	let lettersEl: HTMLElement;
	let star: SVGSVGElement;

	/** How much wider the laid-out letters must get to match the logo's proportions, from their ink. */
	function stretch() {
		const css = getComputedStyle(word);
		const ctx = document.createElement('canvas').getContext('2d')!;
		ctx.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
		const els = [...lettersEl.querySelectorAll<HTMLElement>('.letter')];
		const first = els[0]!;
		const last = els.at(-1)!;
		const left = first.offsetLeft - ctx.measureText(first.textContent ?? '').actualBoundingBoxLeft;
		const right = last.offsetLeft + ctx.measureText(last.textContent ?? '').actualBoundingBoxRight;
		const height = ctx.measureText('x').actualBoundingBoxAscent + ctx.measureText('q').actualBoundingBoxDescent;
		return Math.max(1, LOGO_RATIO / ((right - left) / height));
	}
	// How far the star moves out to stay on the last letter while the letters widen by k from their middle.
	const shift = (k: number) => ((k - 1) * lettersEl.offsetWidth) / 2;

	onMount(() => {
		const mm = whenMotion(() => {
			const gsap = motion();
			const letters = word.querySelectorAll('.letter');
			// GSAP blends resolved colours, not custom properties.
			const hues = Object.values(AREAS).map((a) => getComputedStyle(band).getPropertyValue(`--${a.hue}`).trim());
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true }
			});
			// Drifts up a little faster than the page, so the band feels alive without ever stopping.
			tl.fromTo(word, { y: '14vh' }, { y: '-14vh', duration: 1 }, 0);
			tl.fromTo(
				letters,
				{ yPercent: 110, opacity: 0, filter: 'blur(12px)' },
				{ yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.3, stagger: 0.025, ease: 'out-soft' },
				0.05
			);
			// Widens into the logo, rests, then keeps going as it leaves.
			tl.fromTo(lettersEl, { scaleX: 1 }, { scaleX: () => stretch(), duration: 0.2, ease: 'out-soft' }, 0.32);
			tl.fromTo(star, { x: 0 }, { x: () => shift(stretch()), duration: 0.2, ease: 'out-soft' }, 0.32);
			tl.to(lettersEl, { scaleX: () => stretch() * OVERSHOOT, duration: 0.3, ease: 'in-quick' }, 0.6);
			tl.to(star, { x: () => shift(stretch() * OVERSHOOT), duration: 0.3, ease: 'in-quick' }, 0.6);
			tl.to(letters, { ...FLOAT, scaleX: 1, transformOrigin: '50% 50%', stagger: { each: 0.02, from: 'center' }, duration: 0.28, ease: 'in-quick' }, 0.62);
			// The star pops in, turns with the scroll through the area colors, and blurs away just before the letters go.
			tl.fromTo(star, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'spring-soft' }, 0.22);
			tl.fromTo(star, { rotate: -180 }, { rotate: 270, duration: 0.64 }, 0.22);
			// Each color holds, then hands over quickly: a slow blend between two hues goes muddy.
			tl.fromTo(star, { color: hues[0] }, { keyframes: hues.slice(1).flatMap((color, i) => [{ color: hues[i], duration: 3 }, { color, duration: 1 }]), duration: 0.46 }, 0.22);
			tl.to(star, { opacity: 0, filter: 'blur(16px)', scale: 1.6, duration: 0.24, ease: 'in-quick' }, 0.62);
		});
		// Without motion the name simply rests at the logo's proportions.
		// Measured once the font is in, or the ratio comes from the fallback.
		mm.add(REDUCED, (ctx) => {
			document.fonts.ready.then(() =>
				ctx.add(() => {
					motion().set(lettersEl, { scaleX: stretch() });
					motion().set(star, { x: shift(stretch()) });
				})
			);
		});
		return () => mm.revert();
	});
</script>

<div class="brand-band band on-band" bind:this={band}>
	<p class="word" bind:this={word} role="img" aria-label="sqwer">
		<span class="letters" bind:this={lettersEl}>
			{#each LETTERS as l, i (i)}
				<span class="letter" aria-hidden="true">{l}</span>
			{/each}
		</span>
		<svg class="star" bind:this={star} viewBox="0 0 100 100" aria-hidden="true">
			<path d={STAR} fill="currentColor" />
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
		/* Sized for the stretched name, about four em wide at the logo's proportions, to fit with room for the star. */
		font-size: clamp(76px, 19vw, 300px);
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
	/* Perched over the last letter, like a mark on the name. */
	.star {
		position: absolute;
		top: -0.3em;
		right: -0.32em;
		width: 0.5em;
		height: 0.5em;
		color: var(--lime);
	}
</style>
