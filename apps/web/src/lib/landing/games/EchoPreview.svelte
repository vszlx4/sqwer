<script lang="ts">
	import { loop } from './loop.ts';
	import { echo, ECHO_LOOP, label } from './scenes.ts';

	let t = $state(ECHO_LOOP.still);
	const s = $derived(echo(t));
</script>

<div class="stage" use:loop={{ ...ECHO_LOOP, set: (v) => (t = v) }}>
	<span class="labels">
		<span style:opacity={s.watch}>Watch</span>
		<span style:opacity={1 - s.watch}>Your turn</span>
	</span>
	<span class="row">
		{#each s.slots as k, n (n)}
			<span class="ek" style:--hue={`var(--f-${k.finger})`} style:--label={label(k.finger)} style:--lit={k.lit} style:--ok={k.ok} style:transform={`scale(${k.scale})`}>
				<span style:opacity={Math.max(k.lit, k.ok)}>{k.c}</span>
			</span>
		{/each}
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
	.labels {
		display: grid;
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--band-ink-3);
	}
	.labels span {
		grid-area: 1 / 1;
		text-align: center;
	}
	.row {
		display: flex;
		gap: 8px;
	}
	/* Shown in the finger's hue, then blank; typed back, it turns the success hue. */
	.ek {
		display: grid;
		place-items: center;
		width: 38px;
		height: 40px;
		border-radius: 3px;
		border: 1px solid color-mix(in srgb, var(--lime) calc(var(--ok) * 100%), color-mix(in srgb, var(--hue) calc(var(--lit) * 100%), var(--band-line-strong)));
		border-bottom-width: 3px;
		background: color-mix(
			in srgb,
			color-mix(in srgb, var(--lime) 30%, var(--band-surface-2)) calc(var(--ok) * 100%),
			color-mix(in srgb, var(--hue) calc(var(--lit) * 100%), var(--band-surface-2))
		);
		color: color-mix(in srgb, var(--label) calc(var(--lit) * 100%), var(--band-ink));
		font-family: var(--font-mono);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
	}
</style>
