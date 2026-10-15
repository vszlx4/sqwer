<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { kindOf, pressesFor, qwertyAnsi } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import { fingerName, keyName } from '../catalog.ts';
	import { seeded } from '../generate.ts';
	import type { StepResult } from '../types.ts';
	import GameFrame from './GameFrame.svelte';

	/**
	 * Key hunt: one key lights up on the keyboard; press it before its light runs out. The window
	 * shortens as the learner nears the target, so keys are found by touch rather than by sight.
	 */
	let { pool, focus, target, oncomplete }: { pool: string; focus: string; target: number; oncomplete: (r: StepResult) => void } = $props();

	const LIVES = 3;
	const layout = qwertyAnsi(resolvedPlatform());
	const rand = seeded(Date.now() % 100000);
	// New keys appear twice as often as known ones.
	const bag = untrack(() => [...new Set([...pool])].filter((c) => c.trim()).flatMap((c) => (focus.includes(c) ? [c, c] : [c])));

	let current = $state<string | null>(null);
	let hits = $state(0);
	let wrong = $state(0);
	let timeouts = $state(0);
	let lives = $state(LIVES);
	let over = $state<{ won: boolean; text: string } | null>(null);
	let paused = $state(false);
	let flash = $state<{ ok: string | null; error: string | null }>({ ok: null, error: null });
	let windowMs = $state(2600);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let shownAt = 0;
	let remaining = 0;
	onDestroy(() => {
		clearTimeout(timer);
		clearTimeout(flashTimer);
	});

	const presses = $derived(current ? pressesFor(layout, current) : []);
	const main = $derived(presses[presses.length - 1]);
	const highlight = $derived(new Set(presses.map((p) => p.code)));
	const capLabel = $derived(current && /^[a-z]$/.test(current) ? current.toUpperCase() : (current ?? ''));

	function next() {
		let k = bag[Math.floor(rand() * bag.length)]!;
		if (k === current && bag.length > 1) k = bag.find((c) => c !== current)!;
		current = k;
		// From 2.6 seconds down to 1.3 seconds as the goal comes closer.
		windowMs = Math.round(2600 - 1300 * Math.min(1, hits / target));
		arm(windowMs);
	}
	function arm(ms: number) {
		clearTimeout(timer);
		shownAt = performance.now();
		remaining = ms;
		timer = setTimeout(miss, ms);
	}
	function miss() {
		timeouts++;
		lives--;
		blink('error', main?.code ?? null);
		if (lives <= 0) return end();
		next();
	}
	function blink(kind: 'ok' | 'error', code: string | null) {
		clearTimeout(flashTimer);
		flash = { ok: kind === 'ok' ? code : null, error: kind === 'error' ? code : null };
		flashTimer = setTimeout(() => (flash = { ok: null, error: null }), 180);
	}
	function end() {
		clearTimeout(timer);
		const won = hits >= target;
		const text = won ? `${target} keys found${timeouts ? `, ${timeouts} missed` : ' without missing one'}.` : `${hits} of ${target} keys found before the last life was lost.`;
		over = { won, text };
		current = null;
		const presses = hits + wrong + timeouts;
		setTimeout(() => oncomplete({ passed: won, accuracy: presses ? (hits / presses) * 100 : 0, summary: text }), 1100);
	}

	function onkeydown(e: KeyboardEvent) {
		if (!current || over || paused || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key.length !== 1 || e.key === ' ') return;
		e.preventDefault();
		if (e.key === current) {
			hits++;
			blink('ok', main?.code ?? null);
			if (hits >= target) return end();
			next();
		} else {
			wrong++;
			blink('error', pressesFor(layout, e.key).at(-1)?.code ?? null);
		}
	}

	function pause() {
		paused = true;
		clearTimeout(timer);
		remaining = Math.max(400, remaining - (performance.now() - shownAt));
	}
	function resume() {
		paused = false;
		arm(remaining);
	}
</script>

<svelte:window {onkeydown} />

<GameFrame
	title="Key hunt"
	icon="target"
	how="A key lights up on the keyboard. Press it before its light runs out, without looking down. The light gets shorter as you go."
	goal={`Find ${target} keys`}
	progress={hits / target}
	status={`${hits} / ${target} keys`}
	lives={{ left: lives, total: LIVES }}
	{over}
	{paused}
	onstart={next}
	onpause={pause}
	onresume={resume}
	height={380}
>
	<div class="hunt">
		<div class="prompt" aria-live="polite">
			{#if current && main}
				{#key `${current}-${hits + timeouts}`}
					<span class="cap" style:--finger={`var(--f-${kindOf(main.finger)})`} style:--window={`${windowMs}ms`}>
						<span class="char">{capLabel}</span>
						<span class="fuse" class:paused></span>
					</span>
				{/key}
				<span class="finger" style:color={`var(--f-${kindOf(main.finger)})`}>{fingerName(main.finger)}</span>
				<span class="sr-only">Press {keyName(current)}</span>
			{/if}
		</div>
		<div class="board">
			<Keyboard {layout} {highlight} okKey={flash.ok} errorKey={flash.error} label="Keyboard with the key to find highlighted" />
		</div>
	</div>
</GameFrame>

<style>
	.hunt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		padding: 22px 18px 18px;
	}
	.prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-height: 118px;
	}
	.cap {
		position: relative;
		display: grid;
		place-items: center;
		width: 84px;
		height: 84px;
		border-radius: 3px;
		border: 2px solid var(--finger);
		border-bottom-width: 6px;
		background: var(--key);
		overflow: hidden;
		animation: drop-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes drop-in {
		from {
			transform: translateY(-10px) scale(0.9);
			opacity: 0;
		}
	}
	.char {
		font-family: var(--font-mono);
		font-size: 40px;
		font-weight: 600;
		color: var(--ink);
	}
	/* The light that runs out: a bar along the bottom of the key. */
	.fuse {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 5px;
		background: var(--finger);
		transform-origin: left;
		animation: fuse var(--window) linear forwards;
	}
	.fuse.paused {
		animation-play-state: paused;
	}
	@keyframes fuse {
		to {
			transform: scaleX(0);
		}
	}
	.finger {
		font-size: 14px;
		font-weight: 600;
	}
	.finger::first-letter {
		text-transform: uppercase;
	}
	.board {
		width: 100%;
		max-width: 760px;
	}
	@media (prefers-reduced-motion: reduce) {
		.cap {
			animation: none;
		}
	}
</style>
