<script lang="ts">
	import Seo from '#lib/site/Seo.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import SoundSettings from '#lib/voice/SoundSettings.svelte';
	import VoiceSettings from '#lib/voice/VoiceSettings.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Voice" description="Choose the voice for Listen and type and follow how its clips are made." noindex />

<div class="page">
	<header class="page-head">
		<h1>Voice</h1>
		<p>The voice that reads words in Listen and type, and the clips this computer makes for it.</p>
	</header>

	<section class="device">
		<SoundSettings />
	</section>

	{#await data.status}
		<SkeletonRegion label="Counting voice clips…">
			<Skeleton lines={3} />
			<Skeleton height="160px" />
		</SkeletonRegion>
	{:then status}
		<VoiceSettings initial={status} />
	{:catch}
		<p class="form-alert" role="alert">The voice status could not be read. Reload the page to try again.</p>
	{/await}
</div>

<style>
	.device {
		max-width: 64ch;
		margin-bottom: var(--space-32);
	}
	.page-head {
		margin-bottom: var(--space-8);
	}
	.page-head p {
		margin-top: var(--space-6);
		max-width: 64ch;
		color: var(--ink-2);
	}
	h1 {
		font-size: var(--fs-title);
	}
</style>
