<script lang="ts">
	import { formatNumber } from '#lib/i18n/format.ts';
	import VoiceBar from './VoiceBar.svelte';
	import VoiceIcon from './VoiceIcon.svelte';
	import { fetchVoice, formatDuration, percent, phaseLine, sendVoice, type VoiceStatus } from './status.ts';

	/**
	 * Listen and type menu: how many words of the chosen word set have Enhanced clips, and a way to make it next (switched
	 * on when it was not). Shown only on the machine running the copy, with Enhanced chosen.
	 */
	let { set }: { set: string } = $props();

	let v = $state<VoiceStatus | null>(null);
	let busy = $state(false);

	$effect(() => {
		let stop = false;
		let timer: ReturnType<typeof setTimeout>;
		const tick = async () => {
			const next = await fetchVoice();
			if (stop) return;
			if (next?.local) v = next;
			timer = setTimeout(tick, next?.local && next.phase === 'making' ? 5000 : 30000);
		};
		void tick();
		return () => {
			stop = true;
			clearTimeout(timer);
		};
	});

	async function makeNext() {
		busy = true;
		const r = await sendVoice({ action: 'next', set });
		if (r.status) v = r.status;
		busy = false;
	}

	const p = $derived(v?.chosen === 'supertonic' ? (v.sets.find((x) => x.id === set) ?? null) : null);
	const first = $derived(!!v && !!p && p.order !== null && (v.making === set || v.sets.filter((x) => x.order !== null && x.ready < x.words).sort((a, b) => a.order! - b.order!)[0]?.id === set));
</script>

{#if v && p}
	<div class="voice" aria-live="polite">
		<p class="line">
			<VoiceIcon name="enhanced" size={18} />
			<b>Enhanced voice</b>
			<span class="figure">{p.ready >= p.words ? 'Ready' : `${percent(p.ready, p.words)}%`}</span>
		</p>
		{#if p.ready < p.words}
			<VoiceBar made={p.ready} total={p.words} label={`Enhanced words ready in ${p.name}`} />
			<p class="note">
				{formatNumber(p.ready)} of {formatNumber(p.words)} words of {p.name} ready.
				{#if p.order === null}
					Not one of your Enhanced sets.
				{:else if first}
					{v.phase === 'making' ? `Being made now, ${formatDuration(p.leftMs)} left.` : `${phaseLine(v)}.`}
				{/if}
				The rest play in Standard.
			</p>
			{#if !first}
				<button type="button" class="btn" disabled={busy} onclick={makeNext}>{busy ? 'Starting…' : p.order === null ? 'Add and make next' : 'Make next'}</button>
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
	.line {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		width: 100%;
	}
	.line b {
		color: var(--ink);
	}
	.figure {
		margin-left: auto;
		font-variant-numeric: tabular-nums;
	}
	.note {
		font-size: var(--fs-13);
	}
</style>
