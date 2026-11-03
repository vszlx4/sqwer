<script lang="ts">
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import BranchedMenu from '#lib/bits/BranchedMenu.svelte';
	import { page } from '$app/state';
	import { consent } from '#lib/analytics/consent.svelte.ts';
	import { FOOTER_LEGAL, FOOTER_SECTIONS, LEGAL } from './links.ts';

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
			<nav class="legal" aria-label="Legal">
				{#each FOOTER_LEGAL as link (link.href)}
					<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}>{link.label}</a>
				{/each}
				{#if page.data.analytics !== false}
					<button type="button" class="prefs" onclick={() => ((consent.ready || consent.load()), (consent.open = true))}>Analytics preferences</button>
				{/if}
			</nav>
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
		max-width: 1180px;
		margin: 0 auto;
		padding: 64px clamp(16px, 4vw, 40px) calc(28px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 48px;
	}
	.top {
		display: grid;
		grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
		gap: 48px;
	}
	.intro {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
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
		margin-top: 4px;
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	/* Three branched columns, each its own nav; they wrap to two, then one, as the footer narrows. */
	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: 32px 28px;
		align-items: start;
	}
	.bottom {
		display: grid;
		grid-template-columns: 1fr auto;
		align-items: center;
		gap: 12px 24px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
		font-size: 13px;
		color: var(--ink-2);
	}
	.legal {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 18px;
		grid-column: 1 / -1;
		grid-row: 1;
	}
	.owner {
		grid-row: 2;
	}
	.build {
		grid-row: 2;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--ink-3);
	}
	.legal a,
	.prefs {
		color: var(--ink-2);
		text-decoration: none;
	}
	.legal a[aria-current='page'] {
		color: var(--ink);
	}
	.prefs {
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		cursor: pointer;
	}
	.legal a:hover,
	.prefs:hover {
		color: var(--ink);
	}
	.site-footer :global(:focus-visible) {
		outline-color: var(--ink);
	}
	@media (max-width: 960px) {
		.top {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.bottom {
			grid-template-columns: 1fr;
		}
		.build {
			grid-row: 3;
		}
	}
</style>
