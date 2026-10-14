<script lang="ts">
	import { FINGERS, fingerLabel, kindOf, type Finger } from '@sqwer/layouts';
	import { FINGER_SHAPES, OUTLINES, TIPS, VIEW } from './geometry.ts';

	export interface LegendItem {
		value: string;
		/** Shown in bold, for example the fastest finger. */
		strong?: boolean;
	}

	interface Props {
		/** Accessible description of the figure. */
		label: string;
		/** Strength of each finger's colour, from 0 (no colour) to 1. Fingers left out are not coloured. Defaults to all fingers at full strength. */
		tone?: Partial<Record<Finger, number>>;
		/** A finger to emphasise with a stronger outline. */
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
		/** Selection by pointer only, when equivalent keyboard controls are shown next to the figure. */
		pointerOnly?: boolean;
	}

	let { label, tone, active = null, legend, onselect, fingerName = fingerLabel, disabled = false, pointerOnly = false, legendSize = 10 }: Props = $props();

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
	{viewBox}
	role={onselect && !pointerOnly ? 'group' : 'img'}
	aria-label={label}
>
	<defs>
		{#each FINGERS as f (f)}
			{@const t = TIPS[f]}
			<linearGradient id={`${uid}-${f}`} gradientUnits="userSpaceOnUse" x1={t.x} y1={t.y} x2={t.x} y2={t.y + t.length * 0.95}>
				<stop offset="0" style:stop-color={`var(--f-${kindOf(f)})`} />
				<stop offset="0.55" style:stop-color={`var(--f-${kindOf(f)})`} stop-opacity="0.35" />
				<stop offset="1" style:stop-color={`var(--f-${kindOf(f)})`} stop-opacity="0" />
			</linearGradient>
		{/each}
	</defs>

	{#each FINGERS as f (f)}
		{@const s = strength(f)}
		{@const emphasis = active === f || hovered === f}
		{#if onselect && pointerOnly}
			<!-- Equivalent keyboard controls are shown next to the figure. -->
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
			<path d={FINGER_SHAPES[f]} class="finger" class:active={emphasis} fill={`url(#${uid}-${f})`} fill-opacity={emphasis ? 1 : s} />
		{/if}
	{/each}

	<path d={OUTLINES.left} class="hand-outline" />
	<path d={OUTLINES.right} class="hand-outline" />

	{#if active}
		<path d={FINGER_SHAPES[active]} class="finger-ring" />
	{/if}

	{#if legend}
		<g class="legend" aria-hidden="true">
			{#each FINGERS as f (f)}
				{@const item = legend[f]}
				{#if item}
					{@const t = TIPS[f]}
					{@const lx = LABEL_X[f]}
					<line x1={lx} y1={legendY + 4} x2={t.x} y2={t.y - (kindOf(f) === 'thumb' ? 4 : 6)} class="leader" />
					<text
						x={lx}
						y={legendY}
						font-size={legendSize}
						class="value"
						class:strong={item.strong}
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
	.finger-ring {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.6;
		pointer-events: none;
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
	@media (prefers-reduced-motion: reduce) {
		.finger {
			transition: none;
		}
	}
</style>
