'use client';

import { useEffect, useRef, useState } from 'react';
import BlurText from '@/components/reactbits/BlurText';
import CountUp from '@/components/reactbits/CountUp';
import GradientText from '@/components/reactbits/GradientText';
import ShinyText from '@/components/reactbits/ShinyText';
import { EASES, HOVERS, REVEALS } from '../_engine/options';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { Dp } from './dp/Dp';
import { Badge, Btn, Card, Pic } from './dp/parts';
import { R } from './dp/ctx';
import { CopyBtn, PageHead, Sec, SpecBar } from './kit';

function Reveals() {
	const { current } = useLab();
	const [n, setN] = useState(1);
	return (
		<Sec title="Scroll reveals" note="Eight entrance patterns, replayed with the working design’s duration, easing and stagger." actions={<button className="lb" data-primary="" onClick={() => setN(n + 1)}>Replay all</button>}>
			<div className="lab-grid" style={{ ['--min' as string]: '300px' }}>
				{REVEALS.map((r) => (
					<div key={r.id} className="lab-tile" style={current.reveal === r.id ? { borderColor: 'var(--l-acc)' } : undefined}>
						<Dp spec={{ ...current, reveal: r.id }} live={false} replay={n}>
							<div style={{ padding: 22, minHeight: 190, display: 'grid', gap: 10, alignContent: 'start' }}>
								<h3 {...R(0)} style={{ margin: 0 }}>Reveal</h3>
								<p {...R(1)} style={{ margin: 0 }}>Each line arrives a beat after the last.</p>
								<div {...R(2)}><Badge>{r.name}</Badge></div>
								<div {...R(3)}><Btn size="sm">Continue</Btn></div>
							</div>
						</Dp>
						<div className="lab-tile-meta" style={{ padding: 10 }}><div className="lab-tile-row"><strong style={{ fontSize: '0.85rem' }}>{r.name}</strong><button className="lb" data-sm="" onClick={() => labStore.patch({ reveal: r.id })}>Use</button></div></div>
					</div>
				))}
			</div>
		</Sec>
	);
}

function Hovers() {
	const { current } = useLab();
	return (
		<Sec title="Hover responses" note="Move the pointer over each card, link and picture.">
			<div className="lab-grid" style={{ ['--min' as string]: '260px' }}>
				{HOVERS.map((h) => (
					<div key={h.id} className="lab-tile" style={current.hover === h.id ? { borderColor: 'var(--l-acc)' } : undefined}>
						<Dp spec={{ ...current, hover: h.id }} live={false}>
							<div style={{ padding: 20, display: 'grid', gap: 14, justifyItems: 'start' }}>
								<Card><h3>{h.name}</h3><p>Hover this card.</p></Card>
								<a href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>A text link</a>
								<Btn size="sm" arrow>Button</Btn>
							</div>
						</Dp>
						<div className="lab-tile-meta" style={{ padding: 10 }}><div className="lab-tile-row"><strong style={{ fontSize: '0.85rem' }}>{h.name}</strong><button className="lb" data-sm="" onClick={() => labStore.patch({ hover: h.id })}>Use</button></div></div>
					</div>
				))}
			</div>
		</Sec>
	);
}

function Easing() {
	const { current } = useLab();
	const [b, setB] = useState<[number, number, number, number]>([0.16, 1, 0.3, 1]);
	const [dur, setDur] = useState(current.dur);
	const [go, setGo] = useState(false);
	const [preset, setPreset] = useState(current.ease);
	const css = preset === 'custom' ? `cubic-bezier(${b.join(', ')})` : EASES.find((e) => e.id === preset)!.css;
	const bez = preset === 'custom' ? b : (css.match(/cubic-bezier\(([^)]+)\)/)?.[1].split(',').map(Number) as [number, number, number, number] | undefined);
	const path = bez ? `M0,100 C${bez[0] * 100},${100 - bez[1] * 100} ${bez[2] * 100},${100 - bez[3] * 100} 100,0` : '';
	useEffect(() => { const t = setInterval(() => setGo((g) => !g), dur * 1000 + 700); return () => clearInterval(t); }, [dur]);
	return (
		<Sec title="Easing and duration" note="Pick a curve or draw your own; the ball travels with the exact CSS timing function." actions={<CopyBtn text={`transition: transform ${dur}s ${css};`} label="Copy transition" />}>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,320px) minmax(0,1fr)', gap: 24 }} className="lab-two">
				<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
					<label className="ctl"><span className="ctl-row"><span>Curve</span></span><select className="lab-select" value={preset} onChange={(e) => setPreset(e.target.value)}>{EASES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}<option value="custom">Custom bézier</option></select></label>
					{preset === 'custom' && (['x1', 'y1', 'x2', 'y2'] as const).map((l, i) => <label key={l} className="ctl"><span className="ctl-row"><span>{l}</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{b[i]}</span></span><input className="lab-range" type="range" min={i % 2 ? -1 : 0} max={i % 2 ? 2 : 1} step={0.01} value={b[i]} onChange={(e) => setB(b.map((v, j) => (j === i ? Number(e.target.value) : v)) as [number, number, number, number])} /></label>)}
					<label className="ctl"><span className="ctl-row"><span>Duration</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{dur.toFixed(2)}s</span></span><input className="lab-range" type="range" min={0.1} max={2} step={0.05} value={dur} onChange={(e) => setDur(Number(e.target.value))} /></label>
					<button className="lb" data-primary="" disabled={preset === 'custom'} onClick={() => labStore.patch({ ease: preset, dur })}>Apply to design</button>
					<pre className="lab-code" style={{ whiteSpace: 'pre-wrap' }}>{css}</pre>
				</div>
				<div className="lab-card" style={{ padding: 20, display: 'grid', gap: 18 }}>
					{bez ? <svg viewBox="-8 -8 116 116" style={{ width: 'min(280px, 100%)', background: 'var(--l-bg)', border: '1px solid var(--l-line)' }} role="img" aria-label="Easing curve"><path d="M0 100H100M0 0V100M0 0L100 0M100 0V100" stroke="#fff2" fill="none" /><path d="M0,100 L100,0" stroke="#fff3" strokeDasharray="3 3" /><path d={path} stroke="var(--l-acc)" strokeWidth="2.5" fill="none" /></svg> : <p className="lab-note">Spring, bounce and stepped curves are defined by sampled points rather than a single bézier, so they have no simple graph; watch the ball.</p>}
					<div style={{ position: 'relative', height: 44, maxWidth: 440, borderBottom: '1px dashed var(--l-line2)' }}>
						<div style={{ position: 'absolute', top: 6, left: 0, width: 32, height: 32, background: 'var(--l-acc)', borderRadius: 3, transform: go ? 'translateX(396px)' : 'none', transition: `transform ${dur}s ${css}`, maxWidth: '100%' }} />
					</div>
				</div>
			</div>
			<style>{`@media (max-width: 980px){.lab-two{grid-template-columns:1fr!important}}`}</style>
		</Sec>
	);
}

function ScrollDemos() {
	const { current } = useLab();
	const box = useRef<HTMLDivElement>(null);
	const [p, setP] = useState(0);
	return (
		<Sec title="Scroll-driven" note="Parallax layers and a reading progress bar tied to scroll position, inside a scrollable frame; plus a horizontal snap gallery.">
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
				<div className="lab-card" style={{ position: 'relative', overflow: 'hidden' }}>
					<div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--l-acc)', transformOrigin: 'left', transform: `scaleX(${p})`, zIndex: 3 }} />
					<div ref={box} data-lenis-prevent style={{ height: 320, overflowY: 'auto' }} onScroll={(e) => { const t = e.currentTarget; setP(t.scrollTop / (t.scrollHeight - t.clientHeight)); }}>
						<Dp spec={current} live={false}>
							<div style={{ position: 'relative', height: 900 }}>
								{[['20%', 0.2, 'var(--accent)'], ['45%', 0.5, 'var(--accent-2)'], ['70%', 0.9, 'var(--ink)']].map(([top, k, bg], i) => <div key={i} style={{ position: 'absolute', left: `${10 + i * 25}%`, top: top as string, width: 110, height: 110, background: bg as string, borderRadius: 'var(--radius-lg)', transform: `translateY(${(p * -240 * (k as number)).toFixed(1)}px)`, opacity: 0.9 }} />)}
								<div style={{ position: 'sticky', top: 16, padding: 16 }}><h3 style={{ margin: 0 }}>Scroll me</h3><p style={{ margin: 0 }}>{Math.round(p * 100)}% read</p></div>
							</div>
						</Dp>
					</div>
				</div>
				<div className="lab-card" style={{ overflow: 'hidden' }}>
					<div data-lenis-prevent style={{ overflowX: 'auto', display: 'flex', scrollSnapType: 'x mandatory' }}>
						<Dp spec={current} live={false} style={{ display: 'flex', minWidth: '100%', width: 'max-content' }}>
							{[0, 1, 2, 3, 4].map((i) => <div key={i} style={{ flex: '0 0 320px', padding: 16, scrollSnapAlign: 'start' }}><Pic ratio="4/3" seed={i + 4} caption={`Slide ${i + 1}`} /></div>)}
						</Dp>
					</div>
					<p className="lab-note" style={{ padding: 12 }}>Horizontal scroll-snap gallery; drag, swipe or use the trackpad.</p>
				</div>
			</div>
		</Sec>
	);
}

const STAR = Array.from({ length: 20 }, (_, i) => { const a = (i / 20) * Math.PI * 2 - Math.PI / 2; const r = i % 2 ? 22 : 46; return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r] as [number, number]; });
const CIRCLE = Array.from({ length: 20 }, (_, i) => { const a = (i / 20) * Math.PI * 2 - Math.PI / 2; return [50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40] as [number, number]; });
const SQUARE = Array.from({ length: 20 }, (_, i) => { const t = i / 20; const side = Math.floor(t * 4); const u = (t * 4) % 1; const pts: [number, number][] = [[12, 12], [88, 12], [88, 88], [12, 88]]; const a = pts[side]; const b = pts[(side + 1) % 4]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u] as [number, number]; });
const SHAPES = [CIRCLE, STAR, SQUARE];

function Morph() {
	const [i, setI] = useState(0);
	const [pts, setPts] = useState(CIRCLE);
	const cur = useRef(CIRCLE);
	useEffect(() => {
		const from = cur.current;
		const to = SHAPES[i];
		const t0 = performance.now();
		let raf = 0;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const step = (now: number) => {
			const k = reduce ? 1 : Math.min(1, (now - t0) / 900);
			const e = 1 - (1 - k) ** 3;
			const next = from.map((p, j) => [p[0] + (to[j][0] - p[0]) * e, p[1] + (to[j][1] - p[1]) * e] as [number, number]);
			cur.current = next;
			setPts(next);
			if (k < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		return () => cancelAnimationFrame(raf);
	}, [i]);
	useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % 3), 2200); return () => clearInterval(t); }, []);
	return (
		<svg viewBox="0 0 100 100" width="150" height="150" aria-label="Morphing shape" role="img"><polygon points={pts.map((p) => p.join(',')).join(' ')} fill="var(--accent)" stroke="var(--ink)" strokeWidth="var(--bw)" strokeLinejoin="round" /></svg>
	);
}

function Misc() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	const [k, setK] = useState(0);
	return (
		<>
			<Sec title="Morphing and loading" note="Shape morphing by point interpolation, an organic border-radius morph, and every loader." actions={<button className="lb" onClick={() => setK(k + 1)}>Restart</button>}>
				<div className="lab-card" style={{ overflow: 'hidden' }}>
					<Dp spec={current} live={false} key={k}>
						<div className="dp-demo dp-rowwrap" style={{ gap: 56, alignItems: 'center' }}>
							<div className="dp-cell"><small>Polygon morph</small><Morph /></div>
							<div className="dp-cell"><small>Blob morph</small><div className="dp-morph" /></div>
							<div className="dp-cell"><small>Spinner</small><div className="dp-ring-load" /></div>
							<div className="dp-cell"><small>Dots</small><div className="dp-dots-load"><i /><i /><i /></div></div>
							<div className="dp-cell"><small>Bars</small><div className="dp-bars-load"><i /><i /><i /><i /></div></div>
							<div className="dp-cell"><small>Pixels</small><div className="dp-pixel-load">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div></div>
							<div className="dp-cell" style={{ width: 220 }}><small>Skeleton</small><div className="dp-skel" /><div className="dp-skel" style={{ width: '60%' }} /></div>
							<div className="dp-cell"><small>Typing</small><span className="dp-type-load" style={{ fontFamily: 'var(--f-mono)' }}>building</span></div>
						</div>
					</Dp>
				</div>
			</Sec>
			<Sec title="Text animation" note="React Bits text effects, fed the design’s own colours.">
				<div className="lab-card" style={{ padding: 28, background: s.bg, color: s.ink, display: 'grid', gap: 26 }}>
					<BlurText key={`b${k}`} text="Words arrive out of focus, then settle." delay={140} animateBy="words" direction="top" className="" />
					<div style={{ fontSize: '2rem', fontFamily: 'Georgia, serif' }}><ShinyText text="A shimmer passes across the letters" color={s.ink2} shineColor={s.accent} speed={3} /></div>
					<div style={{ fontSize: '2.6rem', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}><GradientText colors={[s.accent, s.accent2, s.accent]} animationSpeed={6}>Colour that moves</GradientText></div>
					<div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', fontFamily: 'Georgia, serif', fontSize: '3rem' }}>
						<span><CountUp to={97} suffix="%" duration={2} key={`c1${k}`} /></span>
						<span><CountUp to={1840} separator="," duration={2.4} key={`c2${k}`} /></span>
						<span><CountUp to={12.4} decimals={1} prefix="+" suffix="%" duration={2} key={`c3${k}`} /></span>
					</div>
				</div>
			</Sec>
		</>
	);
}

export function MotionLab() {
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="07 · Study" title={<>Motion with <em>intent</em>.</>} lead="Reveals, hovers, easing curves you can draw, scroll-driven parallax, morphing, loaders and text effects. Reduced-motion preferences switch the movement off." />
				<Reveals />
				<Hovers />
				<Easing />
				<ScrollDemos />
				<Misc />
			</main>
		</>
	);
}
