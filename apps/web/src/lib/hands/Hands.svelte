<script lang="ts">
	import { FINGERS, fingerLabel, handOf, kindOf, type Finger } from '@sqwer/layouts';
	import { FINGER_SHAPES, OUTLINES, SHADING, SHADING_COLOURS, SHADING_STOPS, TIPS, VIEW } from './geometry.ts';

	export interface LegendItem {
		value: string;
		/** Shown in bold, for example the fastest finger. */
		strong?: boolean;
		/** Briefly raised and highlighted, as if the key were being pressed. */
		lit?: boolean;
	}

	interface Props {
		/** Figure description. Empty = decorative (hidden from assistive tech). */
		label: string;
		/** Per-finger colour strength 0-1. Omitted fingers uncoloured. Default: all at 1. */
		tone?: Partial<Record<Finger, number>>;
		/** A finger to emphasise: it is shown at full colour strength. */
		active?: Finger | null;
		/** Values shown in a row above the hands, each connected to its fingertip. */
		legend?: Partial<Record<Finger, LegendItem>>;
		/** Makes each finger selectable. */
		onselect?: (f: Finger) => void;
		/** Accessible name for each selectable finger. */
		fingerName?: (f: Finger) => string;
		disabled?: boolean;
		/** Legend text size in figure units (the hands are 300 units wide); larger suits narrow layouts. */
		legendSize?: number;
		/** Draws the fingers and legend in one after another when the figure first appears. */
		animate?: boolean;
		/** Selection by pointer only, when equivalent keyboard controls are shown next to the figure. */
		pointerOnly?: boolean;
	}

	let { label, tone, active = null, legend, onselect, fingerName = fingerLabel, disabled = false, pointerOnly = false, legendSize = 10, animate = false }: Props = $props();

	const uid = $props.id();
	const legendY = $derived(-8 - legendSize);
	const top = $derived(legend ? -14 - legendSize * 1.8 : -2);
	const viewBox = $derived(`0 ${top} ${VIEW.width} ${VIEW.height - top + 2}`);

	// Legend labels are spread evenly over each hand so that neighbouring values never overlap.
	const LABEL_X: Record<Finger, number> = {
		lp: 30, lr: 52, lm: 74, li: 96, lt: 118,
		rt: 182, ri: 204, rm: 226, rr: 248, rp: 270
	};

	const strength = (f: Finger) => Math.max(0, Math.min(1, tone ? (tone[f] ?? 0) : 1));
	let hovered = $state<Finger | null>(null);

	function onkeydown(e: KeyboardEvent, f: Finger) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onselect?.(f);
		}
	}
</script>

<svg
	class="hands"
	class:interactive={!!onselect && !disabled}
	class:animate
	{viewBox}
	role={!label ? undefined : onselect && !pointerOnly ? 'group' : 'img'}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<defs>
		{#each FINGERS as f (f)}
			{@const d = SHADING[handOf(f)]}
			{@const stops = SHADING_STOPS[kindOf(f)]}
			<linearGradient id={`${uid}-${f}`} gradientUnits="userSpaceOnUse" x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}>
				<stop offset={stops.start} style:stop-color={SHADING_COLOURS[kindOf(f)]} stop-opacity="0.92" />
				<stop offset={stops.end} style:stop-color={SHADING_COLOURS[kindOf(f)]} stop-opacity="0" />
			</linearGradient>
		{/each}
	</defs>

	{#each FINGERS as f (f)}
		{@const s = strength(f)}
		{@const emphasis = active === f || hovered === f}
		{#if onselect && pointerOnly}
			<!-- Keyboard equivalents are next to the figure. -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<path
				d={FINGER_SHAPES[f]}
				class="finger"
				class:active={emphasis}
				fill={`url(#${uid}-${f})`}
				fill-opacity={emphasis ? 1 : s}
				onclick={() => !disabled && onselect?.(f)}
				onpointerenter={() => (hovered = disabled ? null : f)}
				onpointerleave={() => (hovered = hovered === f ? null : hovered)}
			/>
		{:else if onselect}
			<path
				d={FINGER_SHAPES[f]}
				class="finger"
				class:active={emphasis}
				fill={`url(#${uid}-${f})`}
				fill-opacity={emphasis ? 1 : s}
				role="button"
				tabindex={disabled ? -1 : 0}
				aria-label={fingerName(f)}
				aria-disabled={disabled}
				onclick={() => !disabled && onselect?.(f)}
				onkeydown={(e) => !disabled && onkeydown(e, f)}
				onpointerenter={() => (hovered = disabled ? null : f)}
				onpointerleave={() => (hovered = hovered === f ? null : hovered)}
			/>
		{:else}
			<path
				d={FINGER_SHAPES[f]}
				class="finger"
				class:active={emphasis}
				fill={`url(#${uid}-${f})`}
				fill-opacity={emphasis ? 1 : s}
				style:--i={FINGERS.indexOf(f)}
			/>
		{/if}
	{/each}

	<path d={OUTLINES.left} class="hand-outline" />
	<path d={OUTLINES.right} class="hand-outline" />


	{#if legend}
		<g class="legend" aria-hidden="true">
			{#each FINGERS as f (f)}
				{@const item = legend[f]}
				{#if item}
					{@const t = TIPS[f]}
					{@const lx = LABEL_X[f]}
					<line
						x1={lx}
						y1={legendY + 4}
						x2={t.x}
						y2={t.y - (kindOf(f) === 'thumb' ? 4 : 6)}
						class="leader"
						pathLength="1"
						style:--i={FINGERS.indexOf(f)}
					/>
					<text
						x={lx}
						y={legendY}
						font-size={legendSize}
						style:--i={FINGERS.indexOf(f)}
						class="value"
						class:strong={item.strong}
						class:lit={item.lit}
						class:dim={tone !== undefined && strength(f) === 0 && active !== f}
						text-anchor="middle">{item.value}</text
					>
				{/if}
			{/each}
		</g>
	{/if}
</svg>

<style>
	.hands {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.hand-outline {
		fill: var(--ink);
	}
	.finger {
		transition: fill-opacity 160ms ease;
	}
	.interactive .finger {
		cursor: pointer;
	}
	.finger:focus-visible {
		outline: none;
		stroke: var(--ink);
		stroke-width: 2;
	}
	.leader {
		stroke: var(--ink-3);
		stroke-width: 0.6;
	}
	.value {
		font-family: var(--font-sans);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		fill: var(--ink-2);
	}
	.value.strong {
		font-weight: 800;
		fill: var(--ink);
	}
	.value.dim {
		fill: var(--ink-3);
	}
	.value {
		transform-box: fill-box;
		transform-origin: center bottom;
		transition:
			transform 180ms cubic-bezier(0.3, 1.6, 0.5, 1),
			fill 180ms ease;
	}
	/* A pressed key's label lifts and turns to full ink. */
	.value.lit {
		fill: var(--ink);
		font-weight: 800;
		transform: translateY(-3px) scale(1.3);
	}
	/* Entrance: fingers fill from left to right, then each value's line draws up to its label. */
	.animate .finger {
		animation: finger-in 700ms ease both;
		animation-delay: calc(240ms + var(--i) * 70ms);
	}
	.animate .leader {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: leader-draw 520ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
		animation-delay: calc(700ms + var(--i) * 70ms);
	}
	.animate .value {
		animation: value-in 420ms ease both;
		animation-delay: calc(1000ms + var(--i) * 70ms);
	}
	@keyframes finger-in {
		from {
			opacity: 0;
		}
	}
	@keyframes leader-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
	@keyframes value-in {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.finger {
			transition: none;
		}
		.animate .finger,
		.animate .leader,
		.animate .value {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
</style>
