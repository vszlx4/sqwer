<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	interface Props {
		items: 'letters' | 'words';
		pool: string;
		focus: string;
		words?: readonly string[];
		target: number;
		/** Adaptive pace: below 1 falls more slowly, above 1 more quickly. */
		pace?: number;
		oncomplete: (r: StepResult) => void;
	}

	let { items, pool, focus, words, target, pace: tempo = 1, oncomplete }: Props = $props();

	interface Drop {
		id: number;
		text: string;
		x: number;
		y: number;
		speed: number;
	}
	interface Burst {
		id: number;
		x: number;
		y: number;
	}

	const HEIGHT = 420;
	const GROUND = HEIGHT - 46;
	const LIVES = 5;
	const rand = seeded(Date.now() % 100000);
	// Each attempt is a new component, so the content is chosen once from the initial settings.
	const wordList = untrack(() => (items === 'words' ? activityWords(pool, focus, words, rand) : []));
	const letterBag = untrack(() => [...pool, ...focus, ...focus].filter((c) => c.trim()));

	let phase = $state<'ready' | 'countdown' | 'playing' | 'paused' | 'over'>('ready');
	let countdown = $state(3);
	let drops = $state<Drop[]>([]);
	let bursts = $state<Burst[]>([]);
	let buffer = $state('');
	let lives = $state(LIVES);
	let cleared = $state(0);
	let dropped = $state(0);
	let presses = $state(0);
	let correct = $state(0);
	let shake = $state(false);
	let nextId = 0;
	let spawnIn = 0;
	let last = 0;
	let frame = 0;
	let wordIndex = 0;
	let timers: ReturnType<typeof setTimeout>[] = [];
	onDestroy(() => {
		cancelAnimationFrame(frame);
		timers.forEach(clearTimeout);
	});

	// The game speeds up as the learner gets closer to the target, not with time.
	const pace = $derived(Math.min(1, cleared / target));

	function nextText(): string {
		if (items === 'letters') return letterBag[Math.floor(rand() * letterBag.length)]!;
		const w = wordList[wordIndex % wordList.length]!;
		wordIndex++;
		if (wordIndex % wordList.length === 0) wordList.splice(0, wordList.length, ...shuffle(wordList, rand));
		return w;
	}

	function spawn() {
		const text = nextText();
		// Keep new drops away from the edges and from the most recent drop.
		let x = 0.08 + rand() * 0.84;
		const lastDrop = drops[drops.length - 1];
		if (lastDrop && Math.abs(lastDrop.x - x) < 0.15) x = x > 0.5 ? x - 0.3 : x + 0.3;
		const base = items === 'letters' ? 62 : 34;
		drops = [...drops, { id: nextId++, text, x, y: -40, speed: base * tempo * (1 + pace * 0.9) * (0.9 + rand() * 0.2) }];
	}

	function start() {
		phase = 'countdown';
		countdown = 3;
		const step = () => {
			countdown--;
			if (countdown > 0) timers.push(setTimeout(step, 650));
			else {
				phase = 'playing';
				last = performance.now();
				spawnIn = 0;
				frame = requestAnimationFrame(loop);
			}
		};
		timers.push(setTimeout(step, 650));
	}

	function loop(t: number) {
		if (phase !== 'playing') return;
		const dt = Math.min(0.05, (t - last) / 1000);
		last = t;
		spawnIn -= dt;
		const maxOnScreen = items === 'letters' ? 6 : 4;
		if (spawnIn <= 0 && drops.length < maxOnScreen) {
			spawn();
			const interval = (items === 'letters' ? 1.5 - pace * 0.8 : 2.6 - pace * 1.2) / tempo;
			spawnIn = interval;
		}
		let lost = 0;
		const moved: Drop[] = [];
		for (const d of drops) {
			const y = d.y + d.speed * dt;
			if (y >= GROUND) lost++;
			else moved.push({ ...d, y });
		}
		drops = moved;
		if (lost) {
			lives = Math.max(0, lives - lost);
			dropped += lost;
			shake = true;
			timers.push(setTimeout(() => (shake = false), 300));
			if (items === 'words' && !drops.some((d) => d.text.startsWith(buffer))) buffer = '';
		}
		if (lives === 0) return end();
		frame = requestAnimationFrame(loop);
	}

	function end() {
		if (phase === 'over') return;
		phase = 'over';
		cancelAnimationFrame(frame);
		const accuracy = presses ? (correct / presses) * 100 : 0;
		const passed = cleared >= target;
		const summary = passed
			? `All ${target} cleared${dropped ? `, with ${dropped} landed` : ' without a single one landing'}.`
			: `${cleared} of ${target} cleared before the last life was lost.`;
		timers.push(setTimeout(() => oncomplete({ passed, accuracy, summary }), 900));
	}

	function pop(d: Drop) {
		const burst = { id: d.id, x: d.x, y: d.y };
		bursts = [...bursts, burst];
		timers.push(setTimeout(() => (bursts = bursts.filter((b) => b !== burst)), 500));
		drops = drops.filter((x) => x.id !== d.id);
		cleared++;
		if (cleared >= target) end();
	}

	function press(ch: string) {
		presses++;
		if (items === 'letters') {
			const hit = drops.filter((d) => d.text === ch).sort((a, b) => b.y - a.y)[0];
			if (hit) {
				correct++;
				pop(hit);
			}
			return;
		}
		const attempt = buffer + ch;
		const candidates = drops.filter((d) => d.text.startsWith(attempt));
		if (!candidates.length) return;
		correct++;
		const exact = candidates.sort((a, b) => b.y - a.y).find((d) => d.text === attempt);
		if (exact) {
			pop(exact);
			buffer = '';
		} else buffer = attempt;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if ((e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (phase === 'ready') {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				start();
			}
			return;
		}
		if (phase !== 'playing') return;
		if (e.key === 'Backspace' && items === 'words') {
			e.preventDefault();
			buffer = buffer.slice(0, -1);
			return;
		}
		if (e.key.length === 1 && e.key !== ' ') {
			e.preventDefault();
			press(e.key);
		}
	}

	function onvisibilitychange() {
		if (document.visibilityState === 'hidden' && phase === 'playing') {
			phase = 'paused';
			cancelAnimationFrame(frame);
		}
	}
	function resume() {
		phase = 'playing';
		last = performance.now();
		frame = requestAnimationFrame(loop);
	}
</script>

<svelte:window {onkeydown} />
<svelte:document {onvisibilitychange} />

<div class="game">
	<div class="hud">
		<span class="lives" aria-label={`${lives} of ${LIVES} lives left`}>
			{#each Array.from({ length: LIVES }) as _, i (i)}<span class="life" class:lost={i >= lives}></span>{/each}
		</span>
		<span class="progress" aria-hidden="true"><span style:transform={`scaleX(${Math.min(1, cleared / target)})`}></span></span>
		<span class="score"><b>{cleared}</b> / {target} cleared</span>
	</div>

	<div class="field" class:shake style:height={`${HEIGHT}px`} aria-hidden={phase === 'playing'}>
		{#each drops as d (d.id)}
			<span class="drop" class:word={items === 'words'} style:left={`${d.x * 100}%`} style:transform={`translate(-50%, ${d.y}px)`}>
				<span class="text">{#if items === 'words' && buffer && d.text.startsWith(buffer)}<b>{buffer}</b><span class="rest">{d.text.slice(buffer.length)}</span>{:else}{d.text}{/if}</span>
			</span>
		{/each}
		{#each bursts as b (b.id)}
			<span class="burst" style:left={`${b.x * 100}%`} style:top={`${b.y + 20}px`}></span>
		{/each}
		<div class="ground" style:top={`${GROUND}px`}></div>

		{#if phase === 'ready'}
			<div class="overlay">
				<p class="title">{items === 'letters' ? 'Falling letters' : 'Falling words'}</p>
				<p>Type each {items === 'letters' ? 'letter' : 'word'} before it lands. They fall faster as you get closer to the goal; {LIVES} may land before the game ends.</p>
				<p class="goal">Clear {target} {items === 'letters' ? 'letters' : 'words'}</p>
				<button type="button" class="btn btn-primary" onclick={start}>Start <kbd>Space</kbd></button>
			</div>
		{:else if phase === 'countdown'}
			<div class="overlay count" aria-live="assertive">{countdown}</div>
		{:else if phase === 'paused'}
			<div class="overlay">
				<p class="title">Paused</p>
				<button type="button" class="btn btn-primary" onclick={resume}>Resume</button>
			</div>
		{:else if phase === 'over'}
			<div class="overlay" aria-live="polite">
				<p class="title">{cleared >= target ? 'Goal reached' : 'Not this time'}</p>
				<p>{cleared} of {target} cleared</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.game {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 14.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.hud b {
		font-size: 20px;
		color: var(--ink);
	}
	.lives {
		display: inline-flex;
		gap: 6px;
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
	.goal {
		padding: 6px 12px;
		border-radius: 3px;
		background: var(--green-soft);
		color: var(--green);
		font-weight: 600;
		font-size: 14px;
	}
	.life {
		width: 16px;
		height: 16px;
		background: var(--rose);
		clip-path: polygon(50% 100%, 0 38%, 12% 8%, 34% 4%, 50% 20%, 66% 4%, 88% 8%, 100% 38%);
		transition:
			opacity 200ms ease,
			transform 200ms ease;
	}
	.life.lost {
		opacity: 0.18;
		transform: scale(0.8);
	}
	.field {
		position: relative;
		overflow: hidden;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background:
			radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ink) 9%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
			linear-gradient(to bottom, var(--surface), var(--bg));
	}
	.field.shake {
		animation: shake 300ms ease;
	}
	@keyframes shake {
		25% {
			transform: translateX(-5px);
		}
		75% {
			transform: translateX(5px);
		}
	}
	.drop {
		position: absolute;
		top: 0;
		display: grid;
		place-items: center;
		min-width: 46px;
		height: 46px;
		padding: 0 10px;
		border-radius: 3px;
		border: 1px solid var(--key-edge);
		border-bottom-width: 3px;
		background: var(--key);
		font-family: var(--font-mono);
		font-size: 22px;
		font-weight: 600;
		color: var(--ink);
		will-change: transform;
	}
	/* One line per word: the typed part and the rest stay together, whatever the position. */
	.text {
		white-space: nowrap;
	}
	.drop.word {
		height: 40px;
		font-size: 19px;
		font-weight: 500;
	}
	/* The typed part of a word is shown by weight; the rest is dimmed. */
	.drop b {
		font-weight: 800;
		color: var(--ink);
	}
	.drop .rest {
		color: var(--untyped);
	}
	.burst {
		position: absolute;
		width: 56px;
		height: 56px;
		margin: -28px 0 0 -28px;
		border-radius: 3px;
		border: 3px solid var(--accent);
		animation: burst 480ms ease-out forwards;
		pointer-events: none;
	}
	@keyframes burst {
		from {
			transform: scale(0.4) rotate(0deg);
			opacity: 1;
		}
		to {
			transform: scale(1.6) rotate(45deg);
			opacity: 0;
		}
	}
	.ground {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		border-top: 3px solid var(--ink);
		background: color-mix(in srgb, var(--accent) 22%, var(--bg));
		display: grid;
		place-items: center;
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
		background: color-mix(in srgb, var(--bg) 82%, transparent);
		-webkit-backdrop-filter: blur(3px);
		backdrop-filter: blur(3px);
		color: var(--ink-2);
	}
	.overlay .title {
		font-family: var(--font-serif);
		font-size: 34px;
		color: var(--ink);
	}
	.overlay.count {
		font-family: var(--font-serif);
		font-size: 96px;
		color: var(--ink);
		animation: pulse-in 650ms ease;
	}
	@keyframes pulse-in {
		from {
			transform: scale(1.4);
			opacity: 0;
		}
	}
	.overlay kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.12);
		font-family: var(--font-mono);
		font-size: 12px;
	}
</style>
