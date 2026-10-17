<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import RankEmblem from '#lib/competitive/RankEmblem.svelte';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { tierFor } from '#lib/progress/competitive.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import { ACCOUNT_LINKS } from '#lib/site/links.ts';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import type { LayoutProps } from './$types';

	/**
	 * The account area: who is signed in and how far they have come, with the account sections in
	 * a side navigation beside the page. The overview uses the name as its main heading; every
	 * other section has its own.
	 */
	let { data, children }: LayoutProps = $props();

	const ICONS: Record<string, IconName> = {
		'/account': 'gauge',
		'/account/profile': 'user',
		'/account/statistics': 'chart',
		'/account/security': 'shield',
		'/account/data': 'download'
	};
	const current = $derived(ACCOUNT_LINKS.find((t) => t.href === page.url.pathname));
	const setup = $derived(page.url.pathname === '/account/setup');
	const overview = $derived(page.url.pathname === '/account');
	const p = $derived(data.profile);
	const user = $derived(page.data.user);
	const level = $derived(user?.level ?? null);
	const tier = $derived(tierFor(user?.best ?? null));
	const since = $derived(new Date(data.account.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
	const fmt = (n: number) => n.toLocaleString('en-GB');
</script>

{#if setup || !p}
	{@render children()}
{:else}
	<Breadcrumbs items={current && current.href !== '/account' ? [{ href: '/account', label: 'Account' }, current] : [{ href: '/account', label: 'Account' }]} />

	<header class="identity">
		<div class="who">
			<Avatar name={p.displayName} color={p.avatarColor} size={72} src={data.avatar} />
			<div class="names">
				{#if overview}<h1 class="name">{p.displayName}</h1>{:else}<p class="name">{p.displayName}</p>{/if}
				<p class="handle">@{p.username} · Member since {since} · {p.isPublic ? 'Public profile' : 'Private profile'}</p>
			</div>
		</div>
		<dl class="standing">
			{#if level}
				<div class="level">
					<dt>Level</dt>
					<dd>
						<span class="big">{level.level}</span>
						<span class="bar" role="progressbar" aria-label={`Progress to level ${level.level + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)}>
							<span style:transform={`scaleX(${level.progress})`}></span>
						</span>
						<span class="sub">{fmt(level.next - level.xp)} XP to level {level.level + 1}</span>
					</dd>
				</div>
			{/if}
			<div class="rank">
				<dt>Competitive</dt>
				<dd>
					<RankEmblem league={tier?.league ?? null} size={40} />
					<span><b>{tier?.name ?? 'Unranked'}</b><span class="sub">{user?.best ? `Best ${Math.round(user.best)} WPM` : 'No ranked test yet'}</span></span>
				</dd>
			</div>
			<div class="course">
				<dt>Course</dt>
				<dd>
					<b>{courses.loaded ? courses.rank.rank.name : '…'}</b>
					<span class="sub">{courses.loaded ? `${fmt(courses.rank.points)} points · ${courses.streak}-day streak` : 'Loading'}</span>
				</dd>
			</div>
		</dl>
	</header>

	<div class="account">
		<nav class="side" aria-label="Account sections">
			<ul>
				{#each ACCOUNT_LINKS as tab (tab.href)}
					<li>
						<a href={tab.href} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>
							<Icon name={ICONS[tab.href] ?? 'user'} size={17} />
							{tab.label}
						</a>
					</li>
				{/each}
				<li class="sep" aria-hidden="true"></li>
				<li><a href="/history"><Icon name="history" size={17} /> History</a></li>
				{#if p.isPublic}<li><a href={`/u/${p.username}`}><Icon name="eye" size={17} /> Public profile</a></li>{/if}
			</ul>
		</nav>
		<div class="content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.identity {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 20px 32px;
		padding-bottom: 24px;
		margin-bottom: 28px;
		border-bottom: 1px solid var(--line);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 18px;
		min-width: 0;
	}
	.names {
		min-width: 0;
	}
	.name {
		font-family: var(--font-serif);
		font-size: clamp(30px, 3.6vw, 42px);
		line-height: 1.05;
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.handle {
		margin-top: 6px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.standing {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin: 0;
	}
	.standing > div {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 150px;
		padding: 10px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dt {
		font-size: 12px;
		font-weight: 600;
		color: var(--ink-3);
	}
	dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	.level dd {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 2px 10px;
	}
	.big {
		grid-row: 1 / span 2;
		display: grid;
		place-items: center;
		min-width: 38px;
		height: 38px;
		padding: 0 6px;
		border-radius: 3px;
		background: var(--violet);
		color: #fff;
		font-size: 18px;
		font-weight: 800;
	}
	.bar {
		height: 6px;
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
	.sub {
		display: block;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.rank dd {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.rank b,
	.course b {
		display: block;
		font-size: 15px;
	}
	.account {
		display: grid;
		grid-template-columns: 210px minmax(0, 1fr);
		gap: clamp(24px, 4vw, 48px);
		align-items: start;
	}
	.side {
		position: sticky;
		top: 96px;
	}
	.side ul {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.side a {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border-radius: 3px;
		font-size: 14.5px;
		font-weight: 500;
		color: var(--ink-2);
		text-decoration: none;
		transition:
			background-color 140ms ease,
			color 140ms ease;
	}
	.side a:hover {
		background: var(--surface);
		color: var(--ink);
	}
	.side a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
	.side a[aria-current='page'] {
		background: var(--surface-2);
		color: var(--ink);
		font-weight: 600;
		box-shadow: inset 3px 0 0 var(--accent);
	}
	.sep {
		height: 1px;
		margin: 8px 12px;
		background: var(--line);
	}
	.content {
		min-width: 0;
	}
	@media (max-width: 900px) {
		.account {
			grid-template-columns: 1fr;
			gap: 20px;
		}
		.side {
			position: static;
			margin: 0 -16px;
			padding: 0 16px;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.side ul {
			flex-direction: row;
			gap: 4px;
			width: max-content;
		}
		.side a {
			white-space: nowrap;
			padding: 8px 12px;
			border: 1px solid var(--line);
		}
		.side a[aria-current='page'] {
			box-shadow: none;
			border-color: var(--ink);
		}
		.sep {
			display: none;
		}
	}
	@media (max-width: 560px) {
		.standing {
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
		}
		.standing .level {
			grid-column: 1 / -1;
		}
		.standing > div {
			min-width: 0;
		}
	}
</style>
