<script lang="ts">
	import { tick } from 'svelte';
	import type { TypingSession } from '@sqwer/engine';

	interface Props {
		session: TypingSession;
		/** Bumped by the parent after every change to the session. */
		rev: number;
		/** Caret blinks while the typist is idle. */
		idle: boolean;
	}

	let { session, rev, idle }: Props = $props();

	let inner: HTMLDivElement | undefined = $state();
	let caret = $state({ x: 0, y: 0, h: 0 });
	let offset = $state(0);
	let instant = $state(true);

	/** Render a window of words around the caret; later words are generated as needed. */
	const visibleEnd = $derived.by(() => {
		rev;
		return Math.min(session.targets.length, session.wordIndex + 60);
	});

	/**
	 * untyped: not reached yet · correct · incorrect: the intended letter is shown in red
	 * (the wrong character itself is not displayed) · extra: typed beyond the end of the word
	 * · missed: skipped by pressing space early.
	 */
	type CharState = 'untyped' | 'correct' | 'incorrect' | 'extra' | 'missed';

	function charsOf(i: number, _rev: number): { ch: string; state: CharState }[] {
		const target = session.targets[i]!;
		const input = session.inputs[i]!;
		const out: { ch: string; state: CharState }[] = [];
		const submitted = session.isSubmitted(i);
		for (let j = 0; j < target.length; j++) {
			const typed = input[j];
			out.push({
				ch: target[j]!,
				state: typed === undefined ? (submitted ? 'missed' : 'untyped') : typed === target[j] ? 'correct' : 'incorrect'
			});
		}
		for (let j = target.length; j < input.length; j++) out.push({ ch: input[j]!, state: 'extra' });
		return out;
	}

	async function measure() {
		await tick();
		if (!inner) return;
		const word = inner.querySelector<HTMLElement>(`[data-word="${session.wordIndex}"]`);
		if (!word) return;
		const letters = word.querySelectorAll<HTMLElement>('[data-char]');
		const index = session.currentInput.length;
		const lineHeight = word.offsetHeight;

		let x: number;
		if (index < letters.length) {
			x = word.offsetLeft + letters[index]!.offsetLeft;
		} else if (letters.length) {
			const last = letters[letters.length - 1]!;
			x = word.offsetLeft + last.offsetLeft + last.offsetWidth;
		} else {
			x = word.offsetLeft;
		}
		caret = { x, y: word.offsetTop, h: lineHeight };

		// Keep the active line as the second visible line.
		const top = word.offsetTop;
		offset = top > lineHeight ? top - lineHeight : 0;
	}

	$effect(() => {
		rev;
		session;
		measure();
	});

	$effect(() => {
		// Fresh test: jump instead of animating from the old position.
		session;
		instant = true;
		requestAnimationFrame(() => requestAnimationFrame(() => (instant = false)));
	});

	$effect(() => {
		const onResize = () => measure();
		window.addEventListener('resize', onResize);
		document.fonts?.ready.then(() => measure());
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<div class="viewport">
	<div class="inner" class:instant bind:this={inner} style:transform={`translateY(${-offset}px)`}>
		{#each { length: visibleEnd } as _, i (i)}
			{@const chars = charsOf(i, rev)}
			<span class="word" data-word={i}>
				{#each chars as c, j (j)}<span data-char class={c.state}>{c.ch}</span>{/each}
			</span>
		{/each}
		<span
			class="caret"
			class:blink={idle}
			class:instant
			class:hidden={session.finished}
			style:transform={`translate(${caret.x}px, ${caret.y + caret.h * 0.16}px)`}
			style:height={`${caret.h * 0.68}px`}
			aria-hidden="true"
		></span>
	</div>
</div>

<style>
	.viewport {
		position: relative;
		/* exactly three lines */
		height: calc(var(--typing-size) * var(--typing-leading) * 3);
		overflow: hidden;
		font-family: var(--font-mono);
		font-size: var(--typing-size);
		line-height: var(--typing-leading);
	}
	.inner {
		position: relative;
		display: flex;
		flex-wrap: wrap;
		column-gap: 0.42em;
		transition: transform 160ms ease-out;
		will-change: transform;
	}
	.inner.instant,
	.caret.instant {
		transition: none;
	}
	.word {
		display: inline-flex;
		position: relative;
		white-space: pre;
	}
	.untyped {
		color: var(--untyped);
	}
	.correct {
		color: var(--ink);
	}
	.incorrect {
		color: var(--error);
	}
	.extra {
		color: var(--error);
		opacity: 0.7;
	}
	.missed {
		color: var(--error);
		background: var(--error-soft);
		border-radius: 3px;
	}
	.caret {
		position: absolute;
		left: -1px;
		top: 0;
		width: 3px;
		border-radius: 3px;
		background: var(--accent);
		box-shadow: 0 0 0 1px var(--ink);
		transition: transform 85ms ease-out;
		pointer-events: none;
	}
	:global([data-theme='dark']) .caret {
		box-shadow: 0 0 12px rgb(204 249 0 / 0.45);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .caret {
			box-shadow: 0 0 12px rgb(204 249 0 / 0.45);
		}
	}
	.caret.blink {
		animation: blink 1.05s step-end infinite;
	}
	.caret.hidden {
		opacity: 0;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
