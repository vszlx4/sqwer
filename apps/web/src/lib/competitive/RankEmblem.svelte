<script lang="ts">
	import { LEAGUES, type League } from '#lib/progress/competitive.ts';

	/**
	 * A competitive rank emblem in the manner of ranked games: a metallic frame whose shape grows
	 * more elaborate rank by rank, a cut gem at its centre, wings from Elite, a crown from
	 * Grandmaster and radiance at the top. Division III to I shows as one to three chevrons.
	 * Decorative: the rank name is always written beside it.
	 */
	interface Props {
		/** The rank, or null for unranked. */
		league: League | null;
		/** 1 for division III, 2 for II, 3 for I; omitted to show the rank alone. */
		division?: number;
		size?: number;
		/** A soft light behind the emblem, for featured places. */
		glow?: boolean;
		locked?: boolean;
	}

	let { league, division, size = 96, glow = false, locked = false }: Props = $props();
	const uid = $props.id();

	const PALETTES: Record<string, [string, string, string]> = {
		silver: ['#f7f9fb', '#a8b2bf', '#47505d'],
		gold: ['#fff3b8', '#e3a82a', '#6e4703'],
		diamond: ['#e6f1ff', '#5a92f6', '#1a3a86'],
		master: ['#f0e4ff', '#9a6cf2', '#3b1d80'],
		elite: ['#d9ffea', '#2db673', '#0b4a30'],
		champion: ['#ffe2d0', '#f06a2a', '#702606'],
		grandmaster: ['#ffdbe9', '#e0457b', '#640d2e'],
		prodigy: ['#d6fbff', '#18b3ce', '#0a4855'],
		overlord: ['#ede0ff', '#7344c8', '#220e4a'],
		transcendent: ['#e6f7ff', '#48a2e8', '#103a61'],
		zenith: ['#fdffe6', '#ccf900', '#465500']
	};
	const UNRANKED: [string, string, string] = ['#e9e9e4', '#9a9a93', '#3d3d3a'];

	const index = $derived(league ? LEAGUES.findIndex((l) => l.id === league.id) : -1);
	const p = $derived(league ? PALETTES[league.id]! : UNRANKED);

	/** Polygon points for a star with n points around the centre. */
	function star(n: number, outer: number, inner: number, cx = 60, cy = 60, rotate = -90): string {
		return Array.from({ length: n * 2 }, (_, i) => {
			const r = i % 2 ? inner : outer;
			const a = ((rotate + (i * 180) / n) * Math.PI) / 180;
			return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
		}).join(' ');
	}

	/** The frame: a heater shield, a cut gem, a spiked crest, a star, a radiant star, then the sun. */
	const frame = $derived.by(() => {
		if (index <= 1) return { kind: 'path', d: 'M60 12 L95 23 V55 C95 80 80 97 60 108 C40 97 25 80 25 55 V23 Z' } as const;
		if (index <= 3) return { kind: 'path', d: 'M60 10 L99 33 V83 L60 108 L21 83 V33 Z' } as const;
		if (index <= 5) return { kind: 'path', d: 'M60 8 L73 19 L98 17 L93 58 C91 82 77 98 60 110 C43 98 29 82 27 58 L22 17 L47 19 Z' } as const;
		if (index <= 7) return { kind: 'poly', d: star(8, 52, 41) } as const;
		if (index <= 9) return { kind: 'poly', d: star(12, 54, 43) } as const;
		return { kind: 'poly', d: star(16, 56, 44) } as const;
	});
	const wings = $derived(index >= 4);
	const crown = $derived(index >= 6);
	const radiant = $derived(index >= 8);
</script>

<svg class="emblem" class:locked class:glow class:pulse={index >= 6} width={size} height={size} viewBox="-10 -10 140 140" aria-hidden="true" style:--glow={p[1]}>
	<defs>
		<linearGradient id={`${uid}-metal`} x1="0.15" y1="0" x2="0.85" y2="1">
			<stop offset="0" stop-color={p[0]} />
			<stop offset="0.45" stop-color={p[1]} />
			<stop offset="1" stop-color={p[2]} />
		</linearGradient>
		<linearGradient id={`${uid}-plate`} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color={p[2]} />
			<stop offset="1" stop-color="#0b0b0b" />
		</linearGradient>
		<linearGradient id={`${uid}-gem`} x1="0.2" y1="0" x2="0.8" y2="1">
			<stop offset="0" stop-color="#ffffff" />
			<stop offset="0.35" stop-color={p[0]} />
			<stop offset="1" stop-color={p[1]} />
		</linearGradient>
		<radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color={p[1]} stop-opacity="0.55" />
			<stop offset="1" stop-color={p[1]} stop-opacity="0" />
		</radialGradient>
	</defs>

	{#if radiant}
		<!-- Rays behind the highest ranks. -->
		<g class="rays" opacity="0.7">
			{#each Array.from({ length: 12 }) as _, i (i)}
				<rect x="58.5" y="-6" width="3" height="22" rx="1.5" fill={p[0]} transform={`rotate(${i * 30} 60 60)`} />
			{/each}
		</g>
	{/if}
	{#if glow || index >= 2}
		<circle cx="60" cy="60" r="62" fill={`url(#${uid}-halo)`} />
	{/if}

	{#if wings}
		<!-- Wings grow with each rank from Elite. -->
		{@const spread = 1 + (index - 4) * 0.05}
		<g transform={`translate(60 62) scale(${spread}) translate(-60 -62)`}>
			{#each [-1, 1] as side (side)}
				<g transform={`translate(60 0) scale(${side} 1) translate(-60 0)`}>
					<path d="M30 40 C12 40 0 50 -6 64 C6 60 14 62 20 66 C10 68 4 74 0 84 C10 79 20 80 26 84 C20 88 18 94 18 100 C28 92 34 84 36 74 Z" fill={`url(#${uid}-metal)`} stroke={p[2]} stroke-width="1.2" stroke-linejoin="round" />
					<path d="M30 46 C18 47 8 54 2 63" fill="none" stroke={p[0]} stroke-opacity="0.7" stroke-width="1.2" />
				</g>
			{/each}
		</g>
	{/if}

	<!-- Frame, bevel and inner plate. -->
	{#if frame.kind === 'path'}
		<path d={frame.d} fill={`url(#${uid}-metal)`} stroke={p[2]} stroke-width="2" stroke-linejoin="round" />
		<path d={frame.d} fill="none" stroke={p[0]} stroke-opacity="0.85" stroke-width="1.4" transform="translate(60 60) scale(0.92) translate(-60 -60)" />
		<path d={frame.d} fill={`url(#${uid}-plate)`} transform="translate(60 61) scale(0.7) translate(-60 -60)" />
	{:else}
		<polygon points={frame.d} fill={`url(#${uid}-metal)`} stroke={p[2]} stroke-width="2" stroke-linejoin="round" />
		<polygon points={frame.d} fill="none" stroke={p[0]} stroke-opacity="0.85" stroke-width="1.4" transform="translate(60 60) scale(0.92) translate(-60 -60)" />
		<circle cx="60" cy="60" r="31" fill={`url(#${uid}-plate)`} stroke={p[2]} stroke-width="1.5" />
	{/if}

	<!-- The gem. -->
	{#if league}
		<g transform="translate(0 -4)">
			<path d="M60 40 L74 56 L60 76 L46 56 Z" fill={`url(#${uid}-gem)`} stroke={p[2]} stroke-width="1" />
			<path d="M60 40 L66 56 L60 76 L54 56 Z" fill="#ffffff" fill-opacity="0.18" />
			<path d="M46 56 H74" stroke="#ffffff" stroke-opacity="0.45" stroke-width="0.8" />
			<path d="M50 50 L56 45" stroke="#ffffff" stroke-opacity="0.9" stroke-width="1.6" stroke-linecap="round" />
		</g>
	{:else}
		<text x="60" y="70" text-anchor="middle" class="q" fill={p[0]}>?</text>
	{/if}

	<!-- Division: one to three chevrons. -->
	{#if division}
		{#each Array.from({ length: division }) as _, i (i)}
			<path d={`M52 ${80 + i * 5} L60 ${85 + i * 5} L68 ${80 + i * 5}`} fill="none" stroke={p[0]} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
		{/each}
	{/if}

	{#if crown}
		<path d="M44 6 L48 -6 L54 2 L60 -10 L66 2 L72 -6 L76 6 Z" fill={`url(#${uid}-metal)`} stroke={p[2]} stroke-width="1.4" stroke-linejoin="round" />
		<circle cx="60" cy="-4" r="2" fill="#ffffff" />
	{/if}

	<!-- Specular highlight. -->
	<ellipse cx="44" cy="30" rx="16" ry="7" fill="#ffffff" fill-opacity="0.22" transform="rotate(-25 44 30)" />
</svg>

<style>
	.emblem {
		flex-shrink: 0;
		overflow: visible;
		filter: drop-shadow(0 6px 10px rgb(0 0 0 / 0.28));
	}
	.emblem.glow {
		filter: drop-shadow(0 0 18px color-mix(in srgb, var(--glow) 55%, transparent)) drop-shadow(0 8px 14px rgb(0 0 0 / 0.3));
	}
	.emblem.pulse .rays {
		transform-origin: 60px 60px;
		animation: spin 24s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.emblem.locked {
		filter: grayscale(1) opacity(0.35);
	}
	.q {
		font-family: var(--font-serif);
		font-size: 30px;
	}
	@media (prefers-reduced-motion: reduce) {
		.emblem.pulse .rays {
			animation: none;
		}
	}
</style>
