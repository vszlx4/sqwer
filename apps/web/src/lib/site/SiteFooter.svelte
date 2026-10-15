<script lang="ts">
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { CONTACT_EMAIL, FOOTER_GROUPS, LEGAL } from './links.ts';

	const year = new Date().getFullYear();

	/** Commitments that hold everywhere on the site, each backed by a policy. */
	const PROMISES = [
		{ icon: 'lock', title: 'No tracking', text: 'No advertising, analytics or tracking cookies.', href: '/cookies' },
		{ icon: 'shield', title: 'Data in the EU', text: 'Accounts are stored in Ireland, encrypted.', href: '/privacy' },
		{ icon: 'download', title: 'Yours to keep', text: 'Download or delete everything at any time.', href: '/account/data' },
		{ icon: 'eye', title: 'Accessible', text: 'Designed to WCAG 2.2 Level AA.', href: '/accessibility' }
	] as const;
</script>

<footer class="site-footer">
	<div class="inner">
		<div class="top">
			<div class="intro">
				<a href="/" class="logo" aria-label="sqwer home"><LogoWordmark class="footer-wordmark" /></a>
				<p class="tagline">Learn to touch type, measure every finger and improve with purpose. Free, with no advertising.</p>
				<a class="contact" href={`mailto:${CONTACT_EMAIL}`}><Icon name="mail" size={16} /> {CONTACT_EMAIL}</a>
				<a class="start" href="/start">Find your level <Icon name="arrow" size={16} /></a>
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

		<ul class="promises" aria-label="Our commitments">
			{#each PROMISES as p (p.title)}
				<li>
					<a href={p.href}>
						<span class="p-icon"><Icon name={p.icon} size={16} /></span>
						<span><b>{p.title}</b><span class="p-text">{p.text}</span></span>
					</a>
				</li>
			{/each}
		</ul>

		<div class="bottom">
			<span>© {year} <span translate="no">sqwer</span>. A free, non-commercial project by {LEGAL.operatorName}.</span>
			<span class="links">
				<a href="/terms">Terms</a>
				<a href="/privacy">Privacy</a>
				<a href="/cookies">Cookies</a>
				<a href="/.well-known/security.txt">security.txt</a>
			</span>
		</div>
	</div>
</footer>

<style>
	/* The footer is a dark band in both themes. */
	.site-footer {
		background:
			radial-gradient(60% 120% at 0% 0%, rgb(204 249 0 / 0.06), transparent 60%),
			#0b0b0b;
		color: #f2f2ee;
		border-top: 1px solid #262626;
	}
	.inner {
		max-width: 1180px;
		margin: 0 auto;
		padding: 64px clamp(16px, 4vw, 40px) calc(28px + env(safe-area-inset-bottom));
		display: flex;
		flex-direction: column;
		gap: 40px;
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
		gap: 14px;
	}
	.logo {
		display: inline-flex;
		color: #ffffff;
		border-radius: 3px;
	}
	.logo :global(.footer-wordmark) {
		height: 22px;
		width: auto;
	}
	.tagline {
		font-size: 15px;
		line-height: 1.55;
		color: #b9b9b3;
	}
	.contact,
	.start {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14.5px;
		text-decoration: none;
	}
	.contact {
		color: #e4e4de;
	}
	.contact:hover {
		color: #ffffff;
	}
	.start {
		margin-top: 4px;
		padding: 9px 14px;
		border-radius: 3px;
		background: var(--accent);
		color: #111;
		font-weight: 600;
	}
	.groups {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 28px;
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
	.promises {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
	}
	.promises a {
		display: flex;
		gap: 10px;
		height: 100%;
		padding: 14px;
		border-radius: 3px;
		border: 1px solid #222;
		background: #111;
		transition: border-color 160ms ease;
	}
	.promises a:hover {
		color: inherit;
		border-color: #3a3a3a;
	}
	.p-icon {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		border-radius: 3px;
		background: rgb(204 249 0 / 0.12);
		color: var(--accent);
	}
	.promises b {
		display: block;
		font-size: 14px;
		color: #f2f2ee;
	}
	.p-text {
		font-size: 13px;
		color: #a3a39c;
	}
	.bottom {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 10px 20px;
		padding-top: 20px;
		border-top: 1px solid #262626;
		font-size: 13px;
		color: #a3a39c;
	}
	.links {
		display: flex;
		gap: 16px;
	}
	.links a {
		color: #a3a39c;
		text-decoration: none;
	}
	.links a:hover {
		color: #ffffff;
	}
	.site-footer :global(:focus-visible) {
		outline-color: #ffffff;
	}
	@media (max-width: 960px) {
		.top {
			grid-template-columns: 1fr;
		}
		.promises {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 640px) {
		.groups {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.promises {
			grid-template-columns: 1fr;
		}
	}
</style>
