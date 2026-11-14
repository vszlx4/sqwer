<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { loop } from './loop.ts';
	import { listen, LISTEN_LOOP } from './scenes.ts';

	let t = $state(LISTEN_LOOP.still);
	const s = $derived(listen(t));
</script>

<div class="stage" use:loop={{ ...LISTEN_LOOP, set: (v) => (t = v) }}>
	<span class="player" style:--voice={s.voice}>
		<span class="play"><Icon name="play" size={14} /></span>
		<span class="wave">{#each s.bars as a, n (n)}<span class:lit={n < s.lit * s.bars.length} style:transform={`scaleY(${a})`}></span>{/each}</span>
		<span class="slow">Slow</span>
	</span>
	<span class="answer" style:opacity={s.opacity} style:--ok={s.ok}>
		<span class="typed">{s.text}<span class="caret" style:opacity={s.caret}></span></span>
		<span class="check" style:transform={`scale(${s.ok})`}><Icon name="check" size={14} /></span>
	</span>
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-16);
	}
	/* The game's player row: play, the clip's outline lit as it plays, Slow. */
	.player {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		height: 52px;
		padding: 0 var(--space-8);
		border-radius: var(--radius);
		background: var(--band-surface);
	}
	.play,
	.slow {
		display: grid;
		place-items: center;
		height: 36px;
		border: 1px solid var(--band-line-strong);
		border-radius: var(--radius);
		color: color-mix(in srgb, var(--accent-ink) calc(var(--voice) * 100%), var(--band-ink-2));
	}
	.play {
		width: 36px;
	}
	.slow {
		padding: 0 var(--space-10);
		font-size: var(--fs-13);
		color: var(--band-ink-2);
	}
	.wave {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		height: 28px;
	}
	.wave span {
		width: 4px;
		height: 100%;
		border-radius: var(--radius);
		background: var(--band-line-strong);
	}
	.wave span.lit {
		background: var(--accent);
	}
	/* The answer box turns the success hue once the word is right. */
	.answer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-10);
		position: relative;
		min-width: 200px;
		height: 48px;
		padding: 0 var(--space-32);
		border: 1px solid color-mix(in srgb, var(--lime) calc(var(--ok) * 100%), var(--band-line-strong));
		border-radius: var(--radius);
		background: var(--band-surface);
	}
	.check {
		position: absolute;
		right: var(--space-12);
	}
	.typed {
		min-height: 1.2em;
		text-align: center;
		font-family: var(--font-mono);
		font-size: var(--fs-20);
		color: color-mix(in srgb, var(--lime-ink) calc(var(--ok) * 100%), var(--band-ink));
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: var(--space-2);
		vertical-align: -0.12em;
		background: var(--accent);
	}
	.check {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: var(--radius);
		background: var(--lime);
		color: var(--on-hue);
	}
</style>
