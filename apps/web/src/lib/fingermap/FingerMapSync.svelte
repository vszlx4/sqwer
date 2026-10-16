<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { applyResets } from '#lib/data/local.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { fingerMap } from './store.svelte.ts';

	// Link stored data (finger map, results, usage, courses) to the account whenever the signed-in state changes.
	// Data cleared from the account on another device is first discarded here, so it is not uploaded again.
	const signedIn = $derived(!!page.data.user);
	$effect(() => {
		const account = signedIn;
		const resets = untrack(() => page.data.user?.resets);
		void (account ? applyResets(resets) : Promise.resolve()).finally(() => {
			fingerMap.attach(account);
			results.attach(account);
			usage.attach(account);
			courses.attach(account);
		});
	});
</script>
