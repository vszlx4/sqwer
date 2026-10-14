<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { activityWords, seeded, shuffle } from '../generate.ts';
	import type { StepResult } from '../types.ts';

	interface Props {
		items: 'letters' | 'words';
		pool: string;
		focus: string;
		words?: readonly string[];
		seconds: number;
		target: number;
		oncomplete: (r: StepResult) => void;
	}

	let { items, pool, focus, words, seconds, target, oncomplete }: Props = $props();

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
	const LIVES = 3;
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
	let elapsed = $state(0);
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

	const pace = $derived(Math.min(1, elapsed / seconds));

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
		drops = [...drops, { id: nextId++, text, x, y: -40, speed: base * (1 + pace * 0.9) * (0.9 + rand() * 0.2) }];
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
		elapsed += dt;
		spawnIn -= dt;
		const maxOnScreen = items === 'letters' ? 6 : 4;
		if (spawnIn <= 0 && drops.length < maxOnScreen) {
			spawn();
			const interval = items === 'letters' ? 1.5 - pace * 0.8 : 2.6 - pace * 1.2;
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
		if (lives === 0 || elapsed >= seconds) return end();
		frame = requestAnimationFrame(loop);
	}

	function end() {
		phase = 'over';
		cancelAnimationFrame(frame);
		const accuracy = presses ? (correct / presses) * 100 : 0;
		const passed = cleared >= target;
		const summary = `${cleared} cleared${dropped ? `, ${dropped} landed` : ''}${lives === 0 ? ', no lives left' : ''}. Goal: ${target}.`;
		timers.push(setTimeout(() => oncomplete({ passed, accuracy, summary }), 900));
	}

	function pop(d: Drop) {
		const burst = { id: d.id, x: d.x, y: d.y };
		bursts = [...bursts, burst];
		timers.push(setTimeout(() => (bursts = bursts.filter((b) => b !== burst)), 500));
		drops = drops.filter((x) => x.id !== d.id);
		cleared++;
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
		<span class="score"><b>{cleared}</b> / {target} cleared</span>
		<span class="clock"><b>{Math.max(0, Math.ceil(seconds - elapsed))}</b> s</span>
	</div>

	<div class="field" class:shake style:height={`${HEIGHT}px`} aria-hidden={phase === 'playing'}>
		{#each drops as d (d.id)}
			<span class="drop" class:word={items === 'words'} style:left={`${d.x * 100}%`} style:transform={`translate(-50%, ${d.y}px)`}>
				{#if items === 'words' && buffer && d.text.startsWith(buffer)}<b>{buffer}</b><span class="rest">{d.text.slice(buffer.length)}</span>{:else}{d.text}{/if}
			</span>
		{/each}
		{#each bursts as b (b.id)}
			<span class="burst" style:left={`${b.x * 100}%`} style:top={`${b.y + 20}px`}></span>
		{/each}
		<div class="ground" style:top={`${GROUND}px`}>
			{#if items === 'words'}<span class="buffer">{buffer || ' '}</span>{/if}
		</div>

		{#if phase === 'ready'}
			<div class="overlay">
				<p class="title">{items === 'letters' ? 'Falling letters' : 'Falling words'}</p>
				<p>Type each {items === 'letters' ? 'letter' : 'word'} before it lands. Three may land before the game ends.</p>
				<p>Clear <b>{target}</b> to pass.</p>
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
				<p class="title">{cleared >= target ? 'Cleared!' : 'Time to try again'}</p>
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
	.life {
		width: 18px;
		height: 18px;
		background: var(--error);
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
	.drop.word {
		height: 40px;
		font-size: 19px;
		font-weight: 500;
	}
	/* The typed part of a word is shown by weight; the rest is dimmed. */
	.drop b {
		font-weight: 800;
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
	.buffer {
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 600;
		min-height: 1.3em;
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
