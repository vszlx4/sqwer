<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import RankEmblem from '#lib/competitive/RankEmblem.svelte';
	import { tierFor } from '#lib/progress/competitive.ts';
	import { examXp, type LevelStatus } from '#lib/progress/xp.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import SignOutDialog from './SignOutDialog.svelte';
	import { ACCOUNT_LINKS } from './links.ts';
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
		<Avatar {name} color={user.profile?.avatarColor ?? 'ink'} size={32} src={user.avatar} />
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
			<div class="who">
				<div class="id">
					<p class="name">{name}</p>
					<p class="handle">{user.profile ? `@${user.profile.username}` : 'Profile not set up'}</p>
				</div>
				<a class="rank" href="/competitive" aria-label={tier ? `Competitive rank: ${tier.name}` : 'Competitive rank: unranked'}>
					<RankEmblem league={tier?.league ?? null} size={40} />
					<span>{tier?.name ?? 'Unranked'}</span>
				</a>
			</div>
			<div class="level">
				<div class="row">
					<span>Level {user.level.level}</span>
					<span class="xp">{fmt(user.level.xp - user.level.floor)} / {fmt(user.level.next - user.level.floor)} XP</span>
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
					{#if user.isAdmin}<a href="/admin/analytics" aria-current={page.url.pathname.startsWith('/admin') ? 'page' : undefined}>Analytics</a>{/if}
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
	/* The picture and the level read as one element: two squares of the same size, side by side. */
	.trigger {
		display: flex;
		align-items: center;
		padding: 0;
		border: 0;
		border-radius: 3px;
		background: none;
		cursor: pointer;
		outline-offset: 3px;
		transition: transform 140ms ease;
	}
	.account-menu .trigger :global(.avatar) {
		border-radius: 3px 0 0 3px;
	}
	.trigger:active {
		transform: translateY(1px);
	}
	.lvl {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 0 3px 3px 0;
		background: var(--violet);
		color: var(--on-hue);
		font-size: 13px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		transition: filter 140ms ease;
	}
	.trigger:hover .lvl,
	.trigger[aria-expanded='true'] .lvl {
		filter: brightness(1.12);
	}
	.card,
	.panel {
		position: absolute;
		right: 0;
		top: calc(100% + 8px);
		z-index: 50;
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
	.card {
		width: 248px;
		padding: 12px 14px;
		pointer-events: none;
	}
	.card-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.card-head b {
		font-size: 14px;
		color: var(--rank);
	}
	.card dl {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 12px;
		font-size: 13px;
	}
	.card dl div {
		display: flex;
		justify-content: space-between;
		gap: 8px;
	}
	.card dt {
		color: var(--ink-2);
	}
	.card dd {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.eta {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--line);
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.eta :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.bar {
		height: 6px;
		margin-top: 8px;
		border-radius: 3px;
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
		width: 280px;
		padding: 8px;
	}
	.who {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 10px 4px;
	}
	.id {
		min-width: 0;
	}
	.name {
		font-weight: 600;
		line-height: 1.3;
		overflow-wrap: anywhere;
	}
	.handle {
		font-size: 13px;
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}
	.rank {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
		max-width: 92px;
		padding: 4px;
		border-radius: 3px;
		font-size: 11.5px;
		font-weight: 600;
		line-height: 1.2;
		text-align: center;
		color: var(--ink-2);
		text-decoration: none;
	}
	.rank:hover {
		background: var(--surface);
		color: var(--ink);
	}
	.level {
		padding: 8px 10px 12px;
		border-bottom: 1px solid var(--line);
		margin-bottom: 6px;
	}
	.level .row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-size: 13px;
		font-weight: 700;
		color: var(--rank);
	}
	.level .xp {
		font-weight: 500;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
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
	@media (prefers-reduced-motion: reduce) {
		.card,
		.panel {
			animation: none;
		}
	}
</style>
