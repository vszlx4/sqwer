<script lang="ts">
	import { claimTyping } from '#lib/ui/typing-focus.ts';
	import { onDestroy, onMount, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { canSpeak, speak, stopSpeaking, voicesReady } from '../audio.ts';
	import { voice } from '../voice/voice.svelte.ts';
	import { COURSE_WORDS, matchHeard, type HeardMatch } from '@sqwer/content';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

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

	let phase = $state<'ready' | 'playing' | 'over'>('ready');
	let index = $state(0);
	let value = $state('');
	let showWord = $state(false);
	let feedback = $state<{ match: HeardMatch; word: string } | null>(null);
	let correct = $state(0);
	let input: HTMLInputElement | undefined = $state();
	let timers: ReturnType<typeof setTimeout>[] = [];
	onDestroy(() => {
		timers.forEach(clearTimeout);
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

	const word = $derived(list[index] ?? '');

	function present() {
		feedback = null;
		value = '';
		if (speech) void speak(word).then((spoken) => !spoken && flash());
		else flash();
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

	function submit() {
		const answer = value.trim();
		if (!answer || feedback) return;
		const match = matchHeard(word, answer);
		const ok = match.ok;
		if (ok) correct++;
		feedback = { match, word };
		timers.push(
			setTimeout(
				() => {
					if (index + 1 < list.length) {
						index++;
						present();
					} else {
						phase = 'over';
						const accuracy = (correct / list.length) * 100;
						timers.push(
							setTimeout(
								() => oncomplete({ passed: correct >= target, accuracy, summary: `${correct} of ${list.length} words typed correctly. Goal: ${target}.` }),
								700
							)
						);
					}
				},
				match.ok && match.how === 'exact' ? 650 : 1500
			)
		);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (!value.trim()) present();
			else submit();
		}
	}

	$effect(() =>
		claimTyping({
			focus: () => {
				if (phase !== 'ready') input?.focus({ preventScroll: true });
			},
			key: (e) => {
				if (phase === 'ready') {
					if (e.key === ' ') begin();
					return;
				}
				if (!input || input.disabled) return;
				input.focus({ preventScroll: true });
				if (e.key === ' ') onkeydown(e);
				else if (e.key === 'Backspace') value = value.slice(0, -1);
				else value += e.key;
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
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="listen">
	{#if phase === 'ready'}
		<div class="intro">
			<span class="icon" aria-hidden="true"><Icon name="volume" size={34} /></span>
			<p class="title">{speech ? 'Listen and type' : 'Look and type'}</p>
			<p>
				{#if speech}
					You will hear {list.length} words, one at a time. Words that sound the same and British spellings count. Type each word, then press <kbd>Enter</kbd>. Press
					<kbd>Enter</kbd> with an empty answer to hear the word again.
				{:else}
					No voice is built into this device, so each word is shown for a moment instead. Type it from memory, then press
					<kbd>Enter</kbd>.
				{/if}
			</p>
			<p>Type <b>{target}</b> of {list.length} correctly to pass. Turn your sound on.</p>
			<button type="button" class="btn btn-primary" onclick={begin}>Start <kbd>Space</kbd></button>
		</div>
	{:else}
		<p class="count">Word {Math.min(index + 1, list.length)} of {list.length} · {correct} correct</p>
		<div class="card" class:ok={feedback?.match.ok} class:bad={feedback && !feedback.match.ok}>
			{#if showWord}
				<p class="shown">{word}</p>
			{:else if feedback}
				<p class="result" role="status">
					{#if feedback.match.ok}
						<Icon name="check" size={22} /> Correct
						{#if feedback.match.how === 'spelling'}<span class="also">· also spelled <b>{feedback.word}</b></span>
						{:else if feedback.match.how === 'sound'}<span class="also">· sounds like <b>{feedback.word}</b></span>{/if}
					{:else}The word was <b>{feedback.word}</b>{/if}
				</p>
			{:else if speech}
				<button type="button" class="replay" onclick={() => speak(word)} aria-label="Hear the word again">
					<Icon name="volume" size={28} />
				</button>
			{:else}
				<p class="hidden-word" aria-hidden="true">· · ·</p>
			{/if}
		</div>
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
				placeholder="Type what you hear…"
				data-testid="listen-input"
				data-tab-restart
			/>
		</label>
		<p class="help">Press <kbd>Enter</kbd> to check your answer. With an empty answer, <kbd>Enter</kbd> plays the word again.</p>
	{/if}
</div>

<style>
	.listen {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-16);
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
	.icon {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
	}
	.title {
		font-family: var(--font-serif);
		font-size: var(--fs-32);
		color: var(--ink);
	}
	kbd {
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: var(--fs-12);
	}
	.count {
		font-size: var(--fs-14);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.card {
		display: grid;
		place-items: center;
		width: min(100%, var(--w-form));
		height: 150px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		transition:
			background-color var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out);
	}
	.card.ok {
		border-color: var(--ink);
		background: color-mix(in srgb, var(--accent) 35%, var(--surface));
	}
	.card.bad {
		border-color: var(--error);
		background: var(--error-soft);
	}
	.replay {
		display: grid;
		place-items: center;
		width: 76px;
		height: 76px;
		border-radius: var(--radius);
		border: 0;
		background: var(--ink);
		color: var(--bg);
		cursor: pointer;
		animation: breathe 2s ease-in-out infinite;
	}
	@keyframes breathe {
		50% {
			transform: scale(1.06);
		}
	}
	.shown {
		font-family: var(--font-mono);
		font-size: var(--fs-32);
		font-weight: var(--fw-semibold);
	}
	.hidden-word {
		font-size: var(--fs-28);
		color: var(--untyped);
	}
	.result {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-20);
		font-weight: var(--fw-semibold);
	}
	.result b {
		font-family: var(--font-mono);
	}
	.also {
		font-size: var(--fs-15);
		font-weight: var(--fw-regular);
		color: var(--ink-2);
	}
	.answer input {
		width: min(var(--w-form), 86vw);
		height: 56px;
		padding: 0 var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: var(--fs-24);
		text-align: center;
	}
	.answer input:focus-visible {
		border-color: var(--ink);
	}
	.help {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	@media (prefers-reduced-motion: reduce) {
		.replay {
			animation: none;
		}
	}
</style>
