<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { beforeNavigate, onNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { areaFor } from '#lib/site/areas.ts';
	import { appMounted } from '#lib/motion/actions.ts';
	import { smoothScroll, stopSmoothScroll } from '#lib/motion/smooth-scroll.ts';
	import { installKeyboardGuards } from '#lib/ui/typing-focus.ts';
	import SiteFooter from '#lib/site/SiteFooter.svelte';
	import SiteHeader from '#lib/site/SiteHeader.svelte';
	import PageSkeleton from '#lib/site/PageSkeleton.svelte';
	import { skeletonKind } from '#lib/site/skeleton.ts';
	import FingerMapSync from '#lib/fingermap/FingerMapSync.svelte';
	import ActivityTracker from '#lib/usage/ActivityTracker.svelte';
	import Analytics from '#lib/analytics/Analytics.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Cross-fade between pages where the browser supports view transitions.
	onNavigate((navigation) => {
		if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		// Changing only the query (filters, test settings) keeps the page in place.
		if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// The area color follows client-side navigation; the server sets the first one in app.html.
	$effect(() => {
		const area = areaFor(page.url.pathname);
		if (area) document.documentElement.dataset.area = area;
		else delete document.documentElement.dataset.area;
	});

	// A navigation still loading after 150 ms shows the next page's skeleton; faster ones never flash it.
	// The old page stays mounted (hidden) so a cancelled or failed navigation finds it intact.
	let pending = $state<string | null>(null);
	$effect(() => {
		const to = navigating.to;
		if (!to || to.url.pathname === page.url.pathname) {
			pending = null;
			return;
		}
		const popstate = navigating.type === 'popstate';
		const timer = setTimeout(() => {
			pending = to.url.pathname;
			if (!popstate && !to.url.hash) scrollTo(0, 0);
		}, 150);
		return () => clearTimeout(timer);
	});

	// The router owns the scroll position across navigations.
	beforeNavigate(() => stopSmoothScroll());

	// Space never scrolls the page, and running exercises keep the keyboard (lib/ui/typing-focus.ts).
	onMount(() => installKeyboardGuards());
	onMount(() => smoothScroll());
	onMount(appMounted);
</script>

<a class="skip" href="#content">Skip to content</a>

<SiteHeader />

<div class="shell">
	<main id="content">
		{#if pending}<PageSkeleton kind={skeletonKind(pending)} />{/if}
		<div class="page" hidden={!!pending}>
			{@render children()}
		</div>
	</main>
</div>

<SiteFooter />

<FingerMapSync />
<ActivityTracker />
<Analytics />

<style>
	.shell {
		min-height: 100dvh;
		width: 100%;
		display: flex;
		flex-direction: column;
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 clamp(16px, 4vw, 40px);
	}
	main {
		flex: 1;
		padding: calc(var(--header-h) + var(--main-top)) 0 var(--main-bottom);
	}
	.page {
		display: contents;
	}
	.page[hidden] {
		display: none;
	}
	.skip {
		position: absolute;
		left: 12px;
		top: -60px;
		z-index: 50;
		padding: 10px 16px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: var(--fw-semibold);
		text-decoration: none;
	}
	.skip:focus {
		top: 12px;
	}
</style>
