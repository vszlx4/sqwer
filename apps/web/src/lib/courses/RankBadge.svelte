<script lang="ts">
	import type { Rank, Tier } from './progression.ts';

	/** Keycap rank badge in the tier's material, level on the face, up to five stars. Decorative. */
	let { rank, size = 56, locked = false }: { rank: Rank; size?: number; locked?: boolean } = $props();
	const id = $props.id();

	const MATERIALS: Record<Tier, { face: [string, string]; body: [string, string]; ink: string; glow: string }> = {
		bronze: { face: ['#f6cfa8', '#cd8752'], body: ['#9a5a2c', '#6b3a19'], ink: '#4a250c', glow: '#e9a46c' },
		silver: { face: ['#fbfcfd', '#b4bdc8'], body: ['#808b98', '#566070'], ink: '#2c333d', glow: '#d5dce4' },
		gold: { face: ['#fff0b8', '#e5a92a'], body: ['#b07408', '#7c5104'], ink: '#4b3100', glow: '#f5cd58' },
		emerald: { face: ['#b6f5da', '#1fae7b'], body: ['#0e7552', '#074d36'], ink: '#043222', glow: '#4fd6a2' },
		diamond: { face: ['#f1f8ff', '#a9b9ff'], body: ['#5363b8', '#2c3574'], ink: '#1c2257', glow: '#9fe7f5' }
	};
	const m = $derived(MATERIALS[rank.tier]);
	/** One star per tier, up to five at the highest ranks. */
	const stars = $derived(Math.ceil(rank.level / 2));
	const crowned = $derived(rank.level === 10);
</script>

<svg class="badge" class:locked width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
	<defs>
		<linearGradient id={`${id}-face`} x1="0" y1="0" x2="0.6" y2="1">
			<stop offset="0" stop-color={m.face[0]} />
			<stop offset="1" stop-color={m.face[1]} />
		</linearGradient>
		<linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color={m.body[0]} />
			<stop offset="1" stop-color={m.body[1]} />
		</linearGradient>
		<radialGradient id={`${id}-shine`} cx="0.3" cy="0.15" r="0.75">
			<stop offset="0" stop-color="#fff" stop-opacity="0.75" />
			<stop offset="0.45" stop-color="#fff" stop-opacity="0" />
		</radialGradient>
	</defs>
	<!-- Soft halo in the tier colour. -->
	<ellipse cx="32" cy="56" rx="22" ry="4" fill={m.glow} opacity="0.35" />
	<!-- Keycap body and face. -->
	<rect x="7" y="9" width="50" height="47" rx="11" fill={`url(#${id}-body)`} />
	<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}-face)`} />
	<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}-shine)`} />
	<rect x="11.5" y="10.5" width="41" height="36" rx="8" fill="none" stroke="#fff" stroke-opacity="0.55" />
	<text x="32" y="36.5" text-anchor="middle" class="level" fill={m.ink}>{rank.level}</text>
	<!-- One star for each tier reached, up to five. -->
	{#each Array.from({ length: stars }) as _, i (i)}
		<path
			d="M0-3.1l.9 1.9 2.1.3-1.5 1.4.4 2.1L0 1.6l-1.9 1 .4-2.1-1.5-1.4 2.1-.3z"
			transform={`translate(${32 + (i - (stars - 1) / 2) * 7.2} 51.6)`}
			fill="#fff"
			fill-opacity="0.95"
		/>
	{/each}
	{#if crowned}
		<path d="M22 8.5 L25.5 2.5 L29 7 L32 1.5 L35 7 L38.5 2.5 L42 8.5 Z" fill="#ccf900" stroke="#1c2257" stroke-width="1" stroke-linejoin="round" />
	{/if}
</svg>

<style>
	.badge {
		flex-shrink: 0;
		overflow: visible;
		filter: drop-shadow(0 3px 6px rgb(0 0 0 / 0.16));
	}
	.badge.locked {
		filter: grayscale(1) opacity(0.32);
	}
	.level {
		font-family: var(--font-serif);
		font-size: 21px;
		font-weight: 400;
	}
</style>
