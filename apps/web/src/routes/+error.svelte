<script lang="ts">
	import { page } from '$app/state';
	import Seo from '#lib/site/Seo.svelte';

	const notFound = $derived(page.status === 404);
</script>

<Seo
	title={notFound ? 'Page not found' : 'Something went wrong'}
	description={notFound ? 'The requested page could not be found.' : 'An error occurred.'}
	noindex
/>

<section class="error-page" aria-labelledby="error-title">
	<p class="code">{page.status}</p>
	<h1 id="error-title">{notFound ? 'This page could not be found.' : 'Something went wrong.'}</h1>
	<p class="text">
		{#if notFound}
			{page.error?.message && page.error.message !== 'Not Found'
				? page.error.message
				: 'The address may be incorrect, or the page may have been moved or removed.'}
		{:else}
			{page.error?.message === 'Internal Error' ? 'An unexpected error occurred. Please try again.' : (page.error?.message ?? 'An unexpected error occurred. Please try again.')}
		{/if}
	</p>
	{#if page.error?.id}
		<p class="ref">If this keeps happening, contact us and quote the reference <code>{page.error.id}</code>.</p>
	{/if}
	<div class="links">
		<a class="btn btn-primary" href="/">Return to the home page</a>
		{#if notFound}
			<a class="btn" href="/exams">Browse examinations</a>
		{:else}
			<button type="button" class="btn" onclick={() => location.reload()}>Try again</button>
		{/if}
	</div>
</section>

<style>
	.ref {
		font-size: 14px;
		color: var(--ink-2);
	}
	.ref code {
		font-family: var(--font-mono);
		color: var(--ink);
	}
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
		padding: clamp(32px, 10vh, 96px) 0;
	}
	.code {
		font-size: 15px;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	h1 {
		font-size: clamp(32px, 5vw, 56px);
		line-height: 1.08;
		max-width: 16ch;
	}
	.text {
		max-width: 520px;
		font-size: 17px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.links {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 8px;
	}
</style>
