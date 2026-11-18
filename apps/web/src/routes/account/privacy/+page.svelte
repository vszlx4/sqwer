<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHead from '#lib/account/PageHead.svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import type { PageProps } from './$types';

	/** Who sees what: each switch saves the moment it changes. */
	let { data }: PageProps = $props();
	const p = $derived(data.profile!);

	let v = $state(
		untrack(() => ({
			isPublic: p.isPublic,
			showRank: p.showRank,
			showStats: p.showStats,
			showStreak: p.showStreak,
			showOnLeaderboard: p.showOnLeaderboard
		}))
	);
	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let formEl: HTMLFormElement | undefined = $state();
	const save = () => formEl?.requestSubmit();
</script>

<Seo title="Privacy" description="Choose who sees your sqwer profile." noindex />

<PageHead title="Privacy" line="Who sees your profile, and what it shows. Changes save at once.">
	{#snippet action()}
		<p class="saving" class:error={status === 'error'} role="status">
			{#if status === 'saving'}Saving…{:else if status === 'saved'}<Icon name="check" size={16} /> Saved{:else if status === 'error'}Not saved. Try again.{/if}
		</p>
	{/snippet}
</PageHead>

<form
	bind:this={formEl}
	method="POST"
	action="?/save"
	class="panels"
	use:enhance={() => {
		status = 'saving';
		return async ({ result, update }) => {
			await update({ reset: false });
			status = result.type === 'success' ? 'saved' : 'error';
		};
	}}
>
	<SettingsSection title="Profile" flush>
		<SettingRow label="Public profile" hint="Your email address is never shown." for="isPublic">
			<Switch id="isPublic" name="isPublic" bind:checked={v.isPublic} onchange={save} />
		</SettingRow>
		<div class="address" class:off={!v.isPublic}>
			{#if v.isPublic}
				<Icon name="eye" size={16} /> Anyone with the link sees <a href={`/u/${p.username}`}>/u/{p.username}</a>
			{:else}
				<Icon name="lock" size={16} /> Only you see your profile.
			{/if}
		</div>
	</SettingsSection>

	<SettingsSection title="Showcase" description="What a public profile shows besides your name, picture and details." flush>
		<SettingRow label="Rank and points" for="showRank">
			<Switch id="showRank" name="showRank" bind:checked={v.showRank} onchange={save} />
		</SettingRow>
		<SettingRow label="Best speed, accuracy and lessons" for="showStats">
			<Switch id="showStats" name="showStats" bind:checked={v.showStats} onchange={save} />
		</SettingRow>
		<SettingRow label="Daily streak" for="showStreak">
			<Switch id="showStreak" name="showStreak" bind:checked={v.showStreak} onchange={save} />
		</SettingRow>
	</SettingsSection>

	<SettingsSection title="Leaderboards" flush>
		<SettingRow label="Appear on the leaderboards" hint="Name, picture, level and best competitive speed. Your name links to your profile only while it is public." for="showOnLeaderboard">
			<Switch id="showOnLeaderboard" name="showOnLeaderboard" bind:checked={v.showOnLeaderboard} onchange={save} />
		</SettingRow>
	</SettingsSection>
	<noscript><button class="btn btn-primary" type="submit">Save</button></noscript>
</form>

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.saving {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		min-height: 24px;
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--success);
	}
	.saving.error {
		color: var(--error);
	}
	.address {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-8);
		padding: var(--space-12) var(--space-20);
		border-top: 1px solid var(--line);
		background: var(--surface);
		font-size: var(--fs-14);
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.address.off {
		color: var(--ink-2);
	}
	.address a {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
</style>
