<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import { saveSettings, settings, type ThemePref } from '#lib/settings.svelte.ts';

	const OPTIONS: { value: ThemePref; label: string; icon: 'sun' | 'moon' | 'system' }[] = [
		{ value: 'light', label: 'Light theme', icon: 'sun' },
		{ value: 'dark', label: 'Dark theme', icon: 'moon' },
		{ value: 'system', label: 'Use the system theme', icon: 'system' }
	];

	// The saved theme is only known in the browser; show the default until then.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	const current = $derived<ThemePref>(mounted ? settings.theme : 'light');

	function choose(value: ThemePref) {
		settings.theme = value;
		saveSettings();
	}

	// Radio group keyboard behaviour: arrow keys move the selection; the group is a single tab stop.
	function onkeydown(e: KeyboardEvent, index: number) {
		const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
		if (!step) return;
		e.preventDefault();
		const next = (index + step + OPTIONS.length) % OPTIONS.length;
		choose(OPTIONS[next]!.value);
		((e.currentTarget as HTMLElement).parentElement?.children[next] as HTMLElement | undefined)?.focus();
	}
</script>

<div class="toggle" role="radiogroup" aria-label="Colour theme">
	{#each OPTIONS as o, i (o.value)}
		<button
			type="button"
			role="radio"
			aria-checked={current === o.value}
			tabindex={current === o.value ? 0 : -1}
			onkeydown={(e) => onkeydown(e, i)}
			aria-label={o.label}
			title={o.label}
			onclick={() => choose(o.value)}
		>
			<Icon name={o.icon} size={16} />
		</button>
	{/each}
</div>

<style>
	.toggle {
		display: inline-flex;
		padding: 3px;
		gap: 2px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	button {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: 3px;
		color: var(--ink-2);
		cursor: pointer;
		transition:
			color 120ms ease,
			background 120ms ease;
	}
	button:hover {
		color: var(--ink);
	}
	button[aria-checked='true'] {
		background: var(--bg);
		color: var(--ink);
		box-shadow: 0 0 0 1px var(--line-strong);
	}
</style>
