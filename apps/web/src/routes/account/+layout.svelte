<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import { ACCOUNT_LINKS } from '#lib/site/links.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const TABS = ACCOUNT_LINKS;
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
		</nav>
		<div class="content">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	/* Account sections are tabs across the top, not a side panel: one row that scrolls on small screens. */
	.account {
		display: flex;
		flex-direction: column;
		gap: 28px;
	}
	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		overflow-x: auto;
		scrollbar-width: none;
		align-self: flex-start;
		max-width: 100%;
	}
	.tabs a {
		flex-shrink: 0;
		padding: 9px 16px;
		border-radius: 3px;
		font-size: 14.5px;
		font-weight: 500;
		white-space: nowrap;
		color: var(--ink-2);
		text-decoration: none;
		transition:
			color 160ms ease,
			background-color 160ms ease;
	}
	.tabs a:hover {
		color: var(--ink);
	}
	.tabs a[aria-current='page'] {
		color: var(--ink);
		background: var(--bg);
		font-weight: 600;
		box-shadow: var(--shadow);
	}
</style>
