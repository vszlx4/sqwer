<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { computeStats, liveWpm, TypingSession, type TestMode } from '@sqwer/engine';
	import { EXAM_WORDS, WordGenerator, wordListById, type WordListId } from '@sqwer/content';
	import { qwertyAnsi } from '@sqwer/layouts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import type { Exam } from '#lib/exams.ts';
	import { toDetail } from '#lib/results/detail.ts';
	import RankedResult from '#lib/competitive/RankedResult.svelte';
	import { MIN_ACCURACY } from '#lib/progress/competitive.ts';
	import ResultReport from '#lib/results/ResultReport.svelte';
	import type { UploadOutcome } from '#lib/results/store.svelte.ts';
	import { swap } from '#lib/ui/transition.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import type { ExamId, ResultRecord } from '#lib/results/types.ts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { usage } from '#lib/usage/store.svelte.ts';
	import { resolvedPlatform, saveSettings, settings } from '#lib/settings.svelte.ts';
	import ConfigBar from './ConfigBar.svelte';
	import Words from './Words.svelte';
	import { loadWordList } from '#lib/wordlists.ts';

	const LOOKAHEAD = 40;
	/** Attempts with fewer keystrokes are not kept in the history. */
	const MIN_KEYSTROKES = 5;

	let { exam = null }: { exam?: Exam | null } = $props();

	// The page re-creates this component when the exam changes, so the initial value is used.
	const initialExam = untrack(() => exam);
	const examId: ExamId =
		initialExam && initialExam.id !== 'finger-map' && initialExam.id !== 'finger-speed' ? initialExam.id : 'timed';
	// Fixed examinations use their own settings; adjustable ones use the saved settings.
	const fixed = initialExam?.preset && !initialExam.preset.adjustable ? initialExam.preset : null;
	if (initialExam?.preset?.adjustable) {
		settings.mode = initialExam.preset.mode;
		settings.punctuation = initialExam.preset.punctuation;
		settings.numbers = initialExam.preset.numbers;
	}
	const config = () =>
		fixed
			? {
					mode: fixed.mode,
					time: fixed.time ?? settings.time,
					words: fixed.words ?? settings.words,
					punctuation: fixed.punctuation,
					numbers: fixed.numbers
				}
			: settings;

	/** The ranked test has its own display and result. */
	const ranked = examId === 'competitive';
	/** Best verified ranked speed before this attempt, and the server's answer for the latest one. */
	let rankedBest = $state<number | null>(null);
	let rankedUpload = $state.raw<Promise<UploadOutcome | null> | null>(null);
	let previousBest = $state<number | null>(null);

	/** Fixed examinations, ranked included, always use the exam list. */
	const listId = (): WordListId => (fixed ? 'english-200' : settings.wordList);
	let pool: readonly string[] = EXAM_WORDS;
	let poolId = $state<WordListId>('english-200');
	let listError = $state<string | null>(null);
	const poolInfo = $derived(wordListById(poolId)!);

	/** Loads the chosen list when it differs from the one in use, then starts a fresh test with it. */
	function syncList() {
		const id = listId();
		if (id === poolId) return;
		listError = null;
		loadWordList(id).then(
			(words) => {
				if (listId() !== id) return;
				pool = words;
				poolId = id;
				restart();
			},
			() => {
				if (listId() === id) listError = `${wordListById(id)?.name ?? 'The list'} could not be loaded. Check your connection and choose it again.`;
			}
		);
	}

	let generator: WordGenerator;
	let session = $state.raw<TypingSession>(newSession());
	let rev = $state(0);
	let record = $state.raw<ResultRecord | null>(null);
	let now = $state(0);
	let focused = $state(false);
	let idle = $state(true);
	let mouseMoved = $state(true);
	let pressed = $state<Set<string>>(new Set());
	let okKey = $state<string | null>(null);
	let errorKey = $state<string | null>(null);
	let platform = $state(resolvedPlatform());

	let input: HTMLInputElement | undefined = $state();
	let timer: ReturnType<typeof setInterval> | undefined;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	const layout = $derived(qwertyAnsi(platform));

	function currentMode(): TestMode {
		const c = config();
		return c.mode === 'time' ? { kind: 'time', seconds: c.time } : { kind: 'words', count: c.words };
	}

	function newSession(words?: string[]): TypingSession {
		const mode = currentMode();
		generator = new WordGenerator({ punctuation: config().punctuation, numbers: config().numbers, words: pool });
		const list = words ?? generator.next(mode.kind === 'words' ? mode.count : LOOKAHEAD * 2);
		return new TypingSession(list, mode);
	}

	function label(s: TypingSession) {
		const m = s.mode;
		const base = m.kind === 'time' ? `time ${m.seconds}s` : `words ${m.count}`;
		const extras = [config().punctuation && 'punctuation', config().numbers && 'numbers'].filter(Boolean);
		return [base, poolInfo.name, ...extras].join(' · ');
	}

	/** Builds the result record, saves it to the history and counts it in the usage statistics. */
	function save(s: TypingSession, status: ResultRecord['status']): ResultRecord {
		const stats = computeStats(s);
		const r1 = (n: number) => Math.round(n * 10) / 10;
		const rec: ResultRecord = {
			id: crypto.randomUUID(),
			exam: examId,
			status,
			at: Date.now(),
			wpm: r1(stats.wpm),
			accuracy: r1(stats.accuracy),
			raw: r1(stats.raw),
			consistency: r1(stats.consistency),
			seconds: r1(stats.seconds),
			label: label(s),
			detail: toDetail(s, stats)
		};
		usage.testEnded(rec);
		if (status === 'completed' || stats.keystrokes.total >= MIN_KEYSTROKES) {
			const upload = results.add(rec);
			if (ranked && status === 'completed') {
				previousBest = rankedBest;
				rankedUpload = upload;
				// A qualifying result raises the best shown in the display for the next attempt.
				if (rec.accuracy >= MIN_ACCURACY && (rankedBest == null || rec.wpm > rankedBest)) rankedBest = rec.wpm;
			}
		}
		return rec;
	}

	/** Records an attempt that was left before the end. */
	function abandon() {
		if (!session.started || session.finished) return;
		session.finish(performance.now());
		save(session, 'abandoned');
	}

	function restart(repeat = false) {
		abandon();
		stopTimer();
		const words = repeat ? session.targets.slice(0, session.mode.kind === 'words' ? session.targets.length : undefined) : undefined;
		const next = newSession(words);
		const update = () => {
			session = next;
			record = null;
			rev++;
		};
		if (record) swap(update);
		else update();
		now = 0;
		idle = true;
		mouseMoved = true;
		requestAnimationFrame(() => input?.focus());
	}

	function startTimer() {
		stopTimer();
		timer = setInterval(() => {
			now = performance.now();
			if (session.mode.kind === 'time' && session.startedAt !== null) {
				if (now - session.startedAt >= session.mode.seconds * 1000) complete(now);
			}
		}, 100);
	}

	function stopTimer() {
		if (timer) clearInterval(timer);
		timer = undefined;
	}

	function complete(at: number) {
		if (record) return;
		session.finish(at);
		stopTimer();
		const saved = save(session, 'completed');
		// The test dissolves into its results rather than snapping to them.
		swap(() => {
			record = saved;
			rev++;
			// The result opens at the top, wherever the page was scrolled while typing.
			if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
		});
	}

	function afterChange(at: number) {
		if (session.mode.kind === 'time' && session.targets.length - session.wordIndex < LOOKAHEAD) {
			session.appendWords(generator.next(LOOKAHEAD));
		}
		if (session.finished) complete(at);
		now = at;
		idle = false;
		mouseMoved = false;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (idle = true), 700);
		rev++;
	}

	function flash(code: string | undefined, ok: boolean) {
		if (!code) return;
		okKey = ok ? code : null;
		errorKey = ok ? null : code;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => {
			okKey = null;
			errorKey = null;
		}, 160);
	}

	function typeChar(ch: string, code?: string) {
		if (session.finished) return;
		const at = performance.now();
		const wasStarted = session.started;
		const result = session.type(ch, at, code);
		if (result === 'ignored') {
			if (session.finished) complete(at);
			return;
		}
		if (!wasStarted) {
			startTimer();
			usage.testStarted(examId);
		}
		// Light the key that was actually pressed: accent when correct, red when not.
		flash(code ?? layout.chars.get(ch)?.code, result === 'correct');
		afterChange(at);
	}

	function erase(word: boolean) {
		const at = performance.now();
		if (session.backspace(at, word)) afterChange(at);
	}

	function onkeydown(e: KeyboardEvent) {
		pressed = new Set(pressed).add(e.code);
		if (e.key === 'Tab' && !e.shiftKey) {
			e.preventDefault();
			restart();
			return;
		}
		if (e.isComposing || e.metaKey || (e.ctrlKey && e.key !== 'Backspace')) return;
		if (e.key === 'Backspace') {
			e.preventDefault();
			erase(e.ctrlKey || e.altKey);
			return;
		}
		if (e.key.length === 1) {
			e.preventDefault();
			typeChar(e.key, e.code);
		}
	}

	function onkeyup(e: KeyboardEvent) {
		if (!pressed.has(e.code)) return;
		const next = new Set(pressed);
		next.delete(e.code);
		// Releasing a modifier on macOS may swallow other keyups.
		if (e.key === 'Meta' || e.key === 'Shift') next.clear();
		pressed = next;
	}

	/** Virtual keyboards (mobile) send beforeinput instead of usable keydown events. */
	function onbeforeinput(e: InputEvent) {
		e.preventDefault();
		if (e.inputType === 'insertText' && e.data) {
			for (const ch of e.data) typeChar(ch);
		} else if (e.inputType === 'deleteContentBackward') {
			erase(false);
		} else if (e.inputType === 'deleteWordBackward') {
			erase(true);
		}
	}

	function onWindowKeydown(e: KeyboardEvent) {
		// On the results page, Tab leaves the results (they are already saved) for a new test.
		if (record) {
			if (e.key === 'Tab' && !e.shiftKey && !(e.target as HTMLElement | null)?.closest('input, textarea, select')) {
				e.preventDefault();
				restart();
			}
			return;
		}
		if (focused) return;
		const target = e.target as HTMLElement | null;
		if (target?.closest('button, a, input, select, textarea, [contenteditable]')) return;
		if (e.key.length === 1 || e.key === 'Backspace') {
			input?.focus();
			onkeydown(e);
		}
	}

	// While a test is on screen it owns the keyboard: stray keys are typed, focus returns after clicks.
	$effect(() => {
		if (record) return;
		return claimTyping({
			focus: () => input?.focus({ preventScroll: true }),
			key: (e) => {
				input?.focus({ preventScroll: true });
				onkeydown(e);
			}
		});
	});

	function onSettingsChange() {
		platform = resolvedPlatform();
		restart();
		syncList();
	}

	function setPlatform(p: 'mac' | 'pc') {
		settings.platform = p;
		platform = p;
		saveSettings();
	}

	function toggle(key: 'showKeyboard' | 'showZones') {
		settings[key] = !settings[key];
		saveSettings();
		input?.focus();
	}

	onMount(() => {
		input?.focus({ preventScroll: true });
		syncList();
		fingerMap.load();
		results.load();
		const onHide = () => abandon();
		window.addEventListener('pagehide', onHide);
		return () => window.removeEventListener('pagehide', onHide);
	});

	onDestroy(() => {
		abandon();
		stopTimer();
		clearTimeout(idleTimer);
		clearTimeout(flashTimer);
	});

	const typing = $derived.by(() => {
		rev;
		return session.started && !session.finished;
	});
	const fade = $derived(typing && !mouseMoved);

	const remaining = $derived.by(() => {
		rev;
		if (session.mode.kind !== 'time') return 0;
		const elapsed = session.startedAt === null ? 0 : now - session.startedAt;
		return Math.max(0, Math.ceil(session.mode.seconds - elapsed / 1000));
	});

	const wordProgress = $derived.by(() => {
		rev;
		return `${Math.min(session.wordIndex, session.targets.length)}/${session.targets.length}`;
	});
	const wpmNow = $derived.by(() => {
		rev;
		return session.started ? Math.round(liveWpm(session, now)) : 0;
	});
	const started = $derived.by(() => {
		rev;
		now;
		return session.started;
	});

	function toggleRanked(key: keyof typeof settings.ranked) {
		settings.ranked[key] = !settings.ranked[key];
		saveSettings();
	}

	onMount(() => {
		if (!ranked) return;
		// The best verified result from the account, or the best qualifying one in this browser.
		const local = results.forExam('competitive').filter((r) => r.accuracy >= MIN_ACCURACY).map((r) => r.wpm);
		rankedBest = local.length ? Math.max(...local) : null;
		void fetch('/api/competitive')
			.then((r) => (r.ok ? r.json() : null))
			.then((d: { best: number | null } | null) => {
				if (d && d.best != null) rankedBest = Math.max(d.best, rankedBest ?? 0);
			})
			.catch(() => {});
	});
</script>

<svelte:window onkeydown={onWindowKeydown} onmousemove={() => (mouseMoved = true)} />

<div class="test" class:fade>
	{#if record && ranked}
		<RankedResult {record} {previousBest} upload={rankedUpload} onnext={() => restart()} onrepeat={() => restart(true)} />
	{:else if record}
		<ResultReport {record} onnext={() => restart()} onrepeat={() => restart(true)} />
	{:else}
		{#if ranked}
		<div class="chrome top">
			<p class="ranked-rule"><Icon name="trophy" size={15} /> Ranked · {session.mode.kind === 'time' ? session.mode.seconds : 60} seconds · at least {MIN_ACCURACY}% accuracy</p>
			<div class="readouts" role="group" aria-label="Live readouts">
				<button type="button" class="pill" aria-pressed={settings.ranked.time} onclick={() => toggleRanked('time')}><Icon name="clock" size={15} /> Time</button>
				<button type="button" class="pill" aria-pressed={settings.ranked.speed} onclick={() => toggleRanked('speed')}><Icon name="gauge" size={15} /> Speed</button>
			</div>
		</div>

		<div class="status" aria-live="off">
			<span class="counter" class:sr-only={!settings.ranked.time} data-testid="counter" role="timer" aria-label={`${remaining} seconds left`}>{remaining}</span>
			{#if settings.ranked.speed && started}
				<span class="live"><b>{wpmNow}</b> WPM</span>
			{/if}
		</div>
		{:else}
		<div class="chrome top">
			{#if fixed && exam}
				<p class="exam-banner"><b>{exam.title}</b> · {exam.duration} · {exam.purpose}</p>
			{:else}
				<ConfigBar onchange={onSettingsChange} />
			{/if}
			{#if listError}
				<p class="list-note" role="alert">{listError}</p>
			{:else if !fixed && poolInfo.mature}
				<p class="list-note">{poolInfo.name} is a full dictionary list and includes profanity and other mature words. <a href="/copyright#word-lists">About the word lists</a></p>
			{/if}
			<a class="ranked-link" href="/test?exam=competitive" data-sveltekit-reload><Icon name="trophy" size={15} /> Play ranked</a>
		</div>

		<div class="status" aria-live="off">
			<span class="counter" data-testid="counter">
				{#if session.mode.kind === 'time'}{remaining}{:else}{wordProgress}{/if}
			</span>
			{#if settings.liveWpm && session.started}
				<span class="live"><b>{wpmNow}</b> WPM</span>
			{/if}
		</div>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="stage" onclick={() => input?.focus()}>
			<input
				bind:this={input}
				class="capture"
				type="text"
				autocomplete="off"
				autocapitalize="off"
				autocorrect="off"
				spellcheck="false"
				aria-label="Typing input. Type the words shown. Press Tab to restart."
				data-testid="typing-input"
				data-typing-input
				{onkeydown}
				{onkeyup}
				{onbeforeinput}
				onfocus={() => (focused = true)}
				onblur={() => {
					focused = false;
					pressed = new Set();
				}}
			/>
			<Words {session} {rev} {idle} />
		</div>

		<div class="chrome restart-row">
			<button type="button" class="restart" onclick={() => restart()} aria-label="Restart test">
				<Icon name="restart" size={18} />
			</button>
		</div>

		{#if settings.showKeyboard}
			<div class="keyboard-wrap">
				<Keyboard {layout} {pressed} {okKey} {errorKey} showZones={settings.showZones} label="Keyboard showing each key as you press it" />
			</div>
		{/if}

		<div class="chrome kb-tools" role="toolbar" aria-label="Keyboard options">
			<button type="button" class="pill" aria-pressed={settings.showKeyboard} onclick={() => toggle('showKeyboard')}>
				<Icon name="keyboard" size={15} /> Keyboard
			</button>
			<button type="button" class="pill" aria-pressed={settings.showZones} disabled={!settings.showKeyboard} onclick={() => toggle('showZones')}>
				<Icon name="palette" size={15} /> Finger zones
			</button>
			<span class="sep" aria-hidden="true"></span>
			<div class="seg" role="radiogroup" aria-label="Keyboard type">
				<button type="button" role="radio" aria-checked={platform === 'mac'} onclick={() => setPlatform('mac')}>Mac</button>
				<button type="button" role="radio" aria-checked={platform === 'pc'} onclick={() => setPlatform('pc')}>PC</button>
			</div>
		</div>

		{#if settings.showKeyboard && settings.showZones}
			<ul class="legend chrome" aria-label="Finger colors">
				{#each [['pinky', 'Little finger'], ['ring', 'Ring finger'], ['middle', 'Middle finger'], ['index', 'Index finger'], ['thumb', 'Thumb']] as [f, name] (f)}
					<li><span class="swatch" style:background={`var(--zone-${f})`}></span>{name}</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>

<style>
	.ranked-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		color: var(--ink);
		font-size: 13px;
		font-weight: 600;
		text-decoration: none;
		transition: border-color 140ms ease;
	}
	.ranked-link:hover {
		border-color: var(--ink);
	}
	.test {
		--typing-size: clamp(21px, 2.3vw, 29px);
		--typing-leading: 1.65;
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	.chrome {
		transition: opacity 260ms ease;
	}
	.fade .chrome {
		opacity: 0;
		pointer-events: none;
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}
	.ranked-rule {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		color: var(--ink-3);
	}
	.readouts {
		display: flex;
		gap: 6px;
	}
	.list-note {
		flex-basis: 100%;
		text-align: center;
		font-size: 13.5px;
		color: var(--ink-3);
	}
	.list-note a {
		color: var(--ink-2);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.exam-banner {
		max-width: 760px;
		padding: 10px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
		font-size: 14.5px;
		line-height: 1.5;
		color: var(--ink-2);
		text-align: center;
	}
	.exam-banner b {
		color: var(--ink);
	}
	.status {
		display: flex;
		align-items: baseline;
		gap: 18px;
		min-height: 36px;
		font-variant-numeric: tabular-nums;
	}
	.counter {
		font-size: 30px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.live {
		font-size: 15px;
		color: var(--ink-3);
	}
	.live b {
		color: var(--ink-2);
		font-weight: 600;
		font-size: 18px;
	}
	.stage {
		position: relative;
		cursor: text;
	}
	.capture {
		position: absolute;
		inset: 0;
		opacity: 0;
		width: 100%;
		height: 100%;
		cursor: text;
		z-index: 1;
		font-size: 16px; /* prevents iOS zoom on focus */
	}
	.restart-row {
		display: flex;
		justify-content: center;
	}
	.restart {
		width: 42px;
		height: 42px;
		display: grid;
		place-items: center;
		border-radius: 3px;
		color: var(--ink-3);
		cursor: pointer;
		transition:
			color 120ms ease,
			background 120ms ease,
			transform 300ms ease;
	}
	.restart:hover {
		color: var(--ink);
		background: var(--surface);
		transform: rotate(-90deg);
	}
	.keyboard-wrap {
		max-width: 860px;
		width: 100%;
		margin: 6px auto 0;
		transition: opacity 260ms ease;
	}
	.kb-tools {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 6px;
		margin-top: -6px;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 3px;
		font-size: 13.5px;
		font-weight: 500;
		color: var(--ink-3);
		border: 1px solid var(--line);
		background: var(--bg);
		cursor: pointer;
	}
	.pill:hover:not(:disabled) {
		color: var(--ink);
	}
	.pill[aria-pressed='true'] {
		color: var(--ink);
		border-color: var(--line-strong);
		background: var(--surface);
	}
	.pill[aria-pressed='true'] :global(svg) {
		color: var(--ink);
	}
	.pill:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.sep {
		width: 1px;
		height: 18px;
		background: var(--line-strong);
		margin: 0 4px;
	}
	.seg {
		display: inline-flex;
		padding: 3px;
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	.seg button {
		padding: 4px 12px;
		border-radius: 3px;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-3);
		cursor: pointer;
	}
	.seg button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.seg button[aria-checked='true'] {
		background: var(--ink);
		color: var(--bg);
	}
	.legend {
		display: flex;
		justify-content: center;
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
		width: 10px;
		height: 10px;
		border-radius: 3px;
	}
	@media (max-width: 640px) {
		.kb-tools .sep {
			display: none;
		}
	}
</style>
