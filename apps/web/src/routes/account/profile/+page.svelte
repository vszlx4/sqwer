<script lang="ts">
	import { page } from '$app/state';
	import AvatarUpload from '#lib/account/AvatarUpload.svelte';
	import ProfileForm from '#lib/account/ProfileForm.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const p = $derived(data.profile!);
</script>

<Seo title="Edit profile" description="Edit your sqwer profile." noindex />

<div class="page">
	<header class="page-head">
		<h1>Profile</h1>
		<p>How you appear on your profile and the leaderboards, and the details sqwer uses to tailor the course.</p>
	</header>
	{#if page.url.searchParams.get('saved') === '1' && !form}
		<p class="form-alert success" role="status">Your profile has been saved.</p>
	{/if}
	{#if form && 'avatarSaved' in form}<p class="form-alert success" role="status">Your profile picture has been saved.</p>{/if}
	{#if form && 'avatarRemoved' in form}<p class="form-alert success" role="status">Your profile picture has been removed.</p>{/if}
	<SettingsSection title="Personal information" description="Private to you. Used to sign in and to reset your password; never shown on your profile or the leaderboards.">
		<dl class="personal">
			<div>
				<dt>Email address</dt>
				<dd>{page.data.user?.email}</dd>
			</div>
		</dl>
		<p class="note">To change it, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from your current address.</p>
	</SettingsSection>
	<SettingsSection title="Profile picture" description="A square image shown on your profile, in the header and on the leaderboards.">
	<AvatarUpload
		name={p.displayName}
		color={p.avatarColor}
		src={data.avatar}
		error={form && 'avatarError' in form ? (form.avatarError as string) : null}
	/>
	</SettingsSection>
	<div class="details-head">
		<h2>Profile details</h2>
		<p>Changes appear in the preview as you make them. Save to publish them.</p>
	</div>
	<ProfileForm
		mode="edit"
		action="?/save"
		avatar={data.avatar}
		submitLabel="Save profile"
		errors={(form && 'errors' in form ? form.errors : {}) as Record<string, string>}
		initial={{
			displayName: p.displayName,
			username: p.username,
			bio: p.bio,
			experience: p.experience,
			goal: p.goal,
			targetWpm: p.targetWpm,
			platform: p.platform,
			avatarColor: p.avatarColor,
			isPublic: p.isPublic,
			headline: p.headline,
			pronouns: p.pronouns,
			banner: p.banner,
			showRank: p.showRank,
			showStats: p.showStats,
			showStreak: p.showStreak,
			showOnLeaderboard: p.showOnLeaderboard
		}}
	/>
</div>

<style>
	.page {
		display: flex;
		flex-direction: column;
	}
	.page-head {
		margin-bottom: 8px;
	}
	.page-head p,
	.details-head p {
		margin-top: 6px;
		max-width: 64ch;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(28px, 3.2vw, 36px);
	}
	.page > :global(.form-alert) {
		margin: 8px 0;
	}
	.personal div {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		align-items: baseline;
	}
	.personal dt {
		min-width: 120px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.personal dd {
		margin: 0;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.note {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.details-head {
		padding: 28px 0 18px;
		border-top: 1px solid var(--line);
	}
	.details-head h2 {
		font-size: 20px;
	}
</style>
