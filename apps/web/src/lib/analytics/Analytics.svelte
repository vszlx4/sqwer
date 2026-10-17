<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { consent } from './consent.svelte.ts';
	import { startTracking, trackPage } from './tracker.ts';

	/**
	 * Asks for analytics consent and, once given, records page views. Nothing is collected, and no
	 * identifier is created, before the visitor allows it.
	 */
	const enabled = $derived(page.data.analytics !== false);
	let lastPath = '';

	onMount(() => {
		consent.load();
		startTracking();
	});

	afterNavigate((nav) => {
		if (!enabled || !nav.to) return;
		// Changing only the query (filters, test settings) is not a new page.
		if (nav.to.url.pathname === lastPath && nav.type !== 'enter') return;
		lastPath = nav.to.url.pathname;
		consent.load();
		trackPage(nav.to.url, nav.to.route.id);
	});

	function choose(choice: 'granted' | 'denied') {
		consent.set(choice);
		if (choice === 'granted') trackPage(page.url, page.route.id);
	}
</script>

{#if enabled && consent.ready && consent.open}
	<section class="consent" aria-labelledby="consent-title" aria-describedby="consent-text">
		<h2 id="consent-title">Can sqwer count your visit?</h2>
		<p id="consent-text">
			With your permission, sqwer records which pages you open and for how long, with your device type and browser, to see
			how the site is used. No cookies, no advertising, nothing shared with anyone. You can change this at any time under
			Analytics preferences at the foot of every page. <a href="/privacy#analytics">How analytics works</a>
		</p>
		{#if consent.optOut}
			<p class="note">Your browser asks sites not to track you, so analytics stays off.</p>
		{/if}
		<div class="actions">
			<button type="button" class="btn btn-primary" onclick={() => choose('granted')} disabled={consent.optOut}>Allow</button>
			<button type="button" class="btn" onclick={() => choose('denied')}>No, thanks</button>
		</div>
	</section>
{/if}

<style>
	.consent {
		position: fixed;
		left: 16px;
		bottom: 16px;
		z-index: 60;
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: min(440px, calc(100vw - 32px));
		padding: 18px 20px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow-lg);
		animation: rise-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes rise-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	h2 {
		font-size: 19px;
	}
	p {
		font-size: 14px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	a {
		color: var(--ink);
		font-weight: 600;
	}
	.note {
		color: var(--ink);
		font-weight: 600;
	}
	.actions {
		display: flex;
		gap: 8px;
	}
	.actions .btn {
		flex: 1;
		justify-content: center;
	}
	@media (prefers-reduced-motion: reduce) {
		.consent {
			animation: none;
		}
	}
</style>
