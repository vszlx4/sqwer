<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import SignOutDialog from './SignOutDialog.svelte';
	import { ACCOUNT_LINKS } from './links.ts';

	interface Props {
		user: {
			email: string;
			profile: { username: string; displayName: string; avatarColor: string } | null;
			avatar: string | null;
			level: import('#lib/progress/xp.ts').LevelStatus;
		};
	}

	let { user }: Props = $props();
	let open = $state(false);
	let confirming = $state(false);
	let root: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	const name = $derived(user.profile?.displayName ?? user.email.split('@')[0]!);

	afterNavigate(() => (open = false));

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (open && e.key === 'Escape') {
			open = false;
			trigger?.focus();
		}
	}
	function signOut() {
		open = false;
		confirming = true;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="account-menu" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		aria-expanded={open}
		aria-controls="account-menu-panel"
		aria-label={`Account menu for ${name}, level ${user.level.level}`}
		onclick={() => (open = !open)}
	>
		<Avatar {name} color={user.profile?.avatarColor ?? 'ink'} size={32} src={user.avatar} />
		<span class="lvl" aria-hidden="true">{user.level.level}</span>
		<Icon name="chevron" size={14} class="chevron" />
	</button>
	{#if open}
		<div class="panel" id="account-menu-panel">
			<div class="who">
				<p class="name">{name}</p>
				<p class="email">{user.email}</p>
				<div class="level">
					<span>Level {user.level.level}</span>
					<span class="xp">{user.level.xp - user.level.floor} / {user.level.next - user.level.floor} XP</span>
				</div>
				<div class="bar" role="progressbar" aria-label={`Progress to level ${user.level.level + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(user.level.progress * 100)}>
					<span style:transform={`scaleX(${user.level.progress})`}></span>
				</div>
			</div>
			<nav aria-label="Account">
				{#if user.profile}
					{#each ACCOUNT_LINKS as link (link.href)}
						<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a>
					{/each}
					<a href="/history" aria-current={page.url.pathname === '/history' ? 'page' : undefined}>History</a>
				{:else}
					<a href="/account/setup">Complete your profile</a>
				{/if}
			</nav>
			<div class="end">
				<button type="button" class="signout" onclick={signOut}>
					<Icon name="signout" size={16} /> Sign out
				</button>
			</div>
		</div>
	{/if}
</div>

<SignOutDialog open={confirming} onclose={() => (confirming = false)} />

<style>
	.account-menu {
		position: relative;
	}
	.trigger {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 3px 6px 3px 3px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink-2);
		cursor: pointer;
		transition: border-color 140ms ease;
	}
	.lvl {
		display: grid;
		place-items: center;
		min-width: 22px;
		height: 22px;
		padding: 0 5px;
		border-radius: 3px;
		background: var(--violet);
		color: #fff;
		font-size: 12px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.level {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		margin-top: 10px;
		font-size: 13px;
		font-weight: 700;
		color: var(--violet);
	}
	.level .xp {
		font-weight: 500;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.bar {
		height: 6px;
		margin-top: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--violet), var(--accent));
		transform-origin: left;
	}
	.trigger:hover {
		border-color: var(--ink-3);
	}
	.trigger :global(.chevron) {
		transform: rotate(90deg);
		transition: transform 180ms ease;
	}
	.trigger[aria-expanded='true'] :global(.chevron) {
		transform: rotate(-90deg);
	}
	.panel {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		z-index: 50;
		width: 264px;
		padding: 8px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow-lg);
		transform-origin: top right;
		animation: menu-in 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
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
	.signout {
		display: flex;
		align-items: center;
		gap: 8px;
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
		transition: background-color 120ms ease;
	}
	nav a:hover,
	.signout:hover {
		background: var(--surface);
	}
	nav a[aria-current='page'] {
		font-weight: 600;
		background: var(--surface);
	}
	.end {
		margin-top: 6px;
		padding-top: 6px;
		border-top: 1px solid var(--line);
	}
	.signout {
		color: var(--ink-2);
	}
</style>
