<script lang="ts">
	import WakeSlider from '#lib/bits/WakeSlider.svelte';
	import { saveSettings, settings } from '#lib/settings.svelte.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import { sound } from './audio.svelte.ts';
	import VoiceIcon from './VoiceIcon.svelte';
	import { voice, type Said } from './player.svelte.ts';

	/** Listen and type on this device: voice volume and a test word, words shown instead of said, fast mode. Saved on the device. */
	let { compact = false, plain = false }: { compact?: boolean; /** Inside a titled panel: the legend is for screen readers only. */ plain?: boolean } = $props();

	const pct = $derived(Math.round(settings.voiceVolume * 100));

	const TEST_WORD = 'hello';
	let testing = $state(false);
	let tested = $state<Said | 'blocked' | null>(null);
	const TESTED: Record<Said | 'blocked', string> = {
		played: 'Heard it? Then you are set. If not, check the volume here and on your device.',
		stopped: 'Stopped before the end.',
		missing: 'This copy has no clip for the test word yet.',
		error: 'The voice did not answer. Words are shown instead until it does.',
		blocked: 'The browser is holding the sound. Press the button again to allow it.'
	};

	async function test() {
		testing = true;
		tested = null;
		tested = (await sound.unlock()) ? await voice.say(TEST_WORD) : 'blocked';
		testing = false;
	}
</script>

<fieldset class="sound" class:compact>
	<legend class:sr-only={plain}>{#if !compact}<VoiceIcon name="device" size={20} />{/if}Listen and type on this device</legend>
	<div class="row">
		<span class="name"><Icon name={pct === 0 ? 'mute' : 'volume'} size={18} /> Voice volume</span>
		<span class="slider"><WakeSlider value={pct} onChange={(v) => voice.setVolume(v / 100)} step={5} ariaLabel="Voice volume" formatValue={(v) => `${v}%`} /></span>
		<span class="pct" aria-hidden="true">{pct}%</span>
	</div>
	{#if voice.supported && !settings.showWords}
		<div class="test">
			<button type="button" class="btn" disabled={testing} onclick={test}><Icon name="play" size={16} /> {testing ? 'Playing…' : 'Play a test word'}</button>
			<span class="note" aria-live="polite">{tested ? TESTED[tested] : ''}</span>
		</div>
	{/if}
	<label class="row check">
		<span>
			<span class="name">Show words instead of sound</span>
			<span class="note">Each word shows for a moment; type it from memory.</span>
		</span>
		<Switch
			checked={settings.showWords}
			onchange={(e) => {
				settings.showWords = e.currentTarget.checked;
				saveSettings();
			}}
		/>
	</label>
	<label class="row check">
		<span>
			<span class="name">Fast mode</span>
			<span class="note">A right word moves on without Enter. Enter replays, Esc skips.</span>
		</span>
		<Switch
			checked={settings.fastMode}
			onchange={(e) => {
				settings.fastMode = e.currentTarget.checked;
				saveSettings();
			}}
		/>
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
		display: flex;
		align-items: center;
		gap: var(--space-10);
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
	.slider {
		flex: 1;
		min-width: 0;
	}
	.test {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-8) var(--space-12);
	}
	.pct {
		flex: none;
		width: 4ch;
		text-align: end;
		font-variant-numeric: tabular-nums;
		color: var(--ink-2);
	}
	.check {
		justify-content: space-between;
		cursor: pointer;
	}
	.check > span {
		display: grid;
		gap: var(--space-2);
		min-width: 0;
	}
	.note {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
</style>
