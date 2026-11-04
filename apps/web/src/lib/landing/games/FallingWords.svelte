<script lang="ts">
	import { loop } from './loop.ts';
	import { fallingWords, WORDS_LOOP } from './scenes.ts';

	let t = $state(WORDS_LOOP.still);
	const words = $derived(fallingWords(t));
</script>

<div class="stage" use:loop={{ ...WORDS_LOOP, set: (v) => (t = v) }}>
	{#each words as w, i (i)}
		<span
			class="tag"
			style:left={`${w.x}%`}
			style:--hue={`var(--${w.hue})`}
			style:--focus={w.focus}
			style:--fill={w.fill}
			style:--slip={w.slip}
			style:transform={`translate(calc(-50% + ${w.shake}px), ${w.y}px)`}
		>
			{#each w.chars as c, j (j)}<span class="ch" class:typed={c.typed} style:opacity={c.opacity} style:transform={`translateY(${c.y}px)`}>{c.c}</span>{/each}
		</span>
	{/each}
	<span class="zone"></span>
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
	}
	/* Word tags: a hue bar on the left, a ring while targeted, red for a wrong key. The fill fades on completion
	   while the letters lift away. */
	.tag {
		position: absolute;
		top: 0;
		display: flex;
		padding: var(--space-6) var(--space-10) var(--space-6) var(--space-12);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		line-height: var(--lh-tight);
		white-space: nowrap;
		will-change: transform;
	}
	.tag::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 1px solid
			color-mix(in srgb, var(--error) calc(var(--slip) * 100%), color-mix(in srgb, var(--hue) calc(var(--focus) * 100%), var(--band-line-strong)));
		background: var(--band-surface-2);
		box-shadow: inset 3px 0 0 var(--hue);
		opacity: var(--fill);
	}
	.ch {
		position: relative;
		color: var(--band-ink-3);
	}
	.ch.typed {
		color: var(--band-ink);
		font-weight: var(--fw-bold);
	}
	/* Landing zone: a dashed line, not a solid floor. */
	.zone {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 26px;
		border-top: 1px dashed color-mix(in srgb, var(--life) 60%, transparent);
	}
</style>
