<script lang="ts">
	import type { Snippet } from 'svelte';
	import { CHANNEL_LABELS, CHANNELS } from '#lib/analytics/shared.ts';

	/**
	 * The date range and filters of an analytics view, as one GET form so every view has its own
	 * address and works without JavaScript. With JavaScript, choosing a preset or a filter applies
	 * it at once; custom dates apply with the button.
	 */
	interface Props {
		period: { preset: string; fromDay: string; toDay: string };
		filters: { route?: string | null; channel?: string | null; device?: string | null; auth?: string | null };
		/** Pages to offer in the page filter. */
		routes?: string[];
		/** Extra fields that belong to the view (such as the event filters). */
		extra?: Snippet;
		/** Values to carry over unchanged, as hidden fields. */
		hidden?: Record<string, string | null | undefined>;
	}
	let { period, filters, routes = [], extra, hidden = {} }: Props = $props();

	const PRESETS = [
		{ value: '7d', label: '7 days' },
		{ value: '30d', label: '30 days' },
		{ value: '90d', label: '90 days' },
		{ value: '12m', label: '12 months' },
		{ value: 'custom', label: 'Custom' }
	];
	let preset = $state('');
	$effect.pre(() => {
		preset = period.preset;
	});
	const today = new Date().toISOString().slice(0, 10);

	let form: HTMLFormElement | undefined = $state();
	function apply(e: Event) {
		const el = e.target as HTMLInputElement | HTMLSelectElement;
		if (el.type === 'date' || (el.name === 'range' && el.value === 'custom')) return;
		form?.requestSubmit();
	}
	const active = $derived([filters.route, filters.channel, filters.device, filters.auth].filter(Boolean).length);
</script>

<form class="controls" method="GET" bind:this={form} onchange={apply} data-sveltekit-noscroll data-sveltekit-keepfocus>
	{#each Object.entries(hidden) as [name, value] (name)}
		{#if value}<input type="hidden" {name} {value} />{/if}
	{/each}
	<fieldset class="range">
		<legend class="sr-only">Period</legend>
		<div class="seg">
			{#each PRESETS as p (p.value)}
				<label class:on={preset === p.value}>
					<input type="radio" name="range" value={p.value} bind:group={preset} />
					{p.label}
				</label>
			{/each}
		</div>
		{#if preset === 'custom'}
			<div class="dates">
				<label>From <input type="date" name="from" value={period.fromDay} max={today} required /></label>
				<label>To <input type="date" name="to" value={period.toDay} max={today} required /></label>
				<button class="btn" type="submit">Apply dates</button>
			</div>
		{/if}
	</fieldset>

	<fieldset class="filters">
		<legend class="sr-only">Filters</legend>
		<label>
			<span>Page</span>
			<select name="page">
				<option value="">All pages</option>
				{#if filters.route && !routes.includes(filters.route)}<option value={filters.route} selected>{filters.route}</option>{/if}
				{#each routes as r (r)}<option value={r} selected={filters.route === r}>{r}</option>{/each}
			</select>
		</label>
		<label>
			<span>Channel</span>
			<select name="channel">
				<option value="">All channels</option>
				{#each CHANNELS as c (c)}<option value={c} selected={filters.channel === c}>{CHANNEL_LABELS[c]}</option>{/each}
			</select>
		</label>
		<label>
			<span>Device</span>
			<select name="device">
				<option value="">All devices</option>
				<option value="desktop" selected={filters.device === 'desktop'}>Desktop</option>
				<option value="mobile" selected={filters.device === 'mobile'}>Mobile</option>
				<option value="tablet" selected={filters.device === 'tablet'}>Tablet</option>
			</select>
		</label>
		<label>
			<span>Visitors</span>
			<select name="visitors">
				<option value="">Everyone</option>
				<option value="signed-in" selected={filters.auth === 'signed-in'}>Signed in</option>
				<option value="anonymous" selected={filters.auth === 'anonymous'}>Not signed in</option>
			</select>
		</label>
		{@render extra?.()}
		<noscript><button class="btn" type="submit">Apply</button></noscript>
		{#if active}
			<a class="clear" href={`?range=${period.preset}${period.preset === 'custom' ? `&from=${period.fromDay}&to=${period.toDay}` : ''}`} data-sveltekit-noscroll>Clear filters</a>
		{/if}
	</fieldset>
</form>

<style>
	.controls {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}
	.range {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 16px;
	}
	.seg {
		display: inline-flex;
		flex-wrap: wrap;
		padding: 3px;
		gap: 2px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.seg label {
		position: relative;
		padding: 7px 12px;
		border-radius: 3px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
		cursor: pointer;
		transition:
			background-color 140ms ease,
			color 140ms ease;
	}
	.seg label:hover {
		color: var(--ink);
	}
	.seg label.on {
		background: var(--bg);
		color: var(--ink);
		box-shadow: 0 0 0 1px var(--line-strong);
	}
	.seg input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.seg label:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
	.dates {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}
	.dates label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.dates .btn {
		min-height: 38px;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 10px;
	}
	/* Global within the filters, so fields passed in by the page (the extra snippet) match. */
	.filters :global(label) {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.filters :global(label > span) {
		font-size: 12px;
		font-weight: 600;
		color: var(--ink-3);
	}
	.controls :global(select),
	input[type='date'] {
		min-height: 38px;
		max-width: 220px;
		padding: 0 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-size: 14px;
	}
	.clear {
		align-self: center;
		margin-top: 18px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
		text-decoration: none;
	}
	.clear:hover {
		color: var(--ink);
	}
	@media (max-width: 560px) {
		.filters :global(label) {
			flex: 1 1 140px;
		}
		.controls :global(select) {
			max-width: none;
			width: 100%;
		}
	}
</style>
