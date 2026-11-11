<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, tick, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PeekRating from '#lib/bits/PeekRating.svelte';
	import StatusMark, { type StatusMarkStatus } from '#lib/bits/StatusMark.svelte';
	import VoicePill from '#lib/bits/VoicePill.svelte';
	import WakeSlider from '#lib/bits/WakeSlider.svelte';
	import GameFrame from './GameFrame.svelte';
	import { canSpeak, speak, stopSpeaking, voicesReady } from '../audio.ts';
	import { voice, type Speed } from '../voice/voice.svelte.ts';
	import { align, describe, spoken, type Part, type Slot } from '../align.ts';
	import { americanSpelling, COURSE_WORDS, matchHeard } from '@sqwer/content';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	/** Listen and type: hear a word, type it, see what was said against what was typed, continue. */
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
		outcome: Outcome;
		typed: string;
		word: string;
		slots: Slot[];
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

	const word = $derived(list[index] ?? '');
	const correct = $derived(outcomes.filter((o) => o !== 'wrong').length);
	const answered = $derived(outcomes.filter(Boolean).length);

	onDestroy(() => {
		timers.forEach(clearTimeout);
		stopSpeaking();
	});
	onMount(() => {
		// Voices load asynchronously in some browsers; the mode is settled before the exercise starts.
		void voicesReady().then(() => {
			if (!started) speech = canSpeak();
		});
		// Clips are fetched while the intro is read, so the first word plays at once.
		voice.prepare(list);
	});

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
		if (!speech) return flash();
		playing = speed;
		plays++;
		const said = await speak(word, speed);
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
		rating = loadRating(word);
		void play();
		requestAnimationFrame(() => input?.focus());
	}

	function begin() {
		started = true;
		present();
	}

	function accepted(typed: string, how: 'spelling' | 'sound'): Part[] {
		if (how === 'sound') return [{ letter: typed }, ' sounds the same as ', { letter: word }, ', so it counts.'];
		const american = americanSpelling(typed) === typed ? typed : word;
		const british = american === typed ? word : typed;
		return [{ letter: british }, ' is the British spelling of ', { letter: american }, '. Both count.'];
	}

	async function submit() {
		const typed = value.trim().toLowerCase();
		if (!typed || feedback) return;
		stopSpeaking();
		playing = null;
		const match = matchHeard(word, typed);
		const outcome: Outcome = !match.ok ? 'wrong' : match.how === 'exact' ? 'exact' : 'accepted';
		outcomes[index] = outcome;
		const slots = align(typed, word, outcome === 'accepted');
		const note = !match.ok ? describe(slots) : match.how === 'exact' ? ['Spelled exactly right.'] : accepted(typed, match.how);
		const text = note.map((p) => (typeof p === 'string' ? p : p.letter)).join('');
		feedback = { outcome, typed, word, slots, note, said: `${GRADE[outcome]}. ${spoken(typed, word)} ${text}` };
		await tick();
		next?.focus();
	}

	function proceed() {
		if (!feedback || over) return;
		if (index + 1 < list.length) {
			index++;
			present();
			return;
		}
		const won = correct >= target;
		const summary = `${correct} of ${list.length} words typed correctly. Goal: ${target}.`;
		over = { won, text: summary };
		timers.push(setTimeout(() => oncomplete({ passed: won, accuracy: (correct / list.length) * 100, summary }), 1200));
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

	/** Mark for each word in the round: results so far, the word in play, the rest to come. */
	function mark(i: number): StatusMarkStatus {
		const o = outcomes[i];
		if (o) return MARK[o];
		return started && i === index ? 'running' : 'pending';
	}
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
	height={460}
>
	<div class="play">
		<ol class="marks" aria-label={`Word ${Math.min(index + 1, list.length)} of ${list.length}`}>
			{#each list as _, i (i)}
				<li><StatusMark status={mark(i)} size={18} decorative /></li>
			{/each}
		</ol>

		<div class="sound">
			{#if showWord}
				<p class="shown" aria-live="polite">{word}</p>
			{:else}
				<VoicePill level={() => voice.level()} playing={playing !== null && voice.speaking} />
			{/if}
		</div>
		<p class="state" aria-live="polite">
			{#if playing}{playing === 'slow' ? 'Playing slowly' : 'Playing'}
			{:else if !started}Press Start to hear the first word
			{:else if !speech}Shown for a moment
			{:else if plays}Heard {plays === 1 ? 'once' : `${plays} times`}{/if}
		</p>

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
				disabled={!started || !!feedback || !!over}
				placeholder="Type the word you hear"
				data-testid="listen-input"
				data-tab-restart
			/>
		</label>

		{#if feedback}
			<section class="result {feedback.outcome}" aria-labelledby="listen-grade">
				<p class="grade" id="listen-grade">
					<StatusMark status={MARK[feedback.outcome]} size={26} decorative />
					{GRADE[feedback.outcome]}
				</p>
				<p class="sr-only" role="status">{feedback.said}</p>

				<div class="words" aria-hidden="true">
					<p class="label">The word</p>
					<p class="word">
						{#each feedback.slots as s, i (i)}{#if s.word}<span class:fix={s.mark === 'missing' || s.mark === 'wrong'}>{s.word}</span>{/if}{/each}
					</p>
					{#if feedback.outcome !== 'exact'}
						<p class="label">You typed</p>
						<p class="typed">
							{#each feedback.slots as s, i (i)}{#if s.typed}<span class:bad={s.mark === 'extra' || s.mark === 'wrong'} class:variant={s.mark === 'variant'}>{s.typed}</span>{/if}{/each}
						</p>
					{/if}
				</div>
				<p class="why" aria-hidden="true">
					{#each feedback.note as part, i (i)}{#if typeof part === 'string'}{part}{:else}<b class="letter">{part.letter}</b>{/if}{/each}
				</p>

				<div class="foot">
					{#if speech}
						<div class="rate">
							<span>How clear was the voice?</span>
							<PeekRating value={rating} onChange={rate} size={20} lift={4} ariaLabel="How clear was the voice" labels={['Unclear', 'Hard to follow', 'Fine', 'Clear', 'Very clear']} />
						</div>
					{/if}
					<div class="actions">
						{#if speech}
							<button type="button" class="btn" onclick={() => play('normal')} disabled={playing !== null}>
								<Icon name="volume" size={18} /> Hear it
							</button>
						{/if}
						<button type="button" class="btn btn-primary" bind:this={next} onclick={proceed}>
							{index + 1 < list.length ? 'Continue' : 'Finish'} <kbd aria-hidden="true">Enter</kbd>
						</button>
					</div>
				</div>
			</section>
		{:else}
			{#if speech}
				<div class="tools">
					<div class="replay">
						<button type="button" class="btn" onclick={() => play('normal')} disabled={!started || playing !== null}>
							<Icon name="repeat" size={18} /> Again
						</button>
						<button type="button" class="btn" onclick={() => play('slow')} disabled={!started || playing !== null}>
							<Icon name="clock" size={18} /> Slow
						</button>
					</div>
					<div class="volume">
						<Icon name={voice.volume === 0 ? 'mute' : 'volume'} size={18} />
						<WakeSlider
							value={Math.round(voice.volume * 100)}
							onChange={(v) => voice.setVolume(v / 100)}
							step={5}
							ariaLabel="Volume"
							formatValue={(v) => `${v}%`}
						/>
						<span class="pct" aria-hidden="true">{Math.round(voice.volume * 100)}%</span>
					</div>
				</div>
			{/if}
			<p class="keys">
				<span><kbd>Enter</kbd> Check</span>
				{#if speech}<span><kbd>Enter</kbd> on an empty answer: hear again</span>
					<span><kbd>Shift</kbd> <kbd>Enter</kbd> Slow</span>{/if}
			</p>
		{/if}
	</div>
</GameFrame>

<style>
	.play {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-24) var(--space-24) var(--space-32);
		text-align: center;
	}
	.marks {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.marks li {
		display: grid;
	}

	.sound {
		width: min(100%, var(--w-form));
		height: 80px;
		margin-top: var(--space-8);
	}
	.shown {
		display: grid;
		place-items: center;
		height: 100%;
		font-family: var(--font-mono);
		font-size: var(--fs-32);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.state {
		min-height: 20px;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}

	.answer {
		width: min(100%, var(--w-form));
	}
	.answer input {
		width: 100%;
		min-height: 64px;
		padding: var(--space-10) var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: clamp(22px, 2.6vw, 32px); /* off-scale: lesson drill typing size from the design guide */
		font-weight: var(--fw-semibold);
		text-align: center;
		transition: border-color var(--dur-fast) var(--ease-out);
	}
	.answer input::placeholder {
		font-family: var(--font-sans);
		font-size: var(--fs-16);
		font-weight: var(--fw-regular);
		color: var(--ink-3);
	}
	.answer input:hover:not(:disabled) {
		border-color: var(--ink-3);
	}
	.answer input:focus-visible {
		border-color: var(--ink);
	}
	.answer input:disabled {
		color: var(--ink-2);
		background: var(--surface);
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-12);
		width: min(100%, var(--w-form));
	}
	.replay {
		display: flex;
		gap: var(--space-8);
	}
	.volume {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--space-8);
		min-width: 160px;
		max-width: 220px;
		color: var(--ink-2);
	}
	.pct {
		min-width: 4ch;
		font-size: var(--fs-13);
		font-variant-numeric: tabular-nums;
		text-align: right;
	}
	.keys {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-4) var(--space-16);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}

	.result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		width: min(100%, var(--w-narrow));
		padding-top: var(--space-20);
		border-top: 1px solid var(--line);
	}
	.grade {
		display: inline-flex;
		align-items: center;
		gap: var(--space-10);
		font-family: var(--font-serif);
		font-size: var(--fs-28);
		font-weight: var(--fw-regular);
		color: var(--ink);
	}
	.words {
		display: grid;
		justify-items: center;
		gap: var(--space-4);
	}
	.label {
		margin-top: var(--space-8);
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--ink-2);
	}
	.word,
	.typed {
		font-family: var(--font-mono);
		letter-spacing: 0.04em; /* off-scale: mono letters read apart */
		overflow-wrap: anywhere;
	}
	.word {
		font-size: clamp(32px, 4.4vw, 44px); /* off-scale: the answer word is the largest thing in the panel */
		font-weight: var(--fw-semibold);
		line-height: var(--lh-snug);
		color: var(--ink);
	}
	.word .fix {
		font-weight: var(--fw-bold);
		color: var(--success);
	}
	.typed {
		font-size: var(--fs-24);
		color: var(--ink-2);
	}
	.typed .bad {
		font-weight: var(--fw-bold);
		color: var(--error);
	}
	.typed .variant {
		font-weight: var(--fw-bold);
		color: var(--ink);
	}
	.why {
		max-width: 44ch;
		font-size: var(--fs-16);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.letter {
		font-family: var(--font-mono);
		font-weight: var(--fw-bold);
		color: var(--ink);
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-16);
		width: 100%;
		margin-top: var(--space-8);
		padding-top: var(--space-16);
		border-top: 1px solid var(--line);
	}
	.rate {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
		margin-left: auto;
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
		.play {
			padding: var(--space-20) var(--space-16) var(--space-24);
		}
		.foot {
			flex-direction: column;
			align-items: stretch;
		}
		.rate {
			align-items: center;
		}
		.actions {
			margin-left: 0;
		}
		.actions .btn {
			flex: 1;
			justify-content: center;
		}
		.tools {
			justify-content: center;
		}
		.volume {
			max-width: none;
		}
	}
	@media (pointer: coarse) {
		.keys {
			display: none;
		}
	}
</style>
