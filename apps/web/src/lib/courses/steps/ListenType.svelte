<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { canSpeak, speak, voicesReady } from '../audio.ts';
	import { activityWords, seeded } from '../generate.ts';
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

	// Each attempt is a new component, so the words are chosen once.
	const list = untrack(() => activityWords(pool, focus, words, seeded(Date.now() % 100000)).slice(0, count));
	// Without a voice built into the device, the word is shown briefly and typed from memory instead.
	let speech = $state(canSpeak());

	let phase = $state<'ready' | 'playing' | 'over'>('ready');
	let index = $state(0);
	let value = $state('');
	let showWord = $state(false);
	let feedback = $state<{ ok: boolean; word: string } | null>(null);
	let correct = $state(0);
	let input: HTMLInputElement | undefined = $state();
	let timers: ReturnType<typeof setTimeout>[] = [];
	onDestroy(() => {
		timers.forEach(clearTimeout);
		if (speech) speechSynthesis.cancel();
	});
	onMount(() => {
		// Voices load asynchronously in some browsers; the mode is settled before the exercise starts.
		void voicesReady().then(() => {
			if (phase === 'ready') speech = canSpeak();
		});
	});

	const word = $derived(list[index] ?? '');

	function present() {
		feedback = null;
		value = '';
		if (speech) void speak(word);
		else {
			showWord = true;
			timers.push(setTimeout(() => (showWord = false), 1200));
		}
		requestAnimationFrame(() => input?.focus());
	}

	function begin() {
		phase = 'playing';
		present();
	}

	function submit() {
		const answer = value.trim();
		if (!answer || feedback) return;
		const ok = answer.toLowerCase() === word.toLowerCase();
		if (ok) correct++;
		feedback = { ok, word };
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
				ok ? 650 : 1500
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
					You will hear {list.length} words, one at a time. Type each word, then press <kbd>Enter</kbd>. Press
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
		<div class="card" class:ok={feedback?.ok} class:bad={feedback && !feedback.ok}>
			{#if !speech && showWord}
				<p class="shown">{word}</p>
			{:else if feedback}
				<p class="result" role="status">
					{#if feedback.ok}<Icon name="check" size={22} /> Correct{:else}The word was <b>{feedback.word}</b>{/if}
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
		gap: 16px;
		text-align: center;
	}
	.intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		max-width: 520px;
		color: var(--ink-2);
		line-height: 1.55;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 72px;
		height: 72px;
		border-radius: 3px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.title {
		font-family: var(--font-serif);
		font-size: 34px;
		color: var(--ink);
	}
	kbd {
		padding: 1px 6px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 12px;
	}
	.count {
		font-size: 14px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.card {
		display: grid;
		place-items: center;
		width: min(100%, 460px);
		height: 150px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		transition:
			background-color 200ms ease,
			border-color 200ms ease;
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
		border-radius: 3px;
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
		font-size: 34px;
		font-weight: 600;
	}
	.hidden-word {
		font-size: 28px;
		color: var(--untyped);
	}
	.result {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 20px;
		font-weight: 600;
	}
	.result b {
		font-family: var(--font-mono);
	}
	.answer input {
		width: min(460px, 86vw);
		height: 56px;
		padding: 0 16px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 22px;
		text-align: center;
	}
	.answer input:focus-visible {
		border-color: var(--ink);
	}
	.help {
		font-size: 13px;
		color: var(--ink-2);
	}
	@media (prefers-reduced-motion: reduce) {
		.replay {
			animation: none;
		}
	}
</style>
