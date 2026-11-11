<script lang="ts">
	import { formatNumber } from '#lib/i18n/format.ts';
	import VoiceBar from './VoiceBar.svelte';
	import { fetchVoice, formatDuration, percent, sendVoice, type VoiceStatus } from './status.ts';

	/**
	 * Listen and type menu: how much of the chosen word set has Supertonic clips, the time left at the recent pace, and
	 * "make this set now". Shown only on the machine running the copy, with Supertonic chosen.
	 */
	let { set }: { set: string } = $props();

	let v = $state<VoiceStatus | null>(null);
	let busy = $state(false);

	$effect(() => {
		const id = set;
		let stop = false;
		let timer: ReturnType<typeof setTimeout>;
		const tick = async () => {
			const next = await fetchVoice(id);
			if (stop) return;
			if (next?.local) v = next;
			timer = setTimeout(tick, next?.local && next.running ? 5000 : 30000);
		};
		void tick();
		return () => {
			stop = true;
			clearTimeout(timer);
		};
	});

	async function makeNow() {
		busy = true;
		const r = await sendVoice({ action: 'first', set }, set);
		if (r.status) v = r.status;
		busy = false;
	}

	const p = $derived(v?.chosen === 'supertonic' && v.set?.id === set ? v.set : null);
	const words = (clips: number) => formatNumber(Math.floor(clips / 2));
</script>

{#if v && p}
	<div class="voice" aria-live="polite">
		<p class="line">
			<b>Supertonic voice</b>
			{#if p.made >= p.total}
				· every word of {p.name} is ready.
			{:else}
				· {words(p.made)} of {words(p.total)} words of {p.name} ready ({percent(p.made, p.total)}%){#if p.leftMs !== null}, {formatDuration(p.leftMs)} left{/if}.
			{/if}
		</p>
		{#if p.made < p.total}
			<VoiceBar made={p.made} total={p.total} label={`Supertonic clips for ${p.name}`} />
			<p class="note">
				{#if v.first === set}
					Being made now, in active mode.
				{:else if v.paused}
					Making clips is paused; resume it in <a href="/account/voice">Voice settings</a>.
				{/if}
				Words not ready yet are read in the Standard voice.
			</p>
			{#if v.first !== set}
				<button type="button" class="btn" disabled={busy} onclick={makeNow}>{busy ? 'Starting…' : 'Make this set now'}</button>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.voice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-8);
		padding: var(--space-12);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.line,
	.note {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.line b {
		color: var(--ink);
	}
	.note {
		font-size: var(--fs-13);
	}
</style>
