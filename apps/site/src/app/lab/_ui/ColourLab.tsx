'use client';

import { useMemo, useState } from 'react';
import { contrast, customScheme, HARMONIES, hslToHex, type CustomColour, type Harmony, type Scheme } from '../_engine/color';
import { PALETTES, resolveScheme } from '../_engine/palettes';
import { FAMILIES, type Fam } from '../_engine/types';
import { labStore, useLab } from '../_engine/store';
import { Thumb } from './dp/Dp';
import { CopyBtn, PageHead, Sec, SpecBar, toast } from './kit';

const KEYS: (keyof Scheme)[] = ['bg', 'surface', 'ink', 'ink2', 'accent', 'accent2'];
const grade = (r: number) => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA large' : 'fail');

function Strip({ s }: { s: Scheme }) {
	return (
		<span style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1fr', height: 64, width: '100%' }} aria-hidden="true">
			<span style={{ background: s.bg, color: s.ink, display: 'grid', placeContent: 'center', fontFamily: 'Georgia, serif', fontSize: 26 }}>Aa</span>
			<span style={{ background: s.accent }} />
			<span style={{ background: s.accent2 }} />
		</span>
	);
}

function Palettes() {
	const { current, favs } = useLab();
	const [fam, setFam] = useState<Fam | 'all'>('all');
	const [mode, setMode] = useState<'light' | 'dark'>(current.mode);
	const [q, setQ] = useState('');
	const list = PALETTES.filter((p) => (fam === 'all' || p.fams.includes(fam)) && p.name.toLowerCase().includes(q.toLowerCase()));
	return (
		<Sec title="Palettes" note={`${PALETTES.length} palettes. Each is written once and derives its other mode; every text pair is checked.`}
			actions={<>
				<input className="lab-input" style={{ width: 180 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search palettes" />
				<div className="lab-seg" role="group" aria-label="Preview mode">{(['light', 'dark'] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div>
			</>}>
			<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
				<button className="lab-chip" aria-pressed={fam === 'all'} onClick={() => setFam('all')}>All</button>
				{FAMILIES.map((f) => <button key={f.id} className="lab-chip" aria-pressed={fam === f.id} onClick={() => setFam(f.id)}>{f.name}</button>)}
			</div>
			<div className="lab-grid" style={{ ['--min' as string]: '210px' }}>
				{list.map((p) => {
					const s = resolveScheme(p.id, mode);
					const on = current.palette === p.id;
					const ratio = contrast(s.ink, s.bg);
					return (
						<div key={p.id} className="lab-tile" style={on ? { borderColor: 'var(--l-acc)' } : undefined}>
							<button type="button" style={{ all: 'unset', cursor: 'pointer', display: 'block' }} onClick={() => labStore.patch({ palette: p.id, mode })} aria-label={`Use ${p.name} in ${mode}`}><Strip s={s} /></button>
							<div className="lab-tile-meta" style={{ padding: 10 }}>
								<div className="lab-tile-row"><strong style={{ fontSize: '0.85rem' }}>{p.name}</strong><button className="lab-fav" aria-pressed={favs.includes(`pal:${p.id}`)} onClick={() => labStore.toggleFav(`pal:${p.id}`)} aria-label="Favourite">{favs.includes(`pal:${p.id}`) ? '★' : '☆'}</button></div>
								<div className="lab-mono">{ratio.toFixed(1)}:1 · {p.native}-native</div>
							</div>
						</div>
					);
				})}
			</div>
		</Sec>
	);
}

function Generator() {
	const { current } = useLab();
	const [c, setC] = useState<CustomColour>(current.custom);
	const [mode, setMode] = useState(current.mode);
	const s = useMemo(() => customScheme(c, mode), [c, mode]);
	const rows: [string, number][] = [['Hue', c.hue], ['Saturation', c.sat], ['Lightness', c.light], ['Spread', c.spread]];
	const css = `:root {\n${KEYS.map((k) => `  --${String(k).replace('ink2', 'ink-2').replace('accent2', 'accent-2')}: ${s[k]};`).join('\n')}\n}`;
	return (
		<Sec title="Palette generator" note="One hue and a harmony rule produce a full, contrast-checked scheme. Apply it as the custom palette." actions={<><div className="lab-seg" role="group" aria-label="Mode">{(['light', 'dark'] as const).map((m) => <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}</div><button className="lb" data-primary="" onClick={() => { labStore.patch({ custom: c, palette: 'custom', mode }); toast('Custom palette applied'); }}>Apply to design</button></>}>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,320px) minmax(0,1fr)', gap: 24 }} className="lab-two">
				<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
					<div className="ctl"><span className="ctl-row"><span>Hue</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{Math.round(c.hue)}°</span></span><input className="lab-range" style={{ background: 'linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)', height: 4, borderRadius: 2 }} type="range" min={0} max={360} value={c.hue} onChange={(e) => setC({ ...c, hue: Number(e.target.value) })} aria-label="Hue" /></div>
					{rows.slice(1).map(([n, v]) => {
						const key = n === 'Saturation' ? 'sat' : n === 'Lightness' ? 'light' : 'spread';
						const max = key === 'spread' ? 90 : 1;
						return <label key={n} className="ctl"><span className="ctl-row"><span>{n}</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{key === 'spread' ? `${Math.round(v)}°` : v.toFixed(2)}</span></span><input className="lab-range" type="range" min={key === 'spread' ? -90 : 0.1} max={max} step={key === 'spread' ? 1 : 0.01} value={v} onChange={(e) => setC({ ...c, [key]: Number(e.target.value) })} /></label>;
					})}
					<label className="ctl"><span className="ctl-row"><span>Harmony</span></span><select className="lab-select" value={c.harmony} onChange={(e) => setC({ ...c, harmony: e.target.value as Harmony })}>{HARMONIES.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
					<div className="lab-actions"><CopyBtn text={css} label="Copy CSS" /><button className="lb" data-sm="" onClick={() => setC({ hue: Math.random() * 360, sat: 0.4 + Math.random() * 0.5, light: 0.35 + Math.random() * 0.25, harmony: HARMONIES[Math.floor(Math.random() * 6)].id, spread: 0 })}>Random</button></div>
				</div>
				<div style={{ display: 'grid', gap: 14 }}>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--l-line)' }}>
						{KEYS.map((k) => <button key={k} onClick={() => { navigator.clipboard?.writeText(s[k]); toast(`${s[k]} copied`); }} style={{ background: s[k], border: 0, height: 110, cursor: 'pointer', display: 'grid', alignContent: 'end', padding: 8, color: contrast(s[k], '#000') > 7 ? '#000' : '#fff', font: '11px monospace', textAlign: 'left' }}>{k}<br />{s[k]}</button>)}
					</div>
					<div className="lab-card" style={{ overflow: 'hidden' }}><Thumb spec={{ ...current, palette: 'custom', custom: c, mode }} ratio={0.5} /></div>
				</div>
			</div>
			<style>{`@media (max-width: 980px){.lab-two{grid-template-columns:1fr!important}}`}</style>
		</Sec>
	);
}

function Matrix() {
	const { current } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	const names: (keyof Scheme)[] = ['bg', 'surface', 'surface2', 'ink', 'ink2', 'accent', 'accent2', 'onAccent'];
	const [pair, setPair] = useState<[keyof Scheme, keyof Scheme]>(['ink', 'bg']);
	const r = contrast(s[pair[0]], s[pair[1]]);
	const good: [keyof Scheme, keyof Scheme, number][] = [];
	for (const a of names) for (const b of names) if (a !== b && contrast(s[a], s[b]) >= 4.5 && names.indexOf(a) > names.indexOf(b)) good.push([a, b, contrast(s[a], s[b])]);
	return (
		<Sec title="Contrast matrix" note="Every foreground against every background in the current design. Click a cell to inspect the pair.">
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(260px,1fr)', gap: 24 }} className="lab-two">
				<div className="lab-card" style={{ overflow: 'auto', padding: 8 }} data-lenis-prevent>
					<table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: '0.72rem', fontFamily: 'var(--font-geist-mono), monospace' }}>
						<thead><tr><th />{names.map((b) => <th key={b} style={{ color: 'var(--l-ink3)', fontWeight: 400, padding: 4 }}>on {b}</th>)}</tr></thead>
						<tbody>
							{names.map((a) => (
								<tr key={a}>
									<th style={{ color: 'var(--l-ink3)', fontWeight: 400, textAlign: 'right', padding: 4 }}>{a}</th>
									{names.map((b) => {
										const v = contrast(s[a], s[b]);
										return <td key={b}><button onClick={() => setPair([a, b])} aria-label={`${a} on ${b}: ${v.toFixed(1)}`} style={{ width: 62, height: 40, border: pair[0] === a && pair[1] === b ? '2px solid var(--l-acc)' : '1px solid #0004', background: s[b], color: s[a], cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}>{a === b ? '–' : v.toFixed(1)}</button></td>;
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
					<div className="lab-mono">{pair[0]} on {pair[1]}</div>
					<div style={{ background: s[pair[1]], color: s[pair[0]], padding: 20, borderRadius: 3, border: '1px solid var(--l-line2)' }}><div style={{ fontSize: 34, fontFamily: 'Georgia, serif' }}>Aa Large text</div><div style={{ fontSize: 14 }}>Body text at 14 pixels reads like this.</div></div>
					<div style={{ fontSize: '2rem', fontFamily: 'var(--font-altera-serif), serif' }}>{r.toFixed(2)}:1 <span style={{ fontSize: '1rem', color: r >= 4.5 ? 'var(--l-ok)' : '#ff8a6c' }}>{grade(r)}</span></div>
					<p className="lab-note">AA needs 4.5:1 for body text and 3:1 for large text and interface parts; AAA needs 7:1.</p>
					<div className="lab-mono">Accessible pairs in this design</div>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
						{good.slice(0, 14).map(([a, b, v]) => <button key={a + b} className="lab-chip" onClick={() => setPair([a, b])} style={{ background: s[b], color: s[a], borderColor: 'var(--l-line2)' }}>{a}/{b} {v.toFixed(1)}</button>)}
					</div>
				</div>
			</div>
		</Sec>
	);
}

function Harmonies() {
	const [hue, setHue] = useState(24);
	return (
		<Sec title="Harmony wheel" note="Where each rule lands for a base hue. Drag the slider; the swatches update.">
			<input className="lab-range" type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} aria-label="Base hue" />
			<div className="lab-grid" style={{ ['--min' as string]: '220px' }}>
				{HARMONIES.map((h) => {
					const hs = h.id === 'tetrad' ? [0, 90, 180, 270] : h.id === 'triad' ? [0, 120, 240] : h.id === 'split' ? [0, 150, 210] : h.id === 'complement' ? [0, 180] : h.id === 'analogous' ? [-30, 0, 30] : [0, 0, 0];
					return (
						<div key={h.id} className="lab-card" style={{ padding: 10, display: 'grid', gap: 8 }}>
							<div className="lab-mono">{h.name}</div>
							<div style={{ display: 'flex', height: 56, borderRadius: 3, overflow: 'hidden' }}>{hs.map((o, i) => <i key={i} style={{ flex: 1, background: hslToHex(hue + o, h.id === 'mono' ? 0.6 : 0.7, h.id === 'mono' ? 0.3 + i * 0.2 : 0.5) }} />)}</div>
						</div>
					);
				})}
			</div>
		</Sec>
	);
}

export function ColourLab() {
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="05 · Study" title={<>Colour, <em>measured</em>.</>} lead="A shelf of palettes in light and dark, a generator for your own, a full contrast matrix with plain-language grades, and harmony rules you can see." />
				<Palettes />
				<Generator />
				<Matrix />
				<Harmonies />
			</main>
		</>
	);
}
