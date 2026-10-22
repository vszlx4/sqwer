'use client';

import { useState } from 'react';
import { BGS, SURFACES } from '../_engine/options';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { Backdrop } from './Backdrop';
import { Dp } from './dp/Dp';
import { Btn, Card, Eyebrow, Title } from './dp/parts';
import { PageHead, Sec, SpecBar, toast } from './kit';

export function BackgroundLab() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	const [id, setId] = useState(current.bg === 'plain' ? 'grain-gradient' : current.bg);
	const [i, setI] = useState(current.bgI);
	const [angle, setAngle] = useState(current.angle);
	const [surface, setSurface] = useState(current.surface);
	const meta = BGS.find((b) => b.id === id)!;
	const spec = { ...current, bg: id, bgI: i, angle, surface };
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="06 · Study" title={<>Grounds for <em>everything</em> else.</>} lead={`${BGS.length} backgrounds: gradients, noise and grain, grids and patterns, textures, glows and animated shader fields. Each re-colours itself from the palette and responds to intensity and angle.`} />
				<div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) minmax(0,1fr)', gap: 24, alignItems: 'start' }} className="lab-two">
					<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 14, position: 'sticky', top: 70 }}>
						<div><div className="lab-mono">Selected</div><strong style={{ fontFamily: 'var(--font-altera-serif), serif', fontWeight: 400, fontSize: '1.5rem' }}>{meta.name}</strong><p className="lab-note">{meta.note ?? (meta.kind === 'gl' ? 'Runs on the GPU or canvas; only the selected one animates here.' : 'Pure CSS and inline SVG.')}</p></div>
						<label className="ctl"><span className="ctl-row"><span>Intensity</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{i.toFixed(2)}</span></span><input className="lab-range" type="range" min={0} max={1} step={0.01} value={i} onChange={(e) => setI(Number(e.target.value))} /></label>
						<label className="ctl"><span className="ctl-row"><span>Gradient angle</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{angle}°</span></span><input className="lab-range" type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} /></label>
						<label className="ctl"><span className="ctl-row"><span>Texture overlay</span></span><select className="lab-select" value={surface} onChange={(e) => setSurface(e.target.value)}>{SURFACES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
						<button className="lb" data-primary="" onClick={() => { labStore.patch({ bg: id, bgI: i, angle, surface }); toast('Applied to working design'); }}>Apply to design</button>
					</div>
					<div className="lab-card" style={{ overflow: 'hidden', minHeight: 420 }}>
						<Dp spec={spec} live key={id + surface}>
							<div className="dp-demo" style={{ minHeight: 480, display: 'grid', alignContent: 'center', gap: 22, maxWidth: 760 }}>
								<Eyebrow>Background · {meta.name}</Eyebrow>
								<Title text="Text has to stay readable on top." hl="readable" />
								<p className="dp-lead">Move the sliders: a background that is lovely alone can swallow a paragraph. Check the contrast of copy and the legibility of controls over every part of the ground.</p>
								<div className="dp-rowwrap"><Btn arrow>Primary action</Btn><Btn kind="secondary">Secondary</Btn></div>
								<Card><b>A card on the ground</b><p>Surfaces keep content legible when the ground gets busy.</p></Card>
							</div>
						</Dp>
					</div>
				</div>
				<Sec title="All grounds" note="Click to preview. The shader and canvas ones show a still wash here and animate in the preview above.">
					<div className="lab-grid" style={{ ['--min' as string]: '200px' }}>
						{BGS.map((b) => (
							<button key={b.id} className="lab-tile" onClick={() => { setId(b.id); setI(b.i || 0.6); }} aria-pressed={id === b.id} style={{ cursor: 'pointer', ...(id === b.id ? { borderColor: 'var(--l-acc)' } : {}), font: 'inherit' }}>
								<span style={{ display: 'block', position: 'relative', height: 130, background: s.bg, overflow: 'hidden', ['--angle' as string]: `${angle}deg` }}>
									<Backdrop id={b.id} scheme={s} mode={current.mode} intensity={b.i || 0.6} live={false} />
								</span>
								<span className="lab-tile-meta" style={{ padding: 10 }}><span className="lab-tile-row"><strong style={{ fontSize: '0.85rem' }}>{b.name}</strong><span className="lab-mono">{b.kind === 'gl' ? 'gpu' : 'css'}</span></span></span>
							</button>
						))}
					</div>
				</Sec>
				<style>{`@media (max-width: 980px){.lab-two{grid-template-columns:1fr!important}}`}</style>
			</main>
		</>
	);
}
