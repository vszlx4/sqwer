<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import VoiceBar from './VoiceBar.svelte';
	import { fetchBrief, formatDuration, percent, sendVoice, timeLeft, type VoiceAction, type VoiceBrief } from './status.ts';

	/** Supertonic's progress in the account menu while clips are still to make: pause or resume, Low or Active. */
	let { initial }: { initial: VoiceBrief } = $props();

	// svelte-ignore state_referenced_locally
	let v = $state<VoiceBrief>(initial);
	let busy = $state(false);

	// Lives only while the menu is open: refreshes while clips are being made.
	onMount(() => {
		const timer = setInterval(async () => {
			if (busy || !v.running) return;
			const next = await fetchBrief();
			if (next) v = next;
		}, 4000);
		return () => clearInterval(timer);
	});

	async function send(action: VoiceAction) {
		busy = true;
		await sendVoice(action);
		v = (await fetchBrief()) ?? v;
		busy = false;
	}

	const left = $derived(timeLeft(v.made, v.total, v.msPerClip));
	const done = $derived(v.total > 0 && v.made >= v.total && !v.running);
	const line = $derived(
		v.downloading
			? `Downloading the model, ${percent(v.downloading.received, v.downloading.total)}%`
			: v.paused
				? 'Paused'
				: v.running
					? `${v.first ? 'Set made first, ' : ''}${percent(v.made, v.total)}% made${left !== null ? `, ${formatDuration(left)} left` : ''}`
					: 'Starting soon'
	);
</script>

{#if !done}
	<section class="voice" aria-label="Voice clips">
		<div class="head">
			<a href="/account/voice">Voice clips</a>
			<span>{line}</span>
		</div>
		<VoiceBar made={v.made} total={v.total} label="Voice clips made" />
		<div class="controls">
			<button type="button" class="ctl" disabled={busy} onclick={() => send({ action: v.paused ? 'resume' : 'pause' })}>
				<Icon name={v.paused ? 'play' : 'pause'} size={14} />
				{v.paused ? 'Resume' : 'Pause'}
			</button>
			<div class="seg" role="group" aria-label="Speed">
				<button type="button" class="ctl" aria-pressed={v.mode === 'low'} disabled={busy} onclick={() => send({ action: 'mode', mode: 'low' })}>Low</button>
				<button type="button" class="ctl" aria-pressed={v.mode === 'active'} disabled={busy} onclick={() => send({ action: 'mode', mode: 'active' })}>Active</button>
			</div>
		</div>
	</section>
{/if}

<style>
	.voice {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-8) var(--space-10) var(--space-12);
		border-bottom: 1px solid var(--line);
		margin-bottom: var(--space-6);
	}
	.head {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
		font-size: var(--fs-13);
	}
	.head a {
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.head span {
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.controls {
		display: flex;
		justify-content: space-between;
		gap: var(--space-8);
	}
	.seg {
		display: flex;
	}
	.ctl {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-8);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--ink);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		cursor: pointer;
	}
	.seg .ctl:first-child {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}
	.seg .ctl:last-child {
		margin-left: -1px;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.ctl[aria-pressed='true'] {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--bg);
	}
	.ctl:disabled {
		opacity: 0.6;
		cursor: default;
	}
</style>
