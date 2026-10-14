<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { buildProfile, pickPrompt, predictFinger, type FingerObservation } from '@sqwer/fingermap';
	import { ENGLISH_WORDS, MAPPING_WORDS } from '@sqwer/content';
	import { FINGERS, fingerLabel, kindOf, qwertyAnsi, type Finger } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { resolvedPlatform, settings } from '#lib/settings.svelte.ts';
	import FingerChips from './FingerChips.svelte';
	import { keyName } from './names.ts';
	import { fingerMap } from './store.svelte.ts';
	import { usage } from '#lib/usage/store.svelte.ts';

	const VOCAB = [...ENGLISH_WORDS, ...MAPPING_WORDS, ...MAPPING_WORDS];

	const layout = qwertyAnsi(resolvedPlatform());
	const profile = $derived(buildProfile(fingerMap.observations, layout));

	type Phase = 'type' | 'pick' | 'shift';

	let prompt = $state('');
	let index = $state(0);
	let phase = $state<Phase>('type');
	let tags = $state<(Finger | null)[]>([]);
	let pressedCode = $state<string | null>(null);
	let shiftCode = $state<string | null>(null);
	let letterFinger = $state<Finger | null>(null);
	let added = $state(0);
	let errorKey = $state<string | null>(null);
	let notice = $state('');
	let sawKeyboard = $state(false);

	/** Observations committed for each tagged character of the current prompt (for undo). */
	let history: number[] = [];
	let lastShift: string | null = null;
	let errorTimer: ReturnType<typeof setTimeout> | undefined;

	const target = $derived(prompt[index]);
	const entry = $derived(target !== undefined ? layout.chars.get(target) : undefined);
	const codeAt = (i: number) => (i >= 0 && i < prompt.length ? (layout.chars.get(prompt[i]!)?.code ?? null) : null);

	const suggestion = $derived.by<Finger | null>(() => {
		if (phase === 'pick' && pressedCode) return predictFinger(profile, pressedCode, codeAt(index - 1), codeAt(index + 1)) ?? null;
		if (phase === 'shift' && shiftCode) return profile.keys[shiftCode]?.finger ?? null;
		return null;
	});

	const highlight = $derived.by(() => {
		if (phase === 'pick' && pressedCode) return new Set([pressedCode]);
		if (phase === 'shift' && shiftCode) return new Set([shiftCode]);
		return new Set<string>();
	});

	const coverage = $derived(Math.round((profile.core.mapped / profile.core.total) * 100));

	function newPrompt() {
		prompt = pickPrompt(profile, layout, VOCAB, Math.random, { extended: settings.mapExtended });
		index = 0;
		tags = Array.from({ length: prompt.length }, () => null);
		phase = 'type';
		history = [];
	}

	onMount(() => {
		fingerMap.load().then(newPrompt);
	});

	function flash(code: string) {
		errorKey = code;
		clearTimeout(errorTimer);
		errorTimer = setTimeout(() => (errorKey = null), 260);
	}

	function pick(f: Finger) {
		// Clicking a chip leaves it focused; drop focus so Space keeps typing.
		(document.activeElement as HTMLElement | null)?.blur?.();
		if (phase === 'pick') {
			letterFinger = f;
			if (shiftCode) {
				phase = 'shift';
				return;
			}
			commit(f, null);
		} else if (phase === 'shift' && letterFinger) {
			commit(letterFinger, f);
		}
	}

	function commit(finger: Finger, shiftFinger: Finger | null) {
		if (!pressedCode) return;
		const at = Date.now();
		const list: FingerObservation[] = [
			{ code: pressedCode, prev: codeAt(index - 1), next: codeAt(index + 1), finger, at }
		];
		if (shiftCode && shiftFinger) list.push({ code: shiftCode, prev: null, next: pressedCode, finger: shiftFinger, at });
		fingerMap.add(list);
		usage.mappingEntries(list.length);
		history.push(list.length);
		added += list.length;
		tags[index] = finger;
		index++;
		phase = 'type';
		pressedCode = shiftCode = null;
		letterFinger = null;
		notice = '';
		if (index >= prompt.length) setTimeout(newPrompt, 380);
	}

	function back() {
		if (phase === 'shift') {
			phase = 'pick';
			return;
		}
		if (phase === 'pick') {
			phase = 'type';
			pressedCode = shiftCode = null;
			return;
		}
		const n = history.pop();
		if (!n) return;
		fingerMap.undo(n);
		added -= n;
		index--;
		tags[index] = null;
	}

	function finish() {
		goto(`/map${added ? `?saved=${added}` : ''}`);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		sawKeyboard = true;
		if (e.key === 'Shift') {
			lastShift = e.code;
			return;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			finish();
			return;
		}
		if (e.key === 'Backspace') {
			e.preventDefault();
			back();
			return;
		}
		if (phase === 'type') {
			if (e.key.length !== 1 || !entry) return;
			e.preventDefault();
			if (e.key !== target) {
				flash(e.code);
				notice = `You pressed ${e.key === ' ' ? 'Space' : e.key}. Please type ${target === ' ' ? 'Space' : target}.`;
				return;
			}
			pressedCode = e.code && layout.keys.some((k) => k.code === e.code) ? e.code : entry.code;
			shiftCode = entry.shift ? (lastShift ?? 'ShiftLeft') : null;
			phase = 'pick';
			notice = '';
			return;
		}

		const digit = '1234567890'.indexOf(e.key);
		if (digit >= 0) {
			e.preventDefault();
			pick(FINGERS[digit]!);
		} else if ((e.key === ' ' || e.key === 'Enter') && suggestion) {
			e.preventDefault();
			pick(suggestion);
		}
	}

	const question = $derived.by(() => {
		if (phase === 'pick' && pressedCode) return { lead: 'Which finger pressed', key: keyName(layout, pressedCode) };
		if (phase === 'shift' && shiftCode) return { lead: 'Which finger held', key: keyName(layout, shiftCode) };
		return { lead: 'Type', key: target === undefined ? '' : target === ' ' ? 'Space' : target };
	});
</script>

<svelte:window {onkeydown} />

<div class="session">
	<div class="top">
		<a class="back" href="/map"><Icon name="arrow" size={16} class="flip" /> Finger map</a>
		<div class="progress" aria-label={`Core keys mapped: ${profile.core.mapped} of ${profile.core.total}`}>
			<span class="pct">{coverage}%</span>
			<span class="bar"><span style:width={`${coverage}%`}></span></span>
			<span class="meta">{profile.core.mapped}/{profile.core.total} keys · {added} new {added === 1 ? 'entry' : 'entries'}</span>
		</div>
		<button type="button" class="finish" onclick={finish}>Finish</button>
	</div>

	<div class="prompt" aria-label={`Prompt: ${prompt}`}>
		{#each prompt.split('') as ch, i (i)}
			<span
				class="ch"
				class:done={i < index}
				class:current={i === index}
				class:space={ch === ' '}
				style:--tag={tags[i] ? `var(--f-${kindOf(tags[i]!)})` : 'transparent'}>{ch === ' ' ? '·' : ch}</span
			>
		{/each}
	</div>

	<div class="question" aria-live="polite">
		<h2>
			{question.lead}
			<span class="keycap">{question.key}</span>{phase === 'type' ? '' : '?'}
		</h2>
		<p class="hint">
			{#if phase === 'type'}
				Type the character as you normally would. sqwer will then ask which finger you used.
			{:else}
				Select the finger below, or press <kbd>1</kbd>–<kbd>5</kbd> for the left hand and <kbd>6</kbd>–<kbd>0</kbd> for the right hand.
				{#if suggestion}Press <kbd>Space</kbd> to confirm the <b>{fingerLabel(suggestion).toLowerCase()}</b>.{/if}
			{/if}
		</p>
		{#if notice}<p class="notice" role="alert">{notice}</p>{/if}
	</div>


	<FingerChips disabled={phase === 'type'} suggested={suggestion} onpick={pick} />

	<div class="picker" class:waiting={phase === 'type'}>
		<Keyboard
			{layout}
			{highlight}
			{errorKey}
			label="Keyboard. The key you pressed is highlighted."
		/>
	</div>

	<p class="keys"><kbd>Backspace</kbd> Undo · <kbd>Esc</kbd> Finish</p>

	{#if !sawKeyboard}
		<p class="touch-note">Finger mapping requires a physical keyboard.</p>
	{/if}
	{#if fingerMap.error}<p class="notice" role="alert">{fingerMap.error}</p>{/if}
</div>

<style>
	.session {
		display: flex;
		flex-direction: column;
		gap: 22px;
	}
	.top {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 500;
		color: var(--ink-2);
		text-decoration: none;
	}
	.back:hover {
		color: var(--ink);
	}
	.back :global(.flip) {
		transform: scaleX(-1);
	}
	.progress {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 240px;
	}
	.pct {
		font-size: 22px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.bar {
		flex: 1;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
		max-width: 360px;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		border-radius: 3px;
		transition: width 300ms ease;
	}
	.meta {
		font-size: 13px;
		color: var(--ink-3);
	}
	.finish {
		height: 38px;
		padding: 0 16px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
	}
	.finish:hover {
		background: var(--surface-2);
	}
	.prompt {
		font-family: var(--font-mono);
		font-size: clamp(26px, 3.2vw, 40px);
		line-height: 1.5;
		text-align: center;
		min-height: 1.5em;
		letter-spacing: 0.02em;
	}
	.ch {
		display: inline-block;
		min-width: 0.6em;
		color: var(--untyped);
		border-radius: 3px;
		padding: 0 1px;
		transition: color 100ms ease;
	}
	.ch.space {
		color: transparent;
	}
	.ch.done {
		color: var(--ink);
		background: color-mix(in srgb, var(--tag) 24%, transparent);
	}
	.ch.current {
		color: var(--on-accent);
		background: var(--accent);
	}
	.ch.current.space {
		color: var(--on-accent);
	}
	.question {
		text-align: center;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-height: 92px;
	}
	h2 {
		font-size: 28px;
		font-weight: 400;
		letter-spacing: -0.01em;
	}
	.keycap {
		display: inline-grid;
		place-items: center;
		min-width: 40px;
		height: 40px;
		padding: 0 10px;
		margin: 0 4px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 3px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 20px;
		vertical-align: middle;
	}
	.hint {
		font-size: 15px;
		color: var(--ink-2);
	}
	.notice {
		font-size: 14px;
		color: var(--error);
		font-weight: 500;
		text-align: center;
	}
	.picker {
		max-width: 820px;
		width: 100%;
		margin: 0 auto;
		transition: opacity 150ms ease;
	}
	.picker.waiting {
		opacity: 0.85;
	}
	.keys,
	.touch-note {
		text-align: center;
		font-size: 13px;
		color: var(--ink-3);
	}
	.touch-note {
		display: none;
	}
	@media (pointer: coarse) {
		.touch-note {
			display: block;
		}
	}
	kbd {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 1px 6px;
		border-radius: 3px;
		background: var(--surface);
		border: 1px solid var(--line);
		color: var(--ink-2);
	}
</style>
