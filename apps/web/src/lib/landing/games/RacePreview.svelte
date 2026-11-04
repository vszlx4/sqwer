<script lang="ts">
	import { loop } from './loop.ts';
	import { PASSAGE, race, RACE_LOOP } from './scenes.ts';

	let t = $state(RACE_LOOP.still);
	const s = $derived(race(t));
</script>

<div class="stage" use:loop={{ ...RACE_LOOP, set: (v) => (t = v) }} style:--win={s.win}>
	{#each [{ who: 'me', at: s.me }, { who: 'pace', at: s.pacer }] as lane (lane.who)}
		<span class="lane {lane.who}" style:--at={lane.at} style:opacity={s.opacity}>
			<span class="trail"></span>
			<span class="runner"></span>
			<span class="flag"></span>
		</span>
	{/each}
	<span class="passage" style:opacity={s.opacity}>
		{#each [...PASSAGE] as c, i (i)}{#if i === s.typed}<span class="caret" style:opacity={s.caret}></span>{/if}<span class:typed={i < s.typed}>{c}</span>{/each}
	</span>
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 12px;
		padding: 0 18px;
	}
	.lane {
		--hue: var(--accent);
		position: relative;
		height: 22px;
		border-radius: 3px;
		background: var(--band-surface-2);
	}
	.lane.pace {
		--hue: var(--violet);
	}
	.trail {
		position: absolute;
		left: 3px;
		top: 50%;
		width: calc((100% - 30px) * var(--at));
		height: 3px;
		margin-top: -1.5px;
		border-radius: 3px;
		background: linear-gradient(90deg, transparent, var(--hue));
	}
	.runner {
		position: absolute;
		top: 3px;
		left: calc(3px + (100% - 30px) * var(--at));
		width: 16px;
		height: 16px;
		border-radius: 3px;
		background: var(--hue);
	}
	/* Checkered finish. */
	.flag {
		position: absolute;
		top: 0;
		right: 0;
		width: 8px;
		height: 100%;
		background: conic-gradient(var(--band-ink) 25%, var(--band-bg) 0 50%, var(--band-ink) 0 75%, var(--band-bg) 0) 0 0 / 4px 4px;
		border-radius: 0 3px 3px 0;
	}
	.passage {
		margin-top: 4px;
		font-family: var(--font-mono);
		font-size: var(--fs-16);
		white-space: pre;
		color: var(--band-ink-4);
	}
	.passage .typed {
		color: var(--band-ink);
	}
	.caret {
		display: inline-block;
		width: 2px;
		height: 1em;
		margin-right: -2px;
		vertical-align: -0.12em;
		background: var(--accent);
	}
</style>
