<script lang="ts">
	import Avatar from '#lib/account/Avatar.svelte';
	import { EXPERIENCE, GOALS, labelOf, PLATFORMS } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.profile!);
	const since = $derived(new Date(data.account.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<Seo title="Account overview" description="Your sqwer account overview." noindex />

<div class="stack">
	{#if data.welcome}
		<p class="form-alert success" role="status">Your profile is complete. Thank you for setting up your account.</p>
	{/if}

	<header class="head">
		<Avatar name={p.displayName} color={p.avatarColor} size={72} src={data.avatar} />
		<div>
			<h1>{p.displayName}</h1>
			<p class="meta">@{p.username} · Member since {since}</p>
			{#if p.bio}<p class="bio">{p.bio}</p>{/if}
		</div>
	</header>

	<dl class="tiles">
		<div class="tile"><dt>Experience</dt><dd>{labelOf(EXPERIENCE, p.experience)}</dd></div>
		<div class="tile"><dt>Main goal</dt><dd>{labelOf(GOALS, p.goal)}</dd></div>
		<div class="tile"><dt>Target speed</dt><dd>{p.targetWpm} WPM</dd></div>
		<div class="tile"><dt>Keyboard</dt><dd>{labelOf(PLATFORMS, p.platform)}</dd></div>
	</dl>

	<div class="grid">
		<section class="card">
			<h2>Finger map</h2>
			{#if data.fingerMap.count}
				<p>{data.fingerMap.count} tagged keystrokes are saved to your account and kept in sync on this device.</p>
			{:else}
				<p>No finger map data is saved to your account yet. Data you record while signed in is saved automatically.</p>
			{/if}
			<a class="link-arrow" href="/map">Open the finger map <Icon name="arrow" size={16} /></a>
		</section>
		<section class="card">
			<h2>Security</h2>
			<p>
				{data.recoveryCodes} of 8 recovery codes remaining · {data.sessionCount} signed-in
				{data.sessionCount === 1 ? 'device' : 'devices'}
			</p>
			{#if data.recoveryCodes <= 2}<p class="warn">Few recovery codes remain. Generate a new set to keep access to your account.</p>{/if}
			<a class="link-arrow" href="/account/security">Manage security <Icon name="arrow" size={16} /></a>
		</section>
		<section class="card">
			<h2>Profile visibility</h2>
			<p>{p.isPublic ? 'Your profile is public.' : 'Your profile is private. Only you can see it.'}</p>
			<div class="row">
				<a class="link-arrow" href="/account/profile">Edit profile <Icon name="arrow" size={16} /></a>
				{#if p.isPublic}<a class="link-arrow" href={`/u/${p.username}`}>View public profile <Icon name="arrow" size={16} /></a>{/if}
			</div>
		</section>
	</div>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.head {
		display: flex;
		gap: 18px;
		align-items: center;
	}
	h1 {
		font-size: clamp(30px, 4vw, 42px);
		line-height: 1.1;
		overflow-wrap: anywhere;
	}
	.meta {
		margin-top: 4px;
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.bio {
		margin-top: 8px;
		max-width: 560px;
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}
	.tile,
	.card {
		padding: 16px 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	dd {
		margin-top: 4px;
		font-size: 19px;
		font-weight: 600;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
	h2 {
		font-size: 22px;
	}
	.card p {
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink-2);
		flex: 1;
	}
	.card .warn {
		color: var(--error);
		font-weight: 600;
	}
	.row {
		display: flex;
		gap: 18px;
		flex-wrap: wrap;
	}
	@media (max-width: 960px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
