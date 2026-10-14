<script lang="ts">
	import { page } from '$app/state';
	import { examById } from '#lib/exams.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import TypingTest from '#lib/test/TypingTest.svelte';

	const exam = $derived(examById(page.url.searchParams.get('exam') ?? 'timed') ?? examById('timed')!);
</script>

<Seo title={exam.title} description={`${exam.purpose} Measures: ${exam.measures.join(', ').toLowerCase()}.`} />

<Breadcrumbs items={[{ href: '/exams', label: 'Examinations' }, { href: `/test?exam=${exam.id}`, label: exam.title }]} />
<h1 class="sr-only">{exam.title}</h1>
{#key exam.id}
	<TypingTest {exam} />
{/key}

<p class="keys"><kbd>Tab</kbd> Restart with new words</p>

<style>
	.keys {
		margin-top: 28px;
		text-align: center;
		font-size: 13px;
		color: var(--ink-2);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 11.5px;
		padding: 1px 6px;
		border-radius: 3px;
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
