<script lang="ts">
	import '../app.css';
	import { onNavigate } from '$app/navigation';
	import SiteFooter from '#lib/site/SiteFooter.svelte';
	import SiteHeader from '#lib/site/SiteHeader.svelte';
	import FingerMapSync from '#lib/fingermap/FingerMapSync.svelte';
	import ActivityTracker from '#lib/usage/ActivityTracker.svelte';
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
</script>

<a class="skip" href="#content">Skip to content</a>

<SiteHeader />

<div class="shell">
	<main id="content">
		{@render children()}
	</main>
</div>

<SiteFooter />

<FingerMapSync />
<ActivityTracker />

<style>
	.shell {
		min-height: calc(100dvh - 70px);
		width: 100%;
		display: flex;
		flex-direction: column;
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 clamp(16px, 4vw, 40px);
	}
	main {
		flex: 1;
		padding: clamp(20px, 4vh, 44px) 0 48px;
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
		font-weight: 600;
		text-decoration: none;
	}
	.skip:focus {
		top: 12px;
	}
</style>
