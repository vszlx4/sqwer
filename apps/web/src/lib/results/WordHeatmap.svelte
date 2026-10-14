<script lang="ts">
	import type { WordRecord } from './types.ts';

	let { words }: { words: WordRecord[] } = $props();

	let active = $state<number | null>(null);

	// Five speed bands relative to this test, from the correctly typed words.
	const thresholds = $derived.by(() => {
		const speeds = words.filter((w) => w.ok).map((w) => w.wpm).sort((a, b) => a - b);
		if (!speeds.length) return [0, 0, 0, 0];
		const q = (p: number) => speeds[Math.min(speeds.length - 1, Math.floor(p * speeds.length))]!;
		return [q(0.2), q(0.4), q(0.6), q(0.8)];
	});
	const band = (wpm: number) => 1 + thresholds.filter((t) => wpm >= t).length;
	const inkFor = (b: number) => (b >= 4 ? 'var(--heat-ink-dark)' : 'var(--heat-ink-light)');

	const describe = (w: WordRecord) =>
		`${w.w}: ${Math.round(w.wpm)} WPM in ${(w.ms / 1000).toFixed(2)} seconds${w.ok ? '' : `, typed as “${w.t || '(skipped)'}”`}`;
	const shown = $derived(active === null ? null : words[active]);
</script>

<div class="heatmap">
	<ul class="words" aria-label="Words in this test, coloured by speed">
		{#each words as w, i (i)}
			{@const b = band(w.wpm)}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<li
				class:wrong={!w.ok}
				tabindex="0"
				aria-label={describe(w)}
				style:background={w.ok ? `var(--heat-${b})` : 'var(--error-soft)'}
				style:color={w.ok ? inkFor(b) : 'var(--ink)'}
				onpointerenter={() => (active = i)}
				onpointerleave={() => (active = active === i ? null : active)}
				onfocus={() => (active = i)}
				onblur={() => (active = active === i ? null : active)}
			>
				{w.w}
			</li>
		{/each}
	</ul>
	<div class="foot">
		<p class="detail" aria-live="polite">
			{#if shown}
				<b>{shown.w}</b> · {Math.round(shown.wpm)} WPM · {(shown.ms / 1000).toFixed(2)} s
				{#if !shown.ok} · typed as <b class="typed">{shown.t || '(skipped)'}</b>{/if}
			{:else}
				Hover over or focus a word to see its speed.
			{/if}
		</p>
		<div class="scale" aria-hidden="true">
			<span>Slower</span>
			{#each [1, 2, 3, 4, 5] as b (b)}<i style:background={`var(--heat-${b})`}></i>{/each}
			<span>Faster</span>
			<i class="wrong-swatch"></i><span>Incorrect</span>
		</div>
	</div>
</div>

<style>
	.words {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		font-family: var(--font-mono);
		font-size: 15px;
	}
	li {
		padding: 4px 8px;
		border-radius: 3px;
		border: 2px solid transparent;
		cursor: default;
	}
	li.wrong {
		border-color: var(--error);
	}
	li:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
		box-shadow: none;
	}
	.foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: 12px;
	}
	.detail {
		font-size: 14px;
		color: var(--ink-2);
		min-height: 1.4em;
	}
	.detail b {
		color: var(--ink);
	}
	.typed {
		color: var(--error) !important;
	}
	.scale {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.scale i {
		width: 16px;
		height: 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	.scale span {
		margin: 0 4px;
	}
	.scale .wrong-swatch {
		margin-left: 10px;
		background: var(--error-soft);
		border: 2px solid var(--error);
	}
</style>
