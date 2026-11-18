<script lang="ts">
	import { examById } from '#lib/exams.ts';
	import TestPage from '#lib/test/TestPage.svelte';

	const exam = examById('competitive')!;
</script>

<TestPage {exam} />
