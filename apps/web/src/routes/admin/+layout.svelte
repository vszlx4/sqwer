<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import type { LayoutProps } from './$types';

	/** The administration area: breadcrumbs and the section tabs above each page. */
	let { children }: LayoutProps = $props();

	const TABS = [
		{ href: '/admin/analytics', label: 'Overview' },
		{ href: '/admin/analytics/events', label: 'Events' }
	];
	const current = $derived(TABS.find((t) => t.href === page.url.pathname));
	// Tabs keep the chosen period and filters when switching views.
	const keep = $derived.by(() => {
		const q = new URLSearchParams(page.url.search);
		for (const k of ['after', 'session', 'event', 'source', 'browser', 'os', 'referrer']) q.delete(k);
		const s = q.toString();
		return s ? `?${s}` : '';
	});
</script>

<Breadcrumbs items={[{ href: '/admin', label: 'Administration' }, ...(current ? [{ href: current.href, label: current.label === 'Overview' ? 'Analytics' : 'Analytics events' }] : [])]} />

<div class="admin">
	<nav class="tabs" aria-label="Analytics views">
		{#each TABS as tab (tab.href)}
			<a href={`${tab.href}${keep}`} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>{tab.label}</a>
		{/each}
	</nav>
	{@render children()}
</div>

<style>
	.admin {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.tabs {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--line);
	}
	.tabs a {
		padding: 10px 14px;
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink-2);
		text-decoration: none;
		transition: color 140ms ease;
	}
	.tabs a:hover {
		color: var(--ink);
	}
	.tabs a[aria-current='page'] {
		color: var(--ink);
		border-bottom-color: var(--ink);
	}
</style>
