<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { loop } from './loop.ts';
	import { listen, LISTEN_LOOP } from './scenes.ts';

	let t = $state(LISTEN_LOOP.still);
	const s = $derived(listen(t));
</script>

<div class="stage" use:loop={{ ...LISTEN_LOOP, set: (v) => (t = v) }}>
	<span class="speaker" style:--voice={s.voice}>
		<Icon name="volume" size={18} />
		<span class="wave">{#each s.bars as a, n (n)}<span style:transform={`scaleY(${a})`}></span>{/each}</span>
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
		gap: 16px;
	}
	/* The speaker lights while the word plays. */
	.speaker {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 52px;
		padding: 0 16px;
		border-radius: 3px;
		border: 1px solid color-mix(in srgb, var(--accent) calc(25% + var(--voice) * 45%), transparent);
		background: color-mix(in srgb, var(--accent) calc(6% + var(--voice) * 8%), transparent);
		color: color-mix(in srgb, var(--accent-ink) calc(var(--voice) * 100%), var(--band-ink-3));
	}
	.wave {
		display: flex;
		align-items: center;
		gap: 4px;
		height: 32px;
	}
	.wave span {
		width: 4px;
		height: 100%;
		border-radius: 2px;
		background: var(--accent);
	}
	/* The answer underline turns the success hue once the word is right. */
	.answer {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 132px;
		padding: 0 4px 6px;
		border-bottom: 2px solid color-mix(in srgb, var(--lime) calc(var(--ok) * 100%), var(--band-line-strong));
	}
	.typed {
		flex: 1;
		min-height: 1.2em;
		font-family: var(--font-mono);
		font-size: var(--fs-20);
		color: color-mix(in srgb, var(--lime-ink) calc(var(--ok) * 100%), var(--band-ink));
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-left: 2px;
		vertical-align: -0.12em;
		background: var(--accent);
	}
	.check {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 3px;
		background: var(--lime);
		color: var(--on-hue);
	}
</style>
