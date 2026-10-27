<script lang="ts">
	/** Ranked bars for breakdowns (pages, sources, browsers). Rows can link to their events. */
	interface Item {
		key: string;
		value: number;
		extra?: number;
	}
	interface Props {
		title: string;
		items: Item[];
		/** What the value counts, such as "visitors". */
		measure: string;
		/** What the optional second number counts. */
		extraLabel?: string;
		label?: (key: string) => string;
		href?: (key: string) => string | null;
		empty?: string;
	}
	let { title, items, measure, extraLabel, label = (k) => k, href, empty = 'Nothing recorded in this period.' }: Props = $props();

	const max = $derived(Math.max(1, ...items.map((i) => i.value)));
	const total = $derived(items.reduce((n, i) => n + i.value, 0));
	const fmt = (n: number) => n.toLocaleString('en-GB');
</script>

<section class="list" aria-label={title}>
	<header>
		<h2>{title}</h2>
		<span class="measure">{measure}{extraLabel ? ` · ${extraLabel}` : ''}</span>
	</header>
	{#if items.length}
		<ol>
			{#each items as item (item.key)}
				{@const link = href?.(item.key) ?? null}
				<li>
					<span class="bar" aria-hidden="true" style:transform={`scaleX(${item.value / max})`}></span>
					{#if link}<a class="name" href={link}>{label(item.key)}</a>{:else}<span class="name">{label(item.key)}</span>{/if}
					<span class="value">
						{fmt(item.value)}
						{#if item.extra !== undefined}<small>{fmt(item.extra)}</small>{/if}
						<small class="share">{total ? Math.round((item.value / total) * 100) : 0}%</small>
					</span>
				</li>
			{/each}
		</ol>
	{:else}
		<p class="empty">{empty}</p>
	{/if}
</section>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}
	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
	}
	h2 {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 600;
	}
	.measure {
		font-size: 12px;
		color: var(--ink-2);
	}
	ol {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 32px;
		padding: 0 10px;
		font-size: 14px;
	}
	.bar {
		position: absolute;
		inset: 0;
		border-radius: 3px;
		background: color-mix(in srgb, var(--chart-wpm) 12%, transparent);
		transform-origin: left;
	}
	.name,
	.value {
		position: relative;
	}
	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink);
		text-decoration: none;
	}
	a.name:hover {
		color: var(--violet);
	}
	a.name:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.value {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
		flex-shrink: 0;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	small {
		font-weight: 500;
		font-size: 12px;
		color: var(--ink-2);
	}
	.share {
		min-width: 34px;
		text-align: right;
		color: var(--ink-2);
	}
	.empty {
		padding: 14px;
		border-radius: 3px;
		border: 1px dashed var(--line-strong);
		font-size: 14px;
		color: var(--ink-2);
	}
</style>
