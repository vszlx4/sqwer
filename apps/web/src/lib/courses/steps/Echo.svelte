<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { pressesFor, qwertyAnsi } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import { LANE_NOTES, tone } from '../audio.ts';
	import { keyName } from '../catalog.ts';
	import { seeded } from '../generate.ts';
	import type { StepResult } from '../types.ts';
	import GameFrame from './GameFrame.svelte';

	/**
	 * Echo: keys light up one after another; type the sequence back from memory. Each correct
	 * round adds one key. Remembering a sequence by its finger movements builds the muscle memory
	 * that touch typing depends on.
	 */
	let { pool, start, target, oncomplete }: { pool: string; start: number; target: number; oncomplete: (r: StepResult) => void } = $props();

	const LIVES = 3;
	const layout = qwertyAnsi(resolvedPlatform());
	const rand = seeded(Date.now() % 100000);
	const keys = untrack(() => [...new Set([...pool])].filter((c) => c.trim()));
	let sound = true;
	try {
		sound = localStorage.getItem('sqwer:sound') !== 'off';
	} catch {
		// Storage unavailable: sound stays on.
	}

	let length = $state(untrack(() => start));
	let sequence = $state<string[]>([]);
	let mode = $state<'idle' | 'showing' | 'answering' | 'between'>('idle');
	let shown = $state<number>(-1);
	let typed = $state(0);
	let lives = $state(LIVES);
	let correct = $state(0);
	let presses = $state(0);
	let over = $state<{ won: boolean; text: string } | null>(null);
	let paused = $state(false);
	let message = $state('');
	let flash = $state<{ ok: string | null; error: string | null }>({ ok: null, error: null });
	let timers: ReturnType<typeof setTimeout>[] = [];
	onDestroy(() => timers.forEach(clearTimeout));
	const later = (fn: () => void, ms: number) => timers.push(setTimeout(fn, ms));

	const codeOf = (k: string) => pressesFor(layout, k).at(-1)?.code ?? '';
	const highlight = $derived(mode === 'showing' && shown >= 0 ? new Set([codeOf(sequence[shown]!)]) : new Set<string>());
	const rounds = $derived(target - start + 1);
	const progress = $derived((length - start) / rounds);

	function compose(n: number): string[] {
		const out: string[] = [];
		for (let i = 0; i < n; i++) {
			let k = keys[Math.floor(rand() * keys.length)]!;
			if (k === out[i - 1] && keys.length > 1) k = keys[(keys.indexOf(k) + 1) % keys.length]!;
			out.push(k);
		}
		return out;
	}

	function play(fresh: boolean) {
		if (fresh) sequence = compose(length);
		mode = 'showing';
		message = 'Watch';
		typed = 0;
		// Slightly quicker as sequences grow.
		const on = Math.max(420, 700 - length * 30);
		const off = 180;
		sequence.forEach((k, i) => {
			later(() => {
				shown = i;
				if (sound) tone(LANE_NOTES[keys.indexOf(k) % LANE_NOTES.length]!);
			}, i * (on + off));
			later(() => (shown = -1), i * (on + off) + on);
		});
		later(() => {
			mode = 'answering';
			message = 'Your turn';
		}, sequence.length * (on + off) + 120);
	}

	function blink(kind: 'ok' | 'error', code: string) {
		flash = { ok: kind === 'ok' ? code : null, error: kind === 'error' ? code : null };
		later(() => (flash = { ok: null, error: null }), 200);
	}

	function end(won: boolean) {
		mode = 'idle';
		const text = won ? `Sequences of up to ${target} keys repeated from memory.` : `Reached ${length - 1 >= start ? length - 1 : 0} keys; the goal was ${target}.`;
		over = { won, text };
		later(() => oncomplete({ passed: won, accuracy: presses ? (correct / presses) * 100 : 0, summary: text }), 1100);
	}

	function onkeydown(e: KeyboardEvent) {
		if (mode !== 'answering' || over || paused || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key.length !== 1 || e.key === ' ') return;
		e.preventDefault();
		presses++;
		const expected = sequence[typed]!;
		if (e.key === expected) {
			correct++;
			typed++;
			blink('ok', codeOf(expected));
			if (sound) tone(LANE_NOTES[keys.indexOf(expected) % LANE_NOTES.length]!);
			if (typed === sequence.length) {
				mode = 'between';
				message = 'Correct';
				if (length >= target) return end(true);
				length++;
				later(() => play(true), 750);
			}
		} else {
			blink('error', codeOf(e.key) || codeOf(expected));
			lives--;
			mode = 'between';
			if (lives <= 0) return end(false);
			message = 'Not quite. Watch again';
			later(() => play(false), 1000);
		}
	}

	function pause() {
		paused = true;
		timers.forEach(clearTimeout);
		timers = [];
	}
	function resume() {
		paused = false;
		play(false);
	}
</script>

<svelte:window {onkeydown} />

<GameFrame
	title="Echo"
	icon="repeat"
	how="Keys light up one after another. When they stop, type the same keys in the same order. Each correct round adds one more key."
	goal={`Repeat a sequence of ${target} keys`}
	{progress}
	status={`${Math.min(length, target)} keys`}
	lives={{ left: lives, total: LIVES }}
	{over}
	{paused}
	onstart={() => play(true)}
	onpause={pause}
	onresume={resume}
	height={380}
>
	<div class="echo">
		<p class="message" class:turn={mode === 'answering'} aria-live="polite">{message || ' '}</p>
		<ol class="slots" aria-label={`Sequence of ${sequence.length} keys`}>
			{#each sequence as k, i (i)}
				<li class:filled={mode !== 'showing' && i < typed} class:lit={mode === 'showing' && i === shown}>
					{#if mode === 'showing' && i === shown}{keyName(k).length === 1 ? keyName(k) : k}{:else if i < typed}{keyName(k).length === 1 ? keyName(k) : k}{/if}
				</li>
			{/each}
		</ol>
		<div class="board">
			<Keyboard {layout} {highlight} okKey={flash.ok} errorKey={flash.error} label="Keyboard showing the sequence" />
		</div>
	</div>
</GameFrame>

<style>
	.echo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 22px 18px 18px;
	}
	.message {
		font-family: var(--font-serif);
		font-size: 26px;
		color: var(--ink-2);
		min-height: 1.3em;
		transition: color 200ms ease;
	}
	.message.turn {
		color: var(--ink);
	}
	.slots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		min-height: 48px;
	}
	.slots li {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 3px;
		border: 1px dashed var(--line-strong);
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 600;
		transition:
			background-color 160ms ease,
			transform 160ms ease;
	}
	.slots li.lit {
		border-style: solid;
		border-color: var(--ink);
		background: var(--accent);
		color: var(--on-accent);
		transform: translateY(-3px);
	}
	.slots li.filled {
		border-style: solid;
		border-color: var(--green);
		background: var(--green-soft);
		color: var(--green);
	}
	.board {
		width: 100%;
		max-width: 760px;
	}
</style>
