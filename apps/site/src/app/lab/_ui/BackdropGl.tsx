'use client';

// The shader and canvas backgrounds (React Bits), loaded only when one is chosen so the rest of the lab stays light.

import Aurora from '@/components/reactbits/Aurora';
import Dither from '@/components/reactbits/Dither';
import DotGrid from '@/components/reactbits/DotGrid';
import LightRays from '@/components/reactbits/LightRays';
import LineWaves from '@/components/reactbits/LineWaves';
import Particles from '@/components/reactbits/Particles';
import PixelBlast from '@/components/reactbits/PixelBlast';
import ShapeGrid from '@/components/reactbits/ShapeGrid';
import Silk from '@/components/reactbits/Silk';
import Threads from '@/components/reactbits/Threads';
import { mix, type Scheme } from '../_engine/color';

export default function BackdropGl({ id, c, mode, i }: { id: string; c: Scheme; mode: 'light' | 'dark'; i: number }) {
	const light = mode === 'light';
	const body = (() => {
		switch (id) {
			case 'aurora': return <Aurora colorStops={[c.accent, mix(c.accent, c.bg, 0.45), c.accent2]} amplitude={1} blend={0.5} lightMode={light} />;
			case 'silk': return <Silk color={light ? mix(c.accent, c.bg, 0.35) : mix(c.accent, '#000000', 0.55)} sheenColor={light ? '#ffffff' : c.ink} lightMode={light} />;
			case 'rays': return <LightRays raysOrigin="top-center" raysColor={c.accent} followMouse lightMode={light} />;
			case 'threads': return <Threads color={c.ink2} accentColor={c.accent} amplitude={1} distance={0.2} enableMouseInteraction />;
			case 'linewaves': return <LineWaves color1={c.accent} color2={c.ink2} color3={c.accent2} lightMode={light} brightness={light ? 0.6 : 1} />;
			case 'particles': return <Particles particleColors={[c.accent, c.ink2, c.accent2]} particleCount={360} particleSpread={10} speed={0.08} particleBaseSize={160} lightMode={light} />;
			case 'pixelblast': return <PixelBlast variant="square" pixelSize={5} patternDensity={1.25} color={c.accent} lightMode={light} transparent />;
			case 'dither': return <Dither waveColor={c.accent} backgroundColor={c.bg} colorNum={4} pixelSize={3} enableMouseInteraction />;
			case 'dotgrid': return <DotGrid dotSize={5} gap={22} baseColor={mix(c.ink, c.bg, 0.62)} activeColor={c.accent} proximity={130} shockRadius={220} shockStrength={4} />;
			default: return <ShapeGrid shape="square" cellSize={44} direction="diagonal" speed={0.4} lineWidth={1.2} lineColor={mix(c.ink, c.bg, 0.7)} hoverColor={c.accent} hoverFillColor={c.accent} fillOpacity={0.25} />;
		}
	})();
	return <div className="absolute inset-0" style={{ opacity: 0.3 + 0.7 * i }}>{body}</div>;
}
