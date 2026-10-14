<script lang="ts">
	import { page } from '$app/state';

	let { items }: { items: { href: string; label: string }[] } = $props();

	const site = $derived((page.data.siteUrl as string | undefined) ?? '');
	const all = $derived([{ href: '/', label: 'Home' }, ...items]);
	const ld = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: all.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.label, item: `${site}${item.href}` }))
		}).replace(/</g, '\\u003c')
	);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${ld}</script>`}
</svelte:head>

<nav class="crumbs" aria-label="Breadcrumb">
	<ol>
		{#each all as item, i (item.href)}
			<li>
				{#if i === all.length - 1}
					<span aria-current="page">{item.label}</span>
				{:else}
					<a href={item.href}>{item.label}</a>
					<span class="sep" aria-hidden="true">/</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.crumbs {
		margin-bottom: 20px;
	}
	ol {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	li {
		display: inline-flex;
		gap: 6px;
	}
	a {
		color: var(--ink-2);
		text-decoration: none;
	}
	a:hover {
		color: var(--ink);
	}
	[aria-current='page'] {
		color: var(--ink);
		font-weight: 600;
	}
	.sep {
		color: var(--ink-3);
	}
</style>
