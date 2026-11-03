<script lang="ts">
	import ProfileForm from '#lib/account/ProfileForm.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<Seo title="Set up your profile" description="Set up your sqwer typing profile." noindex />

<div class="setup">
	<header>
		<h1>Set up your profile</h1>
		<p>Four short steps. You can change every answer later in your account settings.</p>
	</header>
	<ProfileForm
		mode="setup"
		submitLabel="Complete setup"
		errors={(form?.errors ?? {}) as Record<string, string>}
		initial={{
			displayName: '',
			username: data.suggestedUsername,
			bio: '',
			experience: 'intermediate',
			goal: 'speed',
			targetWpm: 60,
			platform: 'mac',
			avatarColor: 'lime',
			isPublic: false,
			headline: '',
			pronouns: '',
			banner: 'lime',
			showRank: true,
			showStats: true,
			showStreak: true,
			showOnLeaderboard: true
		}}
	/>
</div>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: 28px;
		max-width: 1000px;
		margin: 0 auto;
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	header p {
		margin-top: 10px;
		font-size: var(--fs-16);
		color: var(--ink-2);
	}
</style>
