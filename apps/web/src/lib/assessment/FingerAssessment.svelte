<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { TypingSession } from '@sqwer/engine';
	import { ENGLISH_WORDS, MAPPING_WORDS } from '@sqwer/content';
	import { buildProfile } from '@sqwer/fingermap';
	import { FINGERS, fingerLabel, kindOf, qwertyAnsi, type Finger } from '@sqwer/layouts';
	import { fingerScores, STAGE_SECONDS, STAGES, stageWords, standouts } from '#lib/assessment.ts';
	import { ASSESSMENT_COVERAGE } from '#lib/exams.ts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import { usage } from '#lib/usage/store.svelte.ts';
	import type { ResultRecord } from '#lib/results/types.ts';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import Words from '#lib/test/Words.svelte';
	import FingerScores from './FingerScores.svelte';

	const VOCAB = [...ENGLISH_WORDS, ...MAPPING_WORDS];
	const layout = qwertyAnsi(resolvedPlatform());
	const profile = $derived(buildProfile(fingerMap.observations, layout));
	const coverage = $derived(profile.core.mapped / profile.core.total);
	const ready = $derived(coverage >= ASSESSMENT_COVERAGE);

	type Phase = 'intro' | 'stage' | 'between' | 'done';
	let phase = $state<Phase>('intro');
	let stageIndex = $state(0);
	let session = $state.raw<TypingSession | null>(null);
	let rev = $state(0);
	let remaining = $state(STAGE_SECONDS);
	let record = $state.raw<ResultRecord | null>(null);
	const completed: TypingSession[] = [];
	let timer: ReturnType<typeof setInterval> | undefined;
	/** When the break between stages began; keys pressed just after a stage ends are ignored. */
	let breakAt = 0;

	onMount(() => {
		fingerMap.load();
		results.load();
	});
	onDestroy(() => clearInterval(timer));

	const latest = $derived(results.latest('finger-speed'));

	function startStage(i: number) {
		stageIndex = i;
		const words = stageWords(STAGES[i]!.kind, layout, profile.samples ? profile : null, VOCAB);
		session = new TypingSession(words, { kind: 'time', seconds: STAGE_SECONDS });
		remaining = STAGE_SECONDS;
		phase = 'stage';
		rev++;
	}

	function begin() {
		usage.testStarted('finger-speed');
		completed.length = 0;
		record = null;
		startStage(0);
	}

	function tick() {
		if (!session?.startedAt) return;
		const left = STAGE_SECONDS - (performance.now() - session.startedAt) / 1000;
		remaining = Math.max(0, Math.ceil(left));
		if (left <= 0) endStage();
	}

	function endStage() {
		if (!session) return;
		clearInterval(timer);
		timer = undefined;
		session.finish(performance.now());
		completed.push(session);
		if (stageIndex < STAGES.length - 1) {
			phase = 'between';
			breakAt = Date.now();
		} else {
			finishAssessment();
		}
	}

	async function finishAssessment() {
		const scores = fingerScores(completed, layout, profile.samples ? profile : null);
		const r: ResultRecord = {
			id: crypto.randomUUID(),
			exam: 'finger-speed',
			status: 'completed',
			at: Date.now(),
			wpm: scores.wpm,
			accuracy: scores.accuracy,
			seconds: STAGE_SECONDS * STAGES.length,
			label: `${STAGES.length} stages of ${STAGE_SECONDS} seconds`,
			fingers: scores.fingers
		};
		record = r;
		phase = 'done';
		usage.testEnded(r);
		await results.add(r);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (phase === 'between') {
			if (e.key.length === 1 || e.key === 'Backspace') e.preventDefault();
			if (e.key === 'Enter' && Date.now() - breakAt > 800 && !(e.target as HTMLElement | null)?.closest('button')) {
				e.preventDefault();
				startStage(stageIndex + 1);
			}
			return;
		}
		if (phase !== 'stage' || !session) return;
		const now = performance.now();
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (session.backspace(now, e.altKey)) rev++;
			return;
		}
		if (e.key.length !== 1) return;
		e.preventDefault();
		const first = !session.started;
		if (session.type(e.key, now, e.code) === 'ignored') return;
		if (first) timer = setInterval(tick, 100);
		if (session.targets.length - session.wordIndex < 20) session.appendWords(stageWords(STAGES[stageIndex]!.kind, layout, profile, VOCAB, Math.random, 40));
		rev++;
	}

	const shown = $derived(record ?? latest);
	const marks = $derived(shown?.fingers ? standouts(shown.fingers) : null);
	const practiceWords = $derived(
		marks ? stageWords(kindOf(marks.slowest[0]) === 'thumb' ? 'index' : (kindOf(marks.slowest[0]) as 'pinky'), layout, profile, VOCAB).slice(0, 10) : []
	);
	const lower = (f: Finger) => fingerLabel(f).toLowerCase().replace('pinky', 'little finger');
</script>

<svelte:window {onkeydown} />

<div class="assessment">
	{#if !fingerMap.loaded}
		<p class="muted">Loading your finger map…</p>
	{:else if phase === 'intro'}
		<header class="intro">
			<h1>Finger speed assessment</h1>
			<p class="lede">
				This assessment measures the speed and accuracy of each finger separately. It consists of four stages of
				{STAGE_SECONDS} seconds, each built from words that rely on one pair of fingers according to your own finger
				map. Thumbs are measured through the space bar.
			</p>
		</header>

		{#if !ready}
			<section class="card locked">
				<h2>Your finger map is not ready yet</h2>
				<p>
					The assessment uses your finger map to attribute each keystroke to the correct finger. It becomes available
					once {Math.round(ASSESSMENT_COVERAGE * 100)}% of core keys are mapped. You have mapped
					<strong>{Math.round(coverage * 100)}%</strong>.
				</p>
				<div class="bar" aria-hidden="true"><span style:width={`${Math.min(100, (coverage / ASSESSMENT_COVERAGE) * 100)}%`}></span></div>
				<a class="btn btn-primary" href={profile.samples ? '/map' : '/map/session'}>
					{profile.samples ? 'Continue mapping' : 'Start mapping'}
				</a>
			</section>
		{:else}
			<section class="card">
				<h2>Before you begin</h2>
				<ol class="stages">
					{#each STAGES as s, i (s.kind)}
						<li><span class="num">{i + 1}</span>{s.title} · {STAGE_SECONDS} seconds</li>
					{/each}
				</ol>
				<ul class="notes">
					<li>Type at a comfortable, steady pace. Accuracy matters as much as speed.</li>
					<li>Each stage starts when you type the first character.</li>
					<li>Use the fingers you normally use. The assessment measures your real technique.</li>
				</ul>
				<button type="button" class="btn btn-primary" onclick={begin}>Begin the assessment</button>
			</section>
		{/if}

		{#if latest?.fingers}
			<section class="previous" aria-labelledby="prev-title">
				<h2 id="prev-title">Your most recent assessment</h2>
				<p class="muted">{new Date(latest.at).toLocaleDateString('en-GB', { dateStyle: 'long' })}</p>
				<FingerScores fingers={latest.fingers} />
			</section>
		{/if}
	{:else if phase === 'stage' && session}
		<div class="stage-head">
			<p class="stage-label">Stage {stageIndex + 1} of {STAGES.length} · <b>{STAGES[stageIndex]!.title}</b></p>
			<p class="timer" aria-live="off">{remaining}</p>
		</div>
		<div class="stage-text">
			<Words {session} {rev} idle={!session.started} />
		</div>
		<p class="muted center">{session.started ? 'Keep a steady rhythm.' : 'Begin typing to start the stage.'}</p>
	{:else if phase === 'between'}
		<section class="card center-card" aria-live="polite">
			<h2>Stage {stageIndex + 1} complete</h2>
			<p>Next: <strong>{STAGES[stageIndex + 1]!.title}</strong>. Rest your hands briefly if needed.</p>
			<button type="button" class="btn btn-primary" onclick={() => startStage(stageIndex + 1)}>Continue to stage {stageIndex + 2}</button>
			<p class="muted">Or press Enter.</p>
		</section>
	{:else if phase === 'done' && shown?.fingers}
		<header class="intro">
			<h1>Your finger speed results</h1>
			<p class="lede">
				Average speed {Math.round(shown.wpm)} WPM at {Math.round(shown.accuracy)}% accuracy across all four stages.
			</p>
		</header>

		<FingerScores fingers={shown.fingers} />

		{#if marks}
			<section class="findings" aria-labelledby="findings-title">
				<h2 id="findings-title">What this assessment shows</h2>
				<ul>
					<li>
						Your <strong>{lower(marks.fastest[0])}</strong> is your fastest finger at {Math.round(marks.fastest[1].wpm)} WPM.
					</li>
					<li>
						Your <strong>{lower(marks.slowest[0])}</strong> is your slowest finger at {Math.round(marks.slowest[1].wpm)} WPM,
						{Math.round((1 - marks.slowest[1].wpm / marks.average) * 100)}% below your average of {Math.round(marks.average)} WPM.
					</li>
					<li>
						Your <strong>{lower(marks.leastAccurate[0])}</strong> is your least accurate finger at
						{Math.round(marks.leastAccurate[1].accuracy)}%.
					</li>
				</ul>
				{#if practiceWords.length}
					<p>
						To strengthen your {lower(marks.slowest[0])}, practise words that rely on it, slowly and accurately at first:
					</p>
					<p class="words">{practiceWords.join(' · ')}</p>
				{/if}
			</section>
		{/if}


		<div class="row">
			<a class="btn btn-primary" href="/journey">Return to your journey</a>
			<button type="button" class="btn" onclick={begin}>Retake the assessment</button>
		</div>
	{/if}
</div>

<style>
	.assessment {
		display: flex;
		flex-direction: column;
		gap: 24px;
		max-width: 980px;
		margin: 0 auto;
	}
	h1 {
		font-size: clamp(32px, 4.5vw, 48px);
		line-height: 1.08;
	}
	h2 {
		font-size: 26px;
	}
	.lede {
		margin-top: 12px;
		max-width: 720px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.card,
	.findings {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 14px;
		padding: 24px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.card p,
	.findings p,
	.findings li {
		font-size: 15.5px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	strong {
		color: var(--ink);
	}
	.locked {
		border-left: 4px solid var(--line-strong);
	}
	.bar {
		width: 100%;
		max-width: 420px;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	.stages {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.stages li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-weight: 600;
	}
	.num {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 14px;
	}
	.notes,
	.findings ul {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-left: 18px;
		list-style: disc;
		font-size: 15px;
		color: var(--ink-2);
	}
	.stage-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.stage-label {
		font-size: 16px;
		color: var(--ink-2);
	}
	.stage-label b {
		color: var(--ink);
	}
	.timer {
		font-size: 34px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.stage-text {
		--typing-size: clamp(21px, 2.3vw, 29px);
		--typing-leading: 1.65;
	}
	.center {
		text-align: center;
	}
	.center-card {
		align-items: center;
		text-align: center;
		padding: 40px 24px;
	}
	.muted {
		color: var(--ink-2);
		font-size: 14.5px;
	}
	.previous {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.words {
		font-weight: 600;
		color: var(--ink) !important;
	}
	.row {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
</style>
