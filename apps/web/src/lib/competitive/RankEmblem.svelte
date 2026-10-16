<script lang="ts">
	import { LEAGUES, type League } from '#lib/progress/competitive.ts';

	/**
	 * A competitive rank insignia, drawn as a small 3D object in the manner of military rank
	 * insignia: chevron stacks for the first ranks, a star over chevrons for the middle ranks and a
	 * shield patch with a star and chevrons from Champion. The division (III to I) is the number of
	 * chevrons. Lower ranks are brushed and polished metal, the higher ranks are cut glass gems,
	 * and Zenith is white diamond with wings, a halo and prismatic light.
	 * Decorative: the rank name is always written beside it.
	 */
	interface Props {
		/** The rank, or null for unranked. */
		league: League | null;
		/** 1 for division III, 2 for II, 3 for I. Ranks shown on their own use three. */
		division?: number;
		size?: number;
		/** A soft light behind the insignia, for featured places. */
		glow?: boolean;
		locked?: boolean;
	}

	let { league, division, size = 96, glow = false, locked = false }: Props = $props();
	const uid = $props.id();

	type Material = { kind: 'metal' | 'glass' | 'diamond'; light: string; base: string; dark: string; deep: string };
	const MATERIALS: Record<string, Material> = {
		silver: { kind: 'metal', light: '#ffffff', base: '#b9c2cc', dark: '#6b7684', deep: '#353c46' },
		gold: { kind: 'metal', light: '#fff6c4', base: '#e8b52c', dark: '#9a6a06', deep: '#4b3302' },
		diamond: { kind: 'metal', light: '#e6f0ff', base: '#6f9df5', dark: '#2c56b8', deep: '#122760' },
		master: { kind: 'metal', light: '#f2e8ff', base: '#9d74f0', dark: '#5532b8', deep: '#241055' },
		elite: { kind: 'metal', light: '#ddffee', base: '#3cc183', dark: '#137a4b', deep: '#06381e' },
		champion: { kind: 'metal', light: '#ffe3d1', base: '#e57a43', dark: '#9a3d12', deep: '#461805' },
		grandmaster: { kind: 'glass', light: '#ffd6e5', base: '#ff2d6f', dark: '#9c0636', deep: '#4a0018' },
		prodigy: { kind: 'glass', light: '#d8fcff', base: '#19d3f0', dark: '#057d93', deep: '#023642' },
		overlord: { kind: 'glass', light: '#efdcff', base: '#9a4dff', dark: '#5410b8', deep: '#220450' },
		transcendent: { kind: 'glass', light: '#dfecff', base: '#3d7dff', dark: '#0d3bb8', deep: '#031856' },
		zenith: { kind: 'diamond', light: '#ffffff', base: '#e9f0ff', dark: '#a9b8d6', deep: '#5d6b8a' }
	};
	const UNRANKED: Material = { kind: 'metal', light: '#e9e9e4', base: '#9a9a93', dark: '#5a5a55', deep: '#2a2a28' };
	/** The star and chevrons on glass patches are polished silver; on Zenith, a cut diamond. */
	const INSIGNIA: Material = { kind: 'metal', light: '#ffffff', base: '#e2e8f0', dark: '#9aa6b6', deep: '#4c5566' };
	const DIAMOND_STAR: Material = { kind: 'diamond', light: '#ffffff', base: '#dfe8fb', dark: '#7f93bf', deep: '#4a5a80' };

	const index = $derived(league ? LEAGUES.findIndex((l) => l.id === league.id) : -1);
	const m = $derived(league ? MATERIALS[league.id]! : UNRANKED);
	const design = $derived(index < 0 ? 'patch' : index <= 1 ? 'chevrons' : index <= 4 ? 'star' : 'patch');
	const count = $derived(!league || league.id === 'zenith' ? 0 : Math.min(3, Math.max(1, division ?? 3)));
	const wings = $derived(index >= 8);
	const zenith = $derived(league?.id === 'zenith');
	const insignia = $derived(zenith ? DIAMOND_STAR : m.kind === 'metal' && design === 'patch' && index >= 0 ? { ...m, base: m.light, dark: m.base, deep: m.dark } : INSIGNIA);

	/* --------------------------------------------------------------- geometry */

	/** A chevron band pointing down, from x0 to x1, with its top at y. */
	function chevron(x0: number, x1: number, y: number, thick: number, depth: number): string {
		const cx = (x0 + x1) / 2;
		return `M${x0} ${y} L${cx} ${y + depth} L${x1} ${y} L${x1} ${y + thick} L${cx} ${y + depth + thick} L${x0} ${y + thick} Z`;
	}
	/** The top edge of a chevron, for its highlight. */
	const chevronEdge = (x0: number, x1: number, y: number, depth: number) => `M${x0} ${y} L${(x0 + x1) / 2} ${y + depth} L${x1} ${y}`;

	interface Stack {
		x0: number;
		x1: number;
		top: number;
		thick: number;
		depth: number;
		gap: number;
	}
	const stack = $derived.by<Stack>(() => {
		if (design === 'chevrons') {
			const thick = 15;
			const gap = 21;
			const height = (count - 1) * gap + thick + 16;
			return { x0: 16, x1: 104, top: 60 - height / 2, thick, depth: 16, gap };
		}
		if (design === 'star') return { x0: 33, x1: 87, top: 70, thick: 8.5, depth: 9, gap: 12.5 };
		return { x0: 41, x1: 79, top: 64, thick: 6.5, depth: 7, gap: 9.5 };
	});
	const star = $derived(design === 'star' ? { cx: 60, cy: 40, r: 27 } : zenith ? { cx: 60, cy: 50, r: 30 } : { cx: 60, cy: 39, r: 20 });

	const lerp = (a: string, b: string, t: number) => {
		const pa = parseInt(a.slice(1), 16);
		const pb = parseInt(b.slice(1), 16);
		const ch = (p: number, s: number) => (p >> s) & 255;
		const mix = (s: number) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t);
		return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, '0')}`;
	};

	/** A five-pointed star cut into ten facets, each shaded by its angle to a light at the top left. */
	function facets(cx: number, cy: number, r: number, mat: Material, prism = false) {
		const pt = (a: number, rad: number) => [cx + rad * Math.cos((a * Math.PI) / 180), cy + rad * Math.sin((a * Math.PI) / 180)] as const;
		const out: { d: string; fill: string }[] = [];
		const tints = ['#ffd6f0', '#d6f6ff', '#fff4c8', '#e2dcff'];
		for (let i = 0; i < 5; i++) {
			const a = -90 + i * 72;
			const o = pt(a, r);
			const prev = pt(a - 36, r * 0.42);
			const next = pt(a + 36, r * 0.42);
			for (const [side, inner, mid] of [
				[0, prev, a - 18],
				[1, next, a + 18]
			] as const) {
				const light = (Math.cos(((mid - -135) * Math.PI) / 180) + 1) / 2;
				const shade = side === 0 ? light : light * 0.7;
				let fill = shade > 0.5 ? lerp(mat.base, mat.light, (shade - 0.5) * 2) : lerp(mat.dark, mat.base, shade * 2);
				if (prism && (i + side) % 2 === 0) fill = lerp(fill, tints[(i + side) % tints.length]!, 0.45);
				out.push({ d: `M${cx} ${cy} L${o[0]} ${o[1]} L${inner[0]} ${inner[1]} Z`, fill });
			}
		}
		const outline = Array.from({ length: 10 }, (_, i) => pt(-90 + i * 36, i % 2 ? r * 0.42 : r).join(',')).join(' ');
		return { facets: out, outline };
	}
	const starShape = $derived(design === 'chevrons' || !league ? null : facets(star.cx, star.cy, star.r, design === 'star' ? m : insignia, zenith));

	const PATCH = 'M27 8 H93 Q97 8 97 12 V83 L60 106 L23 83 V12 Q23 8 27 8 Z';
	/** Facets of the white diamond patch: lines from the centre to its corners. */
	const DIAMOND_FACETS = [
		{ d: 'M60 52 L27 8 H93 Z', t: 0.95 },
		{ d: 'M60 52 L93 8 L97 12 V83 Z', t: 0.55 },
		{ d: 'M60 52 L97 83 L60 106 Z', t: 0.3 },
		{ d: 'M60 52 L60 106 L23 83 Z', t: 0.45 },
		{ d: 'M60 52 L23 83 V12 L27 8 Z', t: 0.8 }
	];
	const SPARKS = [
		{ x: 104, y: 18, s: 7, d: 0 },
		{ x: 14, y: 30, s: 5, d: 0.8 },
		{ x: 100, y: 92, s: 4.5, d: 1.6 },
		{ x: 22, y: 98, s: 6, d: 2.2 }
	];
</script>

<svg
	class="emblem"
	class:locked
	class:glow={glow || index >= 6}
	class:zenith
	width={size}
	height={size}
	viewBox="-12 -14 144 144"
	aria-hidden="true"
	style:--glow={zenith ? '#ffffff' : m.base}
>
	<defs>
		<!-- Brushed metal: alternating light bands give the look of polished steel. -->
		<linearGradient id={`${uid}-face`} x1="0.1" y1="0" x2="0.9" y2="1">
			{#if m.kind === 'metal'}
				<stop offset="0" stop-color={m.light} />
				<stop offset="0.32" stop-color={m.base} />
				<stop offset="0.5" stop-color={m.light} stop-opacity="0.9" />
				<stop offset="0.68" stop-color={m.base} />
				<stop offset="1" stop-color={m.dark} />
			{:else if m.kind === 'glass'}
				<stop offset="0" stop-color={m.light} />
				<stop offset="0.25" stop-color={m.base} />
				<stop offset="0.75" stop-color={m.dark} />
				<stop offset="1" stop-color={m.deep} />
			{:else}
				<stop offset="0" stop-color="#ffffff" />
				<stop offset="0.35" stop-color="#eef3ff" />
				<stop offset="0.6" stop-color="#d4def3" />
				<stop offset="1" stop-color="#ffffff" />
			{/if}
		</linearGradient>
		<linearGradient id={`${uid}-ins`} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color={design === 'patch' ? insignia.light : m.light} />
			<stop offset="0.45" stop-color={design === 'patch' ? insignia.base : m.base} />
			<stop offset="1" stop-color={design === 'patch' ? insignia.dark : m.dark} />
		</linearGradient>
		<linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#ffffff" stop-opacity="0.75" />
			<stop offset="1" stop-color="#ffffff" stop-opacity="0" />
		</linearGradient>
		<radialGradient id={`${uid}-inner`} cx="0.5" cy="0.62" r="0.6">
			<stop offset="0" stop-color={m.light} stop-opacity="0.55" />
			<stop offset="1" stop-color={m.light} stop-opacity="0" />
		</radialGradient>
		<radialGradient id={`${uid}-halo`} cx="0.5" cy="0.5" r="0.5">
			<stop offset="0" stop-color={zenith ? '#ffffff' : m.base} stop-opacity={zenith ? 0.9 : 0.5} />
			<stop offset="1" stop-color={zenith ? '#ffffff' : m.base} stop-opacity="0" />
		</radialGradient>
		<linearGradient id={`${uid}-ring`} x1="0" y1="0" x2="1" y2="0">
			<stop offset="0" stop-color="#fff3c4" />
			<stop offset="0.5" stop-color="#ffffff" />
			<stop offset="1" stop-color="#ffe7a3" />
		</linearGradient>
		<linearGradient id={`${uid}-feather`} x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#ffffff" />
			<stop offset="0.6" stop-color={zenith ? '#e7eefc' : m.light} />
			<stop offset="1" stop-color={zenith ? '#aebbd8' : m.base} />
		</linearGradient>
		<clipPath id={`${uid}-patch`}><path d={PATCH} /></clipPath>
	</defs>

	{#if glow || index >= 6}
		<circle cx="60" cy="56" r={zenith ? 70 : 62} fill={`url(#${uid}-halo)`} />
	{/if}

	{#if wings || zenith}
		<!-- Feathered wings: three layers on each side, larger and brighter for Zenith. -->
		{@const span = zenith ? 1.18 : 0.92}
		<g transform={`translate(60 46) scale(${span}) translate(-60 -46)`}>
			{#each [-1, 1] as side (side)}
				<g transform={`translate(60 0) scale(${side} 1) translate(-60 0)`}>
					{#each [0, 1, 2, 3] as f (f)}
						<path
							d={`M30 ${30 + f * 9} C${12 - f * 5} ${22 + f * 10} ${-4 - f * 2} ${30 + f * 13} ${-10 + f * 3} ${48 + f * 12} C${2 + f * 2} ${44 + f * 11} ${16 + f} ${44 + f * 10} 30 ${46 + f * 9} Z`}
							fill={`url(#${uid}-feather)`}
							stroke={zenith ? '#9fb0d4' : m.dark}
							stroke-width="0.8"
							stroke-linejoin="round"
							opacity={1 - f * 0.08}
						/>
					{/each}
				</g>
			{/each}
		</g>
	{/if}

	{#if zenith}
		<!-- The halo. -->
		<ellipse cx="60" cy="-3" rx="27" ry="7.5" fill="none" stroke={`url(#${uid}-ring)`} stroke-width="3.6" class="halo" />
		<ellipse cx="60" cy="-3" rx="27" ry="7.5" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.9" />
	{/if}

	{#if design === 'patch'}
		<!-- The patch: extruded edge, face, bevel and, for glass, gloss. -->
		<path d={PATCH} fill={m.deep} transform="translate(0 4.5)" />
		<path d={PATCH} fill={`url(#${uid}-face)`} stroke={m.dark} stroke-width="1.4" stroke-linejoin="round" />
		{#if zenith}
			<g clip-path={`url(#${uid}-patch)`}>
				{#each DIAMOND_FACETS as f, i (i)}
					<path d={f.d} fill={lerp('#c4d0ea', '#ffffff', f.t)} fill-opacity="0.85" />
				{/each}
				<path d="M60 52 L27 8 M60 52 L93 8 M60 52 L97 83 M60 52 L60 106 M60 52 L23 83" stroke="#ffffff" stroke-width="0.8" />
				<!-- Prismatic glints along two facets. -->
				<path d="M60 52 L93 8 L97 12 Z" fill="#ffd6f0" fill-opacity="0.55" />
				<path d="M60 52 L23 83 L23 70 Z" fill="#cdf3ff" fill-opacity="0.6" />
				<path d="M60 52 L97 83 L90 87 Z" fill="#fff1b8" fill-opacity="0.55" />
			</g>
		{:else}
			<path d={PATCH} fill={`url(#${uid}-inner)`} />
		{/if}
		<path d={PATCH} fill="none" stroke={m.light} stroke-opacity="0.8" stroke-width="1.6" transform="translate(60 57) scale(0.9) translate(-60 -57)" />
		{#if m.kind !== 'metal'}
			<g clip-path={`url(#${uid}-patch)`}>
				<ellipse cx="52" cy="14" rx="46" ry="26" fill={`url(#${uid}-gloss)`} />
				<path d="M30 70 L84 8 L92 8 L36 76 Z" fill="#ffffff" fill-opacity="0.16" />
			</g>
		{/if}
	{/if}

	<!-- Chevrons, one to three, each with an extruded edge and a lit top. -->
	{#each Array.from({ length: count }) as _, i (i)}
		{@const y = stack.top + i * stack.gap}
		<path d={chevron(stack.x0, stack.x1, y, stack.thick, stack.depth)} fill={design === 'patch' ? insignia.deep : m.deep} transform="translate(0 3)" />
		<path d={chevron(stack.x0, stack.x1, y, stack.thick, stack.depth)} fill={`url(#${uid}-ins)`} stroke={design === 'patch' ? insignia.dark : m.dark} stroke-width="0.9" stroke-linejoin="round" />
		<path d={chevronEdge(stack.x0, stack.x1, y, stack.depth)} fill="none" stroke="#ffffff" stroke-opacity="0.85" stroke-width="1.3" stroke-linecap="round" />
		{#if m.kind !== 'metal' && design !== 'patch'}
			<path d={chevron(stack.x0, stack.x1, y, stack.thick / 2, stack.depth)} fill="#ffffff" fill-opacity="0.35" />
		{/if}
	{/each}

	{#if starShape}
		<!-- The star: extruded, then ten shaded facets. -->
		<polygon points={starShape.outline} fill={design === 'patch' ? insignia.deep : m.deep} transform="translate(0 3)" />
		{#each starShape.facets as f, i (i)}
			<path d={f.d} fill={f.fill} />
		{/each}
		<polygon points={starShape.outline} fill="none" stroke={design === 'patch' ? insignia.dark : m.dark} stroke-width="0.9" stroke-linejoin="round" />
	{/if}

	{#if !league}
		<text x="60" y="68" text-anchor="middle" class="q" fill={m.deep}>?</text>
	{/if}

	{#if zenith}
		{#each SPARKS as s, i (i)}
			<path
				class="spark"
				style:animation-delay={`${s.d}s`}
				style:transform-origin={`${s.x}px ${s.y}px`}
				d={`M${s.x} ${s.y - s.s} Q${s.x} ${s.y} ${s.x + s.s} ${s.y} Q${s.x} ${s.y} ${s.x} ${s.y + s.s} Q${s.x} ${s.y} ${s.x - s.s} ${s.y} Q${s.x} ${s.y} ${s.x} ${s.y - s.s} Z`}
				fill="#ffffff"
			/>
		{/each}
	{/if}
</svg>

<style>
	.emblem {
		flex-shrink: 0;
		overflow: visible;
		filter: drop-shadow(0 5px 8px rgb(0 0 0 / 0.3));
	}
	.emblem.glow {
		filter: drop-shadow(0 0 14px color-mix(in srgb, var(--glow) 45%, transparent)) drop-shadow(0 6px 10px rgb(0 0 0 / 0.3));
	}
	.emblem.zenith {
		filter: drop-shadow(0 0 18px rgb(255 255 255 / 0.75)) drop-shadow(0 0 40px rgb(200 220 255 / 0.45)) drop-shadow(0 6px 10px rgb(0 0 0 / 0.3));
	}
	.halo {
		filter: drop-shadow(0 0 4px #fff7d6);
	}
	.spark {
		animation: twinkle 2.6s ease-in-out infinite;
	}
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(0.6);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}
	.emblem.locked {
		filter: grayscale(1) opacity(0.35);
	}
	.q {
		font-family: var(--font-serif);
		font-size: 40px;
		font-weight: 400;
	}
	@media (prefers-reduced-motion: reduce) {
		.spark {
			animation: none;
			opacity: 0.8;
		}
	}
</style>
