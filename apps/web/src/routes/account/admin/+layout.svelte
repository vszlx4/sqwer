<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	/** The administration area: breadcrumbs and the section tabs above each page. */
	let { children }: LayoutProps = $props();

	const TABS = [
		{ href: '/account/admin/analytics', label: 'Overview' },
		{ href: '/account/admin/analytics/events', label: 'Events' },
		{ href: '/account/admin/users', label: 'Users' }
	];
	// The authenticator pages come before the dashboard: no tabs there.
	const gate = $derived(page.url.pathname.startsWith('/account/admin/2fa'));
	const current = $derived(TABS.find((t) => t.href === page.url.pathname));
	// Tabs keep the chosen period and filters when switching views.
	const keep = $derived.by(() => {
		const q = new URLSearchParams(page.url.search);
		for (const k of ['after', 'session', 'event', 'source', 'browser', 'os', 'referrer', 'q']) q.delete(k);
		const s = q.toString();
		return s ? `?${s}` : '';
	});
</script>


<div class="admin">
	{#if !gate}
	<nav class="tabs" aria-label="Administration sections">
		{#each TABS as tab (tab.href)}
			<a href={`${tab.href}${keep}`} aria-current={page.url.pathname === tab.href ? 'page' : undefined}>{tab.label}</a>
		{/each}
	</nav>
	{/if}
	{@render children()}
</div>

<style>
	.admin {
		display: flex;
		flex-direction: column;
		gap: var(--space-24);
	}
	.tabs {
		display: flex;
		gap: var(--space-4);
		border-bottom: 1px solid var(--line);
	}
	.tabs a {
		padding: var(--space-10) var(--space-16);
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		text-decoration: none;
		transition: color var(--dur-fast) var(--ease-out);
	}
	.tabs a:hover {
		color: var(--ink);
	}
	.tabs a[aria-current='page'] {
		color: var(--ink);
		border-bottom-color: var(--ink);
	}
</style>
