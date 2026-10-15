<script lang="ts">
	import { page } from '$app/state';
	import AvatarUpload from '#lib/account/AvatarUpload.svelte';
	import ProfileForm from '#lib/account/ProfileForm.svelte';
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
			showStreak: p.showStreak
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
</style>
