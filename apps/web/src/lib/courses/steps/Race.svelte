<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { activityWords, seeded } from '../generate.ts';
	import type { StepResult } from '../types.ts';
	import GameFrame from './GameFrame.svelte';

	/**
	 * Race: type a short passage while a pacer types it at a set speed. The finish line is the end
	 * of the passage; reach it before the pacer. A wrong key does not move you forward, so
	 * accuracy is part of the speed.
	 */
	interface Props {
		pool: string;
		focus: string;
		words?: readonly string[];
		count: number;
		pacerWpm: number;
		oncomplete: (r: StepResult) => void;
	}
	let { pool, focus, words, count, pacerWpm, oncomplete }: Props = $props();

	const text = untrack(() => activityWords(pool, focus, words, seeded(Date.now() % 100000)).slice(0, count).join(' '));
	// Characters per millisecond, using the standard five characters per word.
	const pacerRate = untrack(() => (pacerWpm * 5) / 60000);

	let position = $state(0);
	let errors = $state(0);
	let missFlash = $state(false);
	let pacer = $state(0);
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
		pacer = Math.min(1, ((t - startedAt - pausedFor) * pacerRate) / text.length);
		frame = requestAnimationFrame(tick);
	}

	function finish() {
		running = false;
		cancelAnimationFrame(frame);
		const ms = performance.now() - startedAt - pausedFor;
		const wpm = (text.length / 5) / (ms / 60000);
		const won = pacer < 1;
		const accuracy = (text.length / (text.length + errors)) * 100;
		const summary = won
			? `Finished first at ${Math.round(wpm)} WPM, ahead of the ${pacerWpm} WPM pacer.`
			: `Finished at ${Math.round(wpm)} WPM; the pacer at ${pacerWpm} WPM got there first.`;
		over = { won, text: summary };
		setTimeout(() => oncomplete({ passed: won, accuracy, wpm, summary }), 1200);
	}

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
	status={`${Math.round(you * 100)}%`}
	{over}
	{paused}
	onstart={start}
	onpause={pause}
	onresume={resume}
	height={300}
>
	<div class="race">
		<div class="track" aria-hidden="true">
			<div class="lane">
				<span class="name">You</span>
				<div class="road"><span class="runner you" style:left={`${you * 100}%`}><Icon name="keyboard" size={16} /></span></div>
			</div>
			<div class="lane">
				<span class="name">Pacer · {pacerWpm} WPM</span>
				<div class="road"><span class="runner pacer" style:left={`${pacer * 100}%`}><Icon name="gauge" size={16} /></span></div>
			</div>
		</div>
		<p class="passage" class:miss={missFlash} aria-label="Passage to type">
			<span class="done">{text.slice(0, position)}</span><span class="cursor">{text[position] === ' ' ? '␣' : (text[position] ?? '')}</span><span class="todo">{text.slice(position + 1)}</span>
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
		height: 34px;
		border-radius: 3px;
		background:
			repeating-linear-gradient(90deg, transparent 0 22px, color-mix(in srgb, var(--ink) 10%, transparent) 22px 34px) center / 100% 2px no-repeat,
			var(--surface-2);
		/* The finish line. */
		box-shadow: inset -4px 0 0 var(--ink);
	}
	.runner {
		position: absolute;
		top: 3px;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-left: -14px;
		border-radius: 3px;
		transition: left 120ms linear;
	}
	.runner.you {
		background: var(--accent);
		color: var(--on-accent);
		box-shadow: 0 0 0 2px var(--ink);
	}
	.runner.pacer {
		background: var(--violet);
		color: #fff;
	}
	.passage {
		font-family: var(--font-mono);
		font-size: 22px;
		line-height: 1.6;
		word-break: break-word;
		transition: transform 120ms ease;
	}
	.passage.miss .cursor {
		background: var(--error);
		color: #fff;
	}
	.done {
		color: var(--ink);
	}
	.cursor {
		border-radius: 2px;
		background: var(--accent);
		color: var(--on-accent);
	}
	.todo {
		color: var(--untyped);
	}
	@media (max-width: 560px) {
		.lane {
			grid-template-columns: 1fr;
			gap: 4px;
		}
	}
</style>
