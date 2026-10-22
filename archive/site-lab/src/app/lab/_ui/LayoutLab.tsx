'use client';

import { useState } from 'react';
import { FEATURES, LAYOUTS } from '../_engine/options';
import { labStore, useLab } from '../_engine/store';
import { Dp, Thumb } from './dp/Dp';
import { Hero, TopNav } from './dp/heroes';
import { Features } from './dp/sections';
import { PageHead, Sec, SpecBar } from './kit';

function GridLab() {
	const { current } = useLab();
	const [cols, setCols] = useState(12);
	const [gut, setGut] = useState(16);
	const [baseline, setBaseline] = useState(false);
	const [margin, setMargin] = useState(32);
	return (
		<Sec title="Grid playground" note="Columns, gutters and a baseline overlay on a sample composition.">
			<div className="lab-card" style={{ padding: 14, display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
				{([['Columns', cols, setCols, 4, 16, 1], ['Gutter', gut, setGut, 0, 48, 2], ['Margin', margin, setMargin, 0, 96, 4]] as const).map(([n, v, set, min, max, step]) => (
					<label key={n} className="ctl" style={{ minWidth: 150 }}><span className="ctl-row"><span>{n}</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{v}</span></span><input className="lab-range" type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
				))}
				<label className="dp-opt" style={{ color: 'var(--l-ink2)', display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={baseline} onChange={(e) => setBaseline(e.target.checked)} /> Baseline grid</label>
			</div>
			<div className="lab-card" style={{ overflow: 'hidden' }}>
				<Dp spec={current} live={false}>
					<div className="dp-demo" style={{ padding: margin, position: 'relative' }}>
						{baseline && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, color-mix(in srgb, var(--accent-2) 35%, transparent) 0 1px, transparent 1px 8px)', zIndex: 5 }} />}
						<div className="dp-grid-demo" style={{ ['--cols' as string]: cols, ['--gut' as string]: `${gut}px` }}>
							{Array.from({ length: cols }, (_, i) => <div key={i}>{i + 1}</div>)}
						</div>
						<div className="dp-grid-demo" style={{ ['--cols' as string]: cols, ['--gut' as string]: `${gut}px`, marginTop: 20 }}>
							<div style={{ gridColumn: `1 / span ${Math.max(1, Math.round(cols * 0.62))}`, minHeight: 120 }}>main · 62%</div>
							<div style={{ gridColumn: `span ${Math.max(1, Math.round(cols * 0.38))}`, minHeight: 120 }}>aside · 38%</div>
						</div>
					</div>
				</Dp>
			</div>
		</Sec>
	);
}

const COMPOSITIONS: [string, string, string[]][] = [
	['Golden asymmetry', '1.618fr 1fr', ['A', 'B']],
	['Bento', 'repeat(4, 1fr)', ['a', 'b', 'c', 'd', 'e', 'f']],
	['Editorial columns', '1fr 2fr 1fr', ['margin', 'text', 'note']],
	['Off-centre', '1fr 3fr', ['rail', 'content']]
];

function Compositions() {
	const { current } = useLab();
	return (
		<Sec title="Structure sketches" note="Four ways of dividing a page, in the working design’s colours.">
			<div className="lab-card" style={{ overflow: 'hidden' }}>
				<Dp spec={current} live={false}>
					<div className="dp-demo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
						{COMPOSITIONS.map(([n, cols, parts]) => (
							<div key={n} className="dp-cell" style={{ width: '100%' }}>
								<small>{n}</small>
								<div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8, width: '100%', gridAutoRows: n === 'Bento' ? '54px' : undefined }}>
									{parts.map((p, i) => <div key={p} style={{ minHeight: 90, background: i === 0 ? 'var(--accent)' : 'var(--surface-2)', color: i === 0 ? 'var(--on-accent)' : 'var(--ink)', border: 'var(--bw) solid var(--bc)', borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center', font: '11px var(--f-mono)', gridColumn: n === 'Bento' && i === 0 ? 'span 2' : undefined, gridRow: n === 'Bento' && i === 0 ? 'span 2' : undefined }}>{p}</div>)}
								</div>
							</div>
						))}
						<div className="dp-cell" style={{ width: '100%', position: 'relative', minHeight: 170 }}>
							<small>Overlapping</small>
							<div style={{ position: 'relative', width: '100%', height: 150 }}>
								<div style={{ position: 'absolute', inset: '0 30% 20% 0', background: 'var(--accent)', borderRadius: 'var(--radius)' }} />
								<div style={{ position: 'absolute', inset: '30% 0 0 25%', background: 'var(--surface)', border: 'var(--bw) solid var(--ink)', borderRadius: 'var(--radius)', display: 'grid', placeItems: 'center', font: '11px var(--f-mono)' }}>overlaps by 25%</div>
							</div>
						</div>
						<div className="dp-cell" style={{ width: '100%' }}>
							<small>Full-screen split</small>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', height: 150, border: 'var(--bw) solid var(--ink)' }}>
								<div style={{ background: 'var(--ink)', color: 'var(--bg)', display: 'grid', placeItems: 'center', font: '11px var(--f-mono)' }}>50 / 50</div>
								<div style={{ background: 'var(--accent-2)' }} />
							</div>
						</div>
					</div>
				</Dp>
			</div>
		</Sec>
	);
}

export function LayoutLab() {
	const { current } = useLab();
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="09 · Study" title={<>Fifteen ways to <em>open</em> a page.</>} lead="Hero compositions and section layouts drawn live in the working design. Click one to apply it, and use the grid playground to check columns, gutters and baseline." />
				<Sec title="Hero compositions" note="Selected one is outlined.">
					<div className="lab-grid" style={{ ['--min' as string]: '360px' }}>
						{LAYOUTS.map((l) => (
							<div key={l.id} className="lab-tile" style={current.layout === l.id ? { borderColor: 'var(--l-acc)' } : undefined}>
								<button style={{ all: 'unset', cursor: 'pointer', display: 'block' }} onClick={() => labStore.patch({ layout: l.id })} aria-label={`Apply ${l.name}`}>
									<Thumb spec={{ ...current, layout: l.id }} ratio={0.62}><TopNav /><Hero layout={l.id} /></Thumb>
								</button>
								<div className="lab-tile-meta"><div className="lab-tile-row"><strong>{l.name}</strong><span className="lab-mono">{l.fams?.join(' · ')}</span></div><p>{l.note}</p></div>
							</div>
						))}
					</div>
				</Sec>
				<Sec title="Section layouts" note="The same six features arranged eight ways.">
					<div className="lab-grid" style={{ ['--min' as string]: '420px' }}>
						{FEATURES.map((f) => (
							<div key={f.id} className="lab-tile" style={current.features === f.id ? { borderColor: 'var(--l-acc)' } : undefined}>
								<button style={{ all: 'unset', cursor: 'pointer', display: 'block' }} onClick={() => labStore.patch({ features: f.id })} aria-label={`Apply ${f.name}`}>
									<Thumb spec={{ ...current, features: f.id }} ratio={0.75}><Features layout={f.id} /></Thumb>
								</button>
								<div className="lab-tile-meta"><div className="lab-tile-row"><strong>{f.name}</strong><span className="lab-mono">{f.fams?.join(' · ')}</span></div></div>
							</div>
						))}
					</div>
				</Sec>
				<Compositions />
				<GridLab />
			</main>
		</>
	);
}
