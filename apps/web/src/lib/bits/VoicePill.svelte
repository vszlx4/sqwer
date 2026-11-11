<!--
	Svelte Bits: Voice Pill
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/voice-pill.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: kept the scrolling waveform and its attack/release envelope only. Removed the button, microphone,
	simulated speech, background, timer and slide to cancel; driven by a `level` callback (the playing clip),
	bars span the width and stay drawn after playback; colour from tokens; reduced motion draws a still row.
-->
<script module lang="ts">
	const DT_MAX = 0.05;
	/** Frames per bar: one bar a frame, so a spoken word spans most of the width. */
	const WAVE_EVERY = 1;

	interface Wave {
		hist: number[];
		tick: number;
		acc: number;
		env: number;
		last: number;
		raf: number;
	}
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { REDUCED } from '#lib/motion/gsap.ts';

	interface Props {
		/** Loudness of what is playing now, 0 to 1. */
		level: () => number;
		/** True while sound plays; the waveform scrolls and settles after. */
		playing: boolean;
		/** Bar width and gap in CSS pixels. */
		bar?: number;
		gap?: number;
		/** Height of a silent bar, as a share of the height. */
		floor?: number;
		attack?: number;
		release?: number;
		className?: string;
	}

	let { level, playing, bar = 3, gap = 2, floor = 0.06, attack = 12, release = 70, className = '' }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	const w: Wave = { hist: [], tick: 0, acc: 0, env: 0, last: 0, raf: 0 };
	let still = false;

	/** Bars that fit the current width. */
	function slots(): number {
		const width = canvas?.getBoundingClientRect().width ?? 0;
		return Math.max(1, Math.floor(width / (bar + gap)));
	}

	function draw() {
		if (!canvas) return;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const rect = canvas.getBoundingClientRect();
		const W = Math.max(1, Math.round(rect.width * dpr));
		const H = Math.max(1, Math.round(rect.height * dpr));
		if (canvas.width !== W || canvas.height !== H) {
			canvas.width = W;
			canvas.height = H;
		}
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const n = slots();
		while (w.hist.length < n) w.hist.unshift(0);
		if (w.hist.length > n) w.hist.splice(0, w.hist.length - n);
		const bw = bar * dpr;
		const step = (bar + gap) * dpr;
		const shift = still ? 0 : (w.tick / WAVE_EVERY) * step;
		ctx.clearRect(0, 0, W, H);
		ctx.fillStyle = getComputedStyle(canvas).color;
		for (let i = 0; i < w.hist.length; i++) {
			const v = w.hist[w.hist.length - 1 - i];
			const x = W - (i + 1) * step - shift + (step - bw);
			if (x + bw < 0) break;
			const h = Math.max(bw, (floor + (1 - floor) * v) * H);
			ctx.globalAlpha = 0.28 + 0.72 * Math.min(1, v * 1.4);
			ctx.beginPath();
			ctx.roundRect(x, (H - h) / 2, bw, h, Math.min(bw / 2, dpr));
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	function frame(now: number) {
		const dt = Math.min((now - w.last) / 1000, DT_MAX);
		w.last = now;
		const target = playing ? Math.min(1, level()) : 0;
		const tau = Math.max(1, target > w.env ? attack : release) / 1000;
		w.env += (target - w.env) * (1 - Math.exp(-dt / tau));
		w.acc = Math.max(w.acc, w.env);
		w.tick = (w.tick + 1) % WAVE_EVERY;
		if (w.tick === 0) {
			w.hist.push(w.acc);
			w.acc = 0;
		}
		draw();
		// After the clip, the tail scrolls on until the envelope has died away, then the waveform holds still.
		w.raf = playing || w.env > 0.004 ? requestAnimationFrame(frame) : 0;
	}

	/** Reduced motion: one still row at a mid height while sound plays, silent bars otherwise. */
	function drawStill() {
		w.hist = Array(slots()).fill(playing ? 0.45 : 0);
		w.tick = 0;
		draw();
	}

	$effect(() => {
		const on = playing;
		untrack(() => {
			if (still) return drawStill();
			if (on && !w.raf) {
				w.last = performance.now();
				w.raf = requestAnimationFrame(frame);
			}
		});
	});

	onMount(() => {
		const media = matchMedia(REDUCED);
		still = media.matches;
		const change = () => {
			still = media.matches;
			if (still) drawStill();
		};
		media.addEventListener('change', change);
		const resize = new ResizeObserver(() => draw());
		if (canvas) resize.observe(canvas);
		draw();
		return () => {
			cancelAnimationFrame(w.raf);
			media.removeEventListener('change', change);
			resize.disconnect();
		};
	});
</script>

<canvas bind:this={canvas} class={`voice-pill ${className}`} aria-hidden="true"></canvas>

<style>
	.voice-pill {
		display: block;
		width: 100%;
		height: 100%;
		color: var(--accent-ink);
	}
</style>
