<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { computeStats, TypingSession } from '@sqwer/engine';
	import { pressesFor, qwertyAnsi, type Finger } from '@sqwer/layouts';
	import Hands from '#lib/hands/Hands.svelte';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import Words from '#lib/test/Words.svelte';
	import type { StepResult } from '../types.ts';

	interface Props {
		tokens: string[];
		/** A timed checkpoint instead of a fixed passage. */
		seconds?: number;
		minAccuracy: number;
		minWpm?: number;
		/** Show the next key and finger. */
		hints?: boolean;
		oncomplete: (r: StepResult) => void;
	}

	let { tokens, seconds, minAccuracy, minWpm = 0, hints = $bindable(true), oncomplete }: Props = $props();

	const layout = qwertyAnsi(resolvedPlatform());
	// Each attempt is a new component with its own session.
	const session = untrack(() => new TypingSession(tokens, seconds ? { kind: 'time', seconds } : { kind: 'words', count: tokens.length }));
	let rev = $state(0);
	let idle = $state(true);
	let now = $state(performance.now());
	let input: HTMLInputElement | undefined = $state();
	let okKey = $state<string | null>(null);
	let errorKey = $state<string | null>(null);
	let frame = 0;
	let flashTimer: ReturnType<typeof setTimeout> | undefined;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let done = false;

	onMount(() => input?.focus({ preventScroll: true }));
	onDestroy(() => {
		cancelAnimationFrame(frame);
		clearTimeout(flashTimer);
		clearTimeout(idleTimer);
	});

	function loop() {
		now = performance.now();
		if (seconds && session.startedAt !== null && now - session.startedAt >= seconds * 1000) {
			session.finish(session.startedAt + seconds * 1000);
			finish();
			return;
		}
		frame = requestAnimationFrame(loop);
	}

	function finish() {
		if (done) return;
		done = true;
		cancelAnimationFrame(frame);
		const stats = computeStats(session);
		const passed = stats.accuracy >= minAccuracy && stats.wpm >= minWpm;
		const parts = [`${Math.round(stats.accuracy)}% accuracy`];
		if (seconds || minWpm) parts.unshift(`${Math.round(stats.wpm)} WPM`);
		oncomplete({ passed, accuracy: stats.accuracy, wpm: stats.wpm, summary: parts.join(' at ') });
	}

	function flash(code: string | undefined, ok: boolean) {
		if (!code) return;
		okKey = ok ? code : null;
		errorKey = ok ? null : code;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => ((okKey = null), (errorKey = null)), 160);
	}

	function typeChar(ch: string, code?: string) {
		if (done) return;
		const at = performance.now();
		const first = !session.started;
		const result = session.type(ch, at, code);
		if (result === 'ignored') {
			if (session.finished) finish();
			return;
		}
		if (first) frame = requestAnimationFrame(loop);
		flash(code ?? layout.chars.get(ch)?.code, result === 'correct');
		changed();
		if (session.finished) finish();
	}

	function changed() {
		idle = false;
		clearTimeout(idleTimer);
		idleTimer = setTimeout(() => (idle = true), 700);
		rev++;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.isComposing || e.metaKey || (e.ctrlKey && e.key !== 'Backspace')) return;
		if (e.key === 'Backspace') {
			e.preventDefault();
			if (session.backspace(performance.now(), e.ctrlKey || e.altKey)) changed();
			return;
		}
		if (e.key.length === 1) {
			e.preventDefault();
			typeChar(e.key, e.code);
		}
	}

	/** Virtual keyboards send beforeinput instead of usable keydown events. */
	function onbeforeinput(e: InputEvent) {
		e.preventDefault();
		if (e.inputType === 'insertText' && e.data) for (const ch of e.data) typeChar(ch);
		else if (e.inputType === 'deleteContentBackward' && session.backspace(performance.now())) changed();
	}

	function onWindowKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		if (target === input || target?.closest('button, a, input, select, textarea')) return;
		if (e.key.length === 1 || e.key === 'Backspace') {
			input?.focus();
			onkeydown(e);
		}
	}

	const progress = $derived.by(() => {
		rev;
		if (seconds) return session.startedAt === null ? 0 : Math.min(1, (now - session.startedAt) / (seconds * 1000));
		return session.wordIndex / tokens.length;
	});
	const wordsDone = $derived.by(() => {
		rev;
		return Math.min(session.wordIndex, tokens.length);
	});
	const remaining = $derived(seconds ? Math.max(0, Math.ceil(seconds - progress * seconds)) : 0);

	// The next key and the finger that presses it, for learners who are still finding keys.
	const next = $derived.by<{ codes: Set<string>; finger: Finger | null }>(() => {
		rev;
		const ch = session.nextChar;
		if (!hints || !ch) return { codes: new Set(), finger: null };
		const presses = pressesFor(layout, ch, session.prevChar);
		return { codes: new Set(presses.map((p) => p.code)), finger: presses[presses.length - 1]?.finger ?? null };
	});
	const handTone = $derived(next.finger ? { [next.finger]: 1 } : {});
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="drill">
	<div class="meter" aria-hidden="true"><span style:width={`${progress * 100}%`}></span></div>
	<div class="status">
		{#if seconds}
			<span class="time"><b>{remaining}</b> s</span>
		{:else}
			<span>{wordsDone} / {tokens.length}</span>
		{/if}
		<span class="goal">Goal: {minWpm ? `${minWpm} WPM, ` : ''}{minAccuracy}% accuracy</span>
		<label class="hint-toggle"><input type="checkbox" bind:checked={hints} /> Show the next key</label>
	</div>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="stage" onclick={() => input?.focus()}>
		<input
			bind:this={input}
			class="capture"
			type="text"
			autocomplete="off"
			autocapitalize="off"
			spellcheck="false"
			aria-label="Typing input. Type the text shown. Press Tab to restart this exercise."
			data-testid="typing-input"
			data-tab-restart
			{onkeydown}
			{onbeforeinput}
		/>
		<Words {session} {rev} {idle} />
	</div>

	{#if hints}
		<div class="guide">
			<div class="hands"><Hands label="The finger for the next key is highlighted" tone={handTone} active={next.finger} /></div>
			<div class="kb"><Keyboard {layout} highlight={next.codes} {okKey} {errorKey} label="Keyboard showing the next key" /></div>
		</div>
	{/if}
</div>

<style>
	.drill {
		display: flex;
		flex-direction: column;
		gap: 18px;
		--typing-size: clamp(22px, 2.6vw, 32px);
		--typing-leading: 1.6;
	}
	.meter {
		height: 4px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 200ms linear;
	}
	.status {
		display: flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
		font-size: 14px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.time b {
		font-size: 22px;
		color: var(--ink);
	}
	.goal {
		font-weight: 600;
	}
	.hint-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-left: auto;
		cursor: pointer;
	}
	.hint-toggle input {
		accent-color: var(--ink);
	}
	.stage {
		position: relative;
		cursor: text;
	}
	.capture {
		position: absolute;
		inset: 0;
		opacity: 0;
		font-size: 16px;
		cursor: text;
	}
	.guide {
		display: grid;
		grid-template-columns: minmax(0, 0.42fr) minmax(0, 1fr);
		gap: 24px;
		align-items: center;
		margin-top: 8px;
	}
	@media (max-width: 760px) {
		.guide {
			grid-template-columns: 1fr;
		}
		.hands {
			width: min(100%, 300px);
			margin: 0 auto;
		}
	}
</style>
