<script lang="ts">
	import { loop } from './loop.ts';
	import { HUNT_LOOP, keyHunt, label } from './scenes.ts';

	const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
	let t = $state(HUNT_LOOP.still);
	const s = $derived(keyHunt(t));
	const byKey = $derived(new Map<string, (typeof s.keys)[number]>(s.keys.map((k) => [k.key, k])));
</script>

<div class="stage" use:loop={{ ...HUNT_LOOP, set: (v) => (t = v) }}>
	<span class="mini-kb">
		{#each ROWS as row, r (row)}
			<span class="kb-row" style:--r={r}>
				{#each [...row] as k (k)}
					{@const h = byKey.get(k)}
					{#if h}
						<span class="mk" style:--hue={`var(--f-${h.finger})`} style:--label={label(h.finger)} style:--lit={h.lit} style:--ok={h.ok} style:--miss={h.miss} style:transform={`translateY(${h.press * 2}px)`}>{k}</span>
					{:else}
						<span class="mk">{k}</span>
					{/if}
				{/each}
			</span>
		{/each}
	</span>
	<span class="fuse"><span style:transform={`scaleX(${s.fuse})`}></span></span>
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
	.mini-kb {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.kb-row {
		display: flex;
		gap: 4px;
		margin-left: calc(var(--r) * 9px);
	}
	/* A lit key takes its finger's hue; a ring shows the hit (success) or the timeout (error). */
	.mk {
		--lit: 0;
		--ok: 0;
		--miss: 0;
		--hue: var(--band-line);
		--label: var(--band-ink-3);
		display: grid;
		place-items: center;
		width: 20px;
		height: 22px;
		border-radius: 3px;
		border: 1px solid color-mix(in srgb, var(--hue) calc(var(--lit) * 100%), var(--band-line));
		border-bottom-width: 2px;
		background: color-mix(in srgb, var(--hue) calc(var(--lit) * 100%), var(--band-surface));
		color: color-mix(in srgb, var(--label) calc(var(--lit) * 100%), var(--band-ink-3));
		box-shadow: 0 0 0 calc((var(--ok) + var(--miss)) * 3px) color-mix(in srgb, var(--error) calc(var(--miss) * 100%), var(--lime));
		font-family: var(--font-mono);
		font-size: var(--fs-10);
		font-weight: var(--fw-semibold);
		text-transform: uppercase;
	}
	/* The time left to find it. */
	.fuse {
		width: 140px;
		height: 4px;
		border-radius: 3px;
		background: var(--band-surface-2);
		overflow: hidden;
	}
	.fuse span {
		display: block;
		height: 100%;
		background: var(--accent);
		transform-origin: left;
	}
</style>
