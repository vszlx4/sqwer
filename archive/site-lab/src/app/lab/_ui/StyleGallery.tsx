'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DIMS, GROUPS, optionName } from '../_engine/dims';
import { diff } from '../_engine/mix';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { FAMILIES, type Fam } from '../_engine/types';
import { WORLDS, WORLD_BY_ID } from '../_engine/worlds';
import { Dp, Thumb, VIEWPORTS, Viewport } from './dp/Dp';
import { Swatches, toast } from './kit';

const LEVELS = ['Restrained', 'Considered', 'Bold', 'Loud', 'Radical'];

export function StyleGallery() {
	const { favs } = useLab();
	const router = useRouter();
	const [fam, setFam] = useState<Fam | 'all'>('all');
	const [q, setQ] = useState('');
	const [lvl, setLvl] = useState(0);
	const [onlyFav, setOnlyFav] = useState(false);
	const shown = useMemo(
		() => WORLDS.filter((w) => (fam === 'all' || w.fam === fam) && (!lvl || w.level === lvl) && (!onlyFav || favs.includes(`world:${w.id}`)) && (!q || `${w.name} ${w.blurb} ${w.spec.palette} ${w.spec.type}`.toLowerCase().includes(q.toLowerCase()))),
		[fam, q, lvl, onlyFav, favs]
	);
	return (
		<>
			<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
				<input className="lab-input" style={{ maxWidth: 260 }} placeholder="Search styles, palettes, fonts…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search styles" />
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Family">
					<button className="lab-chip" aria-pressed={fam === 'all'} onClick={() => setFam('all')}>All {WORLDS.length}</button>
					{FAMILIES.map((f) => (
						<button key={f.id} className="lab-chip" aria-pressed={fam === f.id} onClick={() => setFam(f.id)} title={f.note}>{f.name} {WORLDS.filter((w) => w.fam === f.id).length}</button>
					))}
				</div>
				<select className="lab-select" style={{ width: 'auto' }} value={lvl} onChange={(e) => setLvl(Number(e.target.value))} aria-label="Intensity">
					<option value={0}>Any intensity</option>
					{LEVELS.map((l, i) => <option key={l} value={i + 1}>{l}</option>)}
				</select>
				<button className="lab-chip" aria-pressed={onlyFav} onClick={() => setOnlyFav(!onlyFav)}>★ Favourites {favs.filter((f) => f.startsWith('world:')).length}</button>
			</div>
			<div className="lab-grid" style={{ ['--min' as string]: '380px' }}>
				{shown.map((w) => {
					const s = resolveScheme(w.spec.palette, w.spec.mode);
					const fav = favs.includes(`world:${w.id}`);
					return (
						<article key={w.id} className="lab-tile">
							<Link href={`/lab/styles/${w.id}`} aria-label={`Open ${w.name} full size`} style={{ display: 'block' }}>
								<Thumb spec={w.spec} ratio={0.62} />
							</Link>
							<div className="lab-tile-meta">
								<div className="lab-tile-row">
									<strong>{w.name}</strong>
									<button className="lab-fav" aria-pressed={fav} aria-label={fav ? `Unfavourite ${w.name}` : `Favourite ${w.name}`} onClick={() => labStore.toggleFav(`world:${w.id}`)}>{fav ? '★' : '☆'}</button>
								</div>
								<p>{w.blurb}</p>
								<div className="lab-tile-row">
									<span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Swatches s={s} /><span className="lab-mono">{FAMILIES.find((f) => f.id === w.fam)?.name} · {LEVELS[w.level - 1]}</span></span>
									<span style={{ display: 'flex', gap: 6 }}>
										<button className="lb" data-sm="" onClick={() => { labStore.startFrom(w.id); router.push('/lab/mixer'); }}>Mix</button>
										<button className="lb" data-sm="" onClick={() => toast(labStore.addCompare(w.spec) ? 'Added to compare' : 'Compare holds four')}>+ Compare</button>
									</span>
								</div>
							</div>
						</article>
					);
				})}
			</div>
			{shown.length === 0 && <div className="lab-empty"><p>No world matches those filters.</p><button className="lb" onClick={() => { setFam('all'); setQ(''); setLvl(0); setOnlyFav(false); }}>Clear filters</button></div>}
		</>
	);
}

export function StyleDetail({ id }: { id: string }) {
	const w = WORLD_BY_ID[id];
	const router = useRouter();
	const { vp } = useLab();
	const i = WORLDS.indexOf(w);
	const prev = WORLDS[(i + WORLDS.length - 1) % WORLDS.length];
	const next = WORLDS[(i + 1) % WORLDS.length];
	const s = resolveScheme(w.spec.palette, w.spec.mode);
	return (
		<main>
			<div className="lab-specbar" role="region" aria-label="Style controls">
				<div className="grow">
					<Link href="/lab/styles" className="lb" data-sm="">← Gallery</Link>
					<div><strong>{w.name}</strong><div className="lab-mono">{FAMILIES.find((f) => f.id === w.fam)?.name} · {String(i + 1).padStart(2, '0')} / {WORLDS.length}</div></div>
				</div>
				<div className="lab-seg" role="group" aria-label="Viewport">
					{VIEWPORTS.map((v) => <button key={v.id} onClick={() => labStore.setViewport(v.id)} aria-pressed={vp === v.id}>{v.name}</button>)}
				</div>
				<Link href={`/lab/styles/${prev.id}`} className="lb" data-sm="" aria-label={`Previous: ${prev.name}`}>‹ {prev.name}</Link>
				<Link href={`/lab/styles/${next.id}`} className="lb" data-sm="" aria-label={`Next: ${next.name}`}>{next.name} ›</Link>
				<button className="lb" data-primary="" onClick={() => { labStore.startFrom(w.id); router.push('/lab/mixer'); }}>Mix from this</button>
			</div>
			<div style={{ background: 'repeating-conic-gradient(#12100d 0 25%, #0f0d0b 0 50%) 0 0 / 22px 22px', padding: vp === 'desktop' ? 0 : 28 }}>
				<Viewport vp={vp}>
					<Dp key={id} spec={w.spec} />
				</Viewport>
			</div>
			<section className="lab-page">
				<div className="lab-sec" style={{ marginTop: 0 }}>
					<div className="lab-sec-head"><div><h2 className="lab-h2">Identity</h2><p>{w.blurb}</p></div><Swatches s={s} /></div>
					<div style={{ display: 'grid', gap: 22, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
						{GROUPS.map((g) => (
							<div key={g} className="lab-card" style={{ padding: 16 }}>
								<div className="lab-mono" style={{ marginBottom: 10 }}>{g}</div>
								{DIMS.filter((d) => d.group === g).map((d) => (
									<div key={d.key as string} className="tok-row" style={{ gridTemplateColumns: '1fr auto', borderTop: '1px solid var(--l-line)', padding: '6px 0' }}>
										<span>{d.label}</span>
										<b style={{ color: 'var(--l-ink)', fontWeight: 500 }}>{d.kind === 'choice' ? optionName(d.key, (w.spec as unknown as Record<string, string>)[d.key as string]) : `${(w.spec as unknown as Record<string, number>)[d.key as string]}${d.unit ?? ''}`}</b>
									</div>
								))}
							</div>
						))}
					</div>
					<p className="lab-note">{diff(w.spec, WORLDS[0].spec).length} of {DIMS.length} decisions differ from {WORLDS[0].name}, which is the point.</p>
				</div>
			</section>
		</main>
	);
}
