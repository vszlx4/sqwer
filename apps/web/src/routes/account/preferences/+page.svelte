<script lang="ts">
	import { onMount } from 'svelte';
	import { LIST_LEVELS, WORD_LISTS, isWordListId } from '@sqwer/content';
	import PageHead from '#lib/account/PageHead.svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { detectPlatform, resetSettings, saveSettings, settings, TIME_OPTIONS, WORD_OPTIONS, type Settings } from '#lib/settings.svelte.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Segmented from '#lib/ui/Segmented.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import Switch from '#lib/ui/Switch.svelte';

	/** Preferences kept in this browser: theme, keyboard, typing test defaults and readouts. Each applies at once. */
	let mounted = $state(false);
	let reset = $state(false);
	onMount(() => (mounted = true));

	const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
		settings[key] = value;
		saveSettings();
		reset = false;
	};
	const flip = (key: 'showKeyboard' | 'showZones' | 'mapExtended' | 'punctuation' | 'numbers' | 'liveWpm') => (e: Event) =>
		set(key, (e.currentTarget as HTMLInputElement).checked);
	const flipRanked = (key: 'time' | 'speed') => (e: Event) => set('ranked', { ...settings.ranked, [key]: (e.currentTarget as HTMLInputElement).checked });

	const detected = $derived(mounted ? (detectPlatform() === 'mac' ? 'Mac' : 'PC') : '');
	const groups = (['English', 'Themed'] as const).map((name) => ({ name, lists: WORD_LISTS.filter((l) => l.group === name) }));
</script>

<Seo title="Preferences" description="Theme, keyboard and typing test preferences on this device." noindex />

<PageHead title="Preferences" line="Saved in this browser and applied at once. Other devices keep their own.">
	{#snippet action()}
		{#if mounted}
			<button
				type="button"
				class="btn"
				onclick={() => {
					resetSettings();
					reset = true;
				}}><Icon name="restart" size={16} /> Reset to defaults</button
			>
		{/if}
	{/snippet}
</PageHead>

{#if reset}<p class="form-alert success" role="status">Preferences reset to their defaults.</p>{/if}

{#if !mounted}
	<SkeletonRegion label="Loading preferences…">
		<Skeleton height="120px" />
		<Skeleton height="220px" />
	</SkeletonRegion>
{:else}
	<div class="panels">
		<SettingsSection title="Appearance" flush>
			<SettingRow label="Theme" hint="System follows your device." wide>
				<Segmented
					name="theme"
					label="Theme"
					value={settings.theme}
					options={[
						{ value: 'light', label: 'Light' },
						{ value: 'dark', label: 'Dark' },
						{ value: 'system', label: 'System' }
					]}
					onchange={(t) => set('theme', t)}
				/>
			</SettingRow>
		</SettingsSection>

		<SettingsSection title="Keyboard" flush>
			<SettingRow label="Layout" hint={`Auto uses this device: ${detected}.`} wide>
				<Segmented
					name="platform"
					label="Keyboard layout"
					value={settings.platform}
					options={[
						{ value: 'auto', label: 'Auto' },
						{ value: 'mac', label: 'Mac' },
						{ value: 'pc', label: 'PC' }
					]}
					onchange={(p) => set('platform', p)}
				/>
			</SettingRow>
			<SettingRow label="On-screen keyboard" hint="Shown under typing tests." for="showKeyboard">
				<Switch id="showKeyboard" checked={settings.showKeyboard} onchange={flip('showKeyboard')} />
			</SettingRow>
			<SettingRow label="Finger zones" hint="Colors each key by the finger that types it." for="showZones" disabled={!settings.showKeyboard}>
				<Switch id="showZones" checked={settings.showZones} disabled={!settings.showKeyboard} onchange={flip('showZones')} />
			</SettingRow>
			<SettingRow label="Number row in the finger map" hint="Maps the digits and symbols too." for="mapExtended">
				<Switch id="mapExtended" checked={settings.mapExtended} onchange={flip('mapExtended')} />
			</SettingRow>
		</SettingsSection>

		<SettingsSection title="Typing test" description="Where a timed or word-count test starts." flush>
			<SettingRow label="Mode" wide>
				<Segmented
					name="mode"
					label="Test mode"
					value={settings.mode}
					options={[
						{ value: 'time', label: 'Time' },
						{ value: 'words', label: 'Words' }
					]}
					onchange={(m) => set('mode', m)}
				/>
			</SettingRow>
			<SettingRow label={settings.mode === 'time' ? 'Length' : 'Words'} wide>
				{#if settings.mode === 'time'}
					<Segmented name="time" label="Test length in seconds" value={settings.time} options={TIME_OPTIONS.map((n) => ({ value: n, label: `${n} s` }))} onchange={(n) => set('time', n)} />
				{:else}
					<Segmented name="words" label="Words per test" value={settings.words} options={WORD_OPTIONS.map((n) => ({ value: n, label: String(n) }))} onchange={(n) => set('words', n)} />
				{/if}
			</SettingRow>
			<SettingRow label="Word list" for="wordList" wide>
				<select
					id="wordList"
					class="select"
					value={settings.wordList}
					onchange={(e) => {
						const id = e.currentTarget.value;
						if (isWordListId(id)) set('wordList', id);
					}}
				>
					{#each groups as g (g.name)}
						<optgroup label={g.name}>
							{#each g.lists as l (l.id)}
								<option value={l.id}>{l.name} · {LIST_LEVELS[l.level - 1]}{l.mature ? ' · mature' : ''}</option>
							{/each}
						</optgroup>
					{/each}
				</select>
			</SettingRow>
			<SettingRow label="Punctuation" for="punctuation">
				<Switch id="punctuation" checked={settings.punctuation} onchange={flip('punctuation')} />
			</SettingRow>
			<SettingRow label="Numbers" for="numbers">
				<Switch id="numbers" checked={settings.numbers} onchange={flip('numbers')} />
			</SettingRow>
			<SettingRow label="Live speed" hint="Words per minute while you type." for="liveWpm">
				<Switch id="liveWpm" checked={settings.liveWpm} onchange={flip('liveWpm')} />
			</SettingRow>
		</SettingsSection>

		<SettingsSection title="Ranked test" description="What the competitive test shows while it runs." flush>
			<SettingRow label="Time left" for="rankedTime">
				<Switch id="rankedTime" checked={settings.ranked.time} onchange={flipRanked('time')} />
			</SettingRow>
			<SettingRow label="Speed" for="rankedSpeed">
				<Switch id="rankedSpeed" checked={settings.ranked.speed} onchange={flipRanked('speed')} />
			</SettingRow>
		</SettingsSection>

		<p class="more"><Icon name="volume" size={16} /> <span>Volume and Listen and type are in <a href="/account/sound">Sound and voice</a>.</span></p>
	</div>
{/if}

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.select {
		min-height: 40px;
		max-width: 100%;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: var(--fs-14);
	}
	.select:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.more {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.more a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
</style>
