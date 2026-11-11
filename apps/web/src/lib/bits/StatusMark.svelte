<!--
	Svelte Bits: Status Mark
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/status-mark.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: motion animations ported to GSAP through lib/motion (named in-out and out-soft eases);
	colours default to tokens; Tailwind classes moved to scoped CSS; label strike removed; spoken text overridable.
-->
<script module lang="ts">
	export type StatusMarkStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
	const CHECK = 'M7.5 12.25 10.5 15.25 16.75 8.75';
	const CROSS = 'M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5';
	const TEXT: Record<StatusMarkStatus, string> = {
		pending: 'Pending',
		running: 'In progress',
		done: 'Completed',
		failed: 'Failed',
		cancelled: 'Cancelled'
	};
	const IDLE_DASH = 0.3;
	const MORPH = 0.3;
	const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
</script>

<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { motion, REDUCED } from '#lib/motion/gsap.ts';

	interface Props {
		status?: StatusMarkStatus;
		progress?: number;
		/** Spoken text; defaults to the status name. */
		spoken?: string;
		/** Hidden from assistive technology when the text around it says the same. */
		decorative?: boolean;
		size?: number;
		strokeWidth?: number;
		dashes?: number;
		spinDuration?: number;
		arcLength?: number;
		fillOpacity?: number;
		className?: string;
	}

	let {
		status = 'pending',
		progress,
		spoken,
		decorative = false,
		size = 20,
		strokeWidth = 2,
		dashes = 8,
		spinDuration = 1100,
		arcLength = 0.68,
		fillOpacity = 0.08,
		className = ''
	}: Props = $props();

	const r = $derived(10 - strokeWidth / 2);
	const C = $derived(2 * Math.PI * r);
	const P = $derived(C / Math.max(1, dashes));
	const determinate = $derived(status === 'running' && typeof progress === 'number' && Number.isFinite(progress));
	const indeterminate = $derived(status === 'running' && !determinate);
	const solid = $derived(status === 'running' || status === 'done' || status === 'failed');
	const targetArc = $derived(indeterminate ? arcLength : determinate ? clamp01(progress as number) : 1);

	let ring: SVGCircleElement | undefined = $state();
	const v = { mode: untrack(() => (solid ? 1 : 0)), arc: untrack(() => targetArc), travel: 0 };
	let reduce = false;

	function write() {
		if (!ring) return;
		const dash = IDLE_DASH * P + (v.arc * C - IDLE_DASH * P) * v.mode;
		const gap = (1 - IDLE_DASH) * P + ((1 - v.arc) * C - (1 - IDLE_DASH) * P) * v.mode;
		ring.setAttribute('stroke-dasharray', `${Math.max(0, dash)} ${Math.max(0, gap)}`);
		ring.setAttribute('stroke-dashoffset', String(v.travel));
	}

	$effect(() => {
		status;
		targetArc;
		C;
		P;
		untrack(() => {
			const gsap = motion();
			gsap.killTweensOf(v);
			if (reduce) {
				v.mode = solid ? 1 : 0;
				v.arc = targetArc;
				v.travel = 0;
				return write();
			}
			if (v.mode === 0) v.arc = targetArc;
			gsap.to(v, { mode: solid ? 1 : 0, duration: MORPH, ease: 'in-out', onUpdate: write });
			gsap.to(v, { arc: targetArc, duration: MORPH, ease: 'out-soft', onUpdate: write });
			if (indeterminate) {
				gsap.to(v, { travel: v.travel - C, duration: spinDuration / 1000, ease: 'none', repeat: -1, onUpdate: write });
				return;
			}
			const unit = determinate ? C : P;
			gsap.to(v, {
				travel: Math.floor(v.travel / unit) * unit,
				duration: MORPH,
				ease: 'out-soft',
				onUpdate: write,
				onComplete: () => {
					v.travel = 0;
					write();
				}
			});
		});
	});

	onMount(() => {
		reduce = matchMedia(REDUCED).matches;
		write();
		return () => motion().killTweensOf(v);
	});

	const label = $derived(spoken ?? TEXT[status] + (determinate ? `, ${Math.round(clamp01(progress as number) * 100)}%` : ''));
</script>

<svg
	class={`status-mark ${className}`}
	data-status={status}
	data-indeterminate={indeterminate ? '' : undefined}
	viewBox="0 0 24 24"
	width={size}
	height={size}
	style:--sm-stroke={strokeWidth}
	style:--sm-fill={fillOpacity}
	role={decorative ? undefined : 'img'}
	aria-label={decorative ? undefined : label}
	aria-hidden={decorative || undefined}
>
	<circle class="disc" cx="12" cy="12" {r} transform="rotate(-90 12 12)"></circle>
	<circle class="ring" bind:this={ring} cx="12" cy="12" {r} transform="rotate(-90 12 12)"></circle>
	<path class="glyph check" d={CHECK} pathLength="1"></path>
	<path class="glyph cross" d={CROSS} pathLength="1"></path>
</svg>

<style>
	.status-mark {
		flex-shrink: 0;
		overflow: visible;
		color: var(--ink-3);
		transition: color var(--dur-base) var(--ease-out);
	}
	.status-mark[data-status='running'] {
		color: var(--accent-ink);
	}
	.status-mark[data-status='done'] {
		color: var(--success);
	}
	.status-mark[data-status='failed'] {
		color: var(--error);
	}
	circle,
	path {
		stroke: currentColor;
		stroke-width: var(--sm-stroke);
	}
	.disc {
		fill: currentColor;
		fill-opacity: 0;
		stroke-opacity: 0;
		transition:
			fill-opacity var(--dur-base) var(--ease-out),
			stroke-opacity var(--dur-base) var(--ease-out);
	}
	[data-status='running'] .disc {
		stroke-opacity: 0.2;
	}
	[data-status='done'] .disc,
	[data-status='failed'] .disc {
		fill-opacity: var(--sm-fill);
	}
	.ring {
		fill: none;
		stroke-linecap: round;
		opacity: 0.55;
		transition: opacity var(--dur-base) var(--ease-out);
	}
	[data-status='running'] .ring,
	[data-status='done'] .ring,
	[data-status='failed'] .ring {
		opacity: 1;
	}
	.glyph {
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1 2;
		stroke-dashoffset: 1.05;
		opacity: 0;
		transition:
			stroke-dashoffset var(--dur-fast) var(--ease-out),
			opacity 0ms linear var(--dur-fast);
	}
	[data-status='done'] .check,
	[data-status='failed'] .cross,
	[data-status='cancelled'] .cross {
		stroke-dashoffset: 0;
		opacity: 1;
		transition:
			stroke-dashoffset var(--dur-base) var(--ease-out) var(--dur-fast),
			opacity 0ms linear var(--dur-fast);
	}
	@media (prefers-reduced-motion: reduce) {
		.glyph {
			stroke-dashoffset: 0;
			transition: opacity var(--dur-base) var(--ease-out);
		}
		[data-status='done'] .check,
		[data-status='failed'] .cross,
		[data-status='cancelled'] .cross {
			transition: opacity var(--dur-base) var(--ease-out);
		}
		[data-indeterminate] .ring {
			animation: sm-breathe 1400ms var(--ease-out) infinite;
		}
	}
	@keyframes sm-breathe {
		50% {
			opacity: 0.45;
		}
	}
</style>
