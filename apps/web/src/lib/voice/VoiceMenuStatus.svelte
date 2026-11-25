<script lang="ts">
	import { onMount } from 'svelte';
	import VoiceBar from './VoiceBar.svelte';
	import VoiceIcon from './VoiceIcon.svelte';
	import { fetchBrief, phaseLine, type VoiceBrief } from './status.ts';

	/** The Enhanced voice in the account menu while its sets are not ready: one line, its controls on the Sound and voice page. */
	let { initial }: { initial: VoiceBrief } = $props();

	// svelte-ignore state_referenced_locally
	let v = $state<VoiceBrief>(initial);

	// Lives only while the menu is open: refreshes while clips are being made.
	onMount(() => {
		const timer = setInterval(async () => {
			if (v.phase !== 'making' && v.phase !== 'downloading' && v.phase !== 'starting') return;
			const next = await fetchBrief();
			if (next) v = next;
		}, 4000);
		return () => clearInterval(timer);
	});

	const line = $derived(phaseLine(v));
	const bar = $derived(v.phase === 'downloading' && v.downloading ? { made: v.downloading.received, total: v.downloading.total } : { made: v.ready, total: v.words });
</script>

{#if v.phase !== 'ready' && v.phase !== 'off'}
	<a class="voice" href="/account/sound" aria-label={`Enhanced voice: ${line}. Open Sound and voice`}>
		<span class="head">
			<b><VoiceIcon name="enhanced" size={14} /> Enhanced voice</b>
			<span>{line}</span>
		</span>
		{#if bar.total}<VoiceBar made={bar.made} total={bar.total} label="Enhanced voice progress" />{/if}
	</a>
{/if}

<style>
	.voice {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-8);
		margin-bottom: var(--space-4);
		border-radius: var(--radius);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.voice:hover {
		background: var(--surface);
	}
	.voice:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
		font-size: var(--fs-13);
	}
	.head b {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		flex: none;
	}
	.head span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
</style>
