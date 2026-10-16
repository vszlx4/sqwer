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
		/** Seconds to look at the content before the count-in, for games where reading ahead helps. */
		preview?: number;
		/** What to look at during the preview, for example "Read the passage". */
		previewLabel?: string;
		children: Snippet;
	}

	let { title, icon, how, goal, progress, status, lives = null, over = null, paused = false, onstart, onpause, onresume, height = 360, preview = 0, previewLabel = 'Get ready', children }: Props = $props();

	let phase = $state<'ready' | 'preview' | 'countdown' | 'playing'>('ready');
	let count = $state(3);
	let left = $state(0);
	let timer: ReturnType<typeof setTimeout> | undefined;
	let previewTimer: ReturnType<typeof setInterval> | undefined;
	onDestroy(() => {
		clearTimeout(timer);
		clearInterval(previewTimer);
	});

	function start() {
		if (phase !== 'ready') return;
		if (preview > 0) {
			phase = 'preview';
			left = preview;
			previewTimer = setInterval(() => {
				left--;
				if (left <= 0) play();
			}, 1000);
			reveal();
			return;
		}
		reveal();
		countIn();
	}

	let game: HTMLDivElement | undefined = $state();
	/** Brings the whole game into view, so nothing needs scrolling once it starts. */
	function reveal() {
		const box = game?.getBoundingClientRect();
		if (box && (box.top < 0 || box.bottom > window.innerHeight)) game!.scrollIntoView({ block: box.height < window.innerHeight ? 'center' : 'start', behavior: 'smooth' });
	}

	/** After reading time the game starts at once: the passage has already been seen, so no count-in. */
	function play() {
		if (phase !== 'preview') return;
		clearInterval(previewTimer);
		phase = 'playing';
		onstart();
	}

	function countIn() {
		if (phase !== 'ready' && phase !== 'preview') return;
		clearInterval(previewTimer);
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
		if ((phase !== 'ready' && phase !== 'preview') || (e.target as HTMLElement | null)?.closest('button, a, input')) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			if (phase === 'ready') start();
			else play();
		}
	}
	function onvisibilitychange() {
		if (document.visibilityState === 'hidden' && phase === 'playing' && !over && !paused) onpause?.();
	}
</script>

<svelte:window {onkeydown} />
<svelte:document {onvisibilitychange} />

<div class="game" bind:this={game}>
	{#if phase === 'preview'}
		<!-- In place of the progress bar, so the layout does not move when the game starts. -->
		<div class="hud prep" role="timer" aria-label={`${previewLabel}: starts in ${left} seconds`}>
			<span class="prep-count" aria-hidden="true">{left}</span>
			<span class="prep-text"><b>{previewLabel}</b><span>Starts when the time runs out</span></span>
			<span class="prep-bar" aria-hidden="true"><span style:animation-duration={`${preview}s`}></span></span>
			<button type="button" class="btn btn-primary" onclick={play}>Start now <kbd>Space</kbd></button>
		</div>
	{:else}
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
	{/if}

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
	.prep {
		gap: 16px;
		min-height: 56px;
		padding: 6px 6px 6px 8px;
		border-radius: 3px;
		border: 1px solid var(--ink);
		background: var(--surface);
		color: var(--ink-2);
	}
	.prep-count {
		display: grid;
		place-items: center;
		min-width: 44px;
		height: 44px;
		border-radius: 3px;
		background: var(--ink);
		color: var(--bg);
		font-size: 24px;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
	}
	.prep-text {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
		font-size: 13px;
	}
	.prep-text b {
		font-size: 15px;
		color: var(--ink);
	}
	.prep-bar {
		flex: 1;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.prep-bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transform-origin: left;
		animation: drain linear both;
	}
	@keyframes drain {
		from {
			transform: scaleX(1);
		}
		to {
			transform: scaleX(0);
		}
	}
	.prep .btn {
		padding: 6px 12px;
		font-size: 13.5px;
	}
	.prep kbd {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgb(0 0 0 / 0.12);
		font-family: var(--font-mono);
		font-size: 12px;
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
		.count span,
		.prep-bar span {
			animation: none;
		}
	}
</style>
