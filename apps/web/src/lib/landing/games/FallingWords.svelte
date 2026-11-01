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
		padding: 5px 9px 5px 11px;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1;
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
		box-shadow:
			inset 3px 0 0 var(--hue),
			0 0 18px -4px color-mix(in srgb, var(--hue) calc(var(--focus) * 55%), transparent);
		opacity: var(--fill);
	}
	.ch {
		position: relative;
		color: var(--band-ink-3);
	}
	.ch.typed {
		color: var(--band-ink);
		font-weight: 700;
	}
	/* Landing zone: a dashed line over a soft warning glow, not a solid floor. */
	.zone {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 26px;
		border-top: 1px dashed color-mix(in srgb, var(--life) 60%, transparent);
		background: linear-gradient(to top, color-mix(in srgb, var(--life) 18%, transparent), transparent);
	}
</style>
