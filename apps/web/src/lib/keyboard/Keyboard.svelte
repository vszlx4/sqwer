<script lang="ts">
	import { kindOf, type Finger, type KeyboardLayout, type KeyDef } from '@sqwer/layouts';
	import type { ZoneInfo } from './types.ts';

	interface Props {
		layout: KeyboardLayout;
		/** Physical keys currently held down. */
		pressed?: ReadonlySet<string>;
		/** Key just pressed correctly. */
		okKey?: string | null;
		/** Key just pressed incorrectly. */
		errorKey?: string | null;
		/** Keys to highlight (for example, the key being tagged in finger mapping). */
		highlight?: ReadonlySet<string>;
		showZones?: boolean;
		/** Per-key finger colouring that replaces the standard zones (e.g. a finger map). */
		zoneMap?: ReadonlyMap<string, ZoneInfo>;
		/** Keys to mark as still needing data. */
		pendingKeys?: ReadonlySet<string>;
		/** Makes character keys selectable. */
		onkeyselect?: (code: string) => void;
		selectedKey?: string | null;
		class?: string;
		label?: string;
	}

	let {
		layout,
		pressed = new Set(),
		okKey = null,
		errorKey = null,
		highlight,
		showZones = false,
		zoneMap,
		pendingKeys,
		onkeyselect,
		selectedKey = null,
		class: className = '',
		label = 'Keyboard'
	}: Props = $props();

	const uid = $props.id();
	const U = 60;
	const GAP = 4;
	const PAD = 0.2;

	const width = $derived((layout.width + PAD * 2) * U);
	const height = $derived((layout.height + PAD * 2) * U);
	const zoneColor = (f: Finger) => `var(--f-${kindOf(f)})`;

	function legend(k: KeyDef): { main: string; top?: string } {
		if (!k.char || k.code === 'Space') return { main: k.label };
		if (/^[a-z]$/.test(k.label)) return { main: k.label.toUpperCase() };
		return { main: k.label, top: k.shiftLabel };
	}

	type KeyState = 'error' | 'ok' | 'highlight' | 'pressed' | 'idle';
	function stateOf(k: KeyDef): KeyState {
		if (errorKey === k.code) return 'error';
		if (okKey === k.code) return 'ok';
		if (highlight?.has(k.code)) return 'highlight';
		if (pressed.has(k.code)) return 'pressed';
		return 'idle';
	}

	const FILL: Record<KeyState, string> = {
		error: 'var(--error)',
		ok: 'var(--accent)',
		highlight: 'var(--accent)',
		pressed: 'var(--key-pressed)',
		idle: 'var(--key)'
	};
	const INK: Record<KeyState, string> = {
		error: 'var(--white)',
		ok: 'var(--on-accent)',
		highlight: 'var(--on-accent)',
		pressed: 'var(--key-label)',
		idle: 'var(--key-label)'
	};

	function zoneFor(k: KeyDef): ZoneInfo | null {
		if (zoneMap) return zoneMap.get(k.code) ?? null;
		return showZones ? { finger: k.finger, strength: 0.55 } : null;
	}

	function keyKeydown(e: KeyboardEvent, code: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onkeyselect?.(code);
		}
	}
</script>

<svg class={className} viewBox={`${-PAD * U} ${-PAD * U} ${width} ${height}`} role={onkeyselect ? 'group' : 'img'} aria-label={label}>
	<defs>
		<pattern id={`${uid}-pending`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
			<rect width="8" height="8" fill="var(--key)" />
			<line x1="0" y1="0" x2="0" y2="8" stroke="var(--line)" stroke-width="3" />
		</pattern>
	</defs>

	<rect
		x={-PAD * U * 0.6}
		y={-PAD * U * 0.6}
		width={(layout.width + PAD * 1.2) * U}
		height={(layout.height + PAD * 1.2) * U}
		rx="3"
		fill="var(--surface)"
		stroke="var(--line-strong)"
		stroke-width="1.5"
	/>

	{#each layout.keys as k (k.code)}
		{@const x = k.x * U + GAP / 2}
		{@const y = k.y * U + GAP / 2}
		{@const w = k.w * U - GAP}
		{@const h = k.h * U - GAP}
		{@const state = stateOf(k)}
		{@const down = state !== 'idle' && state !== 'highlight'}
		{@const small = k.h < 1}
		{@const zone = state === 'idle' || state === 'pressed' ? zoneFor(k) : null}
		{@const pending = pendingKeys?.has(k.code) && !zone && state === 'idle'}
		{@const l = legend(k)}
		<g class="key" style:transform={down ? 'translateY(1.5px)' : 'none'}>
			<rect {x} {y} width={w} height={h} rx="3" fill={pending ? `url(#${uid}-pending)` : FILL[state]} stroke="var(--key-edge)" stroke-width="1.2" />
			{#if zone}
				<rect {x} {y} width={w} height={h} rx="3" fill={zoneColor(zone.finger)} opacity={0.12 + zone.strength * 0.3} />
				<rect x={x + 6} y={y + h - 6} width={w - 12} height="3" rx="1.5" fill={zoneColor(zone.finger)} />
			{/if}
			{#if selectedKey === k.code}
				<rect x={x - 2} y={y - 2} width={w + 4} height={h + 4} rx="3" fill="none" stroke="var(--ink)" stroke-width="2.5" />
			{/if}
			{#if k.char && k.code !== 'Space'}
				{#if l.top}
					<text x={x + w / 2} y={y + h * 0.36} text-anchor="middle" class="legend sym" fill={INK[state]}>{l.top}</text>
					<text x={x + w / 2} y={y + h * 0.72} text-anchor="middle" class="legend sym" fill={INK[state]}>{l.main}</text>
				{:else}
					<text x={x + w / 2} y={y + h * 0.48} text-anchor="middle" dominant-baseline="middle" class="legend letter" fill={INK[state]}>{l.main}</text>
				{/if}
				{#if k.code === 'KeyF' || k.code === 'KeyJ'}
					<rect x={x + w / 2 - 6} y={y + h - 11} width="12" height="2" rx="1" fill={INK[state]} opacity="0.7" />
				{/if}
			{:else if k.code !== 'Space'}
				<text
					x={k.align === 'end' ? x + w - 8 : k.align === 'center' ? x + w / 2 : x + 8}
					y={small ? y + h / 2 + 1 : y + h - 9}
					text-anchor={k.align === 'end' ? 'end' : k.align === 'center' ? 'middle' : 'start'}
					dominant-baseline={small ? 'middle' : 'auto'}
					class="legend mod"
					fill={INK[state]}>{l.main}</text
				>
			{/if}
		</g>
	{/each}

	{#if onkeyselect}
		{#each layout.keys.filter((k) => k.char || k.code.startsWith('Shift')) as k (k.code)}
			<rect
				class="hit"
				x={k.x * U}
				y={k.y * U}
				width={k.w * U}
				height={k.h * U}
				role="button"
				tabindex="0"
				aria-label={`${k.code === 'Space' ? 'Space' : legend(k).main} key details`}
				aria-pressed={selectedKey === k.code}
				onclick={() => onkeyselect?.(k.code)}
				onkeydown={(e) => keyKeydown(e, k.code)}
			/>
		{/each}
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
		user-select: none;
	}
	.key {
		transition: transform 60ms ease-out;
	}
	.key rect {
		transition: fill 70ms ease-out;
	}
	.legend {
		font-family: var(--font-sans);
		pointer-events: none;
	}
	.letter {
		font-size: 19px;
		font-weight: 500;
	}
	.sym {
		font-size: 14px;
		font-weight: 500;
	}
	.mod {
		font-size: 11.5px;
		font-weight: 500;
		letter-spacing: 0.01em;
	}
	.hit {
		fill: transparent;
		cursor: pointer;
	}
	.hit:focus-visible {
		outline: none;
		stroke: var(--ink);
		stroke-width: 3;
		box-shadow: none;
	}
</style>
