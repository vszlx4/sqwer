<script lang="ts">
	import { claimTyping, releaseFocus } from '#lib/ui/typing-focus.ts';
	import { onDestroy } from 'svelte';
	import { pressesFor, qwertyAnsi, type Finger } from '@sqwer/layouts';
	import Hands from '#lib/hands/Hands.svelte';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import { fingerName, keyList, keyName } from '../catalog.ts';
	import type { StepResult } from '../types.ts';

	interface Props {
		keys: string[];
		tip: string;
		oncomplete: (r: StepResult) => void;
	}

	let { keys, tip, oncomplete }: Props = $props();

	const layout = qwertyAnsi(resolvedPlatform());
	const REPEATS = 3;

	let index = $state(0);
	let count = $state(0);
	let wrong = $state<string | null>(null);
	let flashOk = $state<string | null>(null);
	let flashError = $state<string | null>(null);
	let finished = $state(false);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let doneTimer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => {
		clearTimeout(flashTimer);
		clearTimeout(doneTimer);
	});

	const current = $derived(keys[index]!);
	/** The physical keys and fingers for the current key; Shift keys are named by their code. */
	const presses = $derived.by<{ code: string; finger: Finger }[]>(() => {
		if (current === 'ShiftLeft') return [{ code: 'ShiftLeft', finger: 'lp' }];
		if (current === 'ShiftRight') return [{ code: 'ShiftRight', finger: 'rp' }];
		return pressesFor(layout, current);
	});
	const main = $derived(presses[presses.length - 1]!);
	/** What is printed on the key cap: the character itself, or "Shift". */
	const capLabel = $derived(current.startsWith('Shift') ? 'Shift' : /^[a-z]$/.test(current) ? current.toUpperCase() : current);
	const highlight = $derived(new Set(presses.map((p) => p.code)));
	const legend = $derived(Object.fromEntries(presses.map((p, i) => [p.finger, { value: i === presses.length - 1 ? keyName(current) : 'Shift', strong: true }])));
	const tone = $derived(Object.fromEntries(presses.map((p) => [p.finger, 1])));
	const instruction = $derived(
		presses.length > 1
			? `Hold Shift with your ${fingerName(presses[0]!.finger)} and press ${keyName(current)} with your ${fingerName(main.finger)}.`
			: `Press ${keyName(current)} with your ${fingerName(main.finger)}.`
	);

	function matches(e: KeyboardEvent) {
		if (current.startsWith('Shift')) return e.code === current;
		return e.key === current;
	}

	// While this is on screen it has the keyboard: clicks never leave focus on a button.
	$effect(() => claimTyping({ focus: releaseFocus }));

	function onkeydown(e: KeyboardEvent) {
		if (finished || e.metaKey || e.ctrlKey || e.altKey) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		// Shift alone is part of a shifted character, not a separate attempt.
		if ((e.key === 'Shift' && !current.startsWith('Shift')) || e.repeat) return;
		e.preventDefault();
		if (matches(e)) {
			wrong = null;
			flashOk = main.code;
			flashError = null;
			count++;
			if (count >= REPEATS) {
				count = 0;
				if (index + 1 < keys.length) index++;
				else {
					finished = true;
					doneTimer = setTimeout(() => oncomplete({ passed: true, accuracy: 100, summary: `You found ${keyList(keys)}.`, graded: false }), 500);
				}
			}
		} else {
			wrong = e.key === ' ' ? 'Space' : e.key.length === 1 ? keyName(e.key) : e.key;
			flashError = e.code;
			flashOk = null;
		}
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => ((flashOk = null), (flashError = null)), 220);
	}
</script>

<svelte:window {onkeydown} />

<div class="intro">
	<p class="tip">{tip}</p>

	<div class="prompt" aria-live="polite">
		<span class="cap" class:done={finished}>{capLabel}</span>
		<div>
			<p class="instruction">{finished ? 'Well placed. Moving on.' : instruction}</p>
			<p class="dots" aria-label={`${count} of ${REPEATS} presses`}>
				{#each Array.from({ length: REPEATS }) as _, i (i)}<span class:on={i < count || finished}></span>{/each}
				<span class="which">Key {index + 1} of {keys.length}</span>
			</p>
			{#if wrong}<p class="wrong" role="alert">That was {wrong}. Find {keyName(current)} with your {fingerName(main.finger)}.</p>{/if}
		</div>
	</div>

	<div class="hands">
		<Hands label={instruction} {tone} active={main.finger} {legend} legendSize={14} />
	</div>
	<div class="kb">
		<Keyboard {layout} {highlight} okKey={flashOk} errorKey={flashError} label={`Keyboard with ${keyName(current)} highlighted`} />
	</div>
</div>

<style>
	.intro {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 22px;
	}
	.tip {
		max-width: 620px;
		text-align: center;
		font-size: 17px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.prompt {
		display: flex;
		align-items: center;
		gap: 18px;
		min-height: 88px;
	}
	.cap {
		display: grid;
		place-items: center;
		min-width: 72px;
		height: 72px;
		padding: 0 14px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 4px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 30px;
		font-weight: 600;
		animation: bob 1.6s ease-in-out infinite;
	}
	.cap.done {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
		animation: none;
	}
	@keyframes bob {
		50% {
			transform: translateY(-4px);
		}
	}
	.instruction {
		font-size: 19px;
		font-weight: 600;
	}
	.dots {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.dots span:not(.which) {
		width: 22px;
		height: 6px;
		border-radius: 3px;
		background: var(--surface-2);
		transition: background-color 160ms ease;
	}
	.dots span.on {
		background: var(--accent);
	}
	.which {
		margin-left: 8px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.wrong {
		margin-top: 8px;
		font-size: 14.5px;
		color: var(--error);
		font-weight: 600;
	}
	.hands {
		width: min(100%, 360px);
	}
	.kb {
		width: min(100%, 760px);
	}
	@media (prefers-reduced-motion: reduce) {
		.cap {
			animation: none;
		}
	}
</style>
