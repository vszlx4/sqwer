<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { formatDay } from '#lib/i18n/format.ts';
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
				<div><dt>Effective</dt><dd><time datetime={doc.effectiveIso}>{formatDay(doc.effectiveIso)}</time></dd></div>
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
		max-width: var(--w-text);
		margin: 0 auto;
		padding-top: clamp(var(--space-8), 3vh, var(--space-32));
	}
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-32);
	}
	.doc-toc {
		padding: var(--space-20) var(--space-20);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: var(--fs-14);
		line-height: var(--lh-base);
	}
	.doc-toc-title {
		margin-bottom: var(--space-10);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	/* Contents sit at the top of the document, in two columns where there is room. */
	.doc-toc ol {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: var(--space-2) var(--space-24);
	}
	.doc-toc a {
		display: flex;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-8);
		margin: 0 calc(var(--space-8) * -1);
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
		margin-top: var(--space-8);
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--line);
		overflow: hidden;
	}
	.doc-meta div {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-12) var(--space-16);
		background: var(--surface);
	}
	.doc-meta dt {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.doc-meta dd {
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		color: var(--ink);
		font-variant-numeric: tabular-nums;
	}
	.doc-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	.doc-footer {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		margin-top: var(--space-40);
		padding-top: var(--space-32);
		border-top: 1px solid var(--line);
		font-size: var(--fs-15);
	}
	.prose .related-title {
		margin-top: var(--space-8);
		font-size: var(--fs-24);
	}
	.prose .related {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-8);
		padding: 0;
		list-style: none;
	}
	.prose .related a {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		height: 100%;
		padding: var(--space-12) var(--space-16);
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
		font-size: var(--fs-12);
		font-weight: var(--fw-regular);
		color: var(--ink-2);
	}
	.name {
		font-size: var(--fs-15);
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
		gap: var(--space-12);
		padding-bottom: var(--space-32);
		margin-bottom: var(--space-32);
		border-bottom: 1px solid var(--line);
	}
	.kicker {
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		font-size: var(--fs-display);
		font-weight: var(--fw-regular);
		line-height: var(--lh-snug);
		letter-spacing: var(--tr-tight);
	}
	.lede {
		font-size: var(--fs-20);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.updated {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.prose {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		font-size: var(--fs-16);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.prose :global(h2) {
		margin-top: var(--space-32);
		font-size: var(--fs-28);
		font-weight: var(--fw-regular);
		line-height: var(--lh-base);
		letter-spacing: normal;
		color: var(--ink);
		scroll-margin-top: 24px;
	}
	.prose :global(h3) {
		margin-top: var(--space-12);
		font-size: var(--fs-18);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.prose :global(strong) {
		color: var(--ink);
		font-weight: var(--fw-semibold);
	}
	/* Links are carried by weight alone, without a block behind the text. */
	.prose :global(a) {
		color: var(--ink);
		font-weight: var(--fw-semibold);
		text-decoration: none;
		overflow-wrap: anywhere;
	}
	.prose :global(a:hover) {
		color: var(--ink-2);
	}
	.prose :global(ol) {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding-left: var(--space-24);
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
		font-size: var(--fs-15);
		line-height: var(--lh-body);
	}
	.prose :global(th),
	.prose :global(td) {
		padding: var(--space-10) var(--space-16);
		text-align: left;
		vertical-align: top;
		border-bottom: 1px solid var(--line);
	}
	.prose :global(thead th) {
		background: var(--surface);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink);
		white-space: nowrap;
	}
	.prose :global(tbody th) {
		font-weight: var(--fw-semibold);
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
		font-size: var(--fs-14);
		color: var(--ink);
	}
	.prose :global(.summary) {
		padding: var(--space-20) var(--space-24);
		border-radius: 3px;
		border: 1px solid var(--ink);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.prose :global(.summary h2) {
		margin-top: 0;
		font-size: var(--fs-24);
	}
	.prose :global(ul) {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding-left: var(--space-24);
		list-style: disc;
	}
	.prose :global(ul li::marker) {
		color: var(--ink-3);
	}
	.prose :global(dl) {
		display: grid;
		grid-template-columns: minmax(120px, 180px) 1fr;
		gap: var(--space-16) var(--space-24);
		padding: var(--space-20) var(--space-24);
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.prose :global(dt) {
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.prose :global(kbd) {
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		padding: 1px var(--space-6);
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--ink);
	}
	.prose :global(.callout) {
		padding: var(--space-16) var(--space-20);
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		border-left: 4px solid var(--accent);
	}
	@media (max-width: 560px) {
		.prose :global(dl) {
			grid-template-columns: 1fr;
			gap: var(--space-4);
		}
		.prose :global(dd) {
			margin-bottom: var(--space-10);
		}
	}
</style>
