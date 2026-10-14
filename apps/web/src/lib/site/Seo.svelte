<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		/** Page title; the site name is appended. Omit on the home page. */
		title?: string;
		description: string;
		noindex?: boolean;
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
	}

	let { title, description, noindex = false, jsonLd }: Props = $props();

	const site = $derived((page.data.siteUrl as string | undefined) ?? '');
	const fullTitle = $derived(title ? `${title} — sqwer` : 'sqwer — Typing test and finger mapping');
	const canonical = $derived(`${site}${page.url.pathname}`);
	const image = $derived(`${site}/og.png`);
	// Escape "<" so structured data can never close the script element.
	const ld = $derived(jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : null);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonical} />
	{#if noindex}<meta name="robots" content="noindex, nofollow" />{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="sqwer" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="sqwer — typing test and finger mapping" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
	{#if ld}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html `<script type="application/ld+json">${ld}</script>`}
	{/if}
</svelte:head>
