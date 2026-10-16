<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { COURSE_WORDS, ENGLISH_WORDS, EXAM_WORDS } from '@sqwer/content';
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
	 * round adds one key. The sequences are real, everyday words made only of the keys taught so
	 * far (two short words when no single word is long enough), so they can be remembered as words
	 * and their finger movements; only pools without letters, such as digits, use random keys.
	 */
	interface Props {
		pool: string;
		start: number;
		target: number;
		/** How long each letter stays lit before it fades, in milliseconds. */
		showMs?: number;
		/** Words to choose from instead of the everyday vocabulary, for example a difficulty tier. */
		words?: readonly string[];
		oncomplete: (r: StepResult) => void;
	}
	let { pool, start, target, showMs = 1100, words, oncomplete }: Props = $props();
	/** How long a letter takes to fade out. */
	const FADE = 350;

	const LIVES = 5;
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
	let fading = $state<number>(-1);
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

	/** Everyday words that use only this step's keys, the most common first. */
	const vocabulary = untrack(() => {
		const allowed = new Set(keys);
		const source = words?.length ? words : [...EXAM_WORDS, ...ENGLISH_WORDS, ...COURSE_WORDS];
		const all = [...new Set(source.map((w) => w.toLowerCase()))];
		return all.filter((w) => w.length >= 2 && /^[a-z]+$/.test(w) && [...w].every((c) => allowed.has(c)));
	});
	const used = new Set<string>();
	const pick = <T,>(list: T[]) => list[Math.floor(rand() * list.length)];

	/** A word of exactly n letters, or two words that together have n letters; null when none exist. */
	function wordOf(n: number): string | null {
		const fresh = (w: string) => !used.has(w);
		const exact = vocabulary.filter((w) => w.length === n);
		const one = pick(exact.filter(fresh)) ?? pick(exact);
		if (one) return one;
		const pairs: string[] = [];
		for (const a of vocabulary) {
			if (a.length >= n - 1) continue;
			for (const b of vocabulary) if (b !== a && a.length + b.length === n) pairs.push(a + b);
			if (pairs.length > 200) break;
		}
		return pick(pairs.filter(fresh)) ?? pick(pairs) ?? null;
	}

	function compose(n: number): string[] {
		const word = vocabulary.length ? wordOf(n) : null;
		if (word) {
			used.add(word);
			return [...word];
		}
		const out: string[] = [];
		for (let i = 0; i < n; i++) {
			let k = keys[Math.floor(rand() * keys.length)]!;
			if (k === out[i - 1] && keys.length > 1) k = keys[(keys.indexOf(k) + 1) % keys.length]!;
			out.push(k);
		}
		return out;
	}

	/**
	 * Shows the sequence one key at a time. Each letter stays lit long enough to be read, then
	 * fades away before the next one appears; nothing stays on screen, so the word is typed from
	 * memory.
	 */
	function play(fresh: boolean) {
		if (fresh) sequence = compose(length);
		mode = 'showing';
		message = 'Watch';
		typed = 0;
		shown = -1;
		fading = -1;
		const step = showMs + FADE + 150;
		const lead = 500;
		sequence.forEach((k, i) => {
			later(() => {
				fading = -1;
				shown = i;
				if (sound) tone(LANE_NOTES[keys.indexOf(k) % LANE_NOTES.length]!);
			}, lead + i * step);
			later(() => {
				shown = -1;
				fading = i;
			}, lead + i * step + showMs);
		});
		later(() => {
			fading = -1;
			mode = 'answering';
			message = 'Your turn';
		}, lead + sequence.length * step);
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
	how={vocabulary.length ? 'The letters of a word light up one at a time, each fading before the next. When the last has faded, type the word from memory. Each correct round makes the word one letter longer.' : 'Keys light up one at a time, each fading before the next. When the last has faded, type them from memory. Each correct round adds one more key.'}
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
				<li class:filled={(mode === 'answering' || mode === 'between') && i < typed} class:lit={mode === 'showing' && i === shown} class:fading={mode === 'showing' && i === fading}>
					{#if (mode === 'showing' && (i === shown || i === fading)) || ((mode === 'answering' || mode === 'between') && i < typed)}{keyName(k).length === 1 ? keyName(k) : k}{/if}
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
	.slots li.fading {
		border-style: solid;
		border-color: var(--line-strong);
		opacity: 0;
		transform: none;
		transition: opacity 350ms ease;
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
