'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DIMS, optionName } from '../_engine/dims';
import { diff } from '../_engine/mix';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { WORLDS } from '../_engine/worlds';
import { Thumb } from './dp/Dp';
import { CopyBtn, Sec, Swatches, download, toast } from './kit';

export function SavedView() {
	const { saved, favs, collections, cmp, current } = useLab();
	const router = useRouter();
	const [col, setCol] = useState('All');
	const [newCol, setNewCol] = useState('');
	const [imp, setImp] = useState('');
	const shown = useMemo(() => saved.filter((s) => col === 'All' || (col === 'Favourites' ? favs.includes(s.id) : s.collection === col)), [saved, col, favs]);
	const favWorlds = WORLDS.filter((w) => favs.includes(`world:${w.id}`));
	return (
		<>
			<div className="lab-actions" style={{ marginBottom: 22 }}>
				<button className="lb" data-primary="" onClick={() => { labStore.save(); toast('Saved the working design'); }}>Save working design: {current.name}</button>
				<button className="lb" onClick={() => download('atlas-library.json', labStore.exportAll())}>Export library</button>
				<CopyBtn text={() => labStore.exportAll()} label="Copy library JSON" small={false} />
			</div>

			<Sec title="Library" note="Designs you saved from the mixer or workbench.">
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
					{['All', 'Favourites', ...collections].map((c) => <button key={c} className="lab-chip" aria-pressed={col === c} onClick={() => setCol(c)}>{c}</button>)}
					<input className="lab-input" style={{ width: 170 }} placeholder="New collection…" value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { labStore.addCollection(newCol); setNewCol(''); } }} aria-label="New collection name" />
				</div>
				{shown.length === 0 ? (
					<div className="lab-empty"><p>Nothing here yet. Save a design from the mixer and it appears in this library.</p><button className="lb" onClick={() => router.push('/lab/mixer')}>Open the mixer</button></div>
				) : (
					<div className="lab-grid" style={{ ['--min' as string]: '360px' }}>
						{shown.map((s) => {
							const sc = resolveScheme(s.spec.palette, s.spec.mode, s.spec.custom);
							return (
								<article key={s.id} className="lab-tile">
									<Thumb spec={s.spec} ratio={0.62} />
									<div className="lab-tile-meta">
										<div className="lab-tile-row">
											<input className="lab-input" style={{ fontWeight: 600, padding: '4px 8px' }} value={s.name} onChange={(e) => labStore.update(s.id, { name: e.target.value, spec: { ...s.spec, name: e.target.value } })} aria-label="Design name" />
											<button className="lab-fav" aria-pressed={favs.includes(s.id)} onClick={() => labStore.toggleFav(s.id)} aria-label="Favourite">{favs.includes(s.id) ? '★' : '☆'}</button>
										</div>
										<div className="lab-tile-row"><Swatches s={sc} /><span className="lab-mono">{optionName('type', s.spec.type)} · {new Date(s.at).toLocaleDateString()}</span></div>
										<select className="lab-select" value={s.collection ?? ''} onChange={(e) => labStore.update(s.id, { collection: e.target.value || undefined })} aria-label="Collection">
											<option value="">No collection</option>
											{collections.map((c) => <option key={c}>{c}</option>)}
										</select>
										<div className="lab-actions">
											<button className="lb" data-sm="" data-primary="" onClick={() => { labStore.load(s.id); router.push('/lab/mixer'); }}>Open</button>
											<button className="lb" data-sm="" onClick={() => labStore.duplicate(s.id)}>Duplicate</button>
											<button className="lb" data-sm="" onClick={() => toast(labStore.addCompare(s.spec, s.name) ? 'Added to compare' : 'Compare holds four')}>+ Compare</button>
											<button className="lb" data-sm="" onClick={() => labStore.remove(s.id)}>Delete</button>
										</div>
									</div>
								</article>
							);
						})}
					</div>
				)}
			</Sec>

			<Sec title="Compare" note="Up to four directions, rendered side by side with what differs." actions={cmp.length > 0 ? <button className="lb" data-sm="" onClick={() => labStore.clearCompare()}>Clear</button> : undefined}>
				{cmp.length === 0 ? (
					<div className="lab-empty"><p>Use “+ Compare” on any style, blueprint or saved design.</p></div>
				) : (
					<>
						<div className="cmp-grid">
							{cmp.map((c) => (
								<div key={c.id} className="cmp-cell">
									<Thumb spec={c.spec} ratio={0.8} />
									<header><strong>{c.name}</strong><span style={{ display: 'flex', gap: 4 }}><button className="lb" data-sm="" onClick={() => { labStore.replace(c.spec); router.push('/lab/mixer'); }}>Use</button><button className="lb" data-sm="" onClick={() => labStore.removeCompare(c.id)} aria-label={`Remove ${c.name}`}>✕</button></span></header>
								</div>
							))}
						</div>
						<div className="lab-card" style={{ overflow: 'auto' }} data-lenis-prevent>
							<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
								<thead><tr><th style={{ textAlign: 'left', padding: 10 }} className="lab-mono">Decision</th>{cmp.map((c) => <th key={c.id} style={{ textAlign: 'left', padding: 10 }}>{c.name}</th>)}</tr></thead>
								<tbody>
									{DIMS.map((d) => {
										const vals = cmp.map((c) => String((c.spec as unknown as Record<string, unknown>)[d.key as string]));
										const differs = new Set(vals).size > 1;
										return (
											<tr key={d.key as string} style={{ borderTop: '1px solid var(--l-line)', background: differs ? 'color-mix(in srgb, var(--l-acc) 6%, transparent)' : undefined }}>
												<td style={{ padding: '7px 10px', color: 'var(--l-ink2)' }}>{d.label}</td>
												{cmp.map((c, i) => <td key={c.id} style={{ padding: '7px 10px', color: differs ? 'var(--l-ink)' : 'var(--l-ink3)' }}>{d.kind === 'choice' ? optionName(d.key, vals[i]) : vals[i]}</td>)}
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
						<p className="lab-note">{cmp.length > 1 ? `${diff(cmp[0].spec, cmp[1].spec).length} of ${DIMS.length} decisions differ between the first two.` : 'Add a second design to see differences.'}</p>
					</>
				)}
			</Sec>

			<Sec title="Favourite worlds" note="Star a world in the style gallery to keep it here.">
				{favWorlds.length === 0 ? <p className="lab-note">No favourite worlds yet.</p> : (
					<div className="lab-grid" style={{ ['--min' as string]: '260px' }}>
						{favWorlds.map((w) => (
							<div key={w.id} className="lab-tile"><Thumb spec={w.spec} ratio={0.62} /><div className="lab-tile-meta"><div className="lab-tile-row"><strong>{w.name}</strong><button className="lb" data-sm="" onClick={() => { labStore.startFrom(w.id); router.push('/lab/mixer'); }}>Mix</button></div></div></div>
						))}
					</div>
				)}
			</Sec>

			<Sec title="Import" note="Paste an exported library or a single design.">
				<textarea className="lab-area" value={imp} onChange={(e) => setImp(e.target.value)} placeholder="Atlas JSON" aria-label="Import JSON" />
				<div><button className="lb" onClick={() => { const r = labStore.importAll(imp); toast(r.message); if (r.ok) setImp(''); }}>Import</button></div>
			</Sec>
		</>
	);
}
