<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onDestroy } from 'svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';

	/**
	 * The shared frame of the course games: a ready screen that explains the goal, a short
	 * count-in, a progress bar towards the target, pausing when the tab is hidden, and an end
	 * screen. Games have targets, not time limits: they end as soon as the target is reached.
	 */
	interface Props {
		title: string;
		icon: IconName;
		/** One or two sentences: how to play. */
		how: string;
		/** The goal, for example "Hit 20 keys". */
		goal: string;
		/** Progress towards the goal, from 0 to 1. */
		progress: number;
		/** Short status, such as "12 / 20 keys". */
		status: string;
		lives?: { left: number; total: number } | null;
		/** Set by the game when it ends. */
		over?: { won: boolean; text: string } | null;
		paused?: boolean;
		onstart: () => void;
		onpause?: () => void;
		onresume?: () => void;
		height?: number;
		children: Snippet;
	}

	let { title, icon, how, goal, progress, status, lives = null, over = null, paused = false, onstart, onpause, onresume, height = 360, children }: Props = $props();

	let phase = $state<'ready' | 'countdown' | 'playing'>('ready');
	let count = $state(3);
	let timer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => clearTimeout(timer));

	function start() {
		if (phase !== 'ready') return;
		phase = 'countdown';
		count = 3;
		const step = () => {
			count--;
			if (count > 0) timer = setTimeout(step, 520);
			else {
				phase = 'playing';
				onstart();
			}
		};
		timer = setTimeout(step, 520);
	}

	function onkeydown(e: KeyboardEvent) {
		if (phase !== 'ready' || (e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			start();
		}
	}
	function onvisibilitychange() {
		if (document.visibilityState === 'hidden' && phase === 'playing' && !over && !paused) onpause?.();
	}
</script>

<svelte:window {onkeydown} />
<svelte:document {onvisibilitychange} />

<div class="game">
	<div class="hud">
		{#if lives}
			<span class="lives" role="img" aria-label={`${lives.left} of ${lives.total} lives left`}>
				{#each Array.from({ length: lives.total }) as _, i (i)}<span class="life" class:lost={i >= lives.left}></span>{/each}
			</span>
		{/if}
		<div class="bar" role="progressbar" aria-label={goal} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
			<span style:transform={`scaleX(${Math.min(1, progress)})`}></span>
		</div>
		<span class="status">{status}</span>
	</div>

	<!-- The game and its overlays share one grid cell, so the frame grows to fit whichever is taller. -->
	<div class="stage" style:min-height={`${height}px`}>
		<div class="layer">{@render children()}</div>

		{#if phase === 'ready'}
			<div class="overlay">
				<span class="badge" aria-hidden="true"><Icon name={icon} size={26} /></span>
				<p class="title">{title}</p>
				<p class="how">{how}</p>
				<p class="goal"><Icon name="target" size={16} /> {goal}</p>
				<button type="button" class="btn btn-primary" onclick={start}>Start <kbd>Space</kbd></button>
			</div>
		{:else if phase === 'countdown'}
			<div class="overlay count" aria-live="assertive">{#key count}<span>{count}</span>{/key}</div>
		{:else if over}
			<div class="overlay" aria-live="polite">
				<span class="badge" class:won={over.won} aria-hidden="true"><Icon name={over.won ? 'trophy' : 'restart'} size={26} /></span>
				<p class="title">{over.won ? 'Goal reached' : 'Not this time'}</p>
				<p class="how">{over.text}</p>
			</div>
		{:else if paused}
			<div class="overlay">
				<p class="title">Paused</p>
				<button type="button" class="btn btn-primary" onclick={() => onresume?.()}>Resume</button>
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
		gap: 14px;
		font-size: 14px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.lives {
		display: inline-flex;
		gap: 5px;
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
		transform: scale(0.75);
	}
	.bar {
		flex: 1;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--green), var(--accent));
		transform-origin: left;
		transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
	}
	.status {
		min-width: 90px;
		text-align: right;
		font-weight: 600;
		color: var(--ink);
	}
	.stage {
		position: relative;
		display: grid;
		overflow: hidden;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background:
			radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ink) 8%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
			linear-gradient(to bottom, var(--surface), var(--bg));
	}
	.layer,
	.overlay {
		grid-area: 1 / 1;
		min-width: 0;
	}
	.layer {
		position: relative;
	}
	.overlay {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 28px 24px;
		text-align: center;
		background: color-mix(in srgb, var(--bg) 84%, transparent);
		-webkit-backdrop-filter: blur(6px);
		backdrop-filter: blur(6px);
		color: var(--ink-2);
		animation: fade 220ms ease both;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	.badge {
		display: grid;
		place-items: center;
		width: 56px;
		height: 56px;
		border-radius: 3px;
		background: var(--ink);
		color: var(--bg);
	}
	.badge.won {
		background: var(--accent);
		color: var(--on-accent);
	}
	.title {
		font-family: var(--font-serif);
		font-size: 32px;
		color: var(--ink);
	}
	.how {
		max-width: 52ch;
		line-height: 1.55;
		text-wrap: pretty;
	}
	.goal {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 3px;
		background: var(--green-soft);
		color: var(--green);
		font-weight: 600;
		font-size: 14px;
	}
	.count span {
		display: block;
		font-family: var(--font-serif);
		font-size: 96px;
		color: var(--ink);
		animation: pop 500ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes pop {
		from {
			transform: scale(1.5);
			opacity: 0;
			filter: blur(6px);
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
	@media (prefers-reduced-motion: reduce) {
		.overlay,
		.count span {
			animation: none;
		}
	}
</style>
