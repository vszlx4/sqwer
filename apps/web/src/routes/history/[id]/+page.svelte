<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import FingerScores from '#lib/assessment/FingerScores.svelte';
	import { examById } from '#lib/exams.ts';
	import ResultReport from '#lib/results/ResultReport.svelte';
	import { results } from '#lib/results/store.svelte.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';

	onMount(() => results.load());

	const record = $derived(results.byId(page.params.id ?? ''));
	const title = $derived(record ? (examById(record.exam)?.title ?? 'Result') : 'Result');
</script>

<Seo title={`${title} result`} description="A saved test result." noindex />
<Breadcrumbs items={[{ href: '/history', label: 'History' }, { href: page.url.pathname, label: title }]} />

{#if !results.loaded}
	<p class="muted">Loading…</p>
{:else if !record}
	<section class="missing">
		<h1>Result not found</h1>
		<p>This result is not stored in this browser or in your account.</p>
		<a class="btn" href="/history">Return to history</a>
	</section>
{:else if record.exam === 'finger-speed' && record.fingers}
	<section class="assessment">
		<h1>Finger speed assessment</h1>
		<p class="muted">
			{new Date(record.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · Average {Math.round(record.wpm)} WPM at
			{Math.round(record.accuracy)}% accuracy
		</p>
		<FingerScores fingers={record.fingers} />
	</section>
{:else}
	<ResultReport {record} />
{/if}

<style>
	.missing,
	.assessment {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
	}
	h1 {
		font-size: clamp(32px, 4.5vw, 48px);
	}
	.muted {
		color: var(--ink-2);
	}
	.assessment :global(.scores) {
		width: 100%;
	}
</style>
