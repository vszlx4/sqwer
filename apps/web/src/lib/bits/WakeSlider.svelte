<!--
	Svelte Bits: Wake Slider
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/wake-slider.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: motion springs ported to the GSAP ticker (same stiffness and damping); colours default to tokens;
	bars use the 3px radius; reduced motion read from lib/motion; value label removed (the caller shows it).
-->
<script module lang="ts">
	const SETTLE = 9.23;
	const FULL_SPEED = 320;
	const MIN_REACH = 1.5;
	const FLAT = 0.002;
	const REST_EPS = 0.01;

	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
	const smoothstep = (s: number) => s * s * (3 - 2 * s);
	const toPct = (v: number, min: number, max: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);
	const snap = (v: number, min: number, max: number, step: number) => {
		if (!(max > min)) return min;
		if (!(step > 0)) return clamp(v, min, max);
		const lastWhole = min + Math.floor(+((max - min) / step).toFixed(6)) * step;
		const grid = clamp(Math.round((v - min) / step) * step + min, min, lastWhole);
		return +(lastWhole < max && Math.abs(v - max) <= Math.abs(v - grid) ? max : grid).toFixed(6);
	};
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { motion, REDUCED } from '#lib/motion/gsap.ts';

	interface Props {
		value?: number;
		onChange?: (value: number) => void;
		min?: number;
		max?: number;
		step?: number;
		bars?: number;
		height?: number;
		restHeight?: number;
		gap?: number;
		sensitivity?: number;
		reach?: number;
		skew?: number;
		glide?: number;
		smoothing?: number;
		formatValue?: (value: number) => string;
		disabled?: boolean;
		ariaLabel?: string;
		className?: string;
	}

	let {
		value: valueProp = 50,
		onChange,
		min = 0,
		max = 100,
		step = 1,
		bars = 24,
		height = 28,
		restHeight = 10,
		gap = 3,
		sensitivity = 1,
		reach = 6,
		skew = 0.6,
		glide = 0.3,
		smoothing = 100,
		formatValue,
		disabled = false,
		ariaLabel = 'Value',
		className = ''
	}: Props = $props();

	const value = $derived(clamp(valueProp, min, max));
	const pct = $derived(toPct(value, min, max));
	const format = $derived(formatValue ?? String);
	const rest = $derived(Math.min(restHeight, height - 1) / height);

	let track: HTMLDivElement | undefined = $state();
	let handle: HTMLButtonElement | undefined = $state();
	const barEls: (HTMLSpanElement | null)[] = [];
	let pointerId: number | null = null;
	let reduce = false;
	let latest = untrack(() => value);

	// Head follows the value on a critically damped spring; speed follows the head's velocity on a softer one.
	const sim = { head: untrack(() => pct), vel: 0, speed: 0, speedVel: 0, lastAmp: 0, running: false };

	function paint(force = false) {
		const h = (sim.head / 100) * (bars - 1);
		const v = reduce ? 0 : sim.speed;
		const amp = smoothstep(clamp((Math.abs(v) * sensitivity) / FULL_SPEED, 0, 1));
		const dir = Math.sign(v) || 1;
		const r = MIN_REACH + (reach - MIN_REACH) * amp;
		const behind = r * (1 + skew);
		const ahead = r * (1 - 0.5 * skew);
		const lit = Math.round(h);
		const flat = !force && amp < FLAT && sim.lastAmp < FLAT;
		for (let i = 0; i < bars; i++) {
			const el = barEls[i];
			if (!el) continue;
			const on = i <= lit && pct > 0 ? 'true' : 'false';
			if (el.dataset.on !== on) el.dataset.on = on;
			if (flat) continue;
			const d = i - h;
			const R = d * dir < 0 ? behind : ahead;
			const lift = Math.abs(d) < R ? amp * Math.cos((Math.PI * d) / (2 * R)) ** 2 : 0;
			el.style.transform = `scaleY(${rest + lift * (1 - rest)})`;
		}
		sim.lastAmp = amp;
	}

	function tick(_time: number, deltaMs: number) {
		const dt = Math.min(deltaMs / 1000, 0.05);
		const w0 = SETTLE / glide;
		const wv = 2000 / smoothing;
		const target = pct;
		// Semi-implicit Euler on both springs.
		sim.vel += (w0 * w0 * (target - sim.head) - 2 * w0 * sim.vel) * dt;
		sim.head += sim.vel * dt;
		sim.speedVel += (wv * wv * (sim.vel - sim.speed) - 2.5 * wv * sim.speedVel) * dt;
		sim.speed += sim.speedVel * dt;
		paint();
		if (Math.abs(target - sim.head) < REST_EPS && Math.abs(sim.vel) < REST_EPS && Math.abs(sim.speed) < 1) {
			sim.head = target;
			sim.vel = sim.speed = sim.speedVel = 0;
			paint(true);
			stop();
		}
	}

	function start() {
		if (sim.running || reduce) return;
		sim.running = true;
		motion().ticker.add(tick);
	}

	function stop() {
		if (!sim.running) return;
		sim.running = false;
		motion().ticker.remove(tick);
	}

	/** Moves the head at once (keyboard steps, reduced motion). */
	function jump(p: number) {
		stop();
		sim.head = p;
		sim.vel = sim.speed = sim.speedVel = 0;
		paint(true);
	}

	$effect(() => {
		const p = pct;
		untrack(() => {
			if (reduce) jump(p);
			else start();
		});
	});

	$effect(() => {
		bars;
		height;
		restHeight;
		untrack(() => paint(true));
	});

	onMount(() => {
		const media = matchMedia(REDUCED);
		reduce = media.matches;
		const change = () => {
			reduce = media.matches;
			if (reduce) jump(pct);
		};
		media.addEventListener('change', change);
		paint(true);
		return () => {
			stop();
			media.removeEventListener('change', change);
		};
	});

	function commit(next: number) {
		const clean = snap(next, min, max, step);
		if (clean === latest) return;
		latest = clean;
		onChange?.(clean);
	}

	function commitFromX(x: number) {
		if (!track) return;
		const rect = track.getBoundingClientRect();
		if (!rect.width) return;
		let ratio = clamp((x - rect.left) / rect.width, 0, 1);
		if (getComputedStyle(track).direction === 'rtl') ratio = 1 - ratio;
		commit(min + ratio * (max - min));
	}

	function onPointerDown(e: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (disabled || pointerId !== null) return;
		pointerId = e.pointerId;
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// Capture can fail on a removed pointer.
		}
		handle?.focus({ preventScroll: true });
		commitFromX(e.clientX);
	}

	function onPointerMove(e: PointerEvent) {
		if (e.pointerId === pointerId) commitFromX(e.clientX);
	}

	function endDrag(e: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (e.pointerId !== pointerId) return;
		try {
			e.currentTarget.releasePointerCapture(e.pointerId);
		} catch {
			// Already released.
		}
		pointerId = null;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (disabled) return;
		const jumps: Record<string, number> = {
			ArrowRight: value + step,
			ArrowUp: value + step,
			ArrowLeft: value - step,
			ArrowDown: value - step,
			PageUp: value + step * 10,
			PageDown: value - step * 10,
			Home: min,
			End: max
		};
		if (!(e.key in jumps)) return;
		e.preventDefault();
		const clean = snap(jumps[e.key], min, max, step);
		jump(toPct(clean, min, max));
		commit(clean);
	}
</script>

<div class={`wake ${className}`} aria-disabled={disabled || undefined} style:--ws-height={`${height}px`} style:--ws-gap={`${gap}px`} style:--ws-rest={rest}>
	<div
		bind:this={track}
		class="track"
		role="presentation"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={endDrag}
		onpointercancel={endDrag}
		onlostpointercapture={endDrag}
	>
		{#each Array.from({ length: bars }) as _, i (i)}<span class="bar" bind:this={barEls[i]}></span>{/each}
		<button
			bind:this={handle}
			type="button"
			role="slider"
			class="handle"
			tabindex={disabled ? -1 : 0}
			aria-label={ariaLabel}
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={format(value)}
			aria-disabled={disabled || undefined}
			onkeydown={onKeyDown}
		></button>
	</div>
</div>

<style>
	.wake {
		display: flex;
		align-items: center;
		width: 100%;
	}
	.wake[aria-disabled='true'] {
		pointer-events: none;
		opacity: 0.5;
	}
	.track {
		position: relative;
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--ws-gap);
		height: var(--ws-height);
		min-height: 44px;
		touch-action: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		cursor: pointer;
	}
	.bar {
		flex: 1;
		min-width: 0;
		height: var(--ws-height);
		border-radius: var(--radius);
		background: var(--line-strong);
		transform: scaleY(var(--ws-rest));
		transform-origin: center;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.bar:global([data-on='true']) {
		background: var(--ink);
	}
	.handle {
		position: absolute;
		inset: 0;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: var(--radius);
		background: transparent;
		cursor: inherit;
		touch-action: none;
	}
</style>
