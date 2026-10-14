<script lang="ts">
	import type { Rank } from './progression.ts';

	/** A rank emblem: a hexagon in the rank's colour with its level. Decorative; the rank name is shown beside it. */
	let { rank, size = 56, locked = false }: { rank: Rank; size?: number; locked?: boolean } = $props();
	const id = $props.id();
</script>

<svg class="badge" class:locked width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
	<defs>
		<linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color={`hsl(${rank.hue} 85% 66%)`} />
			<stop offset="1" stop-color={`hsl(${(rank.hue + 40) % 360} 75% 46%)`} />
		</linearGradient>
	</defs>
	<polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill={`url(#${id}-g)`} />
	<polygon points="32,10 51,21 51,43 32,54 13,43 13,21" fill="none" stroke="rgb(255 255 255 / 0.55)" stroke-width="1.5" />
	{#each Array.from({ length: Math.min(3, Math.ceil(rank.level / 3.4)) }) as _, i (i)}
		<path
			d="M0-4.2l1.2 2.6 2.8.3-2.1 1.9.6 2.8L0 2.2l-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z"
			transform={`translate(${32 + (i - (Math.min(3, Math.ceil(rank.level / 3.4)) - 1) / 2) * 9} 18)`}
			fill="#fff"
		/>
	{/each}
	<text x="32" y="44" text-anchor="middle" class="level">{rank.level}</text>
</svg>

<style>
	.badge {
		flex-shrink: 0;
		filter: drop-shadow(0 4px 10px rgb(0 0 0 / 0.18));
	}
	.badge.locked {
		filter: grayscale(1) opacity(0.35);
	}
	.level {
		font-family: var(--font-sans);
		font-size: 20px;
		font-weight: 800;
		fill: #fff;
	}
</style>
