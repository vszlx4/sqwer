<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHead from '#lib/account/PageHead.svelte';
	import SaveBar from '#lib/account/SaveBar.svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { EXPERIENCE, GOALS, PLATFORMS } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Segmented from '#lib/ui/Segmented.svelte';
	import type { PageProps } from './$types';

	/** What you are learning for: level, goal, target speed and keyboard. */
	let { data, form }: PageProps = $props();
	const p = $derived(data.profile!);

	const pick = () => ({ experience: p.experience, goal: p.goal, targetWpm: Number(p.targetWpm), platform: p.platform });
	type Values = ReturnType<typeof pick>;
	let saved = $state<Values>(untrack(pick));
	let v = $state<Values>(untrack(pick));
	const dirty = $derived(JSON.stringify(v) !== JSON.stringify(saved));
	let saving = $state(false);
	let justSaved = $state(false);
	const errors = $derived((form && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>);

	const PRESETS = [30, 50, 70, 90, 120] as const;
</script>

<Seo title="Course" description="Your typing level, goal and target speed on sqwer." noindex />

<PageHead title="Course" line="What you are learning for. The learning path and your profile use it." />

<form
	method="POST"
	action="?/save"
	class="panels"
	novalidate
	use:enhance={() => {
		saving = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				saved = { ...v };
				justSaved = true;
			}
			saving = false;
		};
	}}
	onchange={() => (justSaved = false)}
>
	{#if errors.form}<p class="form-alert" role="alert">{errors.form}</p>{/if}

	<SettingsSection title="Level">
		<div class="tiles" role="radiogroup" aria-label="Typing level">
			{#each EXPERIENCE as o (o.value)}
				<label class="tile" class:on={v.experience === o.value}>
					<input class="sr-only" type="radio" name="experience" value={o.value} bind:group={v.experience} />
					<b>{o.label}</b>
					<span>{o.hint}</span>
				</label>
			{/each}
		</div>
		{#if errors.experience}<p class="error">{errors.experience}</p>{/if}
	</SettingsSection>

	<SettingsSection title="Goal">
		<div class="tiles" role="radiogroup" aria-label="Main goal">
			{#each GOALS as o (o.value)}
				<label class="tile" class:on={v.goal === o.value}>
					<input class="sr-only" type="radio" name="goal" value={o.value} bind:group={v.goal} />
					<b>{o.label}</b>
					<span>{o.hint}</span>
				</label>
			{/each}
		</div>
		{#if errors.goal}<p class="error">{errors.goal}</p>{/if}
	</SettingsSection>

	<SettingsSection title="Target and keyboard" flush>
		<SettingRow label="Target speed" hint="Words per minute you are working toward." for="targetWpm" stacked>
			<div class="target">
				<output for="targetWpm" class="wpm"><b>{v.targetWpm}</b> WPM</output>
				<input id="targetWpm" name="targetWpm" type="range" min={10} max={250} step={5} bind:value={v.targetWpm} />
				<div class="presets">
					{#each PRESETS as n (n)}
						<button type="button" class="preset" aria-pressed={v.targetWpm === n} onclick={() => { v.targetWpm = n; justSaved = false; }}>{n}</button>
					{/each}
				</div>
			</div>
			{#if errors.targetWpm}<p class="error">{errors.targetWpm}</p>{/if}
		</SettingRow>
		<SettingRow label="Keyboard" hint="Drawn under your finger map on your profile." wide>
			<Segmented name="platform" label="Keyboard" options={PLATFORMS} bind:value={v.platform} />
		</SettingRow>
	</SettingsSection>

	<SaveBar {dirty} {saving} saved={justSaved} ondiscard={() => (v = { ...saved })} />
</form>

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-8);
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-12) var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		cursor: pointer;
		transition:
			border-color var(--dur-fast) var(--ease-out),
			background-color var(--dur-fast) var(--ease-out);
	}
	.tile:hover {
		border-color: var(--ink-3);
	}
	.tile b {
		font-size: var(--fs-15);
	}
	.tile span {
		font-size: var(--fs-13);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.tile.on {
		border-color: var(--ink);
		box-shadow: inset 0 0 0 1px var(--ink);
		background: var(--surface);
	}
	.tile:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.target {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--space-12) var(--space-20);
		width: 100%;
	}
	.wpm {
		min-width: 9ch;
		font-size: var(--fs-14);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.wpm b {
		font-size: var(--fs-28);
		color: var(--ink);
		letter-spacing: var(--tr-tight);
	}
	input[type='range'] {
		width: 100%;
		accent-color: var(--ink);
	}
	.presets {
		grid-column: 2;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6);
	}
	.preset {
		min-width: 44px;
		min-height: 32px;
		padding: 0 var(--space-8);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink-2);
		font: inherit;
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	.preset:hover {
		color: var(--ink);
		border-color: var(--ink-3);
	}
	.preset[aria-pressed='true'] {
		border-color: var(--ink);
		color: var(--ink);
	}
	.error {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--error);
	}
	@media (max-width: 1100px) {
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 560px) {
		.target {
			grid-template-columns: minmax(0, 1fr);
		}
		.presets {
			grid-column: 1;
		}
	}
</style>
