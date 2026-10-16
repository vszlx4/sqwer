<script lang="ts">
	import { page } from '$app/state';
	import AvatarUpload from '#lib/account/AvatarUpload.svelte';
	import ProfileForm from '#lib/account/ProfileForm.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const p = $derived(data.profile!);
</script>

<Seo title="Edit profile" description="Edit your sqwer profile." noindex />

<div class="stack">
	<h1>Profile</h1>
	{#if page.url.searchParams.get('saved') === '1' && !form}
		<p class="form-alert success" role="status">Your profile has been saved.</p>
	{/if}
	{#if form && 'avatarSaved' in form}<p class="form-alert success" role="status">Your profile picture has been saved.</p>{/if}
	{#if form && 'avatarRemoved' in form}<p class="form-alert success" role="status">Your profile picture has been removed.</p>{/if}
	<section class="personal" aria-labelledby="personal-title">
		<h2 id="personal-title">Personal information</h2>
		<dl>
			<div>
				<dt>Email address</dt>
				<dd>{page.data.user?.email}</dd>
			</div>
		</dl>
		<p class="note">Only you can see your email address. It is used to sign in and to reset your password, and is never shown on your profile or the leaderboards. To change it, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from your current address.</p>
	</section>
	<AvatarUpload
		name={p.displayName}
		color={p.avatarColor}
		src={data.avatar}
		error={form && 'avatarError' in form ? (form.avatarError as string) : null}
	/>
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
	.stack {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	h1 {
		font-size: clamp(30px, 4vw, 42px);
	}
	.personal {
		padding: 18px 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.personal h2 {
		font-size: 17px;
	}
	.personal dl div {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-top: 10px;
		font-size: 15px;
	}
	.personal dt {
		min-width: 120px;
		color: var(--ink-2);
	}
	.personal dd {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.note {
		margin-top: 8px;
		max-width: 68ch;
		font-size: 13.5px;
		color: var(--ink-2);
	}
</style>
