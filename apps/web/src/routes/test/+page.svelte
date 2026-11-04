<script lang="ts">
	import { page } from '$app/state';
	import { examById } from '#lib/exams.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import TypingTest from '#lib/test/TypingTest.svelte';

	const exam = $derived(examById(page.url.searchParams.get('exam') ?? 'timed') ?? examById('timed')!);
</script>

<Seo title={exam.title} description={`${exam.purpose} Measures: ${exam.measures.join(', ').toLowerCase()}.`} />

<Breadcrumbs
	items={exam.id === 'competitive'
		? [{ href: '/competitive', label: 'Competitive' }, { href: `/test?exam=${exam.id}`, label: exam.title }]
		: [{ href: '/exams', label: 'Practice' }, { href: `/test?exam=${exam.id}`, label: exam.title }]}
/>
<h1 class="sr-only">{exam.title}</h1>
{#key exam.id}
	<TypingTest {exam} />
{/key}

<p class="keys"><kbd>Tab</kbd> Restart with new words</p>

<style>
	.keys {
		margin-top: var(--space-32);
		text-align: center;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: var(--fs-12);
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--ink-2);
	}
	@media (pointer: coarse) {
		.keys {
			display: none;
		}
	}
</style>
