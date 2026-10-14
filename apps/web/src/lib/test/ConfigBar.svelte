<script lang="ts">
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import { settings, saveSettings, TIME_OPTIONS, WORD_OPTIONS } from '#lib/settings.svelte.ts';

	let { onchange }: { onchange: () => void } = $props();

	function update(fn: () => void) {
		fn();
		saveSettings();
		onchange();
	}

	const toggles: { key: 'punctuation' | 'numbers'; label: string; icon: IconName }[] = [
		{ key: 'punctuation', label: 'Punctuation', icon: 'at' },
		{ key: 'numbers', label: 'Numbers', icon: 'hash' }
	];
</script>

<div class="bar" role="toolbar" aria-label="Test settings">
	<div class="group">
		{#each toggles as t (t.key)}
			<button
				type="button"
				class="opt"
				aria-pressed={settings[t.key]}
				onclick={() => update(() => (settings[t.key] = !settings[t.key]))}
			>
				<Icon name={t.icon} size={15} />
				<span>{t.label}</span>
			</button>
		{/each}
	</div>

	<span class="sep" aria-hidden="true"></span>

	<div class="group" role="radiogroup" aria-label="Test mode">
		{#each [{ v: 'time', icon: 'clock' }, { v: 'words', icon: 'text' }] as const as m (m.v)}
			<button
				type="button"
				class="opt"
				role="radio"
				aria-checked={settings.mode === m.v}
				onclick={() => update(() => (settings.mode = m.v))}
			>
				<Icon name={m.icon} size={15} />
				<span>{m.v === 'time' ? 'Time' : 'Words'}</span>
			</button>
		{/each}
	</div>

	<span class="sep" aria-hidden="true"></span>

	<div class="group" role="radiogroup" aria-label={settings.mode === 'time' ? 'Seconds' : 'Word count'}>
		{#if settings.mode === 'time'}
			{#each TIME_OPTIONS as n (n)}
				<button
					type="button"
					class="opt num"
					role="radio"
					aria-checked={settings.time === n}
					aria-label={`${n} seconds`}
					onclick={() => update(() => (settings.time = n))}>{n}</button
				>
			{/each}
		{:else}
			{#each WORD_OPTIONS as n (n)}
				<button
					type="button"
					class="opt num"
					role="radio"
					aria-checked={settings.words === n}
					aria-label={`${n} words`}
					onclick={() => update(() => (settings.words = n))}>{n}</button
				>
			{/each}
		{/if}
	</div>
</div>

<style>
	.bar {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 5px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.group {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	.sep {
		width: 1px;
		height: 20px;
		background: var(--line-strong);
		margin: 0 6px;
	}
	.opt {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 11px;
		border-radius: 3px;
		font-size: 14px;
		font-weight: 500;
		color: var(--ink-3);
		cursor: pointer;
		transition:
			color 120ms ease,
			background 120ms ease;
	}
	.opt:hover {
		color: var(--ink);
	}
	.opt[aria-pressed='true'],
	.opt[aria-checked='true'] {
		color: var(--on-accent);
		background: var(--accent);
	}
	.num {
		font-family: var(--font-mono);
		font-size: 13.5px;
		min-width: 40px;
		justify-content: center;
	}
	@media (max-width: 640px) {
		.sep {
			display: none;
		}
		.opt {
			padding: 6px 9px;
		}
	}
</style>
