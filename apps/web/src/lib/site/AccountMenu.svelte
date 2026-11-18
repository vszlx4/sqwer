<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import RankEmblem from '#lib/competitive/RankEmblem.svelte';
	import { tierFor } from '#lib/progress/competitive.ts';
	import { examXp, type LevelStatus } from '#lib/progress/xp.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import VoiceMenuStatus from '#lib/voice/VoiceMenuStatus.svelte';
	import type { VoiceBrief } from '#lib/voice/status.ts';
	import SignOutDialog from './SignOutDialog.svelte';
	import { accountSection } from './links.ts';
	import type { IconName } from '#lib/ui/Icon.svelte';
	import { formatNumber } from '#lib/i18n/format.ts';

	/**
	 * Header account control: avatar and level. Click opens the menu; hovering the level shows XP to the next
	 * level and an estimate.
	 */
	interface Props {
		user: {
			email: string;
			profile: { username: string; displayName: string; avatarColor: string } | null;
			avatar: string | null;
			level: LevelStatus;
			best: number | null;
			pace: { tests: number; wpm: number | null; accuracy: number | null };
			isAdmin?: boolean;
			/** Supertonic's progress, on the machine running the copy only. */
			voice?: VoiceBrief | null;
		};
	}

	let { user }: Props = $props();
	let open = $state(false);
	let peek = $state(false);
	let confirming = $state(false);
	let root: HTMLElement | undefined = $state();
	let trigger: HTMLButtonElement | undefined = $state();

	const name = $derived(user.profile?.displayName ?? 'Your account');
	const tier = $derived(tierFor(user.best));
	const remaining = $derived(user.level.next - user.level.xp);
	/** Minutes of one-minute tests at the usual pace needed to reach the next level. */
	const minutes = $derived.by(() => {
		const { wpm, accuracy } = user.pace;
		if (wpm == null || accuracy == null) return null;
		const perMinute = examXp({ seconds: 60, wpm, accuracy, status: 'completed' });
		return perMinute > 0 ? Math.max(1, Math.ceil(remaining / perMinute)) : null;
	});
	const fmt = (n: number) => formatNumber(n);

	/** Few, clear choices; everything else is one click away in the account sidebar. */
	const MENU: { href: string; match: string; label: string; icon: IconName; admin?: boolean }[] = [
		{ href: '/account', match: '/account', label: 'Account', icon: 'user' },
		{ href: '/account/history', match: '/account/history', label: 'History', icon: 'history' },
		{ href: '/account/preferences', match: '/account/preferences', label: 'Preferences', icon: 'keyboard' },
		{ href: '/account/admin/analytics', match: '/account/admin/analytics', label: 'Administration', icon: 'layers', admin: true }
	];

	afterNavigate(() => {
		open = false;
		peek = false;
	});

	function onWindowClick(e: MouseEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		peek = false;
		if (open) {
			open = false;
			trigger?.focus();
		}
	}
	function toggle() {
		open = !open;
		peek = false;
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
		onclick={toggle}
	>
		<Avatar {name} color={user.profile?.avatarColor ?? 'ink'} size={30} src={user.avatar} />
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class="lvl" aria-hidden="true" onmouseenter={() => (peek = !open)} onmouseleave={() => (peek = false)}>{user.level.level}</span>
	</button>

	{#if peek && !open}
		<div class="card" role="tooltip">
			<div class="card-head">
				<b>Level {user.level.level}</b>
				<span>{fmt(remaining)} XP to level {user.level.level + 1}</span>
			</div>
			<div class="bar"><span style:transform={`scaleX(${user.level.progress})`}></span></div>
			<dl>
				<div><dt>Total XP</dt><dd>{fmt(user.level.xp)}</dd></div>
				<div><dt>Tests completed</dt><dd>{fmt(user.pace.tests)}</dd></div>
				{#if user.pace.wpm != null}<div><dt>Usual pace</dt><dd>{Math.round(user.pace.wpm)} WPM</dd></div>{/if}
			</dl>
			<p class="eta">
				{#if minutes}
					<Icon name="clock" size={14} /> About {minutes} {minutes === 1 ? 'minute' : 'minutes'} of tests at your usual pace.
				{:else}
					<Icon name="clock" size={14} /> Complete a test to see how long the next level will take.
				{/if}
			</p>
		</div>
	{/if}

	{#if open}
		<div class="panel" id="account-menu-panel">
			<a class="who" href={user.profile ? '/account' : '/account/setup'}>
				<Avatar {name} color={user.profile?.avatarColor ?? 'ink'} size={40} src={user.avatar} />
				<span class="id">
					<b>{name}</b>
					<span>{user.profile ? `@${user.profile.username}` : 'Profile not set up'}</span>
				</span>
				<span class="rank" title={tier?.name ?? 'Unranked'}><RankEmblem league={tier?.league ?? null} size={28} /></span>
			</a>
			<div class="level">
				<div class="row">
					<b>Level {user.level.level}</b>
					<span>{tier?.name ?? 'Unranked'}</span>
				</div>
				<div class="bar" role="progressbar" aria-label={`Progress to level ${user.level.level + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(user.level.progress * 100)}>
					<span style:transform={`scaleX(${user.level.progress})`}></span>
				</div>
				<p class="xp">{fmt(user.level.xp - user.level.floor)} / {fmt(user.level.next - user.level.floor)} XP</p>
			</div>
			{#if user.voice}<VoiceMenuStatus initial={user.voice} />{/if}
			<nav aria-label="Account">
				{#if user.profile}
					{#each MENU.filter((l) => !l.admin || user.isAdmin) as l (l.href)}
						<a href={l.href} aria-current={accountSection(page.url.pathname)?.href === l.match ? 'page' : undefined}><Icon name={l.icon} size={16} /> {l.label}</a>
					{/each}
				{:else}
					<a href="/account/setup"><Icon name="user" size={16} /> Complete your profile</a>
				{/if}
			</nav>
			<button type="button" class="signout" onclick={signOut}><Icon name="signout" size={16} /> Sign out</button>
		</div>
	{/if}
</div>

<SignOutDialog open={confirming} onclose={() => (confirming = false)} />

<style>
	.account-menu {
		position: relative;
	}
	/* Picture and level in one pill chip in the level color, sized and rounded like the other header controls. */
	.trigger {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		height: 38px;
		padding: var(--space-4);
		border: 1px solid var(--violet);
		border-radius: var(--radius-pill);
		background: var(--violet);
		cursor: pointer;
		outline-offset: 3px;
		transition:
			border-color var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	.account-menu .trigger :global(.avatar) {
		border-radius: var(--radius-pill);
	}
	.trigger:hover,
	.trigger[aria-expanded='true'] {
		border-color: var(--ink);
	}
	.trigger:active {
		transform: translateY(1px);
	}
	.lvl {
		display: grid;
		place-items: center;
		min-width: 30px;
		height: 30px;
		padding: 0 var(--space-6) 0 var(--space-4);
		color: var(--on-hue);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		font-variant-numeric: tabular-nums;
	}
	.card,
	.panel {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		z-index: var(--z-overlay);
		border-radius: var(--radius);
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
	.card {
		width: 248px;
		padding: var(--space-12) var(--space-16);
		pointer-events: none;
	}
	.card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-8);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.card-head b {
		font-size: var(--fs-14);
		color: var(--rank);
	}
	.card dl {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-top: var(--space-12);
		font-size: var(--fs-13);
	}
	.card dl div {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
	}
	.card dt {
		color: var(--ink-2);
	}
	.card dd {
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
	}
	.eta {
		display: flex;
		align-items: flex-start;
		gap: var(--space-6);
		margin-top: var(--space-10);
		padding-top: var(--space-10);
		border-top: 1px solid var(--line);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.eta :global(svg) {
		flex-shrink: 0;
		margin-top: var(--space-2);
	}
	.bar {
		height: 6px;
		margin-top: var(--space-8);
		border-radius: var(--radius);
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--xp-bar);
		transform-origin: left;
	}
	.panel {
		width: 264px;
		padding: var(--space-6);
	}
	.who {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-10);
		padding: var(--space-8);
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.who:hover {
		background: var(--surface);
	}
	.id {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.id b,
	.id span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.id b {
		font-size: var(--fs-15);
	}
	.id span {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.rank {
		display: grid;
		place-items: center;
	}
	.level {
		padding: var(--space-4) var(--space-8) var(--space-12);
		border-bottom: 1px solid var(--line);
		margin-bottom: var(--space-4);
	}
	.level .row {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
		font-size: var(--fs-13);
	}
	.level .row b {
		color: var(--rank);
	}
	.level .row span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink-2);
	}
	.level .bar {
		margin-top: var(--space-6);
	}
	.level .xp {
		margin-top: var(--space-4);
		font-size: var(--fs-12);
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}
	nav {
		display: flex;
		flex-direction: column;
	}
	nav a,
	.signout {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		width: 100%;
		min-height: 36px;
		padding: 0 var(--space-8);
		border-radius: var(--radius);
		font: inherit;
		font-size: var(--fs-14);
		color: var(--ink);
		text-align: left;
		text-decoration: none;
		background: none;
		border: 0;
		cursor: pointer;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	nav a :global(svg),
	.signout :global(svg) {
		color: var(--ink-2);
	}
	nav a:hover,
	.signout:hover {
		background: var(--surface);
	}
	nav a[aria-current='page'] {
		font-weight: var(--fw-semibold);
		background: var(--surface);
	}
	.who:focus-visible,
	nav a:focus-visible,
	.signout:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	.signout {
		margin-top: var(--space-4);
		border-top: 1px solid var(--line);
		border-radius: 0 0 var(--radius) var(--radius);
		color: var(--ink-2);
	}
	@media (prefers-reduced-motion: reduce) {
		.card,
		.panel {
			animation: none;
		}
	}
</style>
