<script lang="ts">
	import { flushSync, onMount } from 'svelte';
	import { motion, REDUCED, ScrollTrigger, whenMotion } from '#lib/motion/gsap.ts';
	import { AREAS } from '#lib/site/areas.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { LETTERS, shift, STAR, stretch } from './wordmark.ts';

	/* The end of the landing page, after the finger map in the normal flow: the band ground with drifting area glows,
	   the name at the logo's proportions with the curve's ✦ on its last letter, and the way in. The name, star and
	   button come in with the scroll as the page arrives and go back out the same way on the way up. The star keeps
	   turning on its own and passes through the area colors as it turns. Only opacity and transforms move. */

	let { cta }: { cta: { href: string; label: string } } = $props();

	let stage: HTMLElement;
	let word: HTMLElement;
	let lettersEl: HTMLElement;
	let star: SVGSVGElement;
	let action: HTMLElement;
	let ambient: HTMLElement;
	let animated = $state(false);

	// Seconds per turn of the star, and per area color (held, then a quick handover: a slow blend goes muddy).
	const TURN = 16;
	const HUE = 3;

	onMount(() => {
		const mm = whenMotion(() => {
			const gsap = motion();
			flushSync(() => (animated = true));
			const letters = word.querySelectorAll('.letter');
			// Scrubbed from the page's top a third of the way up the screen to the top of the screen, both ways.
			const tl = gsap.timeline({
				defaults: { ease: 'none' },
				scrollTrigger: { trigger: stage, start: 'top 70%', end: 'top top', scrub: 0.3, invalidateOnRefresh: true }
			});
			// The name holds the logo's proportions throughout.
			tl.set(lettersEl, { scaleX: () => stretch(word, lettersEl) }, 0);
			tl.set(star, { x: () => shift(lettersEl, stretch(word, lettersEl)) }, 0);
			tl.fromTo(letters, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'out-soft' }, 0);
			tl.fromTo(star, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'spring-soft' }, 0.35);
			tl.fromTo(action, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.25, ease: 'out-soft' }, 0.55);
			tl.to({}, { duration: 0.2 }, 0.8);

			// The star turns on its own, slowly, through the area colors; only while the finale is on screen.
			// GSAP blends resolved colours, not custom properties.
			const hues = Object.values(AREAS).map((a) => getComputedStyle(stage).getPropertyValue(`--${a.hue}`).trim());
			const spin = gsap.timeline({ repeat: -1, paused: true });
			spin.to(star, { rotate: '+=360', duration: TURN, ease: 'none' }, 0);
			const loop = gsap.timeline({ repeat: -1, paused: true });
			hues.forEach((_, i) => loop.to(star, { color: hues[(i + 1) % hues.length], duration: 0.6, ease: 'out-soft' }, (i + 1) * HUE - 0.6));
			gsap.set(star, { color: hues[0] });
			const seen = ScrollTrigger.create({
				trigger: stage,
				start: 'top bottom',
				end: 'bottom top',
				onToggle: ({ isActive }) => {
					spin.paused(!isActive);
					loop.paused(!isActive);
					// The CSS drift and bob run only while the finale is on screen.
					stage.toggleAttribute('data-live', isActive);
				}
			});

			// With a mouse, the glows lean away from the pointer.
			const fine = matchMedia('(pointer: fine)').matches;
			const leans = [...ambient.querySelectorAll<HTMLElement>('[data-lean]')].map((el) => ({
				k: Number(el.dataset.lean),
				x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'out-soft' }),
				y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'out-soft' })
			}));
			const lean = (e: PointerEvent) => {
				if (!stage.hasAttribute('data-live')) return;
				const nx = e.clientX / innerWidth - 0.5;
				const ny = e.clientY / innerHeight - 0.5;
				for (const l of leans) {
					l.x(-nx * l.k);
					l.y(-ny * l.k);
				}
			};
			if (fine) window.addEventListener('pointermove', lean, { passive: true });

			// Tabbing onto the way in plays the entrance out, so focus never lands on a hidden button.
			const reveal = () => {
				const st = tl.scrollTrigger;
				if (st && tl.progress() < 1) window.scrollTo({ top: st.end });
			};
			stage.addEventListener('focusin', reveal);
			return () => {
				stage.removeEventListener('focusin', reveal);
				window.removeEventListener('pointermove', lean);
				stage.removeAttribute('data-live');
				seen.kill();
				spin.kill();
				loop.kill();
				animated = false;
			};
		});
		// Measured once the font is in, or the ratio comes from the fallback.
		mm.add(REDUCED, (ctx) => {
			document.fonts.ready.then(() =>
				ctx.add(() => {
					const k = stretch(word, lettersEl);
					motion().set(lettersEl, { scaleX: k });
					motion().set(star, { x: shift(lettersEl, k) });
				})
			);
		});
		return () => mm.revert();
	});
</script>

<section class="finale band on-band" bind:this={stage} data-animated={animated || undefined} aria-labelledby="finale-title">
	<div class="ambient" bind:this={ambient} aria-hidden="true">
		<span class="glow-lean" data-lean="24"><span class="glow g1"></span></span>
		<span class="glow-lean" data-lean="36"><span class="glow g2"></span></span>
		<span class="glow-lean" data-lean="18"><span class="glow g3"></span></span>
	</div>
	<h2 id="finale-title" class="word" bind:this={word}>
		<span class="letters" bind:this={lettersEl}>
			{#each LETTERS as l, i (i)}
				<span class="letter">{l}</span>
			{/each}
		</span>
		<svg class="star" bind:this={star} viewBox="0 0 100 100" aria-hidden="true">
			<path d={STAR} fill="currentColor" />
		</svg>
	</h2>
	<div class="action" bind:this={action}>
		<a class="btn btn-primary btn-lg" href={cta.href}>{cta.label} <Icon name="arrow" size={18} /></a>
	</div>
</section>

<style>
	/* The band ground, light or dark with the theme: the band color and its dot grid. */
	.finale {
		--band:
			radial-gradient(circle at 1px 1px, var(--band-dot) 1px, transparent 0) 0 0 / 24px 24px,
			var(--band-bg);
		display: grid;
		place-content: center;
		justify-items: center;
		gap: clamp(var(--space-32), 5vw, var(--space-64));
		min-height: 100vh;
		min-height: 100svh;
		color: var(--band-ink);
	}
	/* What comes in with the scroll starts hidden: a refresh reverts the timeline, and tweens that have not begun yet
	   would show their unanimated state until the scroll reaches them. */
	.finale[data-animated] :is(.letter, .star, .action) {
		opacity: 0;
	}
	.word,
	.action {
		position: relative;
		z-index: 1;
	}
	.word {
		display: flex;
		margin: 0;
		font-family: var(--font-sans);
		/* About four em wide at the logo's proportions, with room for the star. */
		font-size: clamp(64px, 15vw, 240px); /* off-scale: wordmark art */
		font-weight: var(--fw-semibold);
		line-height: var(--lh-tight);
		letter-spacing: var(--tr-tight);
	}
	.letters {
		display: flex;
	}
	.letter {
		display: inline-block;
	}
	/* ---------- Ambient: area-colored glows behind the name ---------- */
	.ambient {
		position: absolute;
		inset: 0 calc(50% - 50vw);
		overflow: hidden;
		pointer-events: none;
	}
	.glow-lean {
		position: absolute;
		inset: 0;
	}
	/* Soft area-colored light, drifting slowly: gradients baked once, only moved. */
	.glow {
		position: absolute;
		width: 60vmax;
		height: 60vmax;
		border-radius: 50%;
		background: radial-gradient(circle, color-mix(in srgb, var(--hue) 28%, transparent) 0%, transparent 65%);
		animation: drift 22s ease-in-out infinite alternate paused;
	}
	.g1 {
		--hue: var(--lime);
		top: -24vmax;
		left: -18vmax;
	}
	.g2 {
		--hue: var(--violet);
		right: -22vmax;
		bottom: -26vmax;
		animation-duration: 27s;
		animation-direction: alternate-reverse;
	}
	.g3 {
		--hue: var(--cyan);
		top: 10%;
		right: -30vmax;
		width: 44vmax;
		height: 44vmax;
		animation-duration: 19s;
	}
	/* data-live is set from script while the finale is on screen. */
	:global([data-live]) .glow {
		animation-play-state: running;
	}
	@keyframes drift {
		to {
			transform: translate(8vmax, 6vmax) scale(1.15);
		}
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
