<script lang="ts">
	import { onMount } from 'svelte';
	import VoiceBar from './VoiceBar.svelte';
	import VoiceIcon from './VoiceIcon.svelte';
	import { fetchBrief, formatDuration, percent, timeLeft, type VoiceBrief } from './status.ts';

	/** The Enhanced voice's progress in the account menu while clips are still to make: one line, its controls on the Sound and voice page. */
	let { initial }: { initial: VoiceBrief } = $props();

	// svelte-ignore state_referenced_locally
	let v = $state<VoiceBrief>(initial);

	// Lives only while the menu is open: refreshes while clips are being made.
	onMount(() => {
		const timer = setInterval(async () => {
			if (!v.running) return;
			const next = await fetchBrief();
			if (next) v = next;
		}, 4000);
		return () => clearInterval(timer);
	});


	const left = $derived(timeLeft(v.made, v.total, v.msPerClip));
	const done = $derived(v.total > 0 && v.made >= v.total && !v.running);
	const line = $derived.by(() => {
		if (v.downloading) return `Downloading the model, ${percent(v.downloading.received, v.downloading.total)}%`;
		if (v.paused) return 'Paused';
		if (v.full) return 'Stopped at the disk limit';
		if (v.running) return `${v.first ? 'Set made first, ' : ''}${percent(v.made, v.total)}% made${left !== null ? `, ${formatDuration(left)} left` : ''}`;
		return 'Starting soon';
	});
</script>

{#if !done}
	<a class="voice" href="/account/sound" aria-label={`Enhanced voice: ${line}. Open Sound and voice`}>
		<span class="head">
			<b><VoiceIcon name="enhanced" size={14} /> Enhanced voice</b>
			<span>{line}</span>
		</span>
		<VoiceBar made={v.made} total={v.total} label="Enhanced clips made" />
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
