<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import LogoMark from '#lib/brand/LogoMark.svelte';
	import { learnerNextStep } from '#lib/courses/learner.svelte.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import { courses } from '#lib/courses/store.svelte.ts';
	import LogoWordmark from '#lib/brand/LogoWordmark.svelte';
	import StaggeredMenu from '#lib/bits/StaggeredMenu.svelte';
	import ThemeToggle from '#lib/ui/ThemeToggle.svelte';
	import AccountMenu from './AccountMenu.svelte';
	import { NAV_LINKS } from './links.ts';

	let menu: StaggeredMenu | undefined = $state();
	afterNavigate(() => menu?.close());

	const HELP_LINKS = [
		{ label: 'How it works', link: '/about' },
		{ label: 'Questions', link: '/faq' },
		{ label: 'Legal', link: '/legal' }
	];

	const user = $derived(page.data.user as App.PageData['user'] | undefined);
	// Signed-in learners on the course see their next lesson from every page.
	const resume = $derived.by(() => {
		if (!user || !courses.loaded || page.url.pathname.startsWith('/learn/')) return null;
		const next = learnerNextStep();
		return next.stage === 'course' && next.lesson ? next : null;
	});
	/** Which of the three areas a page belongs to, so its link is marked as current. */
	const area = $derived.by(() => {
		const path = page.url.pathname;
		if (path === '/test' && page.url.searchParams.get('exam') === 'competitive') return '/competitive';
		if (path.startsWith('/competitive')) return '/competitive';
		if (path.startsWith('/learn') || path === '/start') return '/learn';
		if (['/exams', '/test', '/map', '/history'].some((p) => path === p || path.startsWith(`${p}/`))) return '/exams';
		return null;
	});
	const isCurrent = (href: string) => area === href;
	const currentArea = $derived(NAV_LINKS.find((l) => isCurrent(l.href))?.area);
	const menuItems = $derived(
		NAV_LINKS.map((l) => ({ label: l.label, ariaLabel: `${l.label}: ${l.description}`, link: l.href, current: isCurrent(l.href) }))
	);
</script>

<header class="site-header">
	<div class="bar">
		<a href="/" class="brand" aria-label="sqwer home">
			<LogoWordmark class="wordmark" />
			<LogoMark class="mark" />
		</a>

		<nav class="desktop" aria-label="Main">
			{#each NAV_LINKS as link (link.href)}
				<a href={link.href} data-area={link.area} aria-current={isCurrent(link.href) ? 'page' : undefined}>{link.label}</a>
			{/each}
		</nav>

		<div class="actions">
			{#if resume}
				<a class="resume" href={resume.href} title={resume.title}>
					<RankBadge rank={courses.rank.rank} size={22} />
					<span>Continue <b>Lesson {resume.lesson!.order}</b></span>
				</a>
			{/if}
			<ThemeToggle />
			{#if user}
				<AccountMenu {user} />
			{:else}
				<a class="signin" href="/signin">Sign in</a>
				<a class="cta" href="/signup">Create account</a>
			{/if}
			<span class="menu-slot" aria-hidden="true"></span>
		</div>
	</div>
</header>

<!-- Outside the header: its view-transition-name would trap a fixed descendant. -->
<StaggeredMenu
	bind:this={menu}
	class="site-menu"
	isFixed
	items={menuItems}
	socialItems={HELP_LINKS}
	socialsTitle="Help"
	colors={['var(--violet)', 'var(--cyan)']}
	accentColor={currentArea ? `var(--area-${currentArea})` : 'var(--ink)'}
>
	{#snippet footer()}
		{#if !user}
			<div class="menu-account">
				<a class="btn" href="/signin">Sign in</a>
				<a class="btn btn-primary" href="/signup">Create account</a>
			</div>
		{/if}
	{/snippet}
</StaggeredMenu>

<style>
	/* Floating solid pill in the theme surface. Takes no room in the flow (negative margin), so pages start under it. */
	.site-header {
		--bar-gutter: clamp(10px, 3vw, 24px);
		--bar-pad: clamp(8px, 1.5vw, 12px);
		position: sticky;
		top: 0;
		z-index: var(--z-header);
		height: var(--header-h);
		margin-bottom: calc(-1 * var(--header-h));
		padding: var(--space-12) var(--bar-gutter) 0;
		pointer-events: none;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: var(--space-16);
		max-width: var(--w-page);
		height: 56px;
		margin: 0 auto;
		padding: 0 var(--bar-pad);
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--surface);
		box-shadow: var(--shadow);
		pointer-events: auto;
		view-transition-name: site-header;
	}
	.brand {
		display: inline-flex;
		color: var(--logo);
		border-radius: var(--radius-pill);
		margin: 0 var(--space-8) 0 var(--space-10);
	}
	/* Sized to the nav links' visual weight. */
	.brand :global(.wordmark) {
		height: 22px;
		width: auto;
	}
	.brand :global(.mark) {
		display: none;
		height: 20px;
		width: 20px;
	}
	.desktop {
		display: flex;
		gap: var(--space-2);
	}
	nav a {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius-pill);
		font-size: var(--fs-15);
		font-weight: var(--fw-regular);
		color: var(--ink-2);
		text-decoration: none;
		white-space: nowrap;
		transition:
			color var(--dur-fast) var(--ease-out),
			background-color var(--dur-fast) var(--ease-out);
	}
	nav a:hover {
		color: var(--ink);
		background: var(--surface-2);
	}
	/* Current link in its area's color (data-area sets --accent and --on-accent). */
	nav a[aria-current='page'] {
		color: var(--on-accent);
		background: var(--accent);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		margin-left: auto;
	}
	.resume {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		height: 38px;
		padding: 0 var(--space-12) 0 var(--space-8);
		border-radius: var(--radius-pill);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-size: var(--fs-14);
		color: var(--ink-2);
		text-decoration: none;
		white-space: nowrap;
		transition: border-color var(--dur-fast) var(--ease-out);
	}
	.resume b {
		color: var(--ink);
	}
	.resume:hover {
		border-color: var(--ink);
	}
	.signin {
		padding: var(--space-8) var(--space-12);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		color: var(--ink);
		text-decoration: none;
		white-space: nowrap;
	}
	/* Secondary weight: the accent is reserved for the main action of each page. */
	.cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		height: 38px;
		padding: 0 var(--space-16);
		border-radius: var(--radius-pill);
		border: 1px solid var(--ink);
		color: var(--ink);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		text-decoration: none;
		white-space: nowrap;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}
	.cta:hover {
		background: var(--ink);
		color: var(--bg);
	}
	/* Room in the bar for the menu toggle, which lives in the fixed menu layer. */
	.menu-slot {
		display: none;
		width: 72px;
		height: 40px;
	}
	.menu-account {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-8);
	}
	/* Toggle lines up with .menu-slot: same top offset, bar height and inner padding. */
	:global(.site-menu) {
		--sm-header-top: 12px;
		--sm-header-height: 56px;
		--sm-header-padding: 0 calc(clamp(10px, 3vw, 24px) + clamp(8px, 1.5vw, 12px) + 6px);
		--sm-panel-top: 96px;
	}
	@media (max-width: 1100px) {
		.resume span {
			display: none;
		}
		.resume {
			padding: 0 var(--space-8);
		}
	}
	@media (max-width: 900px) {
		.desktop,
		.actions > .signin,
		.actions > .cta {
			display: none;
		}
		.menu-slot {
			display: block;
		}
	}
	@media (min-width: 901px) {
		:global(.site-menu) {
			display: none;
		}
	}
	@media (max-width: 560px) {
		.brand :global(.wordmark) {
			display: none;
		}
		.brand :global(.mark) {
			display: block;
		}
	}
</style>
