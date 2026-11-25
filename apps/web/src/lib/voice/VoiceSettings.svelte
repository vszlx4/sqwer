<script lang="ts">
	import { onMount } from 'svelte';
	import SettingRow from '#lib/account/SettingRow.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import { formatNumber } from '#lib/i18n/format.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import Segmented from '#lib/ui/Segmented.svelte';
	import Switch from '#lib/ui/Switch.svelte';
	import VoiceBar from './VoiceBar.svelte';
	import VoiceIcon from './VoiceIcon.svelte';
	import {
		fetchVoice,
		formatBytes,
		formatDuration,
		percent,
		sendVoice,
		DISK_LIMIT_CHOICES,
		type HealthReport,
		type VoiceAction,
		type VoiceInfo,
		type VoicePhase,
		type VoiceSetStatus,
		type VoiceStatus,
		VOICE_NAME
	} from './status.ts';

	/** The voice (Standard or Enhanced); for Enhanced, where it stands, how it runs and which word sets it makes. */
	let { initial }: { initial: VoiceInfo } = $props();

	// svelte-ignore state_referenced_locally
	let info = $state<VoiceInfo>(initial);
	let busy = $state<string | null>(null);
	let failure = $state<string | null>(null);
	let report = $state<HealthReport | null>(null);

	const s = $derived(info.local ? info : null);
	const fmt = (n: number) => formatNumber(n);
	const ACTIVE: readonly VoicePhase[] = ['making', 'downloading', 'starting'];

	/** Every few seconds while something moves, slowly otherwise; never while a change is on its way. */
	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		const tick = async () => {
			if (!document.hidden && !busy) {
				const next = await fetchVoice();
				if (next) info = next;
			}
			timer = setTimeout(tick, s && ACTIVE.includes(s.phase) ? 3000 : 15000);
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
		if (r.report) report = r.report;
		busy = null;
	}

	const BADGE: Record<VoicePhase, string> = {
		off: 'Off',
		skip: 'Off',
		held: 'Held',
		downloading: 'Downloading',
		making: 'Making',
		paused: 'Paused',
		battery: 'Waiting',
		full: 'Stopped',
		empty: 'Nothing chosen',
		ready: 'Ready',
		starting: 'Starting'
	};

	function detail(v: VoiceStatus): string {
		switch (v.phase) {
			case 'skip':
				return 'SQWER_VOICE=skip is set, so Standard is used and nothing is made.';
			case 'held':
				return 'SQWER_VOICE=pause is set, so no clips are made until it is removed.';
			case 'downloading':
				return v.downloading ? `Downloading the model: ${percent(v.downloading.received, v.downloading.total)}% of ${formatBytes(v.downloading.total)}.` : 'Downloading the model.';
			case 'making': {
				const set = v.sets.find((x) => x.id === v.making);
				const left = v.leftMs ? ` · ${formatDuration(v.leftMs)} left` : '';
				return v.word ? `“${v.word}”${set ? ` for ${set.name}` : ''}${left}` : `Loading the model${left}`;
			}
			case 'paused':
				return 'Nothing is made until you resume.';
			case 'battery':
				return 'On battery, so clips wait for the charger.';
			case 'full':
				return `Stopped at the ${v.diskLimit} GB limit. Raise it to make the rest.`;
			case 'empty':
				return 'Switch on a word set to make its clips.';
			case 'ready':
				return 'Every chosen set is made. Other words play in Standard.';
			default:
				return 'Starts within half a minute.';
		}
	}

	const reportLine = (r: HealthReport) => {
		const found = [
			r.empty && `${fmt(r.empty)} empty`,
			r.bad && `${fmt(r.bad)} broken`,
			r.length && `${fmt(r.length)} with an odd length`,
			r.orphans && `${fmt(r.orphans)} unused`,
			r.parts && `${fmt(r.parts)} leftover ${r.parts === 1 ? 'file' : 'files'}`
		].filter(Boolean);
		return `Checked ${fmt(r.checked)} clips. ${found.length ? `Removed ${found.join(', ')}; broken ones are made again.` : 'All fine.'}`;
	};

	const chosen = $derived(s ? s.sets.filter((x) => x.order !== null).sort((a, b) => a.order! - b.order!) : []);
	const others = $derived(s ? s.sets.filter((x) => x.order === null) : []);
	/** The set being made now, or first in line. */
	const current = $derived(s && s.phase === 'making' ? s.making : (chosen.find((x) => x.ready < x.words)?.id ?? null));

	const setLine = (x: VoiceSetStatus) =>
		x.ready >= x.words
			? `${fmt(x.words)} words · ready`
			: `${fmt(x.ready)} of ${fmt(x.words)} words${x.order !== null ? ` · ${formatDuration(x.leftMs)} left` : ''}`;
</script>

{#snippet setRow(x: VoiceSetStatus)}
	{@const on = x.order !== null}
	{@const id = `voice-set-${x.id}`}
	<li class="set" class:on>
		<Switch {id} checked={on} disabled={!!busy} onchange={() => send({ action: 'set', set: x.id, on: !on }, `set:${x.id}`)} />
		<div class="set-text">
			<label class="set-name" for={id}>
				{x.name}
				{#if on && current === x.id}<span class="chip">{s?.phase === 'making' ? 'Making now' : 'Next'}</span>{/if}
			</label>
			<span class="set-meta">{on || x.ready ? setLine(x) : `${fmt(x.words)} words · ${formatBytes(x.disk)}`}</span>
			{#if on && x.ready < x.words}<VoiceBar made={x.ready} total={x.words} label={`Words ready in ${x.name}`} />{/if}
		</div>
		{#if on && x.ready < x.words && current !== x.id}
			<button type="button" class="link" disabled={!!busy} onclick={() => send({ action: 'next', set: x.id }, `next:${x.id}`)}>Make next</button>
		{/if}
	</li>
{/snippet}

{#if !s}
	<SettingsSection title="Voice">
		{#snippet icon()}<VoiceIcon name={info.voice === 'supertonic' ? 'enhanced' : 'standard'} size={20} />{/snippet}
		<p class="text">Words are read in the {VOICE_NAME[info.voice]} voice, set on the computer running this copy.</p>
	</SettingsSection>
{:else}
	{#if failure}<p class="form-alert" role="alert">{failure}</p>{/if}

	<SettingsSection title="Voice">
		{#snippet icon()}<VoiceIcon name={s.chosen === 'supertonic' ? 'enhanced' : 'standard'} size={20} />{/snippet}
		<div class="choices" role="radiogroup" aria-label="Voice" aria-busy={busy === 'use'}>
			{#each [{ id: 'standard', icon: 'standard' }, { id: 'supertonic', icon: 'enhanced' }] as const as c (c.id)}
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
						<span class="choice-name">{VOICE_NAME[c.id]}</span>
						<span class="note">
							{c.id === 'standard'
								? 'Ready now. Each word is made the first time it plays.'
								: `Clearer. Made ahead of time on this computer${s.model.downloaded ? '.' : `, after a ${formatBytes(s.model.download)} download.`}`}
						</span>
					</span>
					<span class="mark" aria-hidden="true">{#if s.chosen === c.id}<Icon name="check" size={14} />{/if}</span>
				</label>
			{/each}
		</div>
	</SettingsSection>

	{#if s.chosen === 'supertonic'}
		<SettingsSection title="Enhanced voice" flush>
			{#snippet icon()}<VoiceIcon name="clips" size={20} />{/snippet}
			{#snippet action()}
				{#if s.paused}
					<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'resume' }, 'pause')}><Icon name="play" size={16} /> Resume</button>
				{:else}
					<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'pause' }, 'pause')}><Icon name="pause" size={16} /> Pause</button>
				{/if}
			{/snippet}
			<div class="hero" data-phase={s.phase}>
				<div class="hero-top">
					<p class="figure"><b>{fmt(s.ready)}</b> of {fmt(s.words)} words ready</p>
					<span class="badge" class:live={s.phase === 'making' || s.phase === 'downloading'}>{BADGE[s.phase]}</span>
				</div>
				<VoiceBar
					made={s.phase === 'downloading' && s.downloading ? s.downloading.received : s.ready}
					total={s.phase === 'downloading' && s.downloading ? s.downloading.total : s.words}
					label={s.phase === 'downloading' ? 'Model downloaded' : 'Words ready in the chosen sets'}
				/>
				<p class="detail" role="status">{detail(s)}</p>
				{#if s.error && s.phase !== 'making'}<p class="form-alert" role="alert">Last error: {s.error}</p>{/if}
			</div>
			<SettingRow label="Speed" hint={s.mode === 'low' ? 'Gentle, so the computer stays cool. Fine to leave on.' : 'About five times faster, and warmer while it runs.'} wide>
				<Segmented
					name="voice-mode"
					label="Speed"
					value={s.mode}
					disabled={!!busy}
					options={[
						{ value: 'low', label: 'Low' },
						{ value: 'active', label: 'Active' }
					]}
					onchange={(mode) => send({ action: 'mode', mode }, 'mode')}
				/>
			</SettingRow>
			<SettingRow label="On battery" hint={s.battery ? 'Keeps making clips on battery.' : 'Waits for the charger.'} for="voice-battery">
				<Switch id="voice-battery" checked={s.battery} disabled={!!busy} onchange={() => send({ action: 'battery', on: !s.battery }, 'battery')} />
			</SettingRow>
			<SettingRow label="Disk limit" hint={`Clips take ${formatBytes(s.clipsDisk)}; the model ${formatBytes(s.model.disk)}.`} for="voice-limit">
				<select
					id="voice-limit"
					class="select"
					disabled={!!busy}
					value={s.diskLimit ?? 'off'}
					onchange={(e) => send({ action: 'limit', gb: e.currentTarget.value === 'off' ? null : Number(e.currentTarget.value) }, 'limit')}
				>
					<option value="off">No limit</option>
					{#each DISK_LIMIT_CHOICES as gb (gb)}<option value={gb}>{gb} GB</option>{/each}
				</select>
			</SettingRow>
			<SettingRow label="Health check" hint={report ? reportLine(report) : 'Removes empty or broken clips; they are made again.'}>
				<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'check' }, 'check')}>{busy === 'check' ? 'Checking…' : 'Check clips'}</button>
			</SettingRow>
		</SettingsSection>

		<SettingsSection title="Word sets" description="Only the sets switched on are made, in this order. Other words play in Standard." flush>
			{#snippet icon()}<VoiceIcon name="sets" size={20} />{/snippet}
			{#if chosen.length}
				<ul class="sets" aria-label="Sets switched on">
					{#each chosen as x (x.id)}{@render setRow(x)}{/each}
				</ul>
			{/if}
			<p class="group">More sets</p>
			<ul class="sets" aria-label="More sets">
				{#each others as x (x.id)}{@render setRow(x)}{/each}
			</ul>
		</SettingsSection>
	{/if}

	{#if s.flagged.length}
		<SettingsSection title="Words rated unclear" description="Rated one or two stars in Listen and type on this computer.">
			{#snippet icon()}<VoiceIcon name="unclear" size={20} />{/snippet}
			{#snippet action()}
				<button class="btn" type="button" disabled={!!busy} onclick={() => send({ action: 'unflag-all' }, 'unflag')}>Clear the list</button>
			{/snippet}
			<ul class="flagged">
				{#each s.flagged as w (w)}<li>{w}</li>{/each}
			</ul>
			<p class="hint">A word read wrong needs a respelling in RESPELL, in <code>apps/web/src/lib/server/voice/clips.ts</code>; only its clips are made again.</p>
		</SettingsSection>
	{/if}
{/if}

<style>
	.text,
	.hint {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--space-12);
	}
	.choice {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: start;
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
		width: var(--space-40);
		height: var(--space-40);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--tint) 14%, var(--surface));
	}
	.choice-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.choice-name {
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
	}
	.note {
		font-size: var(--fs-13);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.mark {
		display: grid;
		place-items: center;
		width: var(--space-20);
		height: var(--space-20);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-pill);
		color: var(--bg);
	}
	.choice.on .mark {
		border-color: var(--tint);
		background: var(--tint);
	}
	.hero {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		padding: var(--space-20);
		border-bottom: 1px solid var(--line);
	}
	.hero-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-12);
		flex-wrap: wrap;
	}
	.figure {
		font-size: var(--fs-15);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.figure b {
		font-size: var(--fs-24);
		font-weight: var(--fw-bold);
		color: var(--ink);
	}
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-2) var(--space-10);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}
	/* Ink text on a neutral pill; the dot carries the color: amber while working, green when ready. */
	.badge::before {
		content: '';
		width: var(--space-6);
		height: var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--ink-3);
	}
	.badge.live {
		color: var(--ink);
	}
	.badge.live::before {
		background: var(--voice-clips);
		animation: pulse 1.6s var(--ease-out) infinite;
	}
	[data-phase='ready'] .badge {
		color: var(--ink);
	}
	[data-phase='ready'] .badge::before {
		background: var(--success);
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	.detail {
		font-size: var(--fs-14);
		color: var(--ink-2);
		overflow-wrap: anywhere;
	}
	.select {
		min-height: 40px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		font-size: var(--fs-14);
	}
	.select:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.sets {
		display: flex;
		flex-direction: column;
	}
	.set {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-6) var(--space-16);
		padding: var(--space-12) var(--space-20);
	}
	.set + .set {
		border-top: 1px solid var(--line);
	}
	.set-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
	}
	.set-name {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-15);
		font-weight: var(--fw-semibold);
		cursor: pointer;
	}
	.set:not(.on) .set-name {
		font-weight: var(--fw-regular);
	}
	.set-meta {
		font-size: var(--fs-13);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0 var(--space-8);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		color: var(--ink);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
	}
	.chip::before {
		content: '';
		width: var(--space-6);
		height: var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--voice-clips);
	}
	.link {
		min-height: 32px;
		padding: 0 var(--space-4);
		border: 0;
		background: none;
		font: inherit;
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	.link:disabled {
		color: var(--ink-3);
		cursor: default;
	}
	.group {
		padding: var(--space-12) var(--space-20) var(--space-4);
		border-top: 1px solid var(--line);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.sets + .group {
		margin-top: 0;
	}
	.flagged {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-6);
	}
	.flagged li {
		padding: var(--space-2) var(--space-10);
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		font-size: var(--fs-14);
	}
	code {
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		overflow-wrap: anywhere;
	}
	@media (max-width: 560px) {
		.choices {
			grid-template-columns: minmax(0, 1fr);
		}
		.set {
			grid-template-columns: auto minmax(0, 1fr);
		}
		.set .link {
			grid-column: 2;
			justify-self: start;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.badge.live::before {
			animation: none;
		}
	}
</style>
