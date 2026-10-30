<script lang="ts">
	import type { League } from '#lib/progress/competitive.ts';
	import { ART_WHITE, LEAGUE_GLASS, UNRANKED_GLASS, ZENITH_ART, type Glass } from '#lib/progress/rank-art.ts';

	/**
	 * Rank emblem: one cut-glass shape per rank (triangle → octagon, then 4- to 8-point stars), shared by
	 * all divisions. Zenith: white diamond. Decorative.
	 */
	interface Props {
		/** The rank, or null for unranked. */
		league: League | null;
		size?: number;
		locked?: boolean;
	}

	let { league, size = 96, locked = false }: Props = $props();
	const uid = $props.id();

	const GLASS: Record<string, Glass> = LEAGUE_GLASS;
	const UNRANKED = UNRANKED_GLASS;

	type Point = [number, number];
	/** An outline in unit coordinates; `table` is the size of the flat top face, 0 for a pyramid cut. */
	type Shape = { points: Point[]; table: number };

	const regular = (n: number, r = 0.95, offset = -90): Point[] =>
		Array.from({ length: n }, (_, i) => {
			const a = ((offset + (360 / n) * i) * Math.PI) / 180;
			return [Math.cos(a) * r, Math.sin(a) * r];
		});
	const star = (n: number, inner: number, outer: number[] = [1]): Point[] =>
		Array.from({ length: n * 2 }, (_, i) => {
			const a = ((-90 + (180 / n) * i) * Math.PI) / 180;
			const r = i % 2 ? inner : outer[(i / 2) % outer.length]!;
			return [Math.cos(a) * r, Math.sin(a) * r];
		});

	/** One shape per rank, in ladder order. */
	const SHAPES: Record<string, Shape> = {
		silver: { points: [[-1, -0.66], [1, -0.66], [0, 0.98]], table: 0.42 },
		gold: { points: [[-0.84, -0.86], [0.84, -0.86], [0.84, 0.18], [0, 0.98], [-0.84, 0.18]], table: 0.52 },
		diamond: { points: [[0, -1], [0.78, 0], [0, 1], [-0.78, 0]], table: 0.5 },
		master: { points: regular(6), table: 0.56 },
		elite: { points: regular(8, 0.97, -67.5), table: 0.6 },
		champion: { points: star(4, 0.4), table: 0 },
		grandmaster: { points: star(5, 0.46), table: 0 },
		prodigy: { points: star(6, 0.54), table: 0 },
		overlord: { points: star(8, 0.5), table: 0 },
		transcendent: { points: star(8, 0.42, [1, 0.74]), table: 0 }
	};

	const zenith = $derived(league?.id === 'zenith');
	const g = $derived(league ? GLASS[league.id]! : UNRANKED);
	const shape = $derived(league && !zenith ? SHAPES[league.id]! : SHAPES.gold!);
	/** Centre and radius of the emblem. */
	const frame = $derived(zenith ? { cx: 60, cy: 58, r: 54 } : { cx: 60, cy: 58, r: 50 });

	/* ----------------------------------------------------------------- shading */

	const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
	function mix(a: string, b: string, t: number): string {
		const x = hex(a);
		const y = hex(b);
		return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join('')}`;
	}
	/** Colour of a face lit to the degree t, from 0 (facing away) to 1 (facing the light). */
	function ramp(m: Glass, t: number): string {
		const v = Math.min(1, Math.max(0, t));
		return v < 0.5 ? mix(m.deep, m.base, v * 2) : mix(m.base, m.light, (v - 0.5) * 2);
	}
	/** Light falls from the upper left. */
	const LIGHT: Point = [-0.5, -0.866];

	const place = (p: Point, f: { cx: number; cy: number; r: number }): Point => [f.cx + p[0] * f.r, f.cy + p[1] * f.r];
	const poly = (ps: Point[]) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

	/** The faces of the cut: bevels between the outline and the top face, each lit by its slope. */
	const cut = $derived.by(() => {
		const outer = shape.points.map((p) => place(p, frame));
		const inner = shape.points.map((p) => place([p[0] * shape.table, p[1] * shape.table], frame));
		const faces = outer.map((a, i) => {
			const b = outer[(i + 1) % outer.length]!;
			const pts: Point[] = shape.table ? [a, b, inner[(i + 1) % inner.length]!, inner[i]!] : [a, b, [frame.cx, frame.cy]];
			let nx = b[1] - a[1];
			let ny = a[0] - b[0];
			const len = Math.hypot(nx, ny) || 1;
			nx /= len;
			ny /= len;
			if (nx * ((a[0] + b[0]) / 2 - frame.cx) + ny * ((a[1] + b[1]) / 2 - frame.cy) < 0) [nx, ny] = [-nx, -ny];
			const lit = nx * LIGHT[0] + ny * LIGHT[1];
			return { points: poly(pts), fill: ramp(g, 0.5 + lit * 0.62) };
		});
		return { outline: poly(outer), top: shape.table ? poly(inner) : null, faces, ridges: shape.table ? [] : outer.filter((_, i) => i % 2 === 0) };
	});

	/* ------------------------------------------------------------------ zenith */

	/** A brilliant-cut diamond seen from the side: the crown above the girdle, the pavilion below. */
	const Z = (x: number, y: number) => place([x, y], frame);
	const zenithCut = $derived.by(() => {
		const A = Z(-0.42, -0.66);
		const B = Z(0, -0.66);
		const C = Z(0.42, -0.66);
		const G = [-1, -0.5, 0, 0.5, 1].map((x) => Z(x, -0.26));
		const culet = Z(0, 0.98);
		const mids = [-0.75, -0.25, 0.25, 0.75].map((x) => Z(x * 0.5, 0.36));
		const faces: [Point[], string][] = [
			// Crown
			[[G[0]!, A, G[1]!], ZENITH_ART.crown[0]!],
			[[A, B, G[1]!], ZENITH_ART.crown[1]!],
			[[B, G[1]!, G[2]!], ZENITH_ART.crown[2]!],
			[[B, G[2]!, G[3]!], ZENITH_ART.crown[3]!],
			[[B, C, G[3]!], ZENITH_ART.crown[4]!],
			[[C, G[3]!, G[4]!], ZENITH_ART.crown[5]!],
			// Pavilion
			[[G[0]!, G[1]!, mids[0]!], ZENITH_ART.pavilion[0]!],
			[[G[0]!, mids[0]!, culet], ZENITH_ART.pavilion[1]!],
			[[G[1]!, mids[0]!, culet], ZENITH_ART.pavilion[2]!],
			[[G[1]!, G[2]!, mids[1]!], ZENITH_ART.pavilion[3]!],
			[[G[1]!, mids[1]!, culet], ZENITH_ART.pavilion[4]!],
			[[G[2]!, mids[1]!, culet], ZENITH_ART.pavilion[5]!],
			[[G[2]!, G[3]!, mids[2]!], ZENITH_ART.pavilion[6]!],
			[[G[2]!, mids[2]!, culet], ZENITH_ART.pavilion[7]!],
			[[G[3]!, mids[2]!, culet], ZENITH_ART.pavilion[8]!],
			[[G[3]!, G[4]!, mids[3]!], ZENITH_ART.pavilion[9]!],
			[[G[3]!, mids[3]!, culet], ZENITH_ART.pavilion[10]!],
			[[G[4]!, mids[3]!, culet], ZENITH_ART.pavilion[11]!]
		];
		return { outline: poly([A, C, G[4]!, culet, G[0]!]), faces: faces.map(([pts, fill]) => ({ points: poly(pts), fill })) };
	});
	const SPARKS = [
		{ x: 28, y: 20, s: 7, d: 0 },
		{ x: 96, y: 40, s: 5, d: 1.1 },
		{ x: 54, y: 84, s: 4, d: 2 }
	];
	const sparkPath = (x: number, y: number, s: number) => `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;
</script>

<svg class="emblem" class:locked width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
	<defs>
		<linearGradient id={`${uid}-top`} x1="0" y1="0" x2="0.35" y2="1">
			<stop offset="0" stop-color={mix(g.base, g.light, 0.55)} />
			<stop offset="0.45" stop-color={g.base} />
			<stop offset="0.78" stop-color={g.dark} />
			<stop offset="1" stop-color={mix(g.base, g.light, 0.25)} />
		</linearGradient>
		<radialGradient id={`${uid}-caustic`} cx="0.55" cy="0.95" r="0.6">
			<stop offset="0" stop-color={g.light} stop-opacity="0.75" />
			<stop offset="1" stop-color={g.light} stop-opacity="0" />
		</radialGradient>
		<linearGradient id={`${uid}-gloss`} x1="0" y1="0" x2="0.4" y2="1">
			<stop offset="0" stop-color={ART_WHITE} stop-opacity="0.75" />
			<stop offset="1" stop-color={ART_WHITE} stop-opacity="0" />
		</linearGradient>
		<clipPath id={`${uid}-clip`}>
			<polygon points={zenith ? zenithCut.outline : cut.outline} />
		</clipPath>
	</defs>

	{#if zenith}
		<polygon points={zenithCut.outline} transform="translate(0 3)" fill={ZENITH_ART.shadow} />
		{#each zenithCut.faces as f, i (i)}
			<polygon points={f.points} fill={f.fill} stroke={ART_WHITE} stroke-width="0.9" stroke-linejoin="round" />
		{/each}
		<g clip-path={`url(#${uid}-clip)`}>
			<polygon points={poly([Z(-1.1, -0.8), Z(0.25, -0.8), Z(-0.35, 0.3), Z(-1.1, 0.1)])} fill={`url(#${uid}-gloss)`} opacity="0.7" />
			<polygon points={poly([Z(0.1, 0.1), Z(0.32, -0.1), Z(0.04, 0.8)])} fill={ZENITH_ART.flashes[0]} opacity="0.55" />
			<polygon points={poly([Z(-0.5, -0.1), Z(-0.3, -0.05), Z(-0.12, 0.6)])} fill={ZENITH_ART.flashes[1]} opacity="0.5" />
			<polygon points={poly([Z(0.5, -0.2), Z(0.7, -0.2), Z(0.2, 0.55)])} fill={ZENITH_ART.flashes[2]} opacity="0.5" />
		</g>
		<polygon points={zenithCut.outline} fill="none" stroke={ZENITH_ART.outline} stroke-width="1.3" stroke-linejoin="round" />
		{#each SPARKS as s (s.x)}
			<path d={sparkPath(s.x, s.y, s.s)} fill={ART_WHITE} class="spark" style:animation-delay={`${s.d}s`} style:transform-origin={`${s.x}px ${s.y}px`} />
		{/each}
	{:else}
		<polygon points={cut.outline} transform={`translate(0 ${frame.r * 0.07})`} fill={g.deep} stroke={g.deep} stroke-width="1.5" stroke-linejoin="round" />
		{#each cut.faces as f, i (i)}
			<polygon points={f.points} fill={f.fill} stroke={f.fill} stroke-width="0.5" stroke-linejoin="round" />
		{/each}
		{#if cut.top}
			<polygon points={cut.top} fill={`url(#${uid}-top)`} />
			<polygon points={cut.top} fill={`url(#${uid}-caustic)`} />
			<polygon points={cut.top} fill="none" stroke={g.light} stroke-opacity="0.55" stroke-width="0.8" stroke-linejoin="round" />
		{:else}
			{#each cut.ridges as p, i (i)}
				<line x1={frame.cx} y1={frame.cy} x2={p[0]} y2={p[1]} stroke={g.light} stroke-opacity="0.5" stroke-width="0.7" />
			{/each}
		{/if}
		<g clip-path={`url(#${uid}-clip)`}>
			<ellipse
				cx={frame.cx - frame.r * 0.35}
				cy={frame.cy - frame.r * 0.62}
				rx={frame.r * 0.95}
				ry={frame.r * 0.5}
				transform={`rotate(-24 ${frame.cx - frame.r * 0.35} ${frame.cy - frame.r * 0.62})`}
				fill={`url(#${uid}-gloss)`}
				opacity="0.65"
			/>
		</g>
		<polygon points={cut.outline} fill="none" stroke={g.light} stroke-opacity="0.7" stroke-width="0.9" stroke-linejoin="round" />
		<polygon points={cut.outline} fill="none" stroke={g.deep} stroke-width="1.4" stroke-linejoin="round" />
		{#if !league}
			<text x={frame.cx} y={frame.cy + 6} text-anchor="middle" class="q" fill={g.deep}>?</text>
		{/if}
	{/if}
</svg>

<style>
	.emblem {
		flex-shrink: 0;
		overflow: visible;
		filter: drop-shadow(0 3px 4px var(--art-drop-strong));
	}
	.emblem.locked {
		filter: grayscale(1) opacity(0.35);
	}
	.spark {
		animation: twinkle 2.6s ease-in-out infinite;
	}
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.25;
			transform: scale(0.55);
		}
		50% {
			opacity: 1;
			transform: scale(1);
		}
	}
	.q {
		font-family: var(--font-serif);
		font-size: 34px;
		font-weight: 400;
	}
	@media (prefers-reduced-motion: reduce) {
		.spark {
			animation: none;
			opacity: 0.85;
		}
	}
</style>
