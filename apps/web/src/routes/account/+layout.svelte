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
	.tabs a {
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
	.tabs a:hover {
		color: var(--ink);
		background: var(--surface);
	}
	.tabs a[aria-current='page'] {
		color: var(--ink);
		background: var(--surface);
		box-shadow: inset 3px 0 0 var(--accent);
		font-weight: 600;
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
		.tabs {
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
		}
		.tabs a {
			width: auto;
			white-space: nowrap;
		}
	}
</style>
