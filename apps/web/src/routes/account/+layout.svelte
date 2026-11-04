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
	import { formatDate, formatNumber } from '#lib/i18n/format.ts';

	/** Account area: header with standing, side navigation. Overview uses the name as its heading. */
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
	const since = $derived(formatDate(data.account.createdAt, { month: 'long', year: 'numeric' }));
	const fmt = (n: number) => formatNumber(n);
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
				{#if user?.isAdmin}<li><a href="/admin/analytics"><Icon name="chart" size={17} /> Site analytics</a></li>{/if}
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
		gap: var(--space-20) var(--space-32);
		padding-bottom: var(--space-24);
		margin-bottom: var(--space-32);
		border-bottom: 1px solid var(--line);
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--space-20);
		min-width: 0;
	}
	.names {
		min-width: 0;
	}
	.name {
		font-family: var(--font-serif);
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.handle {
		margin-top: var(--space-6);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.standing {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-10);
		margin: 0;
	}
	.standing > div {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 150px;
		padding: var(--space-10) var(--space-16);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dt {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
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
		gap: var(--space-2) var(--space-10);
	}
	.big {
		grid-row: 1 / span 2;
		display: grid;
		place-items: center;
		min-width: 38px;
		height: 38px;
		padding: 0 var(--space-6);
		border-radius: 3px;
		background: var(--violet);
		color: var(--on-hue);
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
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
		background: var(--xp-bar);
		transform-origin: left;
	}
	.sub {
		display: block;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.rank dd {
		display: flex;
		align-items: center;
		gap: var(--space-10);
	}
	.rank b,
	.course b {
		display: block;
		font-size: var(--fs-15);
	}
	.account {
		display: grid;
		grid-template-columns: 210px minmax(0, 1fr);
		gap: clamp(var(--space-24), 4vw, var(--space-48));
		align-items: start;
	}
	.side {
		position: sticky;
		top: 96px;
	}
	.side ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.side a {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		padding: var(--space-10) var(--space-12);
		border-radius: 3px;
		font-size: var(--fs-15);
		font-weight: var(--fw-regular);
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
		font-weight: var(--fw-semibold);
		box-shadow: inset 3px 0 0 var(--accent);
	}
	.sep {
		height: 1px;
		margin: var(--space-8) var(--space-12);
		background: var(--line);
	}
	.content {
		min-width: 0;
	}
	@media (max-width: 900px) {
		.account {
			grid-template-columns: 1fr;
			gap: var(--space-20);
		}
		.side {
			position: static;
			margin: 0 calc(var(--space-16) * -1);
			padding: 0 var(--space-16);
			overflow-x: auto;
			scrollbar-width: none;
		}
		.side ul {
			flex-direction: row;
			gap: var(--space-4);
			width: max-content;
		}
		.side a {
			white-space: nowrap;
			padding: var(--space-8) var(--space-12);
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
