<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { LANE_NOTES, tick, tone } from '../audio.ts';
	import { keyName } from '../catalog.ts';
	import { wordsUsing } from '@sqwer/content';
	import { seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	interface Props {
		keys: string[];
		/** Letters to make real words from; the notes then spell those words. */
		pool?: string;
		bpm: number;
		target: number;
		oncomplete: (r: StepResult) => void;
	}

	let { keys: givenKeys, pool, bpm, target, oncomplete }: Props = $props();

	interface Note {
		id: number;
		lane: number;
		word: number;
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
	/** Misses allowed before the round ends; the round also ends as soon as the target is hit. */
	const MAX_MISSES = 6;
	// Enough notes to reach the target with every allowed miss, so the track never runs out first.
	const notes = untrack(() => target + MAX_MISSES);

	/** Keyboard columns from left to right, so lanes appear in the order the fingers sit. */
	const COLUMNS = '`1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik,9ol.0p;/-[\'=]';
	const byColumn = (a: string, b: string) => COLUMNS.indexOf(a) - COLUMNS.indexOf(b);

	interface Planned {
		id: number;
		lane: number;
		beat: number;
		/** Index of the word the note belongs to, in words mode. */
		word: number;
	}

	/**
	 * In words mode, real English words are chosen whose letters fit in five lanes, and the notes
	 * spell them one after another with a rest between words. Otherwise, or when too few words
	 * can be made from the keys learnt so far, notes follow the given keys.
	 */
	function plan(): { lanes: string[]; notes: Planned[]; words: string[] } {
		if (pool) {
			const letters = [...pool].filter((c) => /[a-z]/.test(c)).join('');
			const candidates = shuffle(
				wordsUsing(letters).filter((w) => w.length >= 2 && w.length <= 5),
				rand
			);
			const chosen: string[] = [];
			const used = new Set<string>();
			let length = 0;
			for (const w of candidates) {
				const union = new Set([...used, ...w]);
				if (union.size > 5 || chosen.includes(w)) continue;
				chosen.push(w);
				w.split('').forEach((c) => used.add(c));
				length += w.length;
				if (length >= notes + 2) break;
			}
			if (chosen.length >= 3 && length >= notes) {
				const lanes = [...used].sort(byColumn);
				const out: Planned[] = [];
				let beat = 0;
				chosen.forEach((w, wi) => {
					for (const c of w) out.push({ id: out.length, lane: lanes.indexOf(c), beat: beat++, word: wi });
					beat++;
				});
				return { lanes, notes: out, words: chosen };
			}
		}
		const out: Planned[] = [];
		let beat = 0;
		for (let i = 0; i < notes; i++) {
			if (i > 2 && rand() < 0.15) beat++;
			let lane = Math.floor(rand() * givenKeys.length);
			const prev = out.slice(-2);
			if (prev.length === 2 && prev.every((n) => n.lane === lane)) lane = (lane + 1) % givenKeys.length;
			out.push({ id: i, lane, beat, word: -1 });
			beat++;
		}
		return { lanes: givenKeys, notes: out, words: [] };
	}
	const planned = untrack(plan);
	const keys = planned.lanes;
	const score = planned.notes;
	const wordMode = planned.words.length > 0;

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
		track = score.map((n) => ({ id: n.id, lane: n.lane, word: n.word, judged: null, at: start + (COUNT_IN + n.beat) * BEAT }));
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
		if (missed >= MAX_MISSES || t > last.at + GOOD + 500) return end();
		frame = requestAnimationFrame(loop);
	}

	function end() {
		if (phase === 'over') return;
		phase = 'over';
		cancelAnimationFrame(frame);
		const hits = perfect + good;
		const judged = hits + missed;
		const accuracy = judged ? ((perfect + good * 0.8) / judged) * 100 : 0;
		const passed = hits >= target;
		const summary = passed
			? `${target} notes on the beat, ${perfect} of them perfect.`
			: `${hits} of ${target} notes on the beat before ${MAX_MISSES} were missed.`;
		timers.push(setTimeout(() => oncomplete({ passed, accuracy, summary }), 900));
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
		if (perfect + good >= target) timers.push(setTimeout(end, 250));
	}

	/** The word being played: the word of the first note not yet judged. */
	const currentWord = $derived.by(() => {
		if (!wordMode) return null;
		const pending = track.find((n) => !n.judged);
		const index = pending?.word ?? Math.max(0, (track.at(-1)?.word ?? 0));
		return { text: planned.words[index] ?? '', notes: track.filter((n) => n.word === index) };
	});

	const yOf = (n: Note) => HIT_Y - ((n.at - now) / LEAD) * HIT_Y;
</script>

<svelte:window {onkeydown} />

<div class="rhythm">
	<div class="hud">
		<span class="progress" aria-hidden="true"><span style:transform={`scaleX(${Math.min(1, (perfect + good) / target)})`}></span></span>
		<span class="misses">{missed} / {MAX_MISSES} missed</span>
		<span><b>{perfect + good}</b> / {target} on the beat</span>
		<button type="button" class="sound" onclick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>
			<Icon name={sound ? 'volume' : 'mute'} size={15} /> Sound {sound ? 'on' : 'off'}
		</button>
	</div>

	{#if wordMode}
		<p class="word" aria-live="polite">
			{#if currentWord && phase === 'playing'}
				{#each [...currentWord.text] as letter, i (i)}
					{@const n = currentWord.notes[i]}
					<span class:hit={n?.judged === 'perfect' || n?.judged === 'good'} class:miss={n?.judged === 'miss'}>{letter}</span>
				{/each}
			{:else}
				<span class="word-hint">The notes spell real words</span>
			{/if}
		</p>
	{/if}

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
				<p>Press each key as its note reaches the line. Four clicks count you in. The round ends after {MAX_MISSES} missed notes.</p>
				<p class="goal">Hit {target} notes on the beat</p>
				<button type="button" class="btn btn-primary" onclick={begin}>Start <kbd>Space</kbd></button>
			</div>
		{:else if phase === 'over'}
			<div class="overlay" aria-live="polite">
				<p class="title">{perfect + good >= target ? 'Goal reached' : 'Not this time'}</p>
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
		gap: 14px;
		font-size: 14.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.hud b {
		font-size: 20px;
		color: var(--ink);
	}
	.progress {
		flex: 1;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.progress span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--green), var(--accent));
		transform-origin: left;
		transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.word {
		display: flex;
		justify-content: center;
		gap: 4px;
		min-height: 44px;
		font-family: var(--font-mono);
		font-size: 30px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.word span {
		color: var(--untyped);
		transition: color 120ms ease;
	}
	.word span.hit {
		color: var(--green);
	}
	.word span.miss {
		color: var(--error);
	}
	.word .word-hint {
		font-family: var(--font-sans);
		font-size: 15px;
		font-weight: 500;
		align-self: center;
	}
	.misses {
		color: var(--rose);
		font-weight: 600;
	}
	.goal {
		padding: 6px 12px;
		border-radius: 3px;
		background: var(--green-soft);
		color: var(--green);
		font-weight: 600;
		font-size: 14px;
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
	.overlay kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.15);
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
