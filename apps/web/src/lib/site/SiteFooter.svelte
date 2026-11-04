<script lang="ts">
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import BranchedMenu from '#lib/bits/BranchedMenu.svelte';
	import { page } from '$app/state';
	import { consent } from '#lib/analytics/consent.svelte.ts';
	import { FOOTER_SECTIONS, LEGAL } from './links.ts';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="inner">
		<div class="top">
			<div class="intro">
				<a href="/" class="logo" aria-label="sqwer home"><LogoWordmark class="footer-wordmark" /></a>
				<p class="tagline">Learn to touch type, measure every finger and improve with purpose.</p>
			</div>

			<div class="groups">
				<BranchedMenu sections={FOOTER_SECTIONS} current={page.url.pathname} />
			</div>
		</div>

		<div class="bottom">
			<p class="owner">© {year} <span translate="no">sqwer</span> · A free project by {LEGAL.operatorName}</p>
			{#if page.data.analytics !== false}
				<button type="button" class="prefs" onclick={() => ((consent.ready || consent.load()), (consent.open = true))}>Analytics preferences</button>
			{/if}
			<span class="build" translate="no">v{__APP_VERSION__}{__APP_COMMIT__ ? ` · ${__APP_COMMIT__}` : ''}</span>
		</div>
	</div>
</footer>

<style>
	/* The footer sits on the page color, flush with the last section above it. */
	.site-footer {
		background: var(--bg);
		color: var(--ink);
		border-top: 1px solid var(--line);
	}
	.inner {
		max-width: var(--w-page);
		margin: 0 auto;
		padding: var(--space-64) clamp(var(--space-16), 4vw, var(--space-40)) calc(var(--space-32) + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: var(--space-48);
	}
	.top {
		display: grid;
		grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
		gap: var(--space-48);
	}
	.intro {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-12);
	}
	.logo {
		display: inline-flex;
		color: var(--ink);
		border-radius: 3px;
	}
	.logo :global(.footer-wordmark) {
		height: 22px;
		width: auto;
	}
	.tagline {
		margin-top: var(--space-4);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	/* Four branched columns, each its own nav; two, then one, as the footer narrows. */
	.groups {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-32) var(--space-32);
		align-items: start;
	}
	.bottom {
		display: grid;
		grid-template-columns: 1fr auto auto;
		align-items: center;
		gap: var(--space-12) var(--space-24);
		padding-top: var(--space-20);
		border-top: 1px solid var(--line);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.build {
		font-family: var(--font-mono);
		font-size: var(--fs-12);
		color: var(--ink-3);
	}
	.prefs {
		justify-self: start;
		color: var(--ink-2);
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
	}
	.prefs:hover {
		color: var(--ink);
	}
	.site-footer :global(:focus-visible) {
		outline-color: var(--ink);
	}
	@media (max-width: 1100px) {
		.top {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 760px) {
		.groups {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 420px) {
		.groups {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 560px) {
		.bottom {
			grid-template-columns: 1fr;
		}
	}
</style>
