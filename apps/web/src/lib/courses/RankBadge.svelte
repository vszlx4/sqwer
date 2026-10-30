<script lang="ts">
	import type { Rank, Tier } from './progression.ts';
	import { ART_WHITE, BADGE_CROWN, BADGE_MATERIALS, type Material } from '#lib/progress/rank-art.ts';

	/** Keycap rank badge in the tier's material, level on the face, up to five stars. Decorative. */
	let { rank, size = 56, locked = false }: { rank: Rank; size?: number; locked?: boolean } = $props();
	const id = $props.id();

	const MATERIALS: Record<Tier, Material> = BADGE_MATERIALS;
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
			<stop offset="0" stop-color={ART_WHITE} stop-opacity="0.75" />
			<stop offset="0.45" stop-color={ART_WHITE} stop-opacity="0" />
		</radialGradient>
	</defs>
	<!-- Soft halo in the tier colour. -->
	<ellipse cx="32" cy="56" rx="22" ry="4" fill={m.glow} opacity="0.35" />
	<!-- Keycap body and face. -->
	<rect x="7" y="9" width="50" height="47" rx="11" fill={`url(#${id}-body)`} />
	<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}-face)`} />
	<rect x="11" y="10" width="42" height="37" rx="8.5" fill={`url(#${id}-shine)`} />
	<rect x="11.5" y="10.5" width="41" height="36" rx="8" fill="none" stroke={ART_WHITE} stroke-opacity="0.55" />
	<text x="32" y="36.5" text-anchor="middle" class="level" fill={m.ink}>{rank.level}</text>
	<!-- One star for each tier reached, up to five. -->
	{#each Array.from({ length: stars }) as _, i (i)}
		<path
			d="M0-3.1l.9 1.9 2.1.3-1.5 1.4.4 2.1L0 1.6l-1.9 1 .4-2.1-1.5-1.4 2.1-.3z"
			transform={`translate(${32 + (i - (stars - 1) / 2) * 7.2} 51.6)`}
			fill={ART_WHITE}
			fill-opacity="0.95"
		/>
	{/each}
	{#if crowned}
		<path d="M22 8.5 L25.5 2.5 L29 7 L32 1.5 L35 7 L38.5 2.5 L42 8.5 Z" fill={BADGE_CROWN} stroke={m.ink} stroke-width="1" stroke-linejoin="round" />
	{/if}
</svg>

<style>
	.badge {
		flex-shrink: 0;
		overflow: visible;
		filter: drop-shadow(0 3px 6px var(--art-drop));
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
