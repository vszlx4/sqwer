<script lang="ts">
	import { page } from '$app/state';
	import { results } from '#lib/results/store.svelte.ts';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { fingerMap } from './store.svelte.ts';

	// Link the finger map to the account whenever the signed-in state changes.
	const signedIn = $derived(!!page.data.user);
	$effect(() => {
		fingerMap.attach(signedIn);
		results.attach(signedIn);
		usage.attach(signedIn);
	});
</script>
