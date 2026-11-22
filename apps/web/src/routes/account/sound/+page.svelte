<script lang="ts">
	import PageHead from '#lib/account/PageHead.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import SoundSettings from '#lib/voice/SoundSettings.svelte';
	import VoiceSettings from '#lib/voice/VoiceSettings.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo title="Sound and voice" description="Volume, Listen and type options and the voice that reads words on sqwer." noindex />

<PageHead title="Sound and voice" line="How words sound in Listen and type." />

<div class="panels">
	<SettingsSection title="On this device" description="Saved in this browser.">
		<SoundSettings plain />
	</SettingsSection>

	{#await data.status}
		<SkeletonRegion label="Counting voice clips…">
			<Skeleton height="96px" />
			<Skeleton height="160px" />
		</SkeletonRegion>
	{:then status}
		<VoiceSettings initial={status} />
	{:catch}
		<p class="form-alert" role="alert">The voice status could not be read. Reload the page to try again.</p>
	{/await}
</div>

<style>
	.panels {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
</style>
