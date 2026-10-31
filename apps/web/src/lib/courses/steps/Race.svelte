<script lang="ts">
	import { claimTyping, releaseFocus } from '#lib/ui/typing-focus.ts';
	import { onDestroy, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';
	import GameFrame from './GameFrame.svelte';

	/** Race against a pacer to the end of the passage. Wrong keys don't advance. */
	interface Props {
		pool: string;
		focus: string;
		words?: readonly string[];
		sentences?: readonly string[];
		count: number;
		pacerWpm: number;
		oncomplete: (r: StepResult) => void;
	}
	let { pool, focus, words, sentences, count, pacerWpm, oncomplete }: Props = $props();

	/** The passage: whole sentences in order when given, otherwise words chosen for the lesson. */
	const text = untrack(() => {
		const rand = seeded(Date.now() % 100000);
		if (sentences?.length) {
			const picked: string[] = [];
			for (const sentence of shuffle(sentences, rand)) {
				picked.push(sentence);
				if (picked.join(' ').split(' ').length >= count) break;
			}
			return picked.join(' ');
		}
		return activityWords(pool, focus, words, rand).slice(0, count).join(' ');
	});
	/** Time to read the passage before the count-in: about half a second a word, from 5 to 12 seconds. */
	const previewSeconds = untrack(() => Math.min(12, Math.max(5, Math.round(text.split(' ').length * 0.5))));
	// Characters per millisecond, using the standard five characters per word.
	const pacerRate = untrack(() => (pacerWpm * 5) / 60000);

	let position = $state(0);
	let errors = $state(0);
	let missFlash = $state(false);
	let pacer = $state(0);
	let liveWpm = $state(0);
	let over = $state<{ won: boolean; text: string } | null>(null);
	let paused = $state(false);
	let running = false;
	let startedAt = 0;
	let pausedFor = 0;
	let pauseStart = 0;
	let frame = 0;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => {
		cancelAnimationFrame(frame);
		clearTimeout(flashTimer);
	});

	const you = $derived(position / text.length);

	function start() {
		running = true;
		startedAt = performance.now();
		frame = requestAnimationFrame(tick);
	}
	function tick(t: number) {
		if (!running) return;
		const ms = t - startedAt - pausedFor;
		pacer = Math.min(1, (ms * pacerRate) / text.length);
		liveWpm = ms > 1500 ? position / 5 / (ms / 60000) : 0;
		// The pacer reaching the line first ends the race at once.
		if (pacer >= 1) return finish();
		frame = requestAnimationFrame(tick);
	}

	function finish() {
		if (over) return;
		running = false;
		cancelAnimationFrame(frame);
		const ms = performance.now() - startedAt - pausedFor;
		const won = position >= text.length && pacer < 1;
		const wpm = position / 5 / (ms / 60000);
		const accuracy = position + errors ? (position / (position + errors)) * 100 : 0;
		const summary = won
			? `Finished first at ${Math.round(wpm)} WPM, ahead of the ${pacerWpm} WPM pacer.`
			: `The ${pacerWpm} WPM pacer reached the line first, with ${Math.round((1 - position / text.length) * 100)}% of the passage left. Your speed: ${Math.round(wpm)} WPM.`;
		over = { won, text: summary };
		setTimeout(() => oncomplete({ passed: won, accuracy, wpm, summary }), 1200);
	}

	// While this is on screen it has the keyboard: clicks never leave focus on a button.
	$effect(() => claimTyping({ focus: releaseFocus }));

	function onkeydown(e: KeyboardEvent) {
		if (!running || paused || over || e.metaKey || e.ctrlKey || e.altKey) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key.length !== 1) return;
		e.preventDefault();
		if (e.key === text[position]) {
			position++;
			if (position >= text.length) finish();
		} else {
			errors++;
			missFlash = true;
			clearTimeout(flashTimer);
			flashTimer = setTimeout(() => (missFlash = false), 160);
		}
	}

	function pause() {
		paused = true;
		running = false;
		pauseStart = performance.now();
		cancelAnimationFrame(frame);
	}
	function resume() {
		paused = false;
		pausedFor += performance.now() - pauseStart;
		running = true;
		frame = requestAnimationFrame(tick);
	}
</script>

<svelte:window {onkeydown} />

<GameFrame
	title="Race"
	icon="flag"
	how={`Type the passage before the pacer, who types at ${pacerWpm} words per minute. A wrong key holds you in place, so stay accurate.`}
	goal="Reach the finish line first"
	progress={you}
	status={liveWpm ? `${Math.round(liveWpm)} WPM` : `${Math.round(you * 100)}%`}
	{over}
	{paused}
	onstart={start}
	onpause={pause}
	onresume={resume}
	height={240}
	preview={previewSeconds}
	previewLabel="Read the passage"
>
	<div class="race">
		<div class="track" aria-hidden="true">
			<div class="lane">
				<span class="name">You</span>
				<div class="road">
					<span class="trail you" style:width={`${you * 100}%`}></span>
					<span class="runner you" style:left={`${you * 100}%`}><Icon name="keyboard" size={16} /></span>
					<span class="finish"></span>
				</div>
			</div>
			<div class="lane">
				<span class="name">Pacer <small>{pacerWpm} WPM</small></span>
				<div class="road">
					<span class="trail pacer" style:width={`${pacer * 100}%`}></span>
					<span class="runner pacer" style:left={`${pacer * 100}%`}><Icon name="gauge" size={16} /></span>
					<span class="finish"></span>
				</div>
			</div>
		</div>
		<p class="passage" class:miss={missFlash} aria-label="Passage to type">
			<span class="done">{text.slice(0, position)}</span><span class="caret" aria-hidden="true"></span><span class="current">{text[position] ?? ''}</span><span class="todo">{text.slice(position + 1)}</span>
		</p>
	</div>
</GameFrame>

<style>
	.race {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 24px 22px;
	}
	.track {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.lane {
		display: grid;
		grid-template-columns: 130px 1fr;
		align-items: center;
		gap: 12px;
	}
	.name {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.road {
		position: relative;
		height: 38px;
		border-radius: 3px;
		overflow: visible;
		background:
			repeating-linear-gradient(90deg, transparent 0 26px, color-mix(in srgb, var(--ink) 9%, transparent) 26px 38px) center / calc(100% - 22px) 2px no-repeat,
			var(--surface-2);
	}
	/* A checkered finish line at the right end of each lane. */
	.finish {
		position: absolute;
		top: 0;
		right: 0;
		width: 12px;
		height: 100%;
		background: conic-gradient(var(--ink) 25%, var(--bg) 0 50%, var(--ink) 0 75%, var(--bg) 0) 0 0 / 6px 6px;
		border-radius: 0 3px 3px 0;
	}
	.trail {
		position: absolute;
		left: 0;
		top: 50%;
		height: 4px;
		margin-top: -2px;
		border-radius: 3px;
		transition: width 120ms linear;
	}
	.trail.you {
		background: linear-gradient(90deg, transparent, var(--accent));
	}
	.trail.pacer {
		background: linear-gradient(90deg, transparent, var(--rank));
	}
	.runner {
		position: absolute;
		top: 4px;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		margin-left: -15px;
		border-radius: 3px;
		transition: left 120ms linear;
		box-shadow: var(--shadow);
	}
	.runner.you {
		background: var(--accent);
		color: var(--on-accent);
		box-shadow: 0 0 0 2px var(--ink);
	}
	.runner.pacer {
		background: var(--violet);
		color: var(--on-hue);
	}
	.name small {
		display: block;
		font-weight: 500;
		color: var(--ink-3);
	}
	.passage {
		font-family: var(--font-mono);
		font-size: 22px;
		line-height: 1.7;
		word-break: break-word;
	}
	.done {
		color: var(--ink);
	}
	.current {
		color: var(--ink);
		font-weight: 700;
	}
	.todo {
		color: var(--untyped);
	}
	/* A caret before the next character; red for a moment after a wrong key. */
	.caret {
		display: inline-block;
		width: 2px;
		height: 1.1em;
		margin-right: -2px;
		vertical-align: -0.18em;
		background: var(--accent);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink) 25%, transparent);
		animation: blink 1s steps(1) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0.3;
		}
	}
	.passage.miss .caret {
		background: var(--error);
		animation: none;
	}
	.passage.miss .current {
		color: var(--error);
	}
	@media (max-width: 560px) {
		.lane {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
