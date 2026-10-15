<script lang="ts">
	import type { Snippet } from 'svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';

	interface Props {
		kicker?: string;
		title: string;
		lede?: string;
		updated?: string;
		/** Breadcrumb trail after "Home". */
		crumbs?: { href: string; label: string }[];
		children: Snippet;
	}

	let { kicker, title, lede, updated, crumbs, children }: Props = $props();
</script>

<article class="prose-page">
	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}
	<header>
		{#if kicker}<p class="kicker">{kicker}</p>{/if}
		<h1>{title}</h1>
		{#if lede}<p class="lede">{lede}</p>{/if}
		{#if updated}<p class="updated">Last updated {updated}</p>{/if}
	</header>
	<div class="prose">
		{@render children()}
	</div>
</article>

<style>
	.prose-page {
		max-width: 760px;
		margin: 0 auto;
		padding-top: clamp(8px, 3vh, 32px);
	}
	header {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-bottom: 28px;
		margin-bottom: 32px;
		border-bottom: 1px solid var(--line);
	}
	.kicker {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		font-size: clamp(36px, 5.5vw, 60px);
		font-weight: 400;
		line-height: 1.05;
		letter-spacing: -0.02em;
	}
	.lede {
		font-size: 19px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.updated {
		font-size: 14px;
		color: var(--ink-2);
	}
	.prose {
		display: flex;
		flex-direction: column;
		gap: 16px;
		font-size: 16.5px;
		line-height: 1.7;
		color: var(--ink-2);
	}
	.prose :global(h2) {
		margin-top: 28px;
		font-size: 28px;
		font-weight: 400;
		line-height: 1.2;
		letter-spacing: -0.01em;
		color: var(--ink);
		scroll-margin-top: 24px;
	}
	.prose :global(h3) {
		margin-top: 12px;
		font-size: 18px;
		font-weight: 600;
		color: var(--ink);
	}
	.prose :global(strong) {
		color: var(--ink);
		font-weight: 600;
	}
	/* Links are carried by weight alone, without a block behind the text. */
	.prose :global(a) {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.prose :global(a:hover) {
		color: var(--ink-2);
	}
	.prose :global(ol) {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-left: 22px;
		list-style: decimal;
	}
	.prose :global(.table-wrap) {
		overflow-x: auto;
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	.prose :global(table) {
		width: 100%;
		border-collapse: collapse;
		font-size: 15px;
		line-height: 1.55;
	}
	.prose :global(th),
	.prose :global(td) {
		padding: 10px 14px;
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid var(--line);
	}
	.prose :global(thead th) {
		background: var(--surface);
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
	}
	.prose :global(tbody th) {
		font-weight: 600;
		color: var(--ink);
	}
	.prose :global(tr:last-child td),
	.prose :global(tr:last-child th) {
		border-bottom: 0;
	}
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--ink);
	}
	.prose :global(.toc) {
		padding: 18px 22px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		font-size: 15px;
	}
	.prose :global(.toc ol) {
		gap: 4px;
	}
	.prose :global(.summary) {
		padding: 18px 22px;
		border-radius: 3px;
		border: 1px solid var(--ink);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.prose :global(.summary h2) {
		margin-top: 0;
		font-size: 22px;
	}
	.prose :global(ul) {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-left: 22px;
		list-style: disc;
	}
	.prose :global(ul li::marker) {
		color: var(--ink-3);
	}
	.prose :global(dl) {
		display: grid;
		grid-template-columns: minmax(120px, 180px) 1fr;
		gap: 14px 24px;
		padding: 20px 22px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.prose :global(dt) {
		font-weight: 600;
		color: var(--ink);
	}
	.prose :global(kbd) {
		font-family: var(--font-mono);
		font-size: 13px;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--ink);
	}
	.prose :global(.callout) {
		padding: 16px 20px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-left: 4px solid var(--accent);
	}
	@media (max-width: 560px) {
		.prose :global(dl) {
			grid-template-columns: 1fr;
			gap: 4px;
		}
		.prose :global(dd) {
			margin-bottom: 10px;
		}
	}
</style>
