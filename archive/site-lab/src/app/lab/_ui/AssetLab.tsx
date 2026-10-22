'use client';

import { useRef, useState, type ReactNode } from 'react';
import { ARTS, SURFACES, TREATS } from '../_engine/options';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { Art } from './Art';
import { Dp } from './dp/Dp';
import { Pic } from './dp/parts';
import { copyText, download, PageHead, Sec, SpecBar } from './kit';

const ICONS: Record<string, string> = {
	home: 'M3 11l9-8 9 8M5 10v10h14V10', search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6', mail: 'M3 6h18v12H3zM3 7l9 7 9-7',
	heart: 'M12 21s-8-5.5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.5-8 11-8 11z', star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', bell: 'M6 17V11a6 6 0 0112 0v6l2 2H4zM10 21h4',
	cart: 'M3 4h3l2.5 11h10L21 7H7M10 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z', sliders: 'M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M8 16v4', lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
	calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2', play: 'M7 4l13 8-13 8z', pause: 'M7 4h4v16H7zM13 4h4v16h-4z',
	'arrow-right': 'M4 12h16M14 6l6 6-6 6', 'arrow-up-right': 'M7 17L17 7M8 7h9v9', check: 'M4 12l5 5L20 6', close: 'M5 5l14 14M19 5L5 19', plus: 'M12 4v16M4 12h16', menu: 'M4 6h16M4 12h16M4 18h16',
	download: 'M12 4v12M7 11l5 5 5-5M4 20h16', upload: 'M12 16V4M7 9l5-5 5 5M4 20h16', image: 'M3 5h18v14H3zM3 16l5-5 5 5 3-3 5 5M9 10a1 1 0 100-2 1 1 0 000 2z', camera: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 100-8 4 4 0 000 8z',
	globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', pin: 'M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11zM12 12a2 2 0 100-4 2 2 0 000 4z', code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
	terminal: 'M3 5h18v14H3zM7 10l3 2-3 2M12 15h5', book: 'M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4zM20 4h-6M20 4v14h-6', bolt: 'M13 3L5 14h6l-1 7 8-11h-6z', leaf: 'M5 19C5 9 11 4 20 4c0 9-5 15-15 15zM5 19l8-8',
	sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2', moon: 'M20 14A8 8 0 019.5 4a8 8 0 1010.5 10z', trophy: 'M7 4h10v6a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 15v4M8 21h8',
	keyboard: 'M3 6h18v12H3zM7 10h1M11 10h1M15 10h1M8 14h8'
};

const ORNAMENTS: [string, ReactNode][] = [
	['Diamond rule', <svg key="a" viewBox="0 0 200 20"><path d="M0 10h84M116 10h84" stroke="currentColor" fill="none" /><path d="M100 3l7 7-7 7-7-7z" fill="currentColor" /></svg>],
	['Wavy rule', <svg key="b" viewBox="0 0 200 20"><path d="M0 10q12-10 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0" stroke="currentColor" fill="none" strokeWidth="1.6" /></svg>],
	['Dotted rule', <svg key="c" viewBox="0 0 200 20"><path d="M4 10h192" stroke="currentColor" strokeWidth="3" strokeDasharray="0 9" strokeLinecap="round" /></svg>],
	['Triple star', <svg key="d" viewBox="0 0 200 20" fill="currentColor"><path d="M70 10l3 2 2 3-3-1-2 3-2-3-3 1 2-3zM100 4l4 5 6 1-5 4 1 6-6-3-6 3 1-6-5-4 6-1zM130 10l3 2 2 3-3-1-2 3-2-3-3 1 2-3z" /></svg>],
	['Four-point star', <svg key="e" viewBox="0 0 40 40" fill="currentColor"><path d="M20 2c1 10 8 17 18 18-10 1-17 8-18 18-1-10-8-17-18-18C12 19 19 12 20 2z" /></svg>],
	['Burst', <svg key="f" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0l3 12 10-8-5 11 12 1-11 5 8 10-11-4 0 12-6-10-6 10 0-12-11 4 8-10-11-5 12-1-5-11 10 8z" /></svg>],
	['Asterisk', <svg key="g" viewBox="0 0 40 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M20 4v32M6 12l28 16M6 28l28-16" /></svg>],
	['Corner', <svg key="h" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 56V20Q4 4 20 4h36M12 56V28Q12 12 28 12h28" /></svg>],
	['Bracket pair', <svg key="i" viewBox="0 0 80 40" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 4H6v32h8M66 4h8v32h-8" /></svg>],
	['Arrow set', <svg key="j" viewBox="0 0 120 30" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15h22M18 8l8 7-8 7M60 22l16-14M62 8h14v14M94 15h22M102 8l-8 7 8 7" /></svg>],
	['Seal', <svg key="k" viewBox="0 0 100 100"><defs><path id="seal" d="M50 50m-34 0a34 34 0 1 1 68 0a34 34 0 1 1 -68 0" /></defs><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" /><text fontSize="9.5" letterSpacing="2.5" fill="currentColor" fontFamily="monospace"><textPath href="#seal">EST · 2026 · MADE BY HAND · SQWER ·</textPath></text></svg>],
	['Scallop', <svg key="l" viewBox="0 0 200 20" fill="currentColor">{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={8 + i * 16.5} cy="8" r="8" />)}</svg>]
];

function IconSet() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	const [style, setStyle] = useState<'outline' | 'bold' | 'duotone' | 'filled'>('outline');
	const [size, setSize] = useState(28);
	const [q, setQ] = useState('');
	const [round, setRound] = useState(true);
	const el = (name: string) => {
		const d = ICONS[name];
		const sw = style === 'bold' ? 2.6 : 1.6;
		return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${style === 'filled' ? 'currentColor' : style === 'duotone' ? s.accent + '44' : 'none'}" stroke="currentColor" stroke-width="${style === 'filled' ? 1 : sw}" stroke-linecap="${round ? 'round' : 'square'}" stroke-linejoin="${round ? 'round' : 'miter'}"><path d="${d}"/></svg>`;
	};
	const names = Object.keys(ICONS).filter((n) => n.includes(q.toLowerCase()));
	return (
		<Sec title="Icons" note={`${Object.keys(ICONS).length} icons in four styles. Click to copy the SVG.`}
			actions={<>
				<input className="lab-input" style={{ width: 140 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search icons" />
				<div className="lab-seg" role="group" aria-label="Style">{(['outline', 'bold', 'duotone', 'filled'] as const).map((x) => <button key={x} aria-pressed={style === x} onClick={() => setStyle(x)}>{x}</button>)}</div>
				<input className="lab-range" style={{ width: 120 }} type="range" min={16} max={56} value={size} onChange={(e) => setSize(Number(e.target.value))} aria-label="Icon size" />
				<button className="lb" data-sm="" data-on={round ? '' : undefined} onClick={() => setRound(!round)}>Round caps</button>
			</>}>
			<div className="lab-card" style={{ padding: 6, background: s.bg, color: s.ink, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))' }}>
				{names.map((n) => (
					<button key={n} onClick={() => copyText(el(n), `${n} SVG copied`)} title={`Copy ${n}`} style={{ all: 'unset', cursor: 'pointer', display: 'grid', justifyItems: 'center', gap: 8, padding: '18px 4px', borderRadius: 3 }} className="icon-cell">
						<span style={{ color: s.accent }} dangerouslySetInnerHTML={{ __html: el(n).replace('currentColor', 'currentColor') }} />
						<span style={{ font: '10px var(--font-geist-mono), monospace', opacity: 0.7 }}>{n}</span>
					</button>
				))}
			</div>
			<style>{`.icon-cell:hover{background:color-mix(in srgb, ${s.accent} 14%, transparent)}.icon-cell:focus-visible{outline:2px solid var(--l-acc)}`}</style>
		</Sec>
	);
}

function Illustrations() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	const [seed, setSeed] = useState(3);
	const refs = useRef<Record<string, HTMLDivElement | null>>({});
	const svg = (k: string) => (refs.current[k]?.querySelector('svg')?.outerHTML ?? '').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
	return (
		<Sec title="Illustration generators" note={`${ARTS.length} procedural illustrators draw with the current palette. Re-roll the seed, copy the SVG, or set one as the design’s illustration style.`} actions={<><button className="lb" onClick={() => setSeed(Math.floor(Math.random() * 999))}>Re-roll seed ({seed})</button></>}>
			<div className="lab-grid" style={{ ['--min' as string]: '280px' }}>
				{ARTS.map((a) => (
					<div key={a.id} className="lab-tile" style={current.art === a.id ? { borderColor: 'var(--l-acc)' } : undefined}>
						<div ref={(el) => { refs.current[a.id] = el; }} style={{ aspectRatio: '4/3', display: 'block' }}><Art kind={a.id} scheme={s} seed={seed} label={a.name} /></div>
						<div className="lab-tile-meta">
							<div className="lab-tile-row"><strong>{a.name}</strong><span className="lab-mono">{a.fams?.join(' · ')}</span></div>
							<div className="lab-actions">
								<button className="lb" data-sm="" onClick={() => labStore.patch({ art: a.id })}>Use</button>
								<button className="lb" data-sm="" onClick={() => copyText(svg(a.id), 'SVG copied')}>Copy SVG</button>
								<button className="lb" data-sm="" onClick={() => download(`${a.id}-${seed}.svg`, svg(a.id), 'image/svg+xml')}>Download</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</Sec>
	);
}

function Treatments() {
	const { current } = useLab();
	return (
		<Sec title="Image treatments and textures" note="The same illustration through seven treatments, and seven texture overlays.">
			<div className="lab-card" style={{ overflow: 'hidden' }}>
				<Dp spec={current} live={false}>
					<div className="dp-demo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 28 }}>
						{TREATS.map((t) => (
							<div key={t.id} className="dp-cell" style={{ width: '100%' }}>
								<small>{t.name}</small>
								<Dp spec={{ ...current, treat: t.id }} live={false} style={{ width: '100%', background: 'transparent' }}><Pic ratio="4/3" seed={9} /></Dp>
							</div>
						))}
					</div>
				</Dp>
			</div>
			<div className="lab-grid" style={{ ['--min' as string]: '200px' }}>
				{SURFACES.map((x) => (
					<div key={x.id} className="lab-tile">
						<Dp spec={{ ...current, surface: x.id }} live={false}><div style={{ height: 130, padding: 16 }}><h3 style={{ margin: 0 }}>{x.name}</h3><p style={{ margin: '6px 0 0', fontSize: 13 }}>Texture over the page.</p></div></Dp>
						<div className="lab-tile-meta" style={{ padding: 10 }}><div className="lab-tile-row"><strong style={{ fontSize: '0.85rem' }}>{x.name}</strong><button className="lb" data-sm="" onClick={() => labStore.patch({ surface: x.id })}>Use</button></div></div>
					</div>
				))}
			</div>
		</Sec>
	);
}

export function AssetLab() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="08 · Study" title={<>Pictures that <em>come from the palette</em>.</>} lead="No stock photos and no image files: illustration, icons, ornaments and textures are all generated from the working design, so they always match it." />
				<Illustrations />
				<IconSet />
				<Sec title="Ornaments" note="Rules, stars, corners, arrows and a seal, drawn in the ink colour.">
					<div className="lab-grid" style={{ ['--min' as string]: '220px' }}>
						{ORNAMENTS.map(([n, node]) => (
							<button key={n} className="lab-tile" onClick={() => copyText(((document.getElementById(`orn-${n}`)?.innerHTML ?? '')), `${n} copied`)} style={{ cursor: 'pointer', font: 'inherit', background: s.bg, color: s.ink }}>
								<span id={`orn-${n}`} style={{ display: 'grid', placeItems: 'center', height: 100, padding: 18, color: s.accent }}><span style={{ width: '100%', maxWidth: 180, maxHeight: 70, display: 'block' }}>{node}</span></span>
								<span className="lab-tile-meta" style={{ padding: 10, color: 'var(--l-ink2)' }}><span className="lab-mono">{n}</span></span>
							</button>
						))}
					</div>
				</Sec>
				<Treatments />
			</main>
		</>
	);
}
