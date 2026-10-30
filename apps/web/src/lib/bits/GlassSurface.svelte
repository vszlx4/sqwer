<!--
	Svelte Bits: Glass Surface
	Source: https://github.com/DavidHDev/svelte-bits/blob/c37078c5ff7af7b090e510e0a2d0fbb472c1d286/static/r/glass-surface.json
	Upstream commit: c37078c5ff7af7b090e510e0a2d0fbb472c1d286
	Licence: MIT + Commons Clause, see THIRD_PARTY_NOTICES. Not covered by the GPL.
	Changes: theme from app.css tokens instead of prefers-color-scheme (follows the theme toggle); frost, edge and
	shadow from tokens; Tailwind and focus classes replaced by scoped CSS; overflow via --glass-overflow; no pointer
	interaction; refraction gated by engine and version (refractionSupported) instead of browser names; backdropBlur
	prop frosts the refracted backdrop. The literal
	colors left are the displacement map's channels (red/blue gradients, gray core), not palette colors.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	type MixBlend =
		| 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
		| 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference'
		| 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity'
		| 'plus-darker' | 'plus-lighter';

	type Props = {
		children?: Snippet;
		width?: number | string;
		height?: number | string;
		borderRadius?: number;
		borderWidth?: number;
		brightness?: number;
		opacity?: number;
		blur?: number;
		displace?: number;
		backgroundOpacity?: number;
		saturation?: number;
		backdropBlur?: number;
		distortionScale?: number;
		redOffset?: number;
		greenOffset?: number;
		blueOffset?: number;
		xChannel?: 'R' | 'G' | 'B';
		yChannel?: 'R' | 'G' | 'B';
		mixBlendMode?: MixBlend;
		class?: string;
		style?: string;
	};

	let {
		children,
		width = 200,
		height = 80,
		borderRadius = 20,
		borderWidth = 0.07,
		brightness = 50,
		opacity = 0.93,
		blur = 11,
		displace = 0,
		backgroundOpacity = 0,
		saturation = 1,
		backdropBlur = 0,
		distortionScale = -180,
		redOffset = 0,
		greenOffset = 10,
		blueOffset = 20,
		xChannel = 'R',
		yChannel = 'G',
		mixBlendMode = 'difference',
		class: className = '',
		style: extraStyle = ''
	}: Props = $props();

	const rawUid = $props.id();
	const uid = rawUid.replace(/[^a-zA-Z0-9_-]/g, '-');
	const filterId = `glass-filter-${uid}`;
	const redGradId = `red-grad-${uid}`;
	const blueGradId = `blue-grad-${uid}`;

	let containerRef: HTMLDivElement;
	let feImageRef: SVGFEImageElement;
	let redChannelRef: SVGFEDisplacementMapElement;
	let greenChannelRef: SVGFEDisplacementMapElement;
	let blueChannelRef: SVGFEDisplacementMapElement;
	let gaussianBlurRef: SVGFEGaussianBlurElement;

	let svgSupported = $state(false);

	// Displacement map: red drives x, blue drives y, the gray core sets the flat middle.
	function generateMap() {
		const rect = containerRef?.getBoundingClientRect();
		const w = rect?.width || (typeof width === 'number' ? width : 400);
		const h = rect?.height || (typeof height === 'number' ? height : 200);
		const edge = Math.min(w, h) * (borderWidth * 0.5);
		const svg = `
			<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
						<stop offset="0%" stop-color="transparent"/>
						<stop offset="100%" stop-color="red"/>
					</linearGradient>
					<linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
						<stop offset="0%" stop-color="transparent"/>
						<stop offset="100%" stop-color="blue"/>
					</linearGradient>
				</defs>
				<rect x="0" y="0" width="${w}" height="${h}" fill="black"></rect>
				<rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${redGradId})" />
				<rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
				<rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
			</svg>`;
		return `data:image/svg+xml,${encodeURIComponent(svg)}`;
	}

	function updateMap() {
		feImageRef?.setAttribute('href', generateMap());
		const list = [
			{ ref: redChannelRef, offset: redOffset },
			{ ref: greenChannelRef, offset: greenOffset },
			{ ref: blueChannelRef, offset: blueOffset }
		];
		for (const { ref, offset } of list) {
			if (!ref) continue;
			ref.setAttribute('scale', String(distortionScale + offset));
			ref.setAttribute('xChannelSelector', xChannel);
			ref.setAttribute('yChannelSelector', yChannel);
		}
		gaussianBlurRef?.setAttribute('stdDeviation', String(displace));
	}

	/**
	 * First engine version that renders an SVG filter in backdrop-filter. CSS.supports() is not enough: Gecko
	 * (Firefox 159, Zen 1.23) and WebKit accept url() and draw nothing (Mozilla bug 1961378, WebKit bug 245510).
	 * Add an engine here once a release renders it.
	 */
	const REFRACTION_SINCE: Record<string, number> = { chromium: 76 };

	/** Rendering engine and its major version, from client hints when present, else the user agent. */
	function engine(): { name: string; version: number } | null {
		const nav = navigator as Navigator & { userAgentData?: { brands: { brand: string; version: string }[] } };
		const brand = nav.userAgentData?.brands.find((b) => b.brand === 'Chromium');
		if (brand) return { name: 'chromium', version: Number(brand.version) };
		const ua = navigator.userAgent;
		const chrome = /\b(?:Chrome|Chromium)\/(\d+)/.exec(ua);
		if (chrome && !/\b(?:CriOS|FxiOS|EdgiOS)\//.test(ua)) return { name: 'chromium', version: Number(chrome[1]) };
		const gecko = /\brv:(\d+)[^)]*\) Gecko\//.exec(ua);
		if (gecko) return { name: 'gecko', version: Number(gecko[1]) };
		const webkit = /\bVersion\/(\d+).*Safari\//.exec(ua);
		if (webkit) return { name: 'webkit', version: Number(webkit[1]) };
		return null;
	}

	function refractionSupported() {
		const e = engine();
		const since = e && REFRACTION_SINCE[e.name];
		if (!since || e.version < since) return false;
		return CSS.supports('backdrop-filter', `url(#${filterId})`);
	}

	$effect(() => {
		// react to all visual props
		void [width, height, borderRadius, borderWidth, brightness, opacity, blur,
			displace, distortionScale, redOffset, greenOffset, blueOffset,
			xChannel, yChannel, mixBlendMode];
		queueMicrotask(updateMap);
	});

	onMount(() => {
		svgSupported = refractionSupported();
		const ro = new ResizeObserver(() => setTimeout(updateMap, 0));
		if (containerRef) ro.observe(containerRef);
		setTimeout(updateMap, 0);
		return () => ro.disconnect();
	});

	const containerStyle = $derived.by(() => {
		const w = typeof width === 'number' ? `${width}px` : width;
		const h = typeof height === 'number' ? `${height}px` : height;
		const base = `width:${w};height:${h};border-radius:${borderRadius}px;--glass-frost:${backgroundOpacity * 100}%;--glass-saturation:${saturation};`;
		// Blur after the refraction frosts what shows through without flattening the bent edges.
		const blur = backdropBlur ? ` blur(${backdropBlur}px)` : '';
		const filter = svgSupported ? `--glass-filter:url(#${filterId})${blur} saturate(${saturation});` : '';
		return `${base}${filter}${extraStyle}`;
	});
</script>

<div bind:this={containerRef} class="glass {className}" class:svg={svgSupported} style={containerStyle}>
	<svg class="glass-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<defs>
			<filter id={filterId} color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
				<feImage bind:this={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
				<feDisplacementMap bind:this={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
				<feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
				<feDisplacementMap bind:this={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
				<feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
				<feDisplacementMap bind:this={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
				<feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
				<feBlend in="red" in2="green" mode="screen" result="rg" />
				<feBlend in="rg" in2="blue" mode="screen" result="output" />
				<feGaussianBlur bind:this={gaussianBlurRef} in="output" stdDeviation="0.7" />
			</filter>
		</defs>
	</svg>
	<div class="glass-content">
		{@render children?.()}
	</div>
</div>

<style>
	.glass {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Hosts with dropdowns set --glass-overflow: visible. */
		overflow: var(--glass-overflow, hidden);
		/* Fallback (no refraction): upstream frosted glass; the --bg tint keeps text readable where blur is missing. */
		background: color-mix(in srgb, var(--bg) 70%, transparent);
		-webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
		backdrop-filter: blur(12px) saturate(1.8) brightness(1.1);
		border: 1px solid color-mix(in srgb, var(--white) 30%, transparent);
		box-shadow:
			inset 0 1px 0 color-mix(in srgb, var(--white) 40%, transparent),
			inset 0 -1px 0 color-mix(in srgb, var(--white) 20%, transparent),
			0 8px 32px -12px var(--glass-shadow);
	}
	/* Chromium: refraction through the displacement filter. */
	.glass.svg {
		background: color-mix(in srgb, var(--bg) var(--glass-frost), transparent);
		-webkit-backdrop-filter: var(--glass-filter);
		backdrop-filter: var(--glass-filter);
		border-color: transparent;
		box-shadow:
			inset 0 0 2px 1px color-mix(in srgb, var(--ink) 15%, transparent),
			inset 0 0 10px 4px color-mix(in srgb, var(--ink) 6%, transparent),
			inset 0 1px 0 var(--glass-shine),
			0 10px 30px -18px var(--glass-shadow);
	}
	.glass-defs {
		position: absolute;
		inset: 0;
		z-index: -1;
		width: 100%;
		height: 100%;
		opacity: 0;
		pointer-events: none;
	}
	.glass-content {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: inherit;
	}
</style>
