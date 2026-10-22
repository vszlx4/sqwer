'use client';

// The Design Mixer and the Workbench. One component, two arrangements of the same engine:
// the mixer is about choosing, locking, randomising and comparing; the workbench is about tuning a single design.

import { useEffect, useMemo, useState } from 'react';
import { DIMS, GROUPS, optionName } from '../_engine/dims';
import { diff, encodeSpec, normalize } from '../_engine/mix';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { specComponents, specCss, specReport, specTokens, specVars } from '../_engine/tokens';
import type { ChoiceDim, DesignSpec, RangeDim } from '../_engine/types';
import { WORLDS, WORLD_BY_ID } from '../_engine/worlds';
import { BLUEPRINTS, BLUEPRINT_BY_ID } from './dp/blueprints';
import { Dp, Thumb, VIEWPORTS, Viewport } from './dp/Dp';
import { ChoiceCtl, CopyBtn, copyText, Dots, download, RangeCtl, toast } from './kit';
import { visualFor } from './visuals';

type Tab = 'tokens' | 'css' | 'json' | 'saved' | 'compare';

function Controls({ spec, only }: { spec: DesignSpec; only?: string[] }) {
	const groups = only ? [only.join('')] : GROUPS;
	return (
		<>
			{GROUPS.filter(() => !only).map((g, gi) => (
				<details key={g} className="ctl-group" open={gi < 4}>
					<summary>{g}</summary>
					<div className="ctl-body">
						{DIMS.filter((d) => d.group === g).map((d) => (
							<DimCtl key={d.key} d={d} spec={spec} />
						))}
					</div>
				</details>
			))}
			{only && (
				<div className="ctl-body" style={{ paddingTop: 12 }}>
					{DIMS.filter((d) => only.includes(d.key as string)).map((d) => (
						<DimCtl key={d.key} d={d} spec={spec} />
					))}
				</div>
			)}
			<i hidden>{groups.length}</i>
		</>
	);
}

function DimCtl({ d, spec }: { d: ChoiceDim | RangeDim; spec: DesignSpec }) {
	const val = (spec as unknown as Record<string, string | number>)[d.key as string];
	if (d.kind === 'range') return <RangeCtl dim={d} value={val as number} onChange={(n) => labStore.patch({ [d.key]: n } as Partial<DesignSpec>, true)} />;
	return <ChoiceCtl dim={d} value={val as string} onChange={(id) => labStore.patch({ [d.key]: id } as Partial<DesignSpec>)} visual={visualFor(d.key as string, spec)} />;
}

export function Studio({ mode }: { mode: 'mixer' | 'workbench' }) {
	const lab = useLab();
	const { current: spec, locks, chaos, vp, saved, cmp, favs, blueprint } = lab;
	const [tab, setTab] = useState<Tab>('tokens');
	const [right, setRight] = useState(true);
	const [outline, setOutline] = useState(false);
	const [replay, setReplay] = useState(0);
	const [match, setMatch] = useState(true);
	const [name, setName] = useState('');
	const [imp, setImp] = useState('');
	const [json, setJson] = useState<'spec' | 'tokens' | 'components'>('spec');
	const [experimental, setExperimental] = useState(false);

	// A ?w=<world> link starts from that world; #d=<encoded> is handled by the store.
	useEffect(() => {
		const w = new URLSearchParams(location.search).get('w');
		if (w && WORLD_BY_ID[w] && lab.ready) labStore.startFrom(w);
	}, [lab.ready]);

	const bp = BLUEPRINT_BY_ID[blueprint] ?? BLUEPRINTS[0];
	const shown = useMemo(() => (mode === 'workbench' && match && spec.subject !== bp.subject ? { ...spec, subject: bp.subject } : spec), [spec, mode, match, bp.subject]);
	const css = useMemo(() => specCss(spec, ':root'), [spec]);
	const tokens = useMemo(() => specTokens(spec), [spec]);
	const report = useMemo(() => specReport(spec), [spec]);
	const vars = specVars(spec);
	const scheme = resolveScheme(spec.palette, spec.mode, spec.custom);
	const lockCount = locks.length;
	const isSaved = saved.some((s) => JSON.stringify(s.spec) === JSON.stringify(spec));

	const roll = () => labStore.roll(experimental ? Math.max(chaos, 0.9) : chaos);

	// Keyboard: R re-rolls, S surprises, Z undoes, when focus is not in a field.
	useEffect(() => {
		const h = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
			if (e.key === 'r') roll();
			else if (e.key === 's') labStore.surprise();
			else if (e.key === 'z') labStore.undo();
			else if (e.key === 'y') labStore.redo();
		};
		window.addEventListener('keydown', h);
		return () => window.removeEventListener('keydown', h);
	});

	const shareUrl = () => `${location.origin}${location.pathname}#d=${encodeSpec(spec)}`;

	return (
		<div className="studio" data-right={right ? '' : undefined}>
			<div className="studio-left" data-lenis-prevent>
				<div style={{ padding: 16, display: 'grid', gap: 12, borderBottom: '1px solid var(--l-line)' }}>
					<div className="lab-mono">{mode === 'mixer' ? 'Design mixer' : 'Workbench'}</div>
					{mode === 'mixer' ? (
						<>
							<label className="ctl">
								<span className="ctl-row"><span>Start from a world</span></span>
								<select className="lab-select" value={WORLD_BY_ID[spec.world] ? spec.world : ''} onChange={(e) => e.target.value && labStore.startFrom(e.target.value)} aria-label="Start from a world">
									<option value="">— custom mix —</option>
									{WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
								</select>
							</label>
							<div className="ctl">
								<div className="ctl-row"><span>Intensity</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{experimental ? 'Experimental' : chaos < 0.3 ? 'Restrained' : chaos < 0.65 ? 'Balanced' : 'Radical'}</span></div>
								<input className="lab-range chaos" type="range" min={0} max={1} step={0.01} value={chaos} onChange={(e) => labStore.setChaos(Number(e.target.value))} aria-label="Restrained to radical" />
								<div className="ctl-row" style={{ gap: 6 }}><span className="lab-mono">restrained</span><span className="lab-mono">radical</span></div>
							</div>
							<label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', color: 'var(--l-ink2)' }}>
								<input type="checkbox" checked={experimental} onChange={(e) => setExperimental(e.target.checked)} />
								Experimental mode: ignore family coherence
							</label>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
								<button type="button" className="lb" onClick={roll}>Randomise unlocked <span className="lab-kbd">R</span></button>
								<button type="button" className="lb" data-primary="" onClick={() => labStore.surprise()}>Surprise me <span className="lab-kbd">S</span></button>
								<button type="button" className="lb" data-sm="" onClick={() => labStore.setLocks(DIMS.map((d) => d.key as string))}>Lock all</button>
								<button type="button" className="lb" data-sm="" onClick={() => labStore.setLocks([])}>Unlock all{lockCount ? ` (${lockCount})` : ''}</button>
							</div>
						</>
					) : (
						<>
							<label className="ctl">
								<span className="ctl-row"><span>Page</span></span>
								<select className="lab-select" value={blueprint} onChange={(e) => labStore.setBlueprint(e.target.value)} aria-label="Page blueprint">
									{BLUEPRINTS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
								</select>
							</label>
							<label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.82rem', color: 'var(--l-ink2)' }}>
								<input type="checkbox" checked={match} onChange={(e) => setMatch(e.target.checked)} />
								Use content that fits this page type
							</label>
							<p className="lab-note">{bp.blurb}</p>
						</>
					)}
				</div>
				{mode === 'mixer' ? <Controls spec={spec} /> : <WorkbenchControls spec={spec} />}
			</div>

			<div className="studio-mid">
				<div className="studio-bar">
					<div className="lab-seg" role="group" aria-label="Viewport">
						{VIEWPORTS.map((v) => <button key={v.id} type="button" aria-pressed={vp === v.id} onClick={() => labStore.setViewport(v.id)}>{v.name}</button>)}
					</div>
					<button type="button" className="lb" data-sm="" data-on={outline ? '' : undefined} onClick={() => setOutline(!outline)}>Structure</button>
					<button type="button" className="lb" data-sm="" onClick={() => setReplay(replay + 1)}>Replay reveals</button>
					<span className="sp" />
					<button type="button" className="lb" data-sm="" onClick={() => labStore.undo()} disabled={lab.hi === 0}>Undo</button>
					<button type="button" className="lb" data-sm="" onClick={() => labStore.redo()} disabled={lab.hi >= lab.hist.length - 1}>Redo</button>
					<input className="lab-input" style={{ width: 150 }} placeholder={spec.name} value={name} onChange={(e) => setName(e.target.value)} aria-label="Design name" />
					<button type="button" className="lb" data-sm="" data-primary="" onClick={() => { labStore.save(name || undefined); toast('Saved to your library'); setName(''); }}>{isSaved ? 'Save copy' : 'Save'}</button>
					<button type="button" className="lb" data-sm="" onClick={() => toast(labStore.addCompare(spec) ? 'Added to compare' : 'Compare holds four designs')}>+ Compare</button>
					<button type="button" className="lb" data-sm="" onClick={() => copyText(shareUrl(), 'Share link copied')}>Share link</button>
					<button type="button" className="lb" data-sm="" data-on={right ? '' : undefined} onClick={() => setRight(!right)}>{right ? 'Hide panel' : 'Show panel'}</button>
				</div>
				<div className="studio-stage" data-lenis-prevent>
					<Viewport vp={vp}>
						<Dp spec={shown} blueprint={mode === 'workbench' ? blueprint : 'landing'} outline={outline} replay={replay} />
					</Viewport>
				</div>
			</div>

			{right && (
				<div className="studio-right" data-lenis-prevent>
					<div className="studio-tabs" role="tablist">
						{(['tokens', 'css', 'json', 'saved', 'compare'] as Tab[]).map((t) => (
							<button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t === 'saved' ? `Saved ${saved.length}` : t === 'compare' ? `Compare ${cmp.length}` : t.toUpperCase()}</button>
						))}
					</div>
					<div className="studio-pane">
						{tab === 'tokens' && (
							<>
								<div className="lab-mono">Colour</div>
								{(['--bg', '--surface', '--surface-2', '--ink', '--ink-2', '--line', '--accent', '--accent-2', '--on-accent'] as const).map((k) => (
									<button key={k} type="button" className="tok-row" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', textAlign: 'left' }} onClick={() => copyText(vars[k], `${k} ${vars[k]}`)}>
										<i style={{ background: vars[k] }} /><span>{k}</span><b>{vars[k]}</b>
									</button>
								))}
								<div className="lab-mono" style={{ marginTop: 10 }}>Type, shape, motion</div>
								{(['--w-display', '--tr', '--radius', '--bw', '--dens', '--dur', '--stag', '--maxw'] as const).map((k) => (
									<div key={k} className="tok-row" style={{ gridTemplateColumns: '1fr auto' }}><span>{k}</span><b>{vars[k]}</b></div>
								))}
								<div className="lab-mono" style={{ marginTop: 10 }}>Contrast</div>
								{report.map((r) => (
									<div key={r.name} className="tok-row" style={{ gridTemplateColumns: '1fr auto' }}>
										<span>{r.name}</span>
										<b className={r.ratio >= r.need ? 'ratio-ok' : 'ratio-bad'}>{r.ratio.toFixed(1)}:1 {r.ratio >= r.need ? 'pass' : `needs ${r.need}`}</b>
									</div>
								))}
								<p className="lab-note">Click a colour to copy it.</p>
							</>
						)}
						{tab === 'css' && (
							<>
								<div className="lab-actions"><CopyBtn text={css} label="Copy CSS" /><button type="button" className="lb" data-sm="" onClick={() => download(`${spec.name.replace(/\W+/g, '-').toLowerCase()}.css`, css, 'text/css')}>Download .css</button></div>
								<pre className="lab-code">{css}</pre>
								<div className="lab-actions"><CopyBtn text={tailwindTheme(spec)} label="Copy Tailwind v4 @theme" /></div>
								<pre className="lab-code">{tailwindTheme(spec)}</pre>
							</>
						)}
						{tab === 'json' && (
							<>
								<div className="lab-seg" role="group" aria-label="JSON kind">
									{(['spec', 'tokens', 'components'] as const).map((k) => <button key={k} type="button" aria-pressed={json === k} onClick={() => setJson(k)}>{k}</button>)}
								</div>
								<pre className="lab-code">{JSON.stringify(json === 'spec' ? spec : json === 'tokens' ? tokens : specComponents(spec), null, 2)}</pre>
								<div className="lab-actions">
									<CopyBtn text={() => JSON.stringify(json === 'spec' ? spec : json === 'tokens' ? tokens : specComponents(spec), null, 2)} />
									<button type="button" className="lb" data-sm="" onClick={() => download(`${spec.name.replace(/\W+/g, '-').toLowerCase()}.${json}.json`, JSON.stringify(json === 'spec' ? spec : json === 'tokens' ? tokens : specComponents(spec), null, 2))}>Download</button>
								</div>
								<div className="lab-mono" style={{ marginTop: 8 }}>Import</div>
								<textarea className="lab-area" placeholder="Paste a design or a whole library exported from Atlas" value={imp} onChange={(e) => setImp(e.target.value)} aria-label="Import JSON" />
								<button type="button" className="lb" onClick={() => { const r = labStore.importAll(imp); toast(r.message); if (r.ok) setImp(''); }}>Import</button>
							</>
						)}
						{tab === 'saved' && (
							<>
								{saved.length === 0 && <p className="lab-note">Nothing saved yet. Press Save in the bar above.</p>}
								{saved.map((s) => (
									<div key={s.id} className="cmp-cell">
										<Thumb spec={s.spec} ratio={0.5} />
										<header>
											<span>{s.name}</span>
											<span style={{ display: 'flex', gap: 4 }}>
												<button className="lb" data-sm="" onClick={() => labStore.load(s.id)}>Load</button>
												<button className="lb" data-sm="" onClick={() => labStore.duplicate(s.id)}>Copy</button>
												<button className="lb" data-sm="" onClick={() => labStore.remove(s.id)} aria-label={`Delete ${s.name}`}>✕</button>
											</span>
										</header>
									</div>
								))}
							</>
						)}
						{tab === 'compare' && (
							<>
								<p className="lab-note">Add up to four directions with “+ Compare”, then judge them side by side. Open the full comparison on the Saved page.</p>
								{cmp.map((s) => (
									<div key={s.id} className="cmp-cell">
										<Thumb spec={s.spec} ratio={0.6} />
										<header>
											<span>{s.name}<br /><span className="lab-mono">{diff(spec, s.spec).length} differences from current</span></span>
											<span style={{ display: 'flex', gap: 4 }}>
												<button className="lb" data-sm="" onClick={() => labStore.replace(s.spec)}>Use</button>
												<button className="lb" data-sm="" onClick={() => labStore.removeCompare(s.id)} aria-label="Remove">✕</button>
											</span>
										</header>
									</div>
								))}
								{cmp.length > 0 && <button className="lb" onClick={() => labStore.clearCompare()}>Clear</button>}
							</>
						)}
					</div>
					<i hidden>{favs.length}{scheme.bg}</i>
				</div>
			)}
		</div>
	);
}

function WorkbenchControls({ spec }: { spec: DesignSpec }) {
	const tune = ['scale', 'tracking', 'bgI', 'angle', 'radius', 'border', 'density', 'width', 'dur', 'stagger'];
	return (
		<>
			<details className="ctl-group" open>
				<summary>Tune</summary>
				<div className="ctl-body">
					{DIMS.filter((d) => tune.includes(d.key as string)).map((d) => <DimCtl key={d.key} d={d} spec={spec} />)}
				</div>
			</details>
			<details className="ctl-group" open>
				<summary>Decisions</summary>
				<div className="ctl-body">
					{DIMS.filter((d) => ['palette', 'mode', 'type', 'bg', 'layout', 'features', 'button', 'card', 'ease', 'shadow', 'reveal'].includes(d.key as string)).map((d) => <DimCtl key={d.key} d={d} spec={spec} />)}
				</div>
			</details>
			<details className="ctl-group">
				<summary>Everything else</summary>
				<div className="ctl-body">
					{DIMS.filter((d) => !tune.includes(d.key as string) && !['palette', 'mode', 'type', 'bg', 'layout', 'features', 'button', 'card', 'ease', 'shadow', 'reveal'].includes(d.key as string)).map((d) => <DimCtl key={d.key} d={d} spec={spec} />)}
				</div>
			</details>
		</>
	);
}

function tailwindTheme(spec: DesignSpec): string {
	const v = specVars(spec);
	return `@theme inline {\n  --color-bg: ${v['--bg']};\n  --color-surface: ${v['--surface']};\n  --color-ink: ${v['--ink']};\n  --color-ink-2: ${v['--ink-2']};\n  --color-line: ${v['--line']};\n  --color-accent: ${v['--accent']};\n  --color-accent-2: ${v['--accent-2']};\n  --color-on-accent: ${v['--on-accent']};\n  --font-display: ${v['--f-display']};\n  --font-body: ${v['--f-body']};\n  --font-mono: ${v['--f-mono']};\n  --radius: ${v['--radius']};\n}\n`;
}

export { Dots, normalize, optionName };
