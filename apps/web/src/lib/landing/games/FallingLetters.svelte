<script lang="ts">
	import { loop } from './loop.ts';
	import { fallingLetters, LETTERS_LOOP } from './scenes.ts';

	let t = $state(LETTERS_LOOP.still);
	const s = $derived(fallingLetters(t));
</script>

<div class="stage" use:loop={{ ...LETTERS_LOOP, set: (v) => (t = v) }} style:translate={`${s.shake}px 0`}>
	{#each s.drops as d, i (i)}
		<span class="cap" style:left={`${d.x}%`} style:--hue={`var(--f-${d.finger})`} style:opacity={d.opacity} style:transform={`translate(-50%, ${d.y}px) scale(${d.scale}, ${d.scale * d.squash})`}>{d.key}</span>
	{/each}
	{#each s.bursts as b, i (i)}
		<span class="burst" style:left={`${b.x}%`} style:top={`${b.y}px`} style:--hue={`var(--f-${b.finger})`} style:opacity={b.opacity} style:transform={`translate(-50%, -50%) scale(${b.scale}) rotate(${b.rotate}deg)`}></span>
	{/each}
	<span class="press" style:--hue={`var(--f-${s.press.finger})`} style:opacity={s.press.glow}>{s.press.key}</span>
	<span class="floor" style:--hit={s.floor}></span>
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
	}
	/* Keycaps: the finger's hue on the edge, as on the keyboard zones. */
	.cap {
		position: absolute;
		top: 0;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 3px;
		border: 1px solid var(--band-line-strong);
		border-bottom: 4px solid var(--hue);
		background: var(--band-surface-2);
		color: var(--band-ink);
		font-family: var(--font-mono);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		transform-origin: 50% 100%;
		will-change: transform;
	}
	.burst {
		position: absolute;
		width: 40px;
		height: 40px;
		border-radius: 3px;
		border: 3px solid var(--hue);
	}
	/* The key just pressed, top right. */
	.press {
		position: absolute;
		top: 10px;
		right: 10px;
		display: grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		border-radius: 3px;
		border: 1px solid var(--hue);
		background: color-mix(in srgb, var(--hue) 22%, var(--band-bg));
		color: var(--band-ink);
		font-family: var(--font-mono);
		font-size: var(--fs-11);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
	}
	/* Solid floor; flashes the life hue when a key lands. */
	.floor {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 16px;
		border-top: 2px solid color-mix(in srgb, var(--life) calc(var(--hit) * 100%), var(--accent));
		background: color-mix(in srgb, var(--life) calc(var(--hit) * 45%), color-mix(in srgb, var(--accent) 24%, var(--band-bg)));
	}
</style>
