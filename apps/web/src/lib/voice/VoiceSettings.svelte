<script lang="ts">
	import { onMount } from 'svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { formatNumber } from '#lib/i18n/format.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import VoiceBar from './VoiceBar.svelte';
	import VoiceIcon from './VoiceIcon.svelte';
	import {
		fetchVoice,
		formatBytes,
		formatDuration,
		percent,
		sendVoice,
		timeLeft,
		DISK_LIMIT_CHOICES,
		type HealthReport,
		type VoiceAction,
		type VoiceCost,
		type VoiceInfo,
		type VoiceStatus,
		VOICE_NAME
	} from './status.ts';

	/** Voice choice (Standard or Enhanced), generator status and controls (pause, speed, disk limit), set list, words rated unclear and health check. */
	let { initial }: { initial: VoiceInfo } = $props();

	// svelte-ignore state_referenced_locally
	let info = $state<VoiceInfo>(initial);
	let busy = $state<string | null>(null);
	let failure = $state<string | null>(null);
	let report = $state<{ set: string | null; result: HealthReport } | null>(null);

	const s = $derived(info.local ? info : null);
	const CHOICES = [
		{ id: 'standard', icon: 'standard', tag: 'Default' },
		{ id: 'supertonic', icon: 'enhanced', tag: 'Opt-in' }
	] as const;
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
		if (v.env === 'skip') return 'SQWER_VOICE=skip is set, so Standard is used and nothing is made.';
		if (v.env === 'pause') return 'SQWER_VOICE=pause is set, so no clips are made until it is removed.';
		if (v.downloading) return `Downloading the model: ${percent(v.downloading.received, v.downloading.total)}% of ${formatBytes(v.downloading.total)}.`;
		if (v.running) return v.word ? `Making clips now. Last word: “${v.word}”.` : 'Starting the voice model…';
		if (v.paused) return 'Paused. Nothing is made until you resume.';
		if (v.full) return `Stopped at the disk limit of ${v.diskLimit} GB. Raise it to make the rest.`;
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
	<SettingsSection title="Voice">
		{#snippet icon()}<VoiceIcon name={info.voice === 'supertonic' ? 'enhanced' : 'standard'} size={20} />{/snippet}
		<p class="text">Words are read in the {VOICE_NAME[info.voice]} voice, set on the computer running this copy.</p>
	</SettingsSection>
{:else}
	{#if failure}<p class="form-alert" role="alert">{failure}</p>{/if}

	<SettingsSection title="Choose a voice">
		{#snippet icon()}<VoiceIcon name={s.chosen === 'supertonic' ? 'enhanced' : 'standard'} size={20} />{/snippet}
		<div class="choices" role="radiogroup" aria-label="Voice" aria-busy={!!busy}>
			{#each CHOICES as c (c.id)}
				<label class="choice" class:on={s.chosen === c.id} style:--tint={`var(--voice-${c.icon})`}>
					<input
						class="sr-only"
						type="radio"
						name="voice"
						value={c.id}
						checked={s.chosen === c.id}
						disabled={!!busy}
						onchange={() => send({ action: 'use', voice: c.id }, 'use')}
					/>
					<span class="tile"><VoiceIcon name={c.icon} size={22} /></span>
					<span class="choice-text">
						<span class="choice-name">{VOICE_NAME[c.id]} <span class="tag">{c.tag}</span></span>
						<span class="note">{c.id === 'supertonic' ? `Clearer. ${s.model.downloaded ? 'Clips made ahead of time.' : `A ${formatBytes(s.model.download)} download, then clips made ahead of time.`}` : 'Ready now. Each word is made the first time it plays.'}</span>
					</span>
					<span class="mark" aria-hidden="true">{#if s.chosen === c.id}<Icon name="check" size={16} />{/if}</span>
				</label>
			{/each}
		</div>
		{#if busy === 'use'}<p class="hint" role="status">Switching…</p>{/if}
		<details class="more">
			<summary>Details</summary>
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
			<p class="hint">
				Enhanced makes two clips per word, normal and slow, in the background in low mode; words not made yet play in Standard.
				Switching back to Standard keeps the clips made.
			</p>
			<p class="credit">Standard runs Kokoro; Enhanced runs Supertonic.</p>
		</details>
	</SettingsSection>

	{#if s.chosen === 'supertonic'}
		<SettingsSection title="Making clips" description="Lessons first, then the lists from small to large.">
		{#snippet icon()}<VoiceIcon name="clips" size={20} />{/snippet}
			<p class="status" role="status">{statusLine(s)}</p>
			{#if s.error}<p class="form-alert" role="alert">Last error: {s.error}</p>{/if}
			<VoiceBar made={s.made} total={s.total} label="Clips made for every list" />
			<p class="figures">
				{fmt(s.made)} of {fmt(s.total)} clips ({percent(s.made, s.total)}%)
				{#if timeLeft(s.made, s.total, s.msPerClip) !== null && s.made < s.total}· {formatDuration(timeLeft(s.made, s.total, s.msPerClip)!)} left{/if}
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
					<span><b>Low</b> One core, so the computer stays quick.</span>
				</label>
				<label class="mode" class:on={s.mode === 'active'}>
					<input type="radio" name="voice-mode" checked={s.mode === 'active'} onchange={() => send({ action: 'mode', mode: 'active' }, 'mode')} />
					<span><b>Active</b> {s.cores > 1 ? `${s.cores - 1} of ${s.cores} cores` : 'Every core'}, much faster.</span>
				</label>
			</fieldset>
			<div class="limit">
				<label for="voice-limit">Disk limit for clips</label>
				<select
					id="voice-limit"
					disabled={!!busy}
					value={s.diskLimit ?? 'off'}
					onchange={(e) => send({ action: 'limit', gb: e.currentTarget.value === 'off' ? null : Number(e.currentTarget.value) }, 'limit')}
				>
					<option value="off">No limit</option>
					{#each DISK_LIMIT_CHOICES as gb (gb)}<option value={gb}>{gb} GB</option>{/each}
				</select>
				<p class="hint">Clips take {formatBytes(s.clipsDisk)} now.</p>
			</div>
		</SettingsSection>

		<SettingsSection title="Sets" description="Make one set before the rest, or check its clips.">
		{#snippet icon()}<VoiceIcon name="sets" size={20} />{/snippet}
			<details class="more">
				<summary>{s.sets.length} sets</summary>
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
			</details>
		</SettingsSection>
	{/if}

	{#if s.flagged.length}
		<SettingsSection title="Words rated unclear" description="Rated one or two stars in Listen and type here.">
		{#snippet icon()}<VoiceIcon name="unclear" size={20} />{/snippet}
			<ul class="flagged">
				{#each s.flagged as w (w)}<li>{w}</li>{/each}
			</ul>
			<details class="more">
				<summary>How to fix a word</summary>
				<p class="text">
					Each clip is made the same way every time, so making it again sounds the same. A word read wrong needs a respelling,
					in RESPELL in <code>apps/web/src/lib/server/voice/clips.ts</code>; only that word's clips are made again.
				</p>
			</details>
			<button class="btn start" type="button" disabled={!!busy} onclick={() => send({ action: 'unflag-all' }, 'unflag')}>Clear the list</button>
		</SettingsSection>
	{/if}

	{#if s.made || s.chosen === 'supertonic'}
		<SettingsSection title="Health check" description="Fixes empty or broken clips and removes ones no list uses.">
		{#snippet icon()}<VoiceIcon name="health" size={20} />{/snippet}
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
	.modes {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-12);
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
		gap: var(--space-12);
	}
	.choice {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: var(--space-12);
		padding: var(--space-16);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		cursor: pointer;
		transition: border-color var(--dur-fast) var(--ease-out);
	}
	.choice:hover {
		border-color: var(--line-strong);
	}
	.choice.on {
		border-color: var(--tint);
		box-shadow: inset 0 0 0 1px var(--tint);
	}
	.choice:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.choice:has(input:disabled) {
		cursor: default;
	}
	.tile {
		display: grid;
		place-items: center;
		flex: none;
		width: var(--space-40);
		height: var(--space-40);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--tint) 14%, var(--surface));
	}
	.choice-text {
		display: grid;
		gap: var(--space-4);
		min-width: 0;
		flex: 1;
	}
	.choice-name {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-8);
		font-size: var(--fs-16);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.choice .note {
		font-size: var(--fs-14);
	}
	.mark {
		display: grid;
		place-items: center;
		flex: none;
		width: var(--space-20);
		height: var(--space-20);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		color: var(--bg);
	}
	.on .mark {
		border-color: var(--tint);
		background: var(--tint);
	}
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
	.more {
		display: grid;
		gap: var(--space-12);
	}
	.more summary {
		justify-self: start;
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		cursor: pointer;
	}
	.more summary:hover {
		color: var(--ink);
	}
	.more[open] summary {
		margin-bottom: var(--space-4);
	}
	.credit {
		font-size: var(--fs-13);
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
	.limit {
		display: grid;
		gap: var(--space-6);
		justify-items: start;
	}
	.limit label {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
	}
	.limit select {
		min-height: 44px;
	}
	.flagged {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.flagged li {
		padding: var(--space-4) var(--space-10);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: var(--fs-14);
	}
	.text code {
		font-size: var(--fs-14);
		overflow-wrap: anywhere;
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
