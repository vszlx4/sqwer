<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const TABS = [
		{ href: '/account', label: 'Overview' },
		{ href: '/account/profile', label: 'Profile' },
		{ href: '/account/statistics', label: 'Statistics' },
		{ href: '/account/security', label: 'Security' },
		{ href: '/account/data', label: 'Your data' }
	];
	const current = $derived(TABS.find((t) => t.href === page.url.pathname));
	const setup = $derived(page.url.pathname === '/account/setup');
</script>

{#if setup}
	{@render children()}
{:else}
	<Breadcrumbs items={current && current.href !== '/account' ? [{ href: '/account', label: 'Account' }, current] : [{ href: '/account', label: 'Account' }]} />
	<div class="account">
		<nav class="tabs" aria-label="Account sections">
			{#each TABS as tab (tab.href)}
				<a href={tab.href} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>{tab.label}</a>
			{/each}
			<form method="POST" action="/signout">
				<button type="submit">Sign out</button>
			</form>
		</nav>
		<div class="content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.account {
		display: grid;
		grid-template-columns: 200px minmax(0, 1fr);
		gap: 40px;
		align-items: start;
	}
	.tabs {
		position: sticky;
		top: 96px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.tabs a,
	.tabs button {
		display: block;
		width: 100%;
		padding: 10px 12px;
		border-radius: 3px;
		font: inherit;
		font-size: 15px;
		font-weight: 500;
		text-align: left;
		color: var(--ink-2);
		text-decoration: none;
		background: none;
		border: 0;
		cursor: pointer;
	}
	.tabs a:hover,
	.tabs button:hover {
		color: var(--ink);
		background: var(--surface);
	}
	.tabs a[aria-current='page'] {
		color: var(--ink);
		background: var(--surface);
		box-shadow: inset 3px 0 0 var(--accent);
		font-weight: 600;
	}
	.tabs form {
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	@media (max-width: 760px) {
		.account {
			grid-template-columns: 1fr;
			gap: 20px;
		}
		.tabs {
			position: static;
			flex-direction: row;
			flex-wrap: wrap;
		}
		.tabs a,
		.tabs button {
			width: auto;
		}
		.tabs form {
			margin: 0;
			padding: 0;
			border: 0;
		}
	}
</style>
