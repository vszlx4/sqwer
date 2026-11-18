<script lang="ts">
	import { page } from '$app/state';
	import { examById } from '#lib/exams.ts';
	import TestPage from '#lib/test/TestPage.svelte';

	// The route's matcher lets only practice tests through.
	const exam = $derived(examById(page.params.exam ?? '')!);
</script>

<TestPage {exam} />
