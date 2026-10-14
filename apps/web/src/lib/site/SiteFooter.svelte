<script lang="ts">
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { FOOTER_GROUPS } from './links.ts';

	const year = new Date().getFullYear();
</script>

<footer class="site-footer">
	<div class="inner">
		<div class="top">
			<div class="intro">
				<a href="/" class="logo" aria-label="sqwer home"><LogoWordmark class="footer-wordmark" /></a>
				<p class="tagline">Learn how you type, measure each finger and improve with purpose.</p>
			</div>

			<div class="groups">
				{#each FOOTER_GROUPS as group (group.title)}
					<nav aria-labelledby={`footer-${group.title}`}>
						<h2 id={`footer-${group.title}`}>{group.title}</h2>
						<ul>
							{#each group.links as link (link.href)}
								<li><a href={link.href}>{link.label}</a></li>
							{/each}
						</ul>
					</nav>
				{/each}
			</div>
		</div>

		<div class="bottom">
			<span>© {year} <span translate="no">sqwer</span>. All rights reserved.</span>
			<span class="private"><Icon name="lock" size={14} /> No advertising, analytics or tracking cookies.</span>
		</div>
	</div>
</footer>

<style>
	/* The footer is a dark band in both themes. */
	.site-footer {
		background: #0b0b0b;
		color: #f2f2ee;
		border-top: 1px solid #262626;
	}
	.inner {
		max-width: 1180px;
		margin: 0 auto;
		padding: 56px clamp(16px, 4vw, 40px) calc(28px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 44px;
	}
	.top {
		display: flex;
		justify-content: space-between;
		gap: 40px;
		flex-wrap: wrap;
	}
	.intro {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
		max-width: 300px;
	}
	.logo {
		display: inline-flex;
		color: #ffffff;
		border-radius: 3px;
	}
	.logo :global(.footer-wordmark) {
		height: 21px;
		width: auto;
	}
	.tagline {
		font-size: 15px;
		line-height: 1.55;
		color: #b9b9b3;
	}
	.groups {
		display: grid;
		grid-template-columns: repeat(3, auto);
		gap: clamp(28px, 5vw, 72px);
	}
	h2 {
		font-family: var(--font-sans);
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #a3a39c;
		margin-bottom: 14px;
	}
	ul {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	ul a {
		font-size: 14.5px;
		color: #e4e4de;
		text-decoration: none;
		transition: color 140ms ease;
	}
	ul a:hover {
		color: var(--accent);
	}
	.bottom {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px;
		padding-top: 20px;
		border-top: 1px solid #262626;
		font-size: 13px;
		color: #a3a39c;
	}
	.private {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.site-footer :global(:focus-visible) {
		outline-color: #ffffff;
	}
	@media (max-width: 640px) {
		.groups {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			width: 100%;
		}
	}
</style>
