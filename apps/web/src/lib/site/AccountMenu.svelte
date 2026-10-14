<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import Avatar from '#lib/account/Avatar.svelte';

	interface Props {
		user: {
			email: string;
			profile: { username: string; displayName: string; avatarColor: string } | null;
			avatar: string | null;
		};
	}

	let { user }: Props = $props();
	let open = $state(false);
	let root: HTMLElement | undefined = $state();

	const name = $derived(user.profile?.displayName ?? user.email.split('@')[0]!);

	afterNavigate(() => (open = false));

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="account-menu" bind:this={root}>
	<button
		type="button"
		class="trigger"
		aria-haspopup="true"
		aria-expanded={open}
		aria-controls="account-menu-panel"
		aria-label={`Account menu for ${name}`}
		onclick={() => (open = !open)}
	>
		<Avatar {name} color={user.profile?.avatarColor ?? 'ink'} size={32} src={user.avatar} />
	</button>
	{#if open}
		<div class="panel" id="account-menu-panel">
			<div class="who">
				<p class="name">{name}</p>
				<p class="email">{user.email}</p>
			</div>
			<nav aria-label="Account">
				{#if user.profile}
					<a href="/account">Account overview</a>
					<a href="/account/profile">Profile</a>
					<a href="/account/statistics">Statistics</a>
					<a href="/history">History</a>
					<a href="/account/security">Security</a>
					<a href="/account/data">Your data</a>
				{:else}
					<a href="/account/setup">Complete your profile</a>
				{/if}
			</nav>
			<form method="POST" action="/signout">
				<button type="submit">Sign out</button>
			</form>
		</div>
	{/if}
</div>

<style>
	.account-menu {
		position: relative;
	}
	.trigger {
		display: grid;
		place-items: center;
		padding: 3px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		cursor: pointer;
	}
	.panel {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		z-index: 50;
		width: 260px;
		padding: 8px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow);
	}
	.who {
		padding: 10px 10px 12px;
		border-bottom: 1px solid var(--line);
		margin-bottom: 6px;
	}
	.name {
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.email {
		font-size: 13px;
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}
	nav a,
	form button {
		display: block;
		width: 100%;
		padding: 9px 10px;
		border-radius: 3px;
		font: inherit;
		font-size: 14.5px;
		color: var(--ink);
		text-align: left;
		text-decoration: none;
		background: none;
		border: 0;
		cursor: pointer;
	}
	nav a:hover,
	form button:hover {
		background: var(--surface);
	}
	form {
		margin-top: 6px;
		padding-top: 6px;
		border-top: 1px solid var(--line);
	}
</style>
