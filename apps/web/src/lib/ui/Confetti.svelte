<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * A short burst of confetti from the top of the screen, drawn on a canvas that ignores the
	 * pointer and removes itself. Nothing is shown when the person prefers reduced motion.
	 */
	let { pieces = 140, duration = 2600 }: { pieces?: number; duration?: number } = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let done = $state(false);

	onMount(() => {
		if (!canvas || matchMedia('(prefers-reduced-motion: reduce)').matches) {
			done = true;
			return;
		}
		const ctx = canvas.getContext('2d')!;
		const dpr = Math.min(2, devicePixelRatio || 1);
		const resize = () => {
			canvas!.width = innerWidth * dpr;
			canvas!.height = innerHeight * dpr;
		};
		resize();
		const style = getComputedStyle(document.documentElement);
		const colours = ['--accent', '--blue', '--green', '--amber', '--orange', '--violet', '--rose'].map((v) => style.getPropertyValue(v).trim() || '#ccf900');
		const W = innerWidth;
		const parts = Array.from({ length: pieces }, () => ({
			x: W / 2 + (Math.random() - 0.5) * W * 0.5,
			y: -20 - Math.random() * 120,
			vx: (Math.random() - 0.5) * 9,
			vy: 2 + Math.random() * 5,
			size: 6 + Math.random() * 7,
			spin: Math.random() * Math.PI,
			vspin: (Math.random() - 0.5) * 0.3,
			colour: colours[Math.floor(Math.random() * colours.length)]!
		}));
		const begin = performance.now();
		let frame = 0;
		const draw = (t: number) => {
			const age = t - begin;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, innerWidth, innerHeight);
			ctx.globalAlpha = Math.max(0, Math.min(1, (duration - age) / 600));
			for (const p of parts) {
				p.vy += 0.12;
				p.vx *= 0.99;
				p.x += p.vx;
				p.y += p.vy;
				p.spin += p.vspin;
				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.rotate(p.spin);
				ctx.fillStyle = p.colour;
				ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
				ctx.restore();
			}
			if (age < duration) frame = requestAnimationFrame(draw);
			else done = true;
		};
		frame = requestAnimationFrame(draw);
		addEventListener('resize', resize);
		return () => {
			cancelAnimationFrame(frame);
			removeEventListener('resize', resize);
		};
	});
</script>

{#if !done}<canvas bind:this={canvas} class="confetti" aria-hidden="true"></canvas>{/if}

<style>
	.confetti {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		z-index: 60;
	}
</style>
