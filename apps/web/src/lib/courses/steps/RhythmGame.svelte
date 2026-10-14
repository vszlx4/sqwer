<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { LANE_NOTES, tick, tone } from '../audio.ts';
	import { keyName } from '../catalog.ts';
	import { seeded } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	interface Props {
		keys: string[];
		bpm: number;
		notes: number;
		oncomplete: (r: StepResult) => void;
	}

	let { keys, bpm, notes, oncomplete }: Props = $props();

	interface Note {
		id: number;
		lane: number;
		at: number;
		judged: 'perfect' | 'good' | 'miss' | null;
	}
	interface Mark {
		id: number;
		lane: number;
		text: string;
	}

	const BEAT = untrack(() => 60000 / bpm);
	const LEAD = Math.max(1400, BEAT * 3);
	const PERFECT = 70;
	const GOOD = 160;
	const HEIGHT = 380;
	const HIT_Y = HEIGHT - 70;
	const COUNT_IN = 4;
	const SOUND_KEY = 'sqwer:sound';
	const rand = seeded(Date.now() % 100000);

	/** One note per beat, with occasional rests, never more than twice in a row on one lane. */
	function compose(): { id: number; lane: number; beat: number }[] {
		const out: { id: number; lane: number; beat: number }[] = [];
		let beat = 0;
		for (let i = 0; i < notes; i++) {
			if (i > 2 && rand() < 0.15) beat++;
			let lane = Math.floor(rand() * keys.length);
			const prev = out.slice(-2);
			if (prev.length === 2 && prev.every((n) => n.lane === lane)) lane = (lane + 1) % keys.length;
			out.push({ id: i, lane, beat });
			beat++;
		}
		return out;
	}
	const score = compose();

	let phase = $state<'ready' | 'playing' | 'over'>('ready');
	let now = $state(0);
	let start = 0;
	let track = $state<Note[]>([]);
	let marks = $state<Mark[]>([]);
	let lit = $state<number | null>(null);
	let stray = $state(0);
	let sound = $state(true);
	let frame = 0;
	let markId = 0;
	let lastTick = -1;
	let timers: ReturnType<typeof setTimeout>[] = [];
	try {
		sound = localStorage.getItem(SOUND_KEY) !== 'off';
	} catch {
		// Storage unavailable: sound stays on.
	}
	onDestroy(() => {
		cancelAnimationFrame(frame);
		timers.forEach(clearTimeout);
	});

	const perfect = $derived(track.filter((n) => n.judged === 'perfect').length);
	const good = $derived(track.filter((n) => n.judged === 'good').length);
	const missed = $derived(track.filter((n) => n.judged === 'miss').length);

	function toggleSound() {
		sound = !sound;
		try {
			localStorage.setItem(SOUND_KEY, sound ? 'on' : 'off');
		} catch {
			// Storage unavailable.
		}
	}

	function begin() {
		phase = 'playing';
		start = performance.now() + 400;
		track = score.map((n) => ({ id: n.id, lane: n.lane, judged: null, at: start + (COUNT_IN + n.beat) * BEAT }));
		frame = requestAnimationFrame(loop);
	}

	function mark(lane: number, text: string) {
		const m = { id: markId++, lane, text };
		marks = [...marks, m];
		timers.push(setTimeout(() => (marks = marks.filter((x) => x !== m)), 520));
	}

	function loop(t: number) {
		now = t;
		// Count-in clicks on the first four beats.
		const beat = Math.floor((t - start) / BEAT);
		if (beat >= 0 && beat < COUNT_IN && beat !== lastTick) {
			lastTick = beat;
			if (sound) tick(beat === 0);
		}
		let changed = false;
		const next = track.map((n) => {
			if (!n.judged && t - n.at > GOOD) {
				changed = true;
				mark(n.lane, 'Miss');
				return { ...n, judged: 'miss' as const };
			}
			return n;
		});
		if (changed) track = next;
		const last = track[track.length - 1]!;
		if (t > last.at + GOOD + 500) return end();
		frame = requestAnimationFrame(loop);
	}

	function end() {
		phase = 'over';
		cancelAnimationFrame(frame);
		const hitRate = ((perfect + good) / notes) * 100;
		const accuracy = ((perfect + good * 0.8) / notes) * 100;
		const summary = `${perfect + good} of ${notes} notes on the beat (${perfect} perfect).`;
		timers.push(setTimeout(() => oncomplete({ passed: hitRate >= 70, accuracy, summary }), 900));
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (phase === 'ready') {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				begin();
			}
			return;
		}
		if (phase !== 'playing') return;
		const lane = keys.indexOf(e.key.toLowerCase());
		if (lane === -1) return;
		e.preventDefault();
		lit = lane;
		timers.push(setTimeout(() => lit === lane && (lit = null), 120));
		const t = performance.now();
		const candidate = track
			.filter((n) => n.lane === lane && !n.judged && Math.abs(n.at - t) <= GOOD)
			.sort((a, b) => Math.abs(a.at - t) - Math.abs(b.at - t))[0];
		if (!candidate) {
			stray++;
			mark(lane, 'Off beat');
			return;
		}
		const judged = Math.abs(candidate.at - t) <= PERFECT ? 'perfect' : 'good';
		track = track.map((n) => (n === candidate ? { ...n, judged } : n));
		mark(lane, judged === 'perfect' ? 'Perfect' : 'Good');
		if (sound) tone(LANE_NOTES[lane % LANE_NOTES.length]!);
	}

	const yOf = (n: Note) => HIT_Y - ((n.at - now) / LEAD) * HIT_Y;
</script>

<svelte:window {onkeydown} />

<div class="rhythm">
	<div class="hud">
		<span><b>{perfect + good}</b> / {notes} on the beat</span>
		<button type="button" class="sound" onclick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
			<Icon name={sound ? 'volume' : 'mute'} size={15} /> Sound {sound ? 'on' : 'off'}
		</button>
	</div>

	<div class="stage" style:height={`${HEIGHT}px`} style:--lanes={keys.length}>
		{#each keys as k, lane (k)}
			<div class="lane" class:lit={lit === lane} style:--hue={(lane * 360) / keys.length}>
				{#each track.filter((n) => n.lane === lane && n.judged !== 'perfect' && n.judged !== 'good') as n (n.id)}
					{@const y = yOf(n)}
					{#if y > -40 && y < HEIGHT}
						<span class="note" class:missed={n.judged === 'miss'} style:transform={`translateY(${y - 14}px)`}></span>
					{/if}
				{/each}
				{#each marks.filter((m) => m.lane === lane) as m (m.id)}
					<span class="mark" class:bad={m.text === 'Miss' || m.text === 'Off beat'}>{m.text}</span>
				{/each}
				<span class="key" style:top={`${HIT_Y + 18}px`}>{keyName(k).length === 1 ? keyName(k) : k}</span>
			</div>
		{/each}
		<div class="line" style:top={`${HIT_Y}px`}></div>

		{#if phase === 'ready'}
			<div class="overlay">
				<p class="title">Rhythm keys</p>
				<p>Press each key as its note reaches the line. Four clicks count you in.</p>
				<p>Hit <b>{Math.ceil(notes * 0.7)}</b> of {notes} notes to pass.</p>
				<button type="button" class="btn btn-primary" onclick={begin}>Start <kbd>Space</kbd></button>
			</div>
		{:else if phase === 'over'}
			<div class="overlay" aria-live="polite">
				<p class="title">{(perfect + good) / notes >= 0.7 ? 'In time!' : 'Try once more'}</p>
				<p>{perfect} perfect · {good} good · {missed} missed{stray ? ` · ${stray} off beat` : ''}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.rhythm {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 14.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.hud b {
		font-size: 20px;
		color: var(--ink);
	}
	.sound {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
	}
	.stage {
		position: relative;
		display: grid;
		grid-template-columns: repeat(var(--lanes), minmax(0, 1fr));
		max-width: 560px;
		width: 100%;
		margin: 0 auto;
		overflow: hidden;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: #0b0b0b;
	}
	.lane {
		position: relative;
		border-right: 1px solid #1f1f1f;
		background: linear-gradient(to bottom, transparent, hsl(var(--hue) 70% 50% / 0.08));
		transition: background-color 120ms ease;
	}
	.lane:last-child {
		border-right: 0;
	}
	.lane.lit {
		background-color: hsl(var(--hue) 70% 50% / 0.16);
	}
	.note {
		position: absolute;
		left: 14%;
		right: 14%;
		top: 0;
		height: 28px;
		border-radius: 3px;
		background: var(--accent);
		box-shadow: 0 0 18px -2px color-mix(in srgb, var(--accent) 70%, transparent);
		will-change: transform;
	}
	.note.missed {
		background: #3a3a3a;
		box-shadow: none;
	}
	.line {
		position: absolute;
		left: 0;
		right: 0;
		height: 3px;
		background: #f2f2ee;
		opacity: 0.85;
	}
	.key {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 3px;
		border: 1px solid #3a3a3a;
		border-bottom-width: 3px;
		background: #181818;
		color: #f2f2ee;
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 600;
		transition:
			background-color 100ms ease,
			transform 100ms ease;
	}
	.lit .key {
		background: var(--accent);
		color: #111;
		transform: translateX(-50%) translateY(2px);
	}
	.mark {
		position: absolute;
		left: 50%;
		top: 46%;
		transform: translateX(-50%);
		font-size: 13px;
		font-weight: 700;
		color: var(--accent);
		white-space: nowrap;
		animation: rise 520ms ease-out forwards;
		pointer-events: none;
	}
	.mark.bad {
		color: #ff7a7a;
	}
	@keyframes rise {
		to {
			transform: translate(-50%, -26px);
			opacity: 0;
		}
	}
	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 24px;
		text-align: center;
		background: rgb(11 11 11 / 0.86);
		color: #b9b9b3;
	}
	.overlay .title {
		font-family: var(--font-serif);
		font-size: 34px;
		color: #f2f2ee;
	}
	.overlay b {
		color: #f2f2ee;
	}
	.overlay kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.15);
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
