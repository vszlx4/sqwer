<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import { ACCOUNT_GROUPS, ACCOUNT_LINKS } from '#lib/site/links.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import type { LayoutProps } from './$types';

	/** Account area: grouped sidebar (a section menu on phones) beside the page. */
	let { data, children }: LayoutProps = $props();

	const path = $derived(page.url.pathname);
	const current = $derived(ACCOUNT_LINKS.find((t) => t.href === path));
	const setup = $derived(path === '/account/setup');
	const p = $derived(data.profile);
	const user = $derived(page.data.user);

	let open = $state(false);
	$effect(() => {
		void path;
		open = false;
	});
</script>

{#if setup || !p}
	{@render children()}
{:else}
	<Breadcrumbs items={current && current.href !== '/account' ? [{ href: '/account', label: 'Account' }, current] : [{ href: '/account', label: 'Account' }]} />

	<div class="account">
		<aside class="side">
			<a class="me" href="/account/profile">
				<Avatar name={p.displayName} color={p.avatarColor} size={40} src={data.avatar} />
				<span class="me-text">
					<b>{p.displayName}</b>
					<span>@{p.username}</span>
				</span>
			</a>
			<button class="toggle" type="button" aria-expanded={open} aria-controls="account-nav" onclick={() => (open = !open)}>
				<span>{current?.label ?? 'Account'}</span>
				<Icon name="chevron" size={16} />
			</button>
			<nav id="account-nav" class:open aria-label="Account sections">
				{#each ACCOUNT_GROUPS as g (g.label)}
					<div class="group">
						<p class="group-label" id={`nav-${g.label}`}>{g.label}</p>
						<ul aria-labelledby={`nav-${g.label}`}>
							{#each g.links as l (l.href)}
								<li>
									<a href={l.href} aria-current={path === l.href ? 'page' : undefined}><Icon name={l.icon} size={17} /> {l.label}</a>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
				<ul class="elsewhere">
					<li><a href="/practice/history"><Icon name="history" size={17} /> History</a></li>
					{#if p.isPublic}<li><a href={`/u/${p.username}`}><Icon name="arrow" size={17} /> Public profile</a></li>{/if}
					{#if user?.isAdmin}<li><a href="/admin/analytics"><Icon name="chart" size={17} /> Site analytics</a></li>{/if}
				</ul>
			</nav>
		</aside>
		<div class="content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.account {
		display: grid;
		grid-template-columns: 228px minmax(0, 1fr);
		gap: clamp(var(--space-24), 4vw, var(--space-48));
		align-items: start;
	}
	.side {
		position: sticky;
		top: 96px;
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		min-width: 0;
	}
	.me {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-8);
		margin: 0 calc(-1 * var(--space-8));
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		min-width: 0;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.me:hover {
		background: var(--surface);
	}
	.me-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.me-text b,
	.me-text span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.me-text b {
		font-size: var(--fs-15);
	}
	.me-text span {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.toggle {
		display: none;
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.group-label {
		padding: 0 var(--space-12);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		color: var(--ink-3);
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.elsewhere {
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
	}
	nav a {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		min-height: 38px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		font-size: var(--fs-15);
		color: var(--ink-2);
		text-decoration: none;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}
	nav a:hover {
		background: var(--surface);
		color: var(--ink);
	}
	nav a:focus-visible,
	.me:focus-visible,
	.toggle:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
	nav a[aria-current='page'] {
		background: var(--ink);
		color: var(--bg);
		font-weight: var(--fw-semibold);
	}
	.content {
		min-width: 0;
	}
	@media (max-width: 900px) {
		.account {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-24);
		}
		.side {
			position: static;
			display: grid;
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			gap: var(--space-12);
		}
		.toggle {
			display: inline-flex;
			align-items: center;
			gap: var(--space-8);
			min-height: 44px;
			padding: 0 var(--space-12) 0 var(--space-16);
			border-radius: var(--radius);
			border: 1px solid var(--line-strong);
			background: var(--surface);
			color: var(--ink);
			font: inherit;
			font-size: var(--fs-15);
			font-weight: var(--fw-semibold);
			cursor: pointer;
		}
		.toggle :global(svg) {
			transform: rotate(90deg);
			transition: transform var(--dur-base) var(--ease-out);
		}
		.toggle[aria-expanded='true'] :global(svg) {
			transform: rotate(-90deg);
		}
		nav {
			grid-column: 1 / -1;
			display: none;
			padding: var(--space-12);
			border-radius: var(--radius);
			border: 1px solid var(--line);
			background: var(--bg);
		}
		nav.open {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: var(--space-16) var(--space-12);
		}
		.elsewhere {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 420px) {
		nav.open {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
