<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PeekRating from '#lib/bits/PeekRating.svelte';
	import StatusMark, { type StatusMarkStatus } from '#lib/bits/StatusMark.svelte';
	import WakeSlider from '#lib/bits/WakeSlider.svelte';
	import ClipWave from './ClipWave.svelte';
	import GameFrame from './GameFrame.svelte';
	import { canSpeak, speak, stopSpeaking, voicesReady } from '../audio.ts';
	import { voice, type Speed } from '../voice/voice.svelte.ts';
	import type { ClipShape } from '../voice/shape.ts';
	import { align, describe, plain, spoken, type Part, type Slot } from '../align.ts';
	import { americanSpelling, COURSE_WORDS, matchHeard } from '@sqwer/content';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import { BATCH, LOOKAHEAD, batchLevel, pickWords, type Answer, type Outcome } from '#lib/games/listen-run.ts';
	import type { StepResult } from '../types.ts';

	/** Endless play: words come one after another from the level's pool until the player stops. */
	export interface ListenFeed {
		level: number;
		adaptive: boolean;
		words: (level: number) => Promise<string[]>;
		/** After every answer: all answers so far and the level the next words come from. */
		onanswer: (answers: Answer[], level: number) => void;
	}

	/** Listen and type: hear a word, type it, see what was said against what was typed, continue. */
	interface Props {
		pool: string;
		focus: string;
		words?: readonly string[];
		/** Lessons: words in the exercise, words needed to pass, and the result. */
		count?: number;
		target?: number;
		oncomplete?: (r: StepResult) => void;
		feed?: ListenFeed;
	}

	let { pool, focus, words, count = 6, target = 4, oncomplete, feed }: Props = $props();
	const endless = untrack(() => !!feed);

	/**
	 * Lesson words: five letters or more first, then four. Sound-alikes stay in: any spelling of the sound is
	 * accepted (matchHeard). Topped up from course vocabulary with taught keys.
	 */
	const list = untrack(() => {
		if (feed) return [];
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

	interface Feedback {
		outcome: Outcome;
		typed: string;
		slots: Slot[];
		/** Letters are marked only when a few differ; otherwise the two words are shown plainly. */
		marked: boolean;
		note: Part[];
		/** Text version for screen readers. */
		said: string;
	}

	let started = $state(false);
	let index = $state(0);
	let value = $state('');
	let showWord = $state(false);
	let feedback = $state<Feedback | null>(null);
	let outcomes = $state<Outcome[]>([]);
	let over = $state<{ won: boolean; text: string } | null>(null);
	/** What is playing now; null when quiet. */
	let playing = $state<Speed | null>(null);
	let plays = $state(0);
	let input: HTMLInputElement | undefined = $state();
	let next: HTMLButtonElement | undefined = $state();
	let timers: ReturnType<typeof setTimeout>[] = [];

	/* Endless: the word in play and the ones fetched behind it, answers so far, the level words come from. */
	let queue = $state<string[]>([]);
	let answers = $state<Answer[]>([]);
	let level = $state(untrack(() => feed?.level ?? 0));
	let loadError = $state(false);
	let filling = false;
	/** Set when the queue ran dry: the next word plays as soon as it arrives. */
	let waiting = false;

	const word = $derived(endless ? (queue[0] ?? '') : (list[index] ?? ''));
	const upcoming = $derived(endless ? queue.slice(1) : list.slice(index + 1));
	const correct = $derived(outcomes.filter((o) => o !== 'wrong').length);
	const answered = $derived(outcomes.filter(Boolean).length);

	/* ---------------------------------------------------------------- clips: made ahead, shown when ready */

	/** Per word: its clip is ready, or there is none (the device's voice speaks it). Missing while it is made. */
	let clips = $state<Record<string, 'ready' | 'none'>>({});
	function prepare(ws: readonly string[]) {
		for (const w of ws) {
			if (w in clips) continue;
			if (!voice.supported) {
				clips[w] = 'none';
				continue;
			}
			void voice.clip(w).then((b) => (clips[w] = b ? 'ready' : 'none'));
		}
	}
	const preparing = $derived(speech && !!word && !(word in clips));
	const ready = $derived(upcoming.filter((w) => w in clips).length);

	let shape = $state<ClipShape | null>(null);
	$effect(() => {
		const w = word;
		shape = null;
		if (clips[w] !== 'ready') return;
		void voice.shape(w, 'normal', 24).then((s) => {
			if (w === word) shape = s;
		});
	});

	onDestroy(() => {
		timers.forEach(clearTimeout);
		stopSpeaking();
	});
	onMount(() => {
		// Voices load asynchronously in some browsers; the mode is settled before the exercise starts.
		void voicesReady().then(() => {
			if (!started) speech = canSpeak();
		});
		// Clips are made while the intro is read, so the first word plays at once.
		if (endless) void fill();
		else prepare(list);
	});

	/** Keeps the word in play and LOOKAHEAD more fetched, from the current level's pool. */
	async function fill() {
		if (!feed || filling) return;
		filling = true;
		try {
			while (queue.length < 1 + LOOKAHEAD) {
				const from = await feed.words(level);
				const add = pickWords(from, [...answers.map((a) => a.word), ...queue], 1 + LOOKAHEAD - queue.length, Math.random);
				if (!add.length) break;
				queue.push(...add);
				prepare(add);
				if (waiting) {
					waiting = false;
					present();
				}
			}
			loadError = false;
		} catch {
			loadError = true;
		} finally {
			filling = false;
		}
	}

	/* ---------------------------------------------------------------- word ratings, kept on this device */

	const RATINGS = 'sqwer:clip-ratings';
	let rating = $state(0);
	function loadRating(w: string): number {
		try {
			return (JSON.parse(localStorage.getItem(RATINGS) ?? '{}') as Record<string, number>)[w] ?? 0;
		} catch {
			return 0;
		}
	}
	function rate(n: number) {
		rating = n;
		try {
			const all = JSON.parse(localStorage.getItem(RATINGS) ?? '{}') as Record<string, number>;
			if (n) all[word] = n;
			else delete all[word];
			localStorage.setItem(RATINGS, JSON.stringify(all));
		} catch {
			// Storage unavailable: the rating is not kept.
		}
	}

	/* ---------------------------------------------------------------- play */

	async function play(speed: Speed = 'normal') {
		if (!word) return;
		if (!speech) return flash();
		const w = word;
		playing = speed;
		plays++;
		const said = await speak(w, speed);
		if (w !== word) return;
		playing = null;
		if (!said) flash();
	}

	/** Shows the word for a moment, when it cannot be heard. */
	function flash() {
		showWord = true;
		timers.push(setTimeout(() => (showWord = false), 1200));
	}

	function present() {
		feedback = null;
		value = '';
		plays = 0;
		playing = null;
		rating = loadRating(word);
		void play();
		requestAnimationFrame(() => input?.focus({ preventScroll: true }));
	}

	function begin() {
		started = true;
		if (endless && !queue.length) {
			waiting = true;
			void fill();
			return;
		}
		present();
	}

	function accepted(typed: string, w: string, how: 'spelling' | 'sound'): Part[] {
		if (how === 'sound') return [{ letter: typed }, ' sounds the same as ', { letter: w }, ', so it counts.'];
		const american = americanSpelling(typed) === typed ? typed : w;
		const british = american === typed ? w : typed;
		return [{ letter: british }, ' is the British spelling of ', { letter: american }, '. Both count.'];
	}

	async function submit() {
		const typed = value.trim().toLowerCase();
		if (!typed || feedback || !word) return;
		stopSpeaking();
		playing = null;
		const match = matchHeard(word, typed);
		const outcome: Outcome = !match.ok ? 'wrong' : match.how === 'exact' ? 'exact' : 'accepted';
		outcomes[endless ? answers.length : index] = outcome;
		const slots = align(typed, word, outcome === 'accepted');
		const differ = slots.filter((s) => s.mark !== 'same').length;
		const note = !match.ok ? describe(slots) : match.how === 'exact' ? ['Spelled exactly right.'] : accepted(typed, word, match.how);
		feedback = {
			outcome,
			typed,
			slots,
			marked: outcome !== 'wrong' || (differ <= 3 && slots.some((s) => s.mark === 'same')),
			note,
			said: `${GRADE[outcome]}. ${spoken(typed, word)} ${plain(note)}`
		};
		if (feed) {
			answers.push({ word, typed, outcome, level, plays });
			if (answers.length % BATCH === 0) level = batchLevel(level, answers.slice(-BATCH).map((a) => a.outcome), feed.adaptive);
			feed.onanswer($state.snapshot(answers), level);
		}
		await tick();
		next?.focus({ preventScroll: true });
	}

	function proceed() {
		if (!feedback || over) return;
		if (endless) {
			stopSpeaking();
			queue.shift();
			if (queue.length) present();
			else {
				feedback = null;
				waiting = true;
			}
			void fill();
			return;
		}
		if (index + 1 < list.length) {
			index++;
			present();
			return;
		}
		const won = correct >= target;
		const summary = `${correct} of ${list.length} words typed correctly. Goal: ${target}.`;
		over = { won, text: summary };
		timers.push(setTimeout(() => oncomplete?.({ passed: won, accuracy: (correct / list.length) * 100, summary }), 1200));
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
				if (!started || over) return;
				if (feedback) next?.focus({ preventScroll: true });
				else input?.focus({ preventScroll: true });
			},
			key: (e) => {
				if (!started || over) return;
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

	const GRADE = { exact: 'Correct', accepted: 'Accepted', wrong: 'Not quite' } as const;
	const MARK: Record<Outcome, StatusMarkStatus> = { exact: 'done', accepted: 'done', wrong: 'failed' };
	/** Endless keeps the last few results in view; lessons show every word of the exercise. */
	const RECENT = 7;

	interface Dot {
		key: number;
		outcome: Outcome | null;
		current: boolean;
	}
	const dots = $derived.by((): Dot[] => {
		if (!endless) return list.map((_, i) => ({ key: i, outcome: outcomes[i] ?? null, current: started && i === index && !outcomes[i] }));
		const from = Math.max(0, answers.length - RECENT);
		const done = answers.slice(from).map((a, i) => ({ key: from + i, outcome: a.outcome, current: false }));
		return feedback ? done : [...done, { key: answers.length, outcome: null, current: started }];
	});
	const position = $derived(endless ? `Word ${answers.length + (feedback ? 0 : 1)}` : `Word ${Math.min(index + 1, list.length)} of ${list.length}`);
	const waving = $derived(playing !== null && (voice.speaking || clips[word] === 'none'));
</script>

<GameFrame
	title={speech ? 'Listen and type' : 'Look and type'}
	icon="volume"
	how={speech
		? `You will hear ${list.length} words, one at a time. Type each word and press Enter. Words that sound the same and British spellings count. Turn your sound on.`
		: `No voice is built into this device, so each of the ${list.length} words is shown for a moment instead. Type it from memory and press Enter.`}
	goal={`Type ${target} of ${list.length} words correctly`}
	progress={Math.min(1, correct / Math.max(1, target))}
	status={`${answered} / ${list.length} words`}
	{over}
	onstart={begin}
	autostart={endless}
	height={460}
>
	<!-- One column; every row keeps its height, so answering swaps content in place and nothing moves. -->
	<div class="play">
		<div class="top">
			<ol class="marks" aria-label={position}>
				{#each dots as d (d.key)}
					<li>
						{#if d.outcome}<StatusMark status={MARK[d.outcome]} size={18} decorative />
						{:else}<span class="dot" class:current={d.current}></span>{/if}
					</li>
				{/each}
			</ol>
			{#if speech && started && upcoming.length}
				<p class="ahead">{ready === upcoming.length ? `Next ${ready} ready` : `Preparing next words: ${ready} of ${upcoming.length}`}</p>
			{/if}
		</div>

		<!-- The player: always on screen, with the volume. -->
		<div class="player" class:mute={!speech}>
			{#if speech}
				<button type="button" class="btn icon" aria-label="Play the word again" onclick={() => play('normal')} disabled={!started || playing !== null || preparing}>
					<Icon name="play" size={18} />
				</button>
			{/if}
			<div class="sound">
				{#if showWord}
					<p class="shown" aria-live="polite">{word}</p>
				{:else}
					<ClipWave
						{shape}
						playing={waving}
						progress={() => (voice.speaking ? voice.progress() : null)}
						estimate={Math.max(500, word.length * (playing === 'slow' ? 160 : 100))}
						bars={24}
					/>
				{/if}
			</div>
			{#if speech}
				<button type="button" class="btn slow" onclick={() => play('slow')} disabled={!started || playing !== null || preparing}>Slow</button>
				<div class="volume">
					<Icon name={voice.volume === 0 ? 'mute' : 'volume'} size={18} />
					<WakeSlider value={Math.round(voice.volume * 100)} onChange={(v) => voice.setVolume(v / 100)} step={5} ariaLabel="Volume" formatValue={(v) => `${v}%`} />
					<span class="pct" aria-hidden="true">{Math.round(voice.volume * 100)}%</span>
				</div>
			{/if}
		</div>

		<p class="state" aria-live="polite">
			{#if feedback}
				<span class="grade" id="listen-grade"><StatusMark status={MARK[feedback.outcome]} size={20} decorative /> {GRADE[feedback.outcome]}</span>
			{:else if loadError}The words could not be loaded. Stop and start again.
			{:else if preparing || (endless && started && !word)}<span class="spin" aria-hidden="true"></span> Preparing the voice…
			{:else if playing}{playing === 'slow' ? 'Playing slowly…' : 'Playing…'}
			{:else if !started}Press Start to hear the first word
			{:else if !speech}Shown for a moment
			{:else if plays}Heard {plays === 1 ? 'once' : `${plays} times`}{/if}
		</p>

		<div class="answer">
			{#if feedback}
				<p class="box" aria-hidden="true">
					{#each feedback.slots as s, i (i)}{#if s.typed}<span class:bad={feedback.marked && (s.mark === 'extra' || s.mark === 'wrong')} class:variant={s.mark === 'variant'}>{s.typed}</span>{/if}{/each}
				</p>
				<p class="sr-only" role="status">{feedback.said}</p>
			{:else}
				<label>
					<span class="sr-only">Your answer</span>
					<input
						bind:this={input}
						data-typing-input
						bind:value
						{onkeydown}
						class="box"
						type="text"
						name="heard"
						autocomplete="off"
						autocapitalize="off"
						spellcheck="false"
						disabled={!started || !!over}
						placeholder="Type what you hear…"
						data-testid="listen-input"
						data-tab-restart
					/>
				</label>
			{/if}
		</div>

		<div class="middle">
			{#if feedback}
				<div class="result" aria-hidden="true">
					<p class="label">The word</p>
					<p class="word">
						{#each feedback.slots as s, i (i)}{#if s.word}<span class:fix={feedback.marked && feedback.outcome === 'wrong' && (s.mark === 'missing' || s.mark === 'wrong')}>{s.word}</span>{/if}{/each}
					</p>
					<p class="why">
						{#each feedback.note as part, i (i)}{#if typeof part === 'string'}{part}{:else}<b class="letter">{part.letter}</b>{/if}{/each}
					</p>
				</div>
			{:else}
				<p class="keys">
					<span><kbd>Enter</kbd> Check</span>
					{#if speech}<span><kbd>Enter</kbd> on empty: play again</span>
						<span><kbd>Shift</kbd>&nbsp;+&nbsp;<kbd>Enter</kbd> Slow</span>{/if}
				</p>
			{/if}
		</div>

		<!-- The primary action never moves: Check while typing, Continue after. -->
		<div class="footer">
			<div class="aside">
				{#if feedback && speech}
					<span>Voice clarity</span>
					<PeekRating value={rating} onChange={rate} size={18} lift={4} ariaLabel="How clear was the voice" labels={['Unclear', 'Hard to follow', 'Fine', 'Clear', 'Very clear']} />
				{/if}
			</div>
			{#if feedback}
				<button type="button" class="btn btn-primary act" bind:this={next} onclick={proceed}>
					{endless || index + 1 < list.length ? 'Continue' : 'Finish'} <Icon name="arrow" size={18} />
				</button>
			{:else}
				<button type="button" class="btn btn-primary act" onclick={() => void submit()} disabled={!started || !value.trim()}>Check</button>
			{/if}
		</div>
	</div>
</GameFrame>

<style>
	.play {
		display: grid;
		grid-template-rows: 20px 64px 28px 64px 132px 48px; /* off-scale: fixed rows of the stage */
		align-items: center;
		gap: var(--space-12);
		width: min(100%, var(--w-narrow));
		margin: 0 auto;
		padding: var(--space-24) var(--space-16);
	}
	/* No focus rings inside the game: the field shows its caret, buttons take their hover tone. */
	.play :global(:focus-visible) {
		outline: none;
		box-shadow: none;
	}
	.play :global(.btn:not(.btn-primary):focus-visible) {
		background: var(--surface-2);
		border-color: var(--ink-3);
	}
	.play :global(.btn-primary:focus-visible) {
		filter: brightness(0.94);
	}

	.top {
		position: relative;
		display: flex;
		justify-content: center;
	}
	.marks {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.marks li {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
	}
	.dot {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1.5px solid var(--line-strong);
	}
	.dot.current {
		border: 2px solid var(--accent);
	}
	.ahead {
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--fs-12);
		color: var(--ink-3);
		font-variant-numeric: tabular-nums;
	}

	.player {
		display: flex;
		align-items: center;
		gap: var(--space-12);
		height: 100%;
		padding: 0 var(--space-10);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.player.mute {
		justify-content: center;
	}
	.btn.icon {
		flex: none;
		width: 44px;
		padding: 0;
	}
	.btn.slow {
		flex: none;
		padding: 0 var(--space-12);
	}
	.sound {
		flex: 1;
		min-width: 0;
		height: 40px;
	}
	.shown {
		display: grid;
		place-items: center;
		height: 100%;
		font-family: var(--font-mono);
		font-size: var(--fs-28);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.volume {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--space-8);
		width: 168px;
		padding-left: var(--space-12);
		border-left: 1px solid var(--line);
		color: var(--ink-2);
	}
	.pct {
		min-width: 4ch;
		font-size: var(--fs-13);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.state {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-8);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.spin {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 2px solid var(--line-strong);
		border-top-color: var(--ink);
		animation: spin 800ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.grade {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-18);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}

	.answer,
	.answer label {
		display: block;
		height: 100%;
	}
	.box {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0 var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: clamp(22px, 2.6vw, 30px); /* off-scale: lesson drill typing size from the design guide */
		font-weight: var(--fw-semibold);
		letter-spacing: 0.04em; /* off-scale: mono letters read apart */
		text-align: center;
		overflow: hidden;
		white-space: nowrap;
		touch-action: manipulation;
	}
	input.box::placeholder {
		font-weight: var(--fw-regular);
		color: var(--ink-3);
	}
	input.box:disabled {
		background: var(--surface);
	}
	.box .bad {
		font-weight: var(--fw-bold);
		color: var(--error);
	}
	.box .variant {
		color: var(--ink-2);
	}

	.middle {
		display: grid;
		place-items: center;
		height: 100%;
		overflow: hidden;
		text-align: center;
	}
	.result {
		display: grid;
		justify-items: center;
		gap: var(--space-4);
	}
	.label {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.word {
		font-family: var(--font-mono);
		font-size: clamp(26px, 3.4vw, 38px); /* off-scale: the answer word is the largest thing in the panel */
		font-weight: var(--fw-semibold);
		letter-spacing: 0.04em; /* off-scale: mono letters read apart */
		line-height: var(--lh-snug);
		color: var(--ink);
		white-space: nowrap;
	}
	.word .fix {
		font-weight: var(--fw-bold);
		color: var(--success);
	}
	.why {
		display: -webkit-box;
		max-width: 46ch;
		margin-top: var(--space-4);
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.letter {
		font-family: var(--font-mono);
		font-weight: var(--fw-bold);
		color: var(--ink);
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-6) var(--space-20);
		font-size: var(--fs-13);
		color: var(--ink-3);
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-12);
		height: 100%;
		padding-top: var(--space-12);
		border-top: 1px solid var(--line);
	}
	.aside {
		display: flex;
		align-items: center;
		gap: var(--space-10);
		min-width: 0;
		font-size: var(--fs-13);
		white-space: nowrap;
		color: var(--ink-2);
	}
	/* The stars keep room above them for their tip; it overlaps the row so the stars line up with the label. */
	.aside > :global(:last-child:not(span)) {
		margin-top: calc(-1 * var(--pr-room));
	}
	.act {
		flex: none;
		min-width: 148px; /* off-scale: Check and Continue share one width */
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

	@media (max-width: 560px) {
		.play {
			grid-template-rows: 20px 108px 28px 56px 132px 56px; /* off-scale: fixed rows of the stage */
			padding: var(--space-20) var(--space-16);
		}
		.ahead {
			display: none;
		}
		.player {
			display: grid;
			grid-template-columns: 44px minmax(0, 1fr) auto;
			grid-template-rows: 44px 36px;
			gap: var(--space-6) var(--space-10);
			padding: var(--space-6) var(--space-10);
		}
		.volume {
			grid-column: 1 / -1;
			width: 100%;
			padding-left: 0;
			border-left: 0;
		}
		.aside > span {
			display: none;
		}
	}
	@media (pointer: coarse) {
		.keys {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation: none;
			border-top-color: var(--line-strong);
		}
	}
</style>
