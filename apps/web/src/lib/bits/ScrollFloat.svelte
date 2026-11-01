<!--
	Svelte Bits: Scroll Float
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/scroll-float.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: the float (stretched, squeezed, lifted out of sight) exported as `FLOAT` and `floatAway()` so other
	timelines can play it on their own targets, in either direction; a gradual blur and an opacity fade ride along; `direction` prop for floating in or away;
	gsap through lib/motion under the motion guard (text left as rendered under reduced motion), named ease instead
	of back.inOut; window scroll only; letters aria-hidden under one aria-label; span root instead of h2; class
	props folded into one.
-->
<script module lang="ts">
	import type { EaseName } from '#lib/motion/tokens.ts';

	/** The floated-off state: squeezed, stretched tall, lifted past its line, blurred out and faded to nothing. */
	export const FLOAT = { opacity: 0, filter: 'blur(16px)', yPercent: -120, scaleY: 2.3, scaleX: 0.7, transformOrigin: '50% 100%' } as const;
	/** The resting state. */
	export const REST = { opacity: 1, filter: 'blur(0px)', yPercent: 0, scaleY: 1, scaleX: 1 } as const;

	/** Tween vars that float targets away, one after another. */
	export function floatAway(stagger = 0.03, ease: EaseName = 'in-quick') {
		return { ...FLOAT, stagger, ease };
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { motion, whenMotion } from '#lib/motion/gsap.ts';

	type Props = {
		text: string;
		/** In: letters float up into place as the line scrolls in. Away: they float off as it scrolls out. */
		direction?: 'in' | 'away';
		start?: string;
		end?: string;
		stagger?: number;
		class?: string;
	};

	let { text, direction = 'in', start, end, stagger = 0.03, class: className = '' }: Props = $props();

	let root: HTMLSpanElement;
	const chars = $derived([...text]);

	onMount(() => {
		const mm = whenMotion(() => {
			const letters = root.querySelectorAll('.char');
			const into = direction === 'in';
			// Floating in mirrors the float away: from below, stretched from the top.
			const off = into ? { ...FLOAT, yPercent: 120, transformOrigin: '50% 0%' } : FLOAT;
			motion().fromTo(letters, into ? off : REST, {
				...(into ? REST : off),
				stagger,
				ease: 'none',
				scrollTrigger: {
					trigger: root,
					start: start ?? (into ? 'center bottom+=50%' : 'top center'),
					end: end ?? (into ? 'bottom bottom-=40%' : 'bottom top'),
					scrub: true
				}
			});
		});
		return () => mm.revert();
	});
</script>

<span bind:this={root} class="scroll-float {className}" aria-label={text} role="img">
	{#each chars as char, i (i)}
		<span class="char" aria-hidden="true">{char === ' ' ? ' ' : char}</span>
	{/each}
</span>

<style>
	.scroll-float {
		display: inline-block;
		overflow: hidden;
	}
	.char {
		display: inline-block;
	}
</style>
