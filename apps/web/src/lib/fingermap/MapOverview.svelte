<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		buildProfile,
		CORE_KEYS,
		EXTENDED_KEYS,
		FILE_EXTENSION,
		parseProfileFile,
		ProfileFileError,
		serializeProfile,
		type FingerObservation
	} from '@sqwer/fingermap';
	import { FINGERS, fingerLabel, handOf, kindOf, qwertyAnsi, type Finger } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import type { ZoneInfo } from '#lib/keyboard/types.ts';
	import Dialog from '#lib/ui/Dialog.svelte';
	import FingerScores from '#lib/assessment/FingerScores.svelte';
	import Hands from '#lib/hands/Hands.svelte';
	import { ASSESSMENT_COVERAGE } from '#lib/exams.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Icon from '#lib/ui/Icon.svelte';
	import { resolvedPlatform, saveSettings, settings } from '#lib/settings.svelte.ts';
	import { keyName } from './names.ts';
	import { fingerMap } from './store.svelte.ts';

	const layout = qwertyAnsi(resolvedPlatform());
	const profile = $derived(buildProfile(fingerMap.observations, layout));
	const empty = $derived(fingerMap.loaded && fingerMap.observations.length === 0);

	let selectedKey = $state<string | null>(null);
	let fileInput: HTMLInputElement | undefined = $state();
	let pendingImport = $state<FingerObservation[] | null>(null);
	let confirmReset = $state(false);
	let message = $state<{ kind: 'ok' | 'error'; text: string } | null>(null);

	onMount(() => {
		fingerMap.load();
		results.load();
		const saved = Number(page.url.searchParams.get('saved'));
		if (saved > 0) message = { kind: 'ok', text: `${saved} new ${saved === 1 ? 'entry has' : 'entries have'} been saved to your finger map.` };
	});

	const zoneMap = $derived(
		new Map<string, ZoneInfo>(
			Object.values(profile.keys)
				.filter((k) => k.finger)
				.map((k) => [k.code, { finger: k.finger!, strength: k.confidence }])
		)
	);

	const pendingKeys = $derived(
		new Set([...CORE_KEYS, ...(settings.mapExtended ? EXTENDED_KEYS : [])].filter((c) => !profile.keys[c]?.mapped))
	);

	const corePct = $derived(Math.round((profile.core.mapped / profile.core.total) * 100));
	const differs = $derived(Object.values(profile.keys).filter((k) => k.mapped && k.differs && !k.code.startsWith('Shift')));
	const maxLoad = $derived(Math.max(1, ...FINGERS.map((f) => profile.load[f])));
	const loadTone = $derived(Object.fromEntries(FINGERS.map((f) => [f, profile.load[f] ? 0.2 + 0.8 * (profile.load[f] / maxLoad) : 0])));
	const loadLegend = $derived(
		Object.fromEntries(FINGERS.map((f) => [f, { value: String(profile.load[f]), strong: profile.load[f] === maxLoad && maxLoad > 1 }]))
	);
	const loadSummary = $derived(
		`Mapped keys per finger: ${FINGERS.map((f) => `${handOf(f)} ${kindOf(f)} ${profile.load[f]}`).join(', ')}.`
	);

	const detail = $derived(selectedKey ? profile.keys[selectedKey] : undefined);
	const detailRules = $derived(selectedKey ? profile.rules.filter((r) => r.code === selectedKey) : []);
	const standardFinger = $derived(selectedKey ? layout.keys.find((k) => k.code === selectedKey)?.finger : undefined);

	const name = (code: string) => keyName(layout, code);
	const lower = (f: Finger) => fingerLabel(f).toLowerCase();

	function exportFile() {
		const text = serializeProfile(fingerMap.observations, layout);
		const blob = new Blob([text], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `my-fingers-${new Date().toISOString().slice(0, 10)}${FILE_EXTENSION}`;
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	async function onFile(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		try {
			const { observations } = parseProfileFile(await file.text());
			if (fingerMap.observations.length) {
				pendingImport = observations;
			} else {
				await fingerMap.replace(observations);
				message = { kind: 'ok', text: `${observations.length} entries have been imported.` };
			}
		} catch (err) {
			message = { kind: 'error', text: err instanceof ProfileFileError ? err.message : 'The file could not be read.' };
		}
	}

	async function applyImport(mode: 'merge' | 'replace') {
		if (!pendingImport) return;
		const list = mode === 'merge' ? [...fingerMap.observations, ...pendingImport] : pendingImport;
		await fingerMap.replace(list);
		message = { kind: 'ok', text: `${pendingImport.length} entries have been imported (${mode === 'merge' ? 'merged' : 'replaced'}).` };
		pendingImport = null;
	}

	async function reset() {
		await fingerMap.clear();
		confirmReset = false;
		selectedKey = null;
		message = { kind: 'ok', text: 'Your finger map has been cleared.' };
	}

	function toggleExtended() {
		settings.mapExtended = !settings.mapExtended;
		saveSettings();
	}

	const shiftSide = $derived.by(() => {
		const s = profile.shift;
		if (!s.samples) return null;
		const left = Math.round((s.left / s.samples) * 100);
		return { left, right: 100 - left, opposite: Math.round(s.opposite * 100) };
	});
</script>

<input bind:this={fileInput} type="file" accept=".json,application/json" class="sr-only" onchange={onFile} tabindex="-1" aria-hidden="true" />

<div class="overview">
	<header class="intro">
		<div>
			<h1>Your finger map</h1>
			<p class="lede">
				Every typist has individual habits. Indicate which finger presses each key, and sqwer will record your
				technique, including habits that depend on the neighboring keys.
			</p>
		</div>
		<div class="intro-actions">
			<a class="btn primary" href="/map/session" data-testid="start-mapping">
				{empty ? 'Start mapping' : 'Continue mapping'} <Icon name="arrow" size={17} />
			</a>
			<label class="check">
				<input type="checkbox" checked={settings.mapExtended} onchange={toggleExtended} />
				Include the number row and symbols
			</label>
		</div>
	</header>

	{#if message}
		<div class="message" class:error={message.kind === 'error'} role="status">
			{message.text}
			<button type="button" aria-label="Dismiss" onclick={() => (message = null)}>×</button>
		</div>
	{/if}
	{#if fingerMap.error}<div class="message error" role="alert">{fingerMap.error}</div>{/if}

	{#if empty}
		<section class="steps" aria-label="How finger mapping works">
			<div class="step">
				<span class="num">1</span>
				<h3>Type a short prompt</h3>
				<p>Words are selected to cover the keys that have not yet been mapped. Type them as you normally would.</p>
			</div>
			<div class="step">
				<span class="num">2</span>
				<h3>Indicate the finger used</h3>
				<p>After each keystroke, select the finger you used, or press <kbd>1</kbd>–<kbd>5</kbd> for the left hand and <kbd>6</kbd>–<kbd>0</kbd> for the right hand.</p>
			</div>
			<div class="step">
				<span class="num">3</span>
				<h3>Review your map</h3>
				<p>Each key displays the finger you use and how consistent your entries are. The map can be exported as a file at any time.</p>
			</div>
		</section>
		<p class="import-line">
			Already have a profile? <button type="button" class="link" onclick={() => fileInput?.click()}>Import a {FILE_EXTENSION} file</button>
		</p>
	{:else if fingerMap.loaded}
		<dl class="stats">
			<div class="stat">
				<dt>Core keys mapped</dt>
				<dd><span data-testid="coverage">{corePct}%</span> <small>{profile.core.mapped}/{profile.core.total}</small></dd>
				<span class="bar"><span style:width={`${corePct}%`}></span></span>
			</div>
			<div class="stat">
				<dt>Entries recorded</dt>
				<dd>{profile.samples}</dd>
			</div>
			<div class="stat">
				<dt>Keys typed with a non-standard finger</dt>
				<dd>{differs.length}</dd>
			</div>
			<div class="stat">
				<dt>Context habits detected</dt>
				<dd>{profile.rules.length}</dd>
			</div>
			<div class="stat">
				<dt>Shift usage</dt>
				{#if shiftSide}
					<dd class="small">{shiftSide.left}% left · {shiftSide.right}% right</dd>
					<span class="sub">{shiftSide.opposite}% with the opposite hand</span>
				{:else}
					<dd class="small muted">No capital letters recorded</dd>
				{/if}
			</div>
		</dl>

		<section class="speed" aria-labelledby="speed-title">
			<div class="map-head">
				<h2 id="speed-title">Finger speed</h2>
				{#if results.latest('finger-speed')}
					<a class="btn" href="/exams/finger-speed">Retake the assessment</a>
				{/if}
			</div>
			{#if results.latest('finger-speed')?.fingers}
				<FingerScores fingers={results.latest('finger-speed')!.fingers!} />
			{:else if profile.core.mapped / profile.core.total >= ASSESSMENT_COVERAGE}
				<div class="speed-cta">
					<p>Your map is ready. Measure the speed and accuracy of each finger to see where to focus your practice.</p>
					<a class="btn btn-primary" href="/exams/finger-speed">Begin the finger assessment</a>
				</div>
			{:else}
				<p class="muted">
					Once {Math.round(ASSESSMENT_COVERAGE * 100)}% of core keys are mapped, you can measure the speed and accuracy of
					each finger. You have mapped {corePct}%.
				</p>
			{/if}
		</section>

		<section class="map-card">
			<div class="map-head">
				<h2>Keyboard</h2>
				<p>Select a key to view its details.</p>
			</div>
			<Keyboard
				{layout}
				{zoneMap}
				{pendingKeys}
				{selectedKey}
				onkeyselect={(c) => (selectedKey = selectedKey === c ? null : c)}
				label="Your finger map. Each key is colored by the finger you use."
			/>
			<ul class="legend">
				{#each [['pinky', 'Little finger'], ['ring', 'Ring finger'], ['middle', 'Middle finger'], ['index', 'Index finger'], ['thumb', 'Thumb']] as [f, name] (f)}
					<li><span class="swatch" style:background={`var(--f-${f})`}></span>{name}</li>
				{/each}
				<li><span class="swatch striped"></span>Requires more entries</li>
				<li><span class="muted">A stronger color indicates more consistent entries</span></li>
			</ul>
		</section>

		<div class="grid">
			<section class="card detail" aria-live="polite">
				{#if selectedKey}
					<div class="detail-head">
						<span class="keycap">{name(selectedKey)}</span>
						<div>
							{#if detail?.finger}
								<h3>Your {lower(detail.finger)}</h3>
								<p>{Math.round(detail.share * 100)}% of {detail.samples} {detail.samples === 1 ? 'entry' : 'entries'}{detail.mapped ? '' : ' (more entries required)'}</p>
							{:else}
								<h3>No entries yet</h3>
								<p>This key will be filled in as you continue mapping.</p>
							{/if}
						</div>
					</div>
					{#if standardFinger}
						<p class="standard">
							Standard touch typing uses the <b>{lower(standardFinger)}</b>{#if detail?.finger && detail.finger !== standardFinger}<span class="tag">different</span>{/if}
						</p>
					{/if}
					{#if detail}
						<ul class="bars">
							{#each FINGERS.filter((f) => detail.counts[f]) as f (f)}
								<li>
									<span class="bar-label">{lower(f)}</span>
									<span class="bar-track"><span style:width={`${((detail.counts[f] ?? 0) / detail.samples) * 100}%`} style:background={`var(--f-${kindOf(f)})`}></span></span>
									<span class="bar-value">{detail.counts[f]}</span>
								</li>
							{/each}
						</ul>
					{/if}
					{#if detailRules.length}
						<h4>Habits for this key</h4>
						<ul class="rules">
							{#each detailRules as r (r.when + r.other)}
								<li>{r.when === 'after' ? 'After' : 'Before'} <span class="mini">{name(r.other)}</span> → {lower(r.finger)} <span class="muted">({r.count}/{r.total})</span></li>
							{/each}
						</ul>
					{/if}
				{:else}
					<h3>Key details</h3>
					<p class="muted">Select a key on the map to view the fingers used for it and any related habits.</p>
				{/if}
			</section>

			<section class="card">
				<h3>Finger load</h3>
				<p class="muted small-p">The number of mapped keys assigned to each finger.</p>
				<div class="load-hands">
					<Hands label={loadSummary} tone={loadTone} legend={loadLegend} legendSize={16} />
				</div>
			</section>

			<section class="card">
				<h3>Your habits</h3>
				{#if profile.rules.length}
					<ul class="rules">
						{#each profile.rules.slice(0, 8) as r (r.code + r.when + r.other)}
							<li>
								<span class="mini">{name(r.code)}</span>
								{r.when === 'after' ? 'after' : 'before'}
								<span class="mini">{name(r.other)}</span> → {lower(r.finger)}
								<span class="muted">({r.count}/{r.total})</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="muted">Habits that depend on the neighboring key are listed here once they have been detected.</p>
				{/if}
				{#if differs.length}
					<h4>Keys typed with a non-standard finger</h4>
					<p class="chips">
						{#each differs as k (k.code)}
							<button type="button" class="mini as-button" onclick={() => (selectedKey = k.code)}>{name(k.code)}</button>
						{/each}
					</p>
				{/if}
			</section>
		</div>

		<section class="toolbar">
			<div class="file-actions">
				<button type="button" class="btn" onclick={exportFile}>Export profile</button>
				<button type="button" class="btn" onclick={() => fileInput?.click()}>Import profile</button>
				<button type="button" class="btn danger" onclick={() => (confirmReset = true)}>Clear map</button>
			</div>
		</section>
		<p class="privacy">{fingerMap.synced ? 'Your finger map is stored in this browser and synchronized to your account.' : 'Your finger map is stored only in this browser. Sign in to save it to an account, or export it to keep a copy.'}</p>
	{/if}
</div>

<Dialog open={!!pendingImport} title="Import finger profile" onclose={() => (pendingImport = null)}>
	Your current map contains {fingerMap.observations.length} entries. Select Merge to add the {pendingImport?.length ?? 0} imported
	entries to it, or Replace to use only the imported entries.
	{#snippet actions()}
		<button type="button" class="btn" onclick={() => (pendingImport = null)}>Cancel</button>
		<button type="button" class="btn" onclick={() => applyImport('replace')}>Replace</button>
		<button type="button" class="btn primary" onclick={() => applyImport('merge')}>Merge</button>
	{/snippet}
</Dialog>

<Dialog open={confirmReset} title="Clear your finger map?" alert onclose={() => (confirmReset = false)}>
	This permanently deletes all {fingerMap.observations.length} entries{fingerMap.synced ? ' from this browser and from your account' : ' stored in this browser'}. Export the map first if you wish to keep a copy.
	{#snippet actions()}
		<button type="button" class="btn" data-autofocus onclick={() => (confirmReset = false)}>Cancel</button>
		<button type="button" class="btn danger solid" onclick={reset}>Clear map</button>
	{/snippet}
</Dialog>

<style>
	.overview {
		display: flex;
		flex-direction: column;
		gap: 26px;
	}
	.intro {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 24px;
		flex-wrap: wrap;
	}
	h1 {
		font-size: clamp(34px, 4.8vw, 52px);
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}
	.lede {
		margin-top: 10px;
		max-width: 560px;
		font-size: 17px;
		line-height: 1.5;
		color: var(--ink-2);
	}
	.intro-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 42px;
		padding: 0 16px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font-weight: 600;
		font-size: 14.5px;
		text-decoration: none;
		cursor: pointer;
	}
	.btn:hover {
		background: var(--surface-2);
	}
	.btn.primary {
		height: 48px;
		padding: 0 22px;
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
		font-size: 15.5px;
	}
	.btn.primary:hover {
		filter: brightness(0.96);
	}
	.btn.danger {
		color: var(--error);
	}
	.btn.danger.solid {
		background: var(--error);
		color: #fff;
		border-color: transparent;
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--ink-2);
		cursor: pointer;
	}
	.check input {
		accent-color: var(--ink);
		width: 16px;
		height: 16px;
	}
	.message {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line-strong);
		border-left: 4px solid var(--accent);
		font-size: 14.5px;
		font-weight: 500;
	}
	.message.error {
		border-left-color: var(--error);
	}
	.message button {
		font-size: 20px;
		line-height: 1;
		color: var(--ink-3);
		cursor: pointer;
		padding: 0 4px;
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 14px;
	}
	.step {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.num {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-weight: 700;
	}
	.step h3 {
		font-size: 18px;
		font-weight: 600;
	}
	.step p {
		color: var(--ink-2);
		line-height: 1.5;
		font-size: 15px;
	}
	.import-line {
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.link {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
		cursor: pointer;
	}
	.stats {
		display: grid;
		grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
		gap: 10px;
	}
	.stat {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	dt {
		font-size: 13px;
		color: var(--ink-3);
		font-weight: 500;
	}
	dd {
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	dd small {
		font-size: 14px;
		color: var(--ink-3);
		font-weight: 500;
	}
	dd.small {
		font-size: 17px;
		padding-top: 6px;
	}
	.sub {
		font-size: 13px;
		color: var(--ink-2);
	}
	.stat .bar {
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
		margin-top: 4px;
	}
	.stat .bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
	}
	.speed {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.speed-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		flex-wrap: wrap;
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		border-left: 4px solid var(--accent);
		background: var(--surface);
	}
	.speed-cta p {
		max-width: 560px;
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.map-card {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.map-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 24px;
		font-weight: 400;
	}
	.map-head p {
		color: var(--ink-3);
		font-size: 14px;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.legend li {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.swatch {
		width: 11px;
		height: 11px;
		border-radius: 3px;
	}
	.swatch.striped {
		background: repeating-linear-gradient(45deg, var(--key) 0 3px, var(--line-strong) 3px 5px);
		border: 1px solid var(--key-edge);
	}
	.grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr 1fr;
		gap: 14px;
	}
	.card {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 3px;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.card h3 {
		font-size: 17px;
		font-weight: 600;
	}
	.card h4 {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-3);
		margin-top: 8px;
	}
	.muted {
		color: var(--ink-3);
	}
	.small-p {
		font-size: 13.5px;
		margin-top: -6px;
	}
	.detail-head {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.detail-head p {
		font-size: 14px;
		color: var(--ink-2);
	}
	.keycap {
		display: grid;
		place-items: center;
		min-width: 54px;
		height: 54px;
		padding: 0 10px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 4px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
	}
	.standard {
		font-size: 14px;
		color: var(--ink-2);
	}
	.tag {
		margin-left: 8px;
		padding: 2px 8px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 12px;
		font-weight: 600;
	}
	.load-hands {
		margin-top: 14px;
	}
	.bars {
		display: flex;
		flex-direction: column;
		gap: 7px;
	}
	.bars li {
		display: grid;
		grid-template-columns: 96px 1fr 28px;
		align-items: center;
		gap: 10px;
		font-size: 13.5px;
	}
	.bar-label {
		color: var(--ink-2);
		white-space: nowrap;
	}
	.bar-track {
		height: 10px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar-track span {
		display: block;
		height: 100%;
		border-radius: 3px;
		min-width: 2px;
	}
	.bar-value {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.rules {
		display: flex;
		flex-direction: column;
		gap: 8px;
		font-size: 14.5px;
	}
	.mini {
		display: inline-grid;
		place-items: center;
		min-width: 24px;
		height: 24px;
		padding: 0 6px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
	}
	.as-button {
		cursor: pointer;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
		padding-top: 6px;
		border-top: 1px solid var(--line);
		padding: 18px 0 0;
	}
	.file-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.privacy {
		font-size: 13px;
		color: var(--ink-3);
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	@media (max-width: 960px) {
		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.stats .stat:first-child {
			grid-column: span 2;
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 720px) {
		.steps {
			grid-template-columns: 1fr;
		}
	}
</style>
