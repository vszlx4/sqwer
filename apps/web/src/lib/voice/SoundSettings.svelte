<script lang="ts">
	import { saveSettings, settings } from '#lib/settings.svelte.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { voice } from './player.svelte.ts';

	/** Listen and type on this device: voice volume, words shown instead of said, moving on by itself. Saved on the device. */
	let { compact = false }: { compact?: boolean } = $props();

	const pct = $derived(Math.round(settings.voiceVolume * 100));
</script>

<fieldset class="sound" class:compact>
	<legend>Listen and type on this device</legend>
	<label class="row">
		<span class="name"><Icon name={pct === 0 ? 'mute' : 'volume'} size={18} /> Voice volume</span>
		<input type="range" min="0" max="100" step="5" value={pct} oninput={(e) => voice.setVolume(Number(e.currentTarget.value) / 100)} aria-valuetext={`${pct}%`} />
		<span class="pct" aria-hidden="true">{pct}%</span>
	</label>
	<label class="row check">
		<input
			type="checkbox"
			checked={settings.showWords}
			onchange={(e) => {
				settings.showWords = e.currentTarget.checked;
				saveSettings();
			}}
		/>
		<span>
			<span class="name">Show words instead of sound</span>
			<span class="note">Each word appears for a moment and is typed from memory. For when sound is not an option.</span>
		</span>
	</label>
	<label class="row check">
		<input
			type="checkbox"
			checked={settings.autoContinue}
			onchange={(e) => {
				settings.autoContinue = e.currentTarget.checked;
				saveSettings();
			}}
		/>
		<span>
			<span class="name">Continue automatically after a right word</span>
			<span class="note">The next word plays a moment after a right answer. Missed words still wait for Continue.</span>
		</span>
	</label>
</fieldset>

<style>
	.sound {
		display: grid;
		gap: var(--space-12);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		margin-bottom: var(--space-8);
		font-weight: var(--fw-semibold);
	}
	.compact legend {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		min-width: 0;
	}
	.name {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		flex: none;
	}
	input[type='range'] {
		flex: 1;
		min-width: 0;
		accent-color: var(--accent);
	}
	.pct {
		flex: none;
		width: 4ch;
		text-align: end;
		font-variant-numeric: tabular-nums;
		color: var(--ink-2);
	}
	.check {
		align-items: flex-start;
	}
	.check input {
		margin-top: var(--space-4);
		accent-color: var(--accent);
	}
	.check > span {
		display: grid;
		gap: var(--space-2);
	}
	.note {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
</style>
