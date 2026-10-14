<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import LogoMark from '#lib/brand/LogoMark.svelte';
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import { NAV_LINKS } from './links.ts';

	let open = $state(false);
	let scrolled = $state(false);
	let menuButton: HTMLButtonElement | undefined = $state();
	let bar: HTMLElement | undefined = $state();
	afterNavigate(() => (open = false));

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			open = false;
			menuButton?.focus();
		}
	}
	function onclick(e: MouseEvent) {
		if (open && bar && !bar.contains(e.target as Node)) open = false;
	}

	const user = $derived(page.data.user as App.PageData['user'] | undefined);
	const isCurrent = (href: string) => page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<svelte:window {onkeydown} {onclick} onscroll={() => (scrolled = window.scrollY > 8)} />

<header class="site-header" class:scrolled>
	<div class="bar" bind:this={bar}>
		<a href="/" class="brand" aria-label="sqwer home">
			<LogoWordmark class="wordmark" />
			<LogoMark class="mark" />
		</a>

		<nav class="desktop" aria-label="Main">
			{#each NAV_LINKS as link (link.href)}
				<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
			{/each}
		</nav>

		<div class="actions">
			<ThemeToggle />
			{#if user}
				<AccountMenu {user} />
			{:else}
				<a class="signin" href="/signin">Sign in</a>
				<a class="cta" href="/signup">Create account</a>
			{/if}
			<button
				bind:this={menuButton}
				type="button"
				class="menu-button"
				aria-expanded={open}
				aria-controls="mobile-menu"
				aria-label={open ? 'Close menu' : 'Open menu'}
				onclick={() => (open = !open)}
			>
				<Icon name={open ? 'close' : 'menu'} size={20} />
			</button>
		</div>

		{#if open}
			<div id="mobile-menu" class="mobile">
				<nav aria-label="Main">
					{#each NAV_LINKS as link (link.href)}
						<a href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
					{/each}
				</nav>
				{#if !user}
					<div class="mobile-account">
						<a class="btn" href="/signin">Sign in</a>
						<a class="btn" href="/signup">Create account</a>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>

<style>
	/* Frosted glass bar that stays at the top while the page scrolls under it */
	.site-header {
		view-transition-name: site-header;
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--bg) 68%, transparent);
		-webkit-backdrop-filter: blur(18px) saturate(170%);
		backdrop-filter: blur(18px) saturate(170%);
		border-bottom: 1px solid transparent;
		transition:
			border-color 200ms ease,
			box-shadow 200ms ease;
	}
	/* The bar separates from the page only once content scrolls beneath it. */
	.site-header.scrolled {
		border-bottom-color: color-mix(in srgb, var(--line-strong) 55%, transparent);
		box-shadow:
			inset 0 1px 0 var(--glass-shine),
			0 10px 30px -18px var(--glass-shadow);
	}
	.bar {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16px;
		max-width: 1180px;
		margin: 0 auto;
		padding: 14px clamp(16px, 4vw, 40px);
	}
	.brand {
		display: inline-flex;
		color: var(--ink);
		border-radius: 3px;
		margin-right: 12px;
	}
	.brand :global(.wordmark) {
		height: 26px;
		width: auto;
	}
	.brand :global(.mark) {
		display: none;
		height: 30px;
		width: 30px;
	}
	.desktop {
		display: flex;
		gap: 2px;
	}
	nav a {
		padding: 8px 14px;
		border-radius: 3px;
		font-size: 14.5px;
		font-weight: 500;
		color: var(--ink-2);
		text-decoration: none;
		white-space: nowrap;
		transition:
			color 140ms ease,
			background-color 140ms ease;
	}
	nav a:hover {
		color: var(--ink);
		background: color-mix(in srgb, var(--surface) 70%, transparent);
	}
	nav a[aria-current='page'] {
		color: var(--ink);
		background: var(--surface);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}
	.signin {
		padding: 8px 12px;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}
	/* Secondary weight: the accent is reserved for the main action of each page. */
	.cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 38px;
		padding: 0 16px;
		border-radius: 3px;
		border: 1px solid var(--ink);
		color: var(--ink);
		font-size: 14.5px;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color 140ms ease,
			color 140ms ease;
	}
	.cta:hover {
		background: var(--ink);
		color: var(--bg);
	}
	.menu-button {
		display: none;
		width: 40px;
		height: 40px;
		place-items: center;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		color: var(--ink);
		cursor: pointer;
	}
	.mobile {
		position: absolute;
		top: calc(100% + 6px);
		left: clamp(16px, 4vw, 40px);
		right: clamp(16px, 4vw, 40px);
		z-index: 20;
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		box-shadow: var(--shadow-lg);
		transform-origin: top center;
		animation: menu-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	@keyframes menu-in {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
	}
	.mobile nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.mobile nav a {
		padding: 12px 14px;
		font-size: 16px;
	}
	.mobile-account {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		margin-top: 8px;
		padding-top: 10px;
		border-top: 1px solid var(--line);
	}
	@media (max-width: 900px) {
		.desktop,
		.actions > .signin,
		.actions > .cta {
			display: none;
		}
		.menu-button {
			display: grid;
		}
	}
	@media (max-width: 600px) {
		.brand :global(.wordmark) {
			display: none;
		}
		.brand :global(.mark) {
			display: block;
		}
	}
</style>
