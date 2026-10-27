<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import { LEGAL_DOCUMENTS, type LegalDocument } from './legal.ts';
	import { CONTACT_EMAIL, LEGAL } from './links.ts';

	interface Props {
		kicker?: string;
		title: string;
		lede?: string;
		updated?: string;
		/** Breadcrumb trail after "Home". */
		crumbs?: { href: string; label: string }[];
		/** For legal documents: the register entry, shown as a document control block. */
		doc?: LegalDocument;
		/** Numbered contents, linked to the `id` of each section heading. */
		toc?: { id: string; label: string }[];
		children: Snippet;
	}

	let { kicker, title, lede, updated, crumbs, doc, toc, children }: Props = $props();

	const related = $derived(doc ? Object.values(LEGAL_DOCUMENTS).filter((d) => d.ref !== doc.ref) : []);

	let body: HTMLDivElement | undefined = $state();

	// Wide tables scroll horizontally as labelled, focusable regions (WCAG 2.1.1).
	onMount(() => {
		for (const wrap of body?.querySelectorAll<HTMLElement>('.table-wrap') ?? []) {
			let heading: Element | null = wrap.previousElementSibling;
			while (heading && !/^H[23]$/.test(heading.tagName)) heading = heading.previousElementSibling;
			wrap.tabIndex = 0;
			wrap.setAttribute('role', 'region');
			wrap.setAttribute('aria-label', heading?.textContent?.replace(/^\d+\.\s*/, '').trim() || 'Table');
		}
	});

</script>

<article class="prose-page" class:with-toc={!!toc?.length}>
	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}
	<header>
		{#if kicker}<p class="kicker">{kicker}</p>{/if}
		<h1>{title}</h1>
		{#if lede}<p class="lede">{lede}</p>{/if}
		{#if doc}
			<dl class="doc-meta">
				<div><dt>Reference</dt><dd>{doc.ref}</dd></div>
				<div><dt>Version</dt><dd>{doc.version}</dd></div>
				<div><dt>Effective</dt><dd><time datetime={doc.effectiveIso}>{doc.effective}</time></dd></div>
				<div><dt>Issued by</dt><dd>{LEGAL.operatorName}</dd></div>
			</dl>
			<div class="doc-actions">
				<button type="button" class="btn" onclick={() => window.print()}><Icon name="download" size={16} /> Print or save as PDF</button>
				<a class="btn" href="/legal">All legal documents</a>
			</div>
		{:else if updated}
			<p class="updated">Last updated {updated}</p>
		{/if}
	</header>
	<div class="body">
		{#if toc?.length}
			<nav class="doc-toc" aria-label="Contents">
				<p class="doc-toc-title">Contents</p>
				<ol>
					{#each toc as item, i (item.id)}
						<li>
							<a href={`#${item.id}`}>
								<span class="num">{i + 1}.</span>{item.label}
							</a>
						</li>
					{/each}
				</ol>
			</nav>
		{/if}
		<div class="prose" bind:this={body}>
			{@render children()}
			{#if doc}
				<footer class="doc-footer">
					<p>
						Questions about this document: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This document is
						issued in English; any translation is provided for convenience only.
					</p>
					<h2 class="related-title">Related documents</h2>
					<ul class="related">
						{#each related as d (d.ref)}
							<li>
								<a href={d.href}><span class="ref">{d.ref}</span><span class="name">{d.title}</span></a>
							</li>
						{/each}
					</ul>
				</footer>
			{/if}
		</div>
	</div>
</article>

<style>
	.prose-page {
		max-width: 760px;
		margin: 0 auto;
		padding-top: clamp(8px, 3vh, 32px);
	}
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 32px;
	}
	.doc-toc {
		padding: 18px 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: 14px;
		line-height: 1.4;
	}
	.doc-toc-title {
		margin-bottom: 10px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	/* Contents sit at the top of the document, in two columns where there is room. */
	.doc-toc ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 2px 24px;
	}
	.doc-toc a {
		display: flex;
		gap: 8px;
		padding: 5px 8px;
		margin: 0 -8px;
		border-radius: 3px;
		color: var(--ink-2);
		text-decoration: none;
		transition:
			color 120ms ease,
			background-color 120ms ease;
	}
	.doc-toc a:hover {
		color: var(--ink);
	}
	.num {
		min-width: 22px;
		font-variant-numeric: tabular-nums;
		color: var(--ink-3);
	}
	.doc-meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1px;
		margin-top: 8px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--line);
		overflow: hidden;
	}
	.doc-meta div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 12px 14px;
		background: var(--surface);
	}
	.doc-meta dt {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.doc-meta dd {
		font-size: 15px;
		font-weight: 600;
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.doc-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.doc-footer {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-top: 40px;
		padding-top: 28px;
		border-top: 1px solid var(--line);
		font-size: 15px;
	}
	.prose .related-title {
		margin-top: 8px;
		font-size: 22px;
	}
	.prose .related {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 8px;
		padding: 0;
		list-style: none;
	}
	.prose .related a {
		display: flex;
		flex-direction: column;
		gap: 2px;
		height: 100%;
		padding: 12px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		transition: border-color 120ms ease;
	}
	.prose .related a:hover {
		color: var(--ink);
		border-color: var(--ink);
	}
	.ref {
		font-family: var(--font-mono);
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-2);
	}
	.name {
		font-size: 15px;
	}
	@media print {
		.doc-actions,
		.doc-toc,
		.prose .related,
		.prose .related-title {
			display: none !important;
		}
		.prose-page.with-toc {
			max-width: none;
		}
		.with-toc .body {
			display: block;
		}
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
	.prose :global(ol[type='a']) {
		list-style: lower-alpha;
	}
	.prose :global(.table-wrap) {
		overflow-x: auto;
		outline-offset: 2px;
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
	.prose :global(td code),
	.prose :global(td time) {
		white-space: nowrap;
	}
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--ink);
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
