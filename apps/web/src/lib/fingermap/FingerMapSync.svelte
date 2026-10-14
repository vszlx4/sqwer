<script lang="ts">
	import { page } from '$app/state';
	import { results } from '#lib/results/store.svelte.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { fingerMap } from './store.svelte.ts';

	// Link stored data (finger map, results, usage, courses) to the account whenever the signed-in state changes.
	const signedIn = $derived(!!page.data.user);
	$effect(() => {
		fingerMap.attach(signedIn);
		results.attach(signedIn);
		usage.attach(signedIn);
		courses.attach(signedIn);
	});
</script>
