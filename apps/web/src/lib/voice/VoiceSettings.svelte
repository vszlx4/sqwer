<script lang="ts">
	import { onMount } from 'svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { formatNumber } from '#lib/i18n/format.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import VoiceBar from './VoiceBar.svelte';
	import {
		fetchVoice,
		formatBytes,
		formatDuration,
		percent,
		sendVoice,
		timeLeft,
		type HealthReport,
		type VoiceAction,
		type VoiceCost,
		type VoiceInfo,
		type VoiceStatus
	} from './status.ts';

	/** Voice choice, generator status and controls, set list and health check. Plain working screen until the Listen and type redesign. */
	let { initial }: { initial: VoiceInfo } = $props();

	// svelte-ignore state_referenced_locally
	let info = $state<VoiceInfo>(initial);
	let busy = $state<string | null>(null);
	let failure = $state<string | null>(null);
	let report = $state<{ set: string | null; result: HealthReport } | null>(null);

	const s = $derived(info.local ? info : null);
	const fmt = (n: number) => formatNumber(n);

	/** Poll quickly while clips are being made or the model downloads, slowly otherwise. */
	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const tick = async () => {
			if (!document.hidden && !busy) {
				const next = await fetchVoice();
				if (next) info = next;
			}
			timer = setTimeout(tick, s?.running ? 3000 : 15000);
		};
		timer = setTimeout(tick, 3000);
		return () => clearTimeout(timer);
	});

	async function send(action: VoiceAction, label: string) {
		busy = label;
		failure = null;
		const r = await sendVoice(action);
		if (r.status) info = r.status;
		if (r.error) failure = r.error;
		if (r.report) report = { set: action.action === 'check' ? (action.set ?? null) : null, result: r.report };
		busy = null;
	}

	const costRange = (c: VoiceCost) => (c.hereMs ? `${formatDuration(c.hereMs)} on this computer` : `${formatDuration(c.fastMs)} on a recent laptop, ${formatDuration(c.slowMs)} on an older one`);

	function statusLine(v: VoiceStatus): string {
		if (v.env === 'skip') return 'SQWER_VOICE=skip is set, so the Standard voice is used and nothing is made.';
		if (v.env === 'pause') return 'SQWER_VOICE=pause is set, so no clips are made until it is removed.';
		if (v.downloading) return `Downloading the model: ${percent(v.downloading.received, v.downloading.total)}% of ${formatBytes(v.downloading.total)}.`;
		if (v.running) return v.word ? `Making clips now. Last word: “${v.word}”.` : 'Starting the voice model…';
		if (v.paused) return 'Paused. Nothing is made until you resume.';
		if (v.made >= v.total && v.total) return 'Every clip is made.';
		return 'Waiting to start. The site starts making clips within half a minute.';
	}

	const reportLine = (r: HealthReport) => {
		const found = [
			r.empty && `${fmt(r.empty)} empty`,
			r.bad && `${fmt(r.bad)} broken`,
			r.length && `${fmt(r.length)} with an odd length`,
			r.orphans && `${fmt(r.orphans)} no longer used`,
			r.parts && `${fmt(r.parts)} leftover temporary ${r.parts === 1 ? 'file' : 'files'}`
		].filter(Boolean);
		return `Checked ${fmt(r.checked)} clips. ${found.length ? `Removed ${found.join(', ')}. Broken clips are made again.` : 'All fine.'}`;
	};
</script>

{#if !s}
	<SettingsSection title="Voice for Listen and type" description="Set by the person running this copy of sqwer.">
		<p class="text">
			Words are read in the {info.voice === 'supertonic' ? 'Supertonic' : 'Standard'} voice. The voice can be changed only on the
			computer running this copy.
		</p>
	</SettingsSection>
{:else}
	{#if failure}<p class="form-alert" role="alert">{failure}</p>{/if}

	<SettingsSection title="Voice for Listen and type" description="Standard reads each word the first time it is needed. Supertonic sounds clearer and is made ahead of time on this computer.">
		<fieldset class="choices" disabled={!!busy}>
			<legend class="sr-only">Voice</legend>
			<div class="choice" class:on={s.chosen === 'standard'}>
				<div class="choice-head">
					<h3>Standard</h3>
					{#if s.chosen === 'standard'}<span class="tag">In use</span>{/if}
				</div>
				<p class="note">The default. Nothing to download; a word is made the first time someone hears it.</p>
				{#if s.chosen !== 'standard'}
					<button class="btn" type="button" onclick={() => send({ action: 'use', voice: 'standard' }, 'use')}>Use Standard</button>
					<p class="hint">Making Supertonic clips stops. The clips made so far are kept for when you switch back.</p>
				{/if}
			</div>
			<div class="choice" class:on={s.chosen === 'supertonic'}>
				<div class="choice-head">
					<h3>Supertonic</h3>
					{#if s.chosen === 'supertonic'}<span class="tag">In use</span>{/if}
				</div>
				<p class="note">Clearer, at a normal and a slow speed. Words not made yet are read in the Standard voice.</p>
				<dl class="cost">
					<div>
						<dt>Download</dt>
						<dd>{s.model.downloaded ? 'Done' : `${formatBytes(s.model.download)}, once`}</dd>
					</div>
					<div>
						<dt>Disk</dt>
						<dd>{formatBytes(s.model.disk)} for the model, {formatBytes(s.cost.core.disk)} for the lessons and small lists, {formatBytes(s.cost.all.disk)} for every list</dd>
					</div>
					<div>
						<dt>Time</dt>
						<dd>Lessons and small lists: {costRange(s.cost.core)}. Every list: {costRange(s.cost.all)}.</dd>
					</div>
				</dl>
				{#if s.chosen !== 'supertonic'}
					<button class="btn btn-primary" type="button" onclick={() => send({ action: 'use', voice: 'supertonic' }, 'use')}>
						{busy === 'use' ? 'Switching…' : 'Use Supertonic'}
					</button>
					<p class="hint">The model downloads first, then clips are made in the background in low mode. You can pause at any time.</p>
				{/if}
			</div>
		</fieldset>
	</SettingsSection>

	{#if s.chosen === 'supertonic'}
		<SettingsSection title="Making clips" description="Two clips per word, lessons first, then the word lists from small to large.">
			<p class="status" role="status">{statusLine(s)}</p>
			{#if s.error}<p class="form-alert" role="alert">Last error: {s.error}</p>{/if}
			<VoiceBar made={s.made} total={s.total} label="Clips made for every list" />
			<p class="figures">
				{fmt(s.made)} of {fmt(s.total)} clips ({percent(s.made, s.total)}%)
				{#if timeLeft(s.made, s.total, s.msPerClip) !== null && s.made < s.total}· {formatDuration(timeLeft(s.made, s.total, s.msPerClip)!)} left at the recent pace{/if}
			</p>
			<div class="row">
				{#if s.paused}
					<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'resume' }, 'pause')}><Icon name="play" size={16} /> Resume</button>
				{:else}
					<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'pause' }, 'pause')}><Icon name="pause" size={16} /> Pause</button>
				{/if}
			</div>
			<fieldset class="modes" disabled={!!busy}>
				<legend>Speed</legend>
				<label class="mode" class:on={s.mode === 'low'}>
					<input type="radio" name="voice-mode" checked={s.mode === 'low'} onchange={() => send({ action: 'mode', mode: 'low' }, 'mode')} />
					<span><b>Low</b> One core at the lowest priority, so the computer stays quick.</span>
				</label>
				<label class="mode" class:on={s.mode === 'active'}>
					<input type="radio" name="voice-mode" checked={s.mode === 'active'} onchange={() => send({ action: 'mode', mode: 'active' }, 'mode')} />
					<span><b>Active</b> {s.cores > 1 ? `${s.cores - 1} of ${s.cores} cores` : 'Every core'}, much faster, and the computer works hard.</span>
				</label>
			</fieldset>
		</SettingsSection>

		<SettingsSection title="Sets" description="Each word counts once, in the first set that has it. Make a set before the rest, in active mode until every word of its list is done, or check its clips.">
			<ul class="sets">
				{#each s.sets as set (set.id)}
					<li>
						<div class="set-head">
							<h3>{set.name}</h3>
							<span class="set-figures">{fmt(set.made)} of {fmt(set.total)}{#if s.first === set.id} · being made now{/if}</span>
						</div>
						<VoiceBar made={set.made} total={set.total} label={`Clips made for ${set.name}`} />
						<div class="row">
							{#if set.made < set.total && s.first !== set.id}
								<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'first', set: set.id }, `first:${set.id}`)}>Make this set now</button>
							{/if}
							<button class="btn" type="button" disabled={!!busy || !set.made} onclick={() => send({ action: 'check', set: set.id }, `check:${set.id}`)}>
								{busy === `check:${set.id}` ? 'Checking…' : 'Check clips'}
							</button>
						</div>
						{#if report?.set === set.id}<p class="report" role="status">{reportLine(report.result)}</p>{/if}
					</li>
				{/each}
			</ul>
		</SettingsSection>
	{/if}

	{#if s.made || s.chosen === 'supertonic'}
		<SettingsSection title="Health check" description="Looks at every clip on disk: empty or broken files, odd lengths, leftovers from a crash and clips no list uses any more.">
			<p class="text">Broken clips are removed and made again; clips no list uses are removed to free space.</p>
			<button class="btn start" type="button" disabled={!!busy} onclick={() => send({ action: 'check' }, 'check')}>
				{busy === 'check' ? 'Checking every clip…' : 'Check every clip'}
			</button>
			{#if report && report.set === null}<p class="report" role="status">{reportLine(report.result)}</p>{/if}
		</SettingsSection>
	{/if}
{/if}

<style>
	.text,
	.note,
	.hint,
	.status,
	.report {
		max-width: var(--w-text);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.hint,
	.report {
		font-size: var(--fs-14);
	}
	.status {
		color: var(--ink);
	}
	.choices,
	.modes {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}
	.choice {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-12);
		padding: var(--space-16);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.choice.on {
		border-color: var(--ink);
	}
	.choice-head,
	.set-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-8);
		width: 100%;
	}
	h3 {
		font-size: var(--fs-16);
		font-weight: var(--fw-semibold);
	}
	.tag {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		color: var(--ink-3);
	}
	.cost {
		display: grid;
		gap: var(--space-6);
		margin: 0;
		font-size: var(--fs-14);
		line-height: var(--lh-body);
	}
	.cost div {
		display: grid;
		grid-template-columns: var(--space-96) minmax(0, 1fr);
		gap: var(--space-8);
	}
	.cost dt {
		font-weight: var(--fw-semibold);
	}
	.cost dd {
		margin: 0;
		color: var(--ink-2);
	}
	.figures,
	.set-figures {
		font-size: var(--fs-14);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.row {
		display: flex;
		gap: var(--space-8);
		flex-wrap: wrap;
	}
	.modes legend {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		margin-bottom: var(--space-8);
	}
	.mode {
		display: flex;
		gap: var(--space-10);
		align-items: flex-start;
		padding: var(--space-12);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
		cursor: pointer;
	}
	.mode.on {
		border-color: var(--ink);
	}
	.mode b {
		display: block;
		color: var(--ink);
	}
	.mode input {
		margin-top: var(--space-4);
		accent-color: var(--ink);
	}
	.sets {
		list-style: none;
		padding: 0;
		margin: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.sets li {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-16);
	}
	.sets li + li {
		border-top: 1px solid var(--line);
	}
	.start {
		align-self: flex-start;
	}
	@media (max-width: 420px) {
		.cost div {
			grid-template-columns: 1fr;
			gap: var(--space-2);
		}
	}
</style>
