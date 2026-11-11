<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { REDUCED } from '#lib/motion/gsap.ts';
	import { canSpeak, speak, stopSpeaking, voicesReady } from '../audio.ts';
	import { voice, type Speed } from '../voice/voice.svelte.ts';
	import { align, describe, spoken, type Slot } from '../align.ts';
	import { americanSpelling, COURSE_WORDS, matchHeard, type HeardMatch } from '@sqwer/content';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	/** Listen and type, open stage (issue 176): progress dots, voice pill, answer, explanation with Continue. */
	interface Props {
		pool: string;
		focus: string;
		words?: readonly string[];
		count: number;
		target: number;
		oncomplete: (r: StepResult) => void;
	}

	let { pool, focus, words, count, target, oncomplete }: Props = $props();

	/**
	 * Spoken words: five letters or more first, then four. Sound-alikes stay in: any spelling of the sound is
	 * accepted (matchHeard). Topped up from course vocabulary with taught keys.
	 */
	const list = untrack(() => {
		const rand = seeded(Date.now() % 100000);
		const given = activityWords(pool, focus, words, rand);
		const long = given.filter((w) => w.length >= 5);
		if (long.length < count) {
			const allowed = new Set([...pool]);
			const extra = shuffle(
				COURSE_WORDS.filter((w) => w.length >= 5 && w.length <= 9 && !long.includes(w) && [...w].every((c) => allowed.has(c))),
				rand
			);
			long.push(...extra.slice(0, count - long.length));
		}
		const rest = given.filter((w) => w.length === 4 && !long.includes(w));
		return [...long, ...rest, ...given.filter((w) => w.length < 4)].slice(0, count);
	});
	// Without any voice on the device, the word is shown briefly and typed from memory instead.
	let speech = $state(canSpeak());

	type Outcome = 'exact' | 'accepted' | 'wrong';
	interface Feedback {
		match: HeardMatch;
		outcome: Outcome;
		typed: string;
		word: string;
		slots: Slot[];
		note: string;
	}

	let phase = $state<'ready' | 'playing' | 'over'>('ready');
	let index = $state(0);
	let value = $state('');
	let showWord = $state(false);
	let feedback = $state<Feedback | null>(null);
	let outcomes = $state<Outcome[]>([]);
	/** What is playing now, for the status line; null when quiet. */
	let playing = $state<Speed | null>(null);
	let plays = $state(0);
	let input: HTMLInputElement | undefined = $state();
	let next: HTMLButtonElement | undefined = $state();
	let pill: HTMLDivElement | undefined = $state();
	let timers: ReturnType<typeof setTimeout>[] = [];
	let frame = 0;

	const correct = $derived(outcomes.filter((o) => o !== 'wrong').length);
	const word = $derived(list[index] ?? '');

	onDestroy(() => {
		timers.forEach(clearTimeout);
		cancelAnimationFrame(frame);
		stopSpeaking();
	});
	onMount(() => {
		// Voices load asynchronously in some browsers; the mode is settled before the exercise starts.
		void voicesReady().then(() => {
			if (phase === 'ready') speech = canSpeak();
		});
		// Clips are fetched while the intro is read, so the first word plays at once.
		voice.prepare(list);
	});

	/** Bar weights across the pill, loudest in the middle. */
	const SHAPE = [0.2, 0.36, 0.6, 0.86, 0.72, 1, 0.84, 0.58, 0.74, 0.46, 0.3, 0.18];

	let level = 0;
	/**
	 * Drives the pill from the playing clip's real level; device voices give none, so a still mid level. Runs while
	 * a word plays and stops once the bars have settled.
	 */
	function meter() {
		if (frame) return;
		const still = matchMedia(REDUCED);
		const step = () => {
			const live = playing !== null;
			const aim = !live ? 0 : still.matches || !voice.speaking ? 0.55 : voice.level();
			level = still.matches ? aim : level * 0.55 + aim * 0.45;
			if (!live && level < 0.005) level = 0;
			pill?.style.setProperty('--level', level.toFixed(3));
			frame = live || level ? requestAnimationFrame(step) : 0;
		};
		frame = requestAnimationFrame(step);
	}

	async function play(speed: Speed = 'normal') {
		if (!speech) return flash();
		playing = speed;
		plays++;
		meter();
		const said = await speak(word, speed);
		playing = null;
		if (!said) flash();
	}

	function present() {
		feedback = null;
		value = '';
		plays = 0;
		void play();
		requestAnimationFrame(() => input?.focus());
	}

	/** Shows the word for a moment, when it cannot be heard. */
	function flash() {
		showWord = true;
		timers.push(setTimeout(() => (showWord = false), 1200));
	}

	function begin() {
		phase = 'playing';
		present();
	}

	function explain(match: HeardMatch, typed: string): string {
		if (!match.ok) return describe(align(typed, word));
		if (match.how === 'exact') return 'Spelled exactly right.';
		if (match.how === 'sound') return `${typed} sounds the same as ${word}, so it counts.`;
		const american = americanSpelling(typed) === typed ? typed : word;
		const british = american === typed ? word : typed;
		return `Both spellings count: ${american} in American English, ${british} in British English.`;
	}

	async function submit() {
		const typed = value.trim().toLowerCase();
		if (!typed || feedback) return;
		stopSpeaking();
		playing = null;
		const match = matchHeard(word, typed);
		const outcome: Outcome = !match.ok ? 'wrong' : match.how === 'exact' ? 'exact' : 'accepted';
		outcomes[index] = outcome;
		feedback = { match, outcome, typed, word, slots: align(typed, word, match.ok && match.how !== 'exact'), note: explain(match, typed) };
		await tick();
		next?.focus();
	}

	function proceed() {
		if (!feedback) return;
		if (index + 1 < list.length) {
			index++;
			present();
			return;
		}
		phase = 'over';
		const accuracy = (correct / list.length) * 100;
		oncomplete({ passed: correct >= target, accuracy, summary: `${correct} of ${list.length} words typed correctly. Goal: ${target}.` });
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		e.preventDefault();
		if (e.shiftKey) void play('slow');
		else if (!value.trim()) void play();
		else void submit();
	}

	$effect(() =>
		claimTyping({
			focus: () => {
				if (phase !== 'playing') return;
				if (feedback) next?.focus({ preventScroll: true });
				else input?.focus({ preventScroll: true });
			},
			key: (e) => {
				if (phase === 'ready') {
					if (e.key === ' ') begin();
					return;
				}
				if (feedback) {
					if (e.key === 'Enter') proceed();
					return;
				}
				if (!input || input.disabled) return;
				input.focus({ preventScroll: true });
				if (e.key === 'Enter') onkeydown(e);
				else if (e.key === 'Backspace') value = value.slice(0, -1);
				else if (e.key.length === 1) value += e.key;
			}
		})
	);

	function onWindowKeydown(e: KeyboardEvent) {
		if (phase !== 'ready' || (e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			begin();
		}
	}

	const GRADE = { exact: 'Correct', accepted: 'Accepted', wrong: 'Not quite' } as const;
	const MARK_LABEL = { same: '', extra: 'extra', missing: 'missing', wrong: 'wrong', variant: 'variant' } as const;
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="stage">
	{#if phase === 'ready'}
		<div class="intro">
			<div class="pill" aria-hidden="true">
				{#each SHAPE as shape, i (i)}<span style:--shape={shape}></span>{/each}
			</div>
			<p class="title">{speech ? 'Listen and type' : 'Look and type'}</p>
			<p>
				{#if speech}
					You will hear {list.length} words, one at a time. Words that sound the same and British spellings count. Type each word, then press <kbd>Enter</kbd>. Press
					<kbd>Enter</kbd> with an empty answer to hear the word again, <kbd>Shift</kbd> + <kbd>Enter</kbd> to hear it slowly.
				{:else}
					No voice is built into this device, so each word is shown for a moment instead. Type it from memory, then press
					<kbd>Enter</kbd>.
				{/if}
			</p>
			<p>Type <b>{target}</b> of {list.length} correctly to pass. Turn your sound on.</p>
			<button type="button" class="btn btn-primary" onclick={begin}>Start <kbd>Space</kbd></button>
		</div>
	{:else}
		<header class="top">
			<ol class="dots" aria-hidden="true">
				{#each list as _, i (i)}
					<li class="dot {outcomes[i] ?? (i === index ? 'now' : 'todo')}"></li>
				{/each}
			</ol>
			<p class="meta">Word {Math.min(index + 1, list.length)} of {list.length} · {correct} correct · goal {target}</p>
		</header>

		{#if showWord}
			<p class="shown" aria-live="polite">{word}</p>
		{:else}
			<div class="pill" class:live={playing !== null} class:quiet={!!feedback} bind:this={pill} aria-hidden="true">
				{#each SHAPE as shape, i (i)}<span style:--shape={shape}></span>{/each}
			</div>
		{/if}
		<p class="state">
			{#if playing}<span class="dot-live" aria-hidden="true"></span>{playing === 'slow' ? 'Playing slowly' : 'Playing'}
			{:else if !speech}Shown for a moment
			{:else if plays}Heard {plays === 1 ? 'once' : `${plays} times`}
			{:else}Ready{/if}
		</p>

		{#if !feedback && speech}
			<div class="controls">
				<button type="button" class="ctl" onclick={() => play('normal')} disabled={playing !== null}>
					<Icon name="repeat" size={18} /> Again
				</button>
				<button type="button" class="ctl" onclick={() => play('slow')} disabled={playing !== null}>
					<Icon name="clock" size={18} /> Slow
				</button>
				<label class="volume">
					<Icon name={voice.volume === 0 ? 'mute' : 'volume'} size={18} />
					<span class="sr-only">Volume</span>
					<input type="range" min="0" max="1" step="0.05" value={voice.volume} oninput={(e) => voice.setVolume(Number(e.currentTarget.value))} />
				</label>
			</div>
		{/if}

		<label class="answer">
			<span class="sr-only">Your answer</span>
			<input
				bind:this={input}
				data-typing-input
				bind:value
				{onkeydown}
				type="text"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				disabled={phase === 'over' || !!feedback}
				placeholder="Type what you hear"
				data-testid="listen-input"
				data-tab-restart
			/>
		</label>

		{#if feedback}
			<section class="panel {feedback.outcome}" aria-labelledby="listen-grade">
				<p class="grade" id="listen-grade" role="status">
					<span class="mark" aria-hidden="true"><Icon name={feedback.outcome === 'wrong' ? 'close' : 'check'} size={16} /></span>
					{GRADE[feedback.outcome]}<span class="sr-only">. {spoken(feedback.typed, feedback.word)} {feedback.note}</span>
				</p>

				<div class="compare" class:plain={feedback.slots.every((s) => s.mark !== 'same')} aria-hidden="true" style:--n={feedback.slots.length}>
					{#if feedback.outcome !== 'exact'}
						<span class="row-label">You</span>
						{#each feedback.slots as s, i (i)}<span class="cell typed {s.mark}">{s.typed || '·'}</span>{/each}
					{/if}
					<span class="row-label">Word</span>
					{#each feedback.slots as s, i (i)}<span class="cell word {s.mark}" class:first={feedback.outcome === 'exact'}>{s.word || '·'}</span>{/each}
					{#if feedback.outcome !== 'exact'}
						<span></span>
						{#each feedback.slots as s, i (i)}<span class="note-mark {s.mark}">{MARK_LABEL[s.mark]}</span>{/each}
					{/if}
				</div>

				<p class="why" aria-hidden="true">{feedback.note}</p>

				<button type="button" class="btn btn-primary next" bind:this={next} onclick={proceed}>
					{index + 1 < list.length ? 'Continue' : 'Finish'} <kbd>Enter</kbd>
				</button>
			</section>
		{:else}
			<p class="help">
				<span><kbd>Enter</kbd> check</span>
				<span>Empty <kbd>Enter</kbd> again</span>
				<span><kbd>Shift</kbd> <kbd>Enter</kbd> slow</span>
			</p>
		{/if}
	{/if}
</div>

<style>
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-20);
		text-align: center;
	}
	.intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		max-width: var(--w-narrow);
		color: var(--ink-2);
		line-height: var(--lh-body);
	}
	.intro .pill {
		--level: 0.4;
		margin-bottom: var(--space-8);
	}
	.title {
		font-family: var(--font-serif);
		font-size: var(--fs-32);
		color: var(--ink);
	}

	.top {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-10);
		margin-bottom: var(--space-8);
	}
	.dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.dot {
		width: 10px;
		height: 10px;
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		transition:
			width var(--dur-base) var(--ease-out),
			background-color var(--dur-base) var(--ease-out);
	}
	.dot.exact,
	.dot.accepted {
		background: var(--ink);
	}
	.dot.wrong {
		background: var(--error);
	}
	.dot.now {
		width: 26px;
		background: var(--accent);
		outline: 1px solid var(--ink);
		outline-offset: 1px;
	}
	.meta {
		font-size: var(--fs-13);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	.pill {
		--level: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		width: 232px;
		height: 88px;
		padding-inline: var(--space-24);
		border-radius: var(--radius-pill);
		/* Fixed dark in both themes so the hue bars read the same. */
		background: var(--on-hue);
		transition: opacity var(--dur-base) var(--ease-out);
	}
	.pill span {
		flex: 1;
		height: 56px;
		border-radius: var(--radius-pill);
		background: var(--accent);
		transform: scaleY(calc(0.14 + var(--shape) * var(--level) * 0.86));
	}
	.pill.quiet {
		opacity: 0.55;
	}
	.shown {
		display: grid;
		place-items: center;
		height: 88px;
		font-family: var(--font-mono);
		font-size: var(--fs-32);
		font-weight: var(--fw-semibold);
	}
	.state {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		min-height: 20px;
		margin-top: calc(var(--space-8) * -1);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.dot-live {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-pill);
		background: var(--accent-ink);
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-8);
	}
	.ctl,
	.volume {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		min-height: 44px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-size: var(--fs-14);
		cursor: pointer;
	}
	.ctl:disabled {
		color: var(--ink-2);
		cursor: default;
	}
	.volume input {
		width: 96px;
		accent-color: var(--ink);
	}

	.answer {
		width: min(var(--w-form), 100%);
	}
	.answer input {
		width: 100%;
		height: 64px;
		padding: 0 var(--space-16);
		border: 0;
		border-bottom: 2px solid var(--ink);
		border-radius: 0;
		background: transparent;
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-32);
		text-align: center;
	}
	.answer input::placeholder {
		font-family: var(--font-sans);
		font-size: var(--fs-18);
		color: var(--untyped);
	}
	/* The underline is the focus mark here: thicker and in the area color, instead of the site ring. */
	.answer input:focus-visible {
		outline: none;
		box-shadow: inset 0 -2px 0 var(--accent-ink);
		border-bottom-color: var(--accent-ink);
	}
	.answer input:disabled {
		color: var(--ink-2);
		border-bottom-color: var(--line-strong);
	}

	.panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-16);
		width: 100%;
		max-width: var(--w-narrow);
		padding: var(--space-24) var(--space-20) 0;
		border-top: 1px solid var(--line);
	}
	.grade {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-family: var(--font-serif);
		font-size: var(--fs-28);
		color: var(--ink);
	}
	.mark {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius-pill);
	}
	.exact .mark,
	.accepted .mark {
		background: var(--success-soft);
		color: var(--success);
	}
	.wrong .mark {
		background: var(--error-soft);
		color: var(--error);
	}

	.compare {
		display: grid;
		grid-template-columns: auto repeat(var(--n), minmax(0, 40px));
		gap: var(--space-4);
		align-items: center;
		max-width: 100%;
	}
	.row-label {
		padding-right: var(--space-8);
		font-size: var(--fs-12);
		color: var(--ink-2);
		text-align: right;
	}
	.cell {
		display: grid;
		place-items: center;
		height: 44px;
		font-family: var(--font-mono);
		font-size: var(--fs-24);
		color: var(--ink);
	}
	.cell.word:not(.first) {
		border-top: 1px solid var(--line);
	}
	.cell.typed.extra,
	.cell.typed.wrong {
		color: var(--error);
		text-decoration: line-through;
	}
	.cell.word.missing,
	.cell.word.wrong {
		font-weight: var(--fw-bold);
		color: var(--streak);
	}
	.cell.typed.missing,
	.cell.word.extra {
		color: var(--untyped);
	}
	.cell.variant {
		font-weight: var(--fw-bold);
		color: var(--success);
	}
	/* A different word altogether: both words plainly, no marks under every letter. */
	.plain .cell.typed {
		color: var(--ink-2);
		text-decoration: none;
	}
	.plain .cell.word {
		color: var(--ink);
	}
	.plain .note-mark {
		visibility: hidden;
	}
	.note-mark {
		min-height: 16px;
		font-size: var(--fs-11);
		color: var(--ink-2);
	}
	.note-mark.extra,
	.note-mark.wrong {
		color: var(--error);
	}
	.note-mark.missing {
		color: var(--streak);
	}
	.note-mark.variant {
		color: var(--success);
	}

	.why {
		max-width: var(--w-form);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.next {
		min-width: 200px;
		justify-content: center;
	}

	.help {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4) var(--space-16);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	kbd {
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-12);
		color: var(--ink-2);
	}
	.btn-primary kbd {
		background: transparent;
		border-color: currentColor;
		color: inherit;
	}

	@media (max-width: 560px) {
		.compare {
			grid-template-columns: auto repeat(var(--n), minmax(0, 32px));
		}
		.cell {
			font-size: var(--fs-20);
		}
		.next {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot,
		.pill {
			transition: none;
		}
	}
</style>
