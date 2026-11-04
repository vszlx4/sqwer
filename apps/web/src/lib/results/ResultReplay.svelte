<script lang="ts">
	import { onDestroy } from 'svelte';
	import { qwertyAnsi } from '@sqwer/layouts';
	import Keyboard from '#lib/keyboard/Keyboard.svelte';
	import { resolvedPlatform } from '#lib/settings.svelte.ts';
	import Words from '#lib/test/Words.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { sessionAt } from './detail.ts';
	import type { ResultDetail } from './types.ts';

	let { detail, seconds }: { detail: ResultDetail; seconds: number } = $props();

	const layout = qwertyAnsi(resolvedPlatform());
	const total = $derived(Math.max(seconds * 1000, detail.replay[detail.replay.length - 1]?.[0] ?? 0));

	let t = $state(0);
	let playing = $state(false);
	let speed = $state(1);
	let frame = 0;
	let last = 0;

	const session = $derived(sessionAt(detail, t));
	const rev = $derived(Math.round(t));

	/** The keystroke shown on the keyboard: the latest one within 150 ms. */
	const flash = $derived.by(() => {
		if (t <= 0) return { ok: null, error: null };
		const recent = session.keystrokes.filter((k) => k.kind === 'insert' && t - k.t < 150);
		const k = recent[recent.length - 1];
		if (!k) return { ok: null, error: null };
		const code = layout.chars.get(k.char!)?.code ?? null;
		return k.correct ? { ok: code, error: null } : { ok: null, error: code };
	});

	function step(now: number) {
		if (!playing) return;
		t = Math.min(total, t + (now - last) * speed);
		last = now;
		if (t >= total) {
			playing = false;
			return;
		}
		frame = requestAnimationFrame(step);
	}

	function play() {
		if (t >= total) t = 0;
		playing = true;
		last = performance.now();
		frame = requestAnimationFrame(step);
	}

	function pause() {
		playing = false;
		cancelAnimationFrame(frame);
	}

	onDestroy(() => cancelAnimationFrame(frame));

	const fmt = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
</script>

<div class="replay">
	<div class="controls">
		<button type="button" class="btn" onclick={() => (playing ? pause() : play())} aria-label={playing ? 'Pause the replay' : 'Play the replay'}>
			<Icon name={playing ? 'pause' : 'play'} size={16} />
			{playing ? 'Pause' : t > 0 && t < total ? 'Resume' : 'Play'}
		</button>
		<button
			type="button"
			class="btn"
			onclick={() => {
				pause();
				t = 0;
			}}
			aria-label="Return to the start">Restart</button
		>
		<div class="speed" role="radiogroup" aria-label="Replay speed">
			{#each [1, 2, 4] as s (s)}
				<button type="button" role="radio" aria-checked={speed === s} onclick={() => (speed = s)}>{s}×</button>
			{/each}
		</div>
		<label class="scrub">
			<span class="sr-only">Replay position</span>
			<input
				type="range"
				min="0"
				max={Math.round(total)}
				step="10"
				value={Math.round(t)}
				oninput={(e) => {
					pause();
					t = Number((e.currentTarget as HTMLInputElement).value);
				}}
			/>
		</label>
		<span class="time">{fmt(t)} / {fmt(total)}</span>
	</div>

	<div class="stage">
		<Words {session} {rev} idle={!playing} />
	</div>
	<div class="kb">
		<Keyboard {layout} okKey={flash.ok} errorKey={flash.error} label="Keyboard showing each key as it was pressed in the replay" />
	</div>
</div>

<style>
	.replay {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		--typing-size: clamp(18px, 2vw, 24px);
		--typing-leading: 1.6;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		flex-wrap: wrap;
	}
	.speed {
		display: inline-flex;
		padding: var(--space-4);
		gap: var(--space-2);
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	.speed button {
		padding: var(--space-6) var(--space-10);
		border-radius: 3px;
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		cursor: pointer;
	}
	.speed button[aria-checked='true'] {
		background: var(--ink);
		color: var(--bg);
	}
	.scrub {
		flex: 1;
		min-width: 160px;
	}
	.scrub input {
		width: 100%;
		accent-color: var(--ink);
	}
	.time {
		font-family: var(--font-mono);
		font-size: var(--fs-14);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.kb {
		max-width: var(--w-text);
	}
</style>
