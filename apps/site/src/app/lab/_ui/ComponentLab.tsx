'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BUTTONS, CARDS, INPUTS, NAVS } from '../_engine/options';
import { useLab } from '../_engine/store';
import { SUBJECT_BY_ID } from '../_engine/content';
import type { DesignSpec } from '../_engine/types';
import { Dp } from './dp/Dp';
import { Badge, Btn, Card, Field, Nav } from './dp/parts';
import { useDp } from './dp/ctx';
import { Sec, SpecBar, PageHead } from './kit';

/** One design scope for a block of demo components. */
function Scope({ spec, children, bare }: { spec: DesignSpec; children: ReactNode; bare?: boolean }) {
	return (
		<div className="lab-card" style={{ overflow: 'hidden' }}>
			<Dp spec={spec} interactive live={false}>{bare ? children : <div className="dp-demo">{children}</div>}</Dp>
		</div>
	);
}

const STATES = ['default', 'hover', 'focus', 'active', 'loading', 'disabled'];

function Buttons() {
	const [state, setState] = useState('default');
	const [size, setSize] = useState<'sm' | undefined | 'lg'>(undefined);
	const st = state === 'default' ? undefined : state;
	const { current } = useLab();
	return (
		<Sec title="Buttons" note={`${BUTTONS.length} variants, each as primary and secondary, with every state forceable.`}
			actions={<>
				<div className="lab-seg" role="group" aria-label="State">{STATES.map((s) => <button key={s} aria-pressed={state === s} onClick={() => setState(s)}>{s}</button>)}</div>
				<div className="lab-seg" role="group" aria-label="Size">{(['sm', undefined, 'lg'] as const).map((s) => <button key={s ?? 'md'} aria-pressed={size === s} onClick={() => setSize(s)}>{s ?? 'md'}</button>)}</div>
			</>}>
			<Scope spec={current}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
					{BUTTONS.map((b) => (
						<div key={b.id} className="dp-cell">
							<small>{b.name}</small>
							<div className="dp-rowwrap">
								<Btn v={b.id} state={st} size={size} arrow>Get started</Btn>
								<Btn v={b.id} kind="secondary" state={st} size={size}>Learn more</Btn>
							</div>
						</div>
					))}
				</div>
			</Scope>
		</Sec>
	);
}

function Inputs() {
	const { current } = useLab();
	const [email, setEmail] = useState('');
	const [sent, setSent] = useState(false);
	const bad = sent && !/^\S+@\S+\.\S+$/.test(email);
	return (
		<Sec title="Inputs and forms" note="Six input styles, their states, and a form that really validates.">
			<Scope spec={current}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 28 }}>
					{INPUTS.map((i) => (
						<div key={i.id} className="dp-cell" style={{ width: '100%' }}>
							<small>{i.name}</small>
							<Field v={i.id} label="Email" placeholder="you@example.com" />
							<Field v={i.id} label="With error" placeholder="Name" error="This field is required" />
							<Field v={i.id} label="Disabled" placeholder="Not editable" state="disabled" />
						</div>
					))}
				</div>
				<form className="dp-cell" style={{ maxWidth: 420, width: '100%' }} onSubmit={(e) => { e.preventDefault(); setSent(true); }} noValidate>
					<small>Live validation</small>
					<Field label="Email" placeholder="you@example.com" value={email} onChange={(v) => { setEmail(v); }} error={bad ? 'Enter a valid email address' : undefined} hint="We never share it." />
					<Btn type="submit" arrow>{sent && !bad ? 'Thanks, you’re in ✓' : 'Subscribe'}</Btn>
				</form>
				<Controls />
			</Scope>
		</Sec>
	);
}

function Controls() {
	const [on, setOn] = useState(true);
	const [v, setV] = useState(60);
	return (
		<div className="dp-rowwrap" style={{ gap: 32 }}>
			<label className="dp-opt"><input className="dp-sw" type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} role="switch" /> Notifications {on ? 'on' : 'off'}</label>
			<label className="dp-opt"><input className="dp-check" type="checkbox" defaultChecked /> Remember me</label>
			<label className="dp-opt"><input className="dp-check" type="radio" name="r" defaultChecked /> Monthly</label>
			<label className="dp-opt"><input className="dp-check" type="radio" name="r" /> Yearly</label>
			<label className="dp-opt" style={{ minWidth: 220 }}><input className="dp-range" type="range" value={v} onChange={(e) => setV(Number(e.target.value))} aria-label="Amount" /> {v}</label>
			<select className="dp-select" defaultValue="b" aria-label="Plan"><option value="a">Starter</option><option value="b">Studio</option><option value="c">Team</option></select>
		</div>
	);
}

function Cards() {
	const { current } = useLab();
	return (
		<Sec title="Cards" note={`${CARDS.length} surface treatments with their hover response taken from the current design (${current.hover}).`}>
			<Scope spec={current}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 28 }}>
					{CARDS.map((c, i) => (
						<div key={c.id} className="dp-cell" style={{ width: '100%' }}>
							<small>{c.name}</small>
							<Card v={c.id} tilt={i % 2 ? 1.2 : -1.2} className="">
								<div style={{ display: 'grid', gap: 10 }}>
									<Badge v="soft">New</Badge>
									<h3>Card title</h3>
									<p>Short supporting copy that wraps to a couple of lines inside the card.</p>
									<Btn v="arrow" kind="secondary" arrow>Read more</Btn>
								</div>
							</Card>
						</div>
					))}
				</div>
			</Scope>
		</Sec>
	);
}

function Navigation() {
	const { current } = useLab();
	return (
		<Sec title="Navigation" note="Seven navigation styles at full width. Resize the preview on the mixer to see them collapse.">
			<div style={{ display: 'grid', gap: 16 }}>
				{NAVS.map((n) => (
					<div key={n.id} className="lab-card" style={{ overflow: 'hidden' }}>
						<div className="lab-mono" style={{ padding: '8px 12px' }}>{n.name}</div>
						<Dp spec={{ ...current, nav: n.id }} live={false}><div style={{ minHeight: 110 }}><Nav /></div></Dp>
					</div>
				))}
			</div>
		</Sec>
	);
}

function Menu() {
	const [open, setOpen] = useState(false);
	const [pick, setPick] = useState('');
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (!open) return;
		const out = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
		document.addEventListener('mousedown', out);
		return () => document.removeEventListener('mousedown', out);
	}, [open]);
	const items = ['Duplicate', 'Rename', 'Move to…', 'Archive'];
	return (
		<div className="dp-pop" ref={ref} onKeyDown={(e) => {
			if (e.key === 'Escape') setOpen(false);
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const b = [...ref.current!.querySelectorAll<HTMLButtonElement>('.dp-pop-menu button')]; const i = b.indexOf(document.activeElement as HTMLButtonElement); b[(i + (e.key === 'ArrowDown' ? 1 : -1) + b.length) % b.length]?.focus(); }
		}}>
			<Btn v="outline" onClick={() => setOpen(!open)} arrow>{pick || 'Actions'}</Btn>
			{open && (
				<div className="dp-pop-menu" role="menu">
					{items.map((x, i) => <button key={x} role="menuitem" autoFocus={i === 0} onClick={() => { setPick(x); setOpen(false); }}>{x}<small>⌘{i + 1}</small></button>)}
					<hr />
					<button role="menuitem" onClick={() => { setPick('Deleted'); setOpen(false); }}>Delete<small>⌫</small></button>
				</div>
			)}
		</div>
	);
}

function Tabs() {
	const [t, setT] = useState<Record<string, number>>({ underline: 0, boxed: 1, pill: 2 });
	const names = ['Overview', 'Details', 'Activity'];
	return (
		<div style={{ display: 'grid', gap: 22 }}>
			{(['underline', 'boxed', 'pill'] as const).map((v) => (
				<div key={v} className="dp-cell">
					<small>{v}</small>
					<div className="dp-tabset" data-v={v} role="tablist" onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') setT({ ...t, [v]: (t[v] + (e.key === 'ArrowRight' ? 1 : 2)) % 3 }); }}>
						{names.map((n, i) => <button key={n} role="tab" aria-selected={t[v] === i} tabIndex={t[v] === i ? 0 : -1} onClick={() => setT({ ...t, [v]: i })}>{n}</button>)}
					</div>
					<p className="dp-panel">Content for “{names[t[v]]}”. Arrow keys move between tabs.</p>
				</div>
			))}
		</div>
	);
}

function Dialogs() {
	const ref = useRef<HTMLDialogElement>(null);
	const [alerts, setAlerts] = useState([0, 1, 2, 3]);
	const kinds = [['Saved', 'Your changes are live.', '✓', '#2f9e66'], ['Heads up', 'This design uses a very light accent.', '!', '#c98a14'], ['Failed', 'We could not reach the server.', '×', '#d6453d'], ['Tip', 'Press R in the mixer to re-roll.', 'i', 'var(--accent-2)']];
	return (
		<div style={{ display: 'grid', gap: 22 }}>
			<div className="dp-rowwrap">
				<Btn onClick={() => ref.current?.showModal()}>Open dialog</Btn>
				<span className="dp-tip" data-tip="Tooltips follow the design"><Btn v="outline" kind="secondary">Hover or focus me</Btn></span>
				<Menu />
			</div>
			<dialog ref={ref} className="dp-dialog" onClick={(e) => e.target === ref.current && ref.current?.close()}>
				<div className="dp-dialog-in">
					<h3>Archive this design?</h3>
					<p>It moves out of the library but can be restored from the archive collection at any time.</p>
					<div className="dp-rowwrap"><Btn onClick={() => ref.current?.close()}>Archive</Btn><Btn kind="secondary" onClick={() => ref.current?.close()}>Cancel</Btn></div>
				</div>
			</dialog>
			<div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
				{alerts.map((k) => (
					<div key={k} className="dp-alert" style={{ ['--c' as string]: kinds[k][3] }} role="status"><i>{kinds[k][2]}</i><div><b>{kinds[k][0]}</b><p>{kinds[k][1]}</p></div><button aria-label="Dismiss" onClick={() => setAlerts(alerts.filter((x) => x !== k))}>×</button></div>
				))}
				{alerts.length === 0 && <Btn kind="secondary" size="sm" onClick={() => setAlerts([0, 1, 2, 3])}>Restore alerts</Btn>}
			</div>
		</div>
	);
}

function Table() {
	const { sub } = useDp();
	const [q, setQ] = useState('');
	const [sort, setSort] = useState<{ k: 'name' | 'meta' | 'price'; d: 1 | -1 }>({ k: 'name', d: 1 });
	const rows = useMemo(() => sub.items.filter((r) => (r.name + r.meta).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a[sort.k].localeCompare(b[sort.k]) * sort.d), [sub.items, q, sort]);
	const th = (k: 'name' | 'meta' | 'price', label: string) => <th scope="col" className="dp-sort-th" aria-sort={sort.k === k ? (sort.d === 1 ? 'ascending' : 'descending') : 'none'} onClick={() => setSort({ k, d: sort.k === k ? (sort.d === 1 ? -1 : 1) : 1 })}>{label} {sort.k === k ? (sort.d === 1 ? '↑' : '↓') : ''}</th>;
	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<div style={{ maxWidth: 280 }}><Field placeholder="Filter rows…" value={q} onChange={setQ} /></div>
			<div className="dp-tablewrap"><table className="dp-spec"><thead><tr>{th('name', 'Item')}{th('meta', 'Detail')}{th('price', 'Value')}</tr></thead><tbody>{rows.map((r) => <tr key={r.name}><th scope="row">{r.name}</th><td>{r.meta}</td><td>{r.price}</td></tr>)}{rows.length === 0 && <tr><td colSpan={3}>No rows match.</td></tr>}</tbody></table></div>
		</div>
	);
}

function Feedback() {
	const [p, setP] = useState(45);
	return (
		<div style={{ display: 'grid', gap: 22 }}>
			<div className="dp-rowwrap"><Badge>Solid</Badge><Badge v="outline">Outline</Badge><Badge v="soft">Soft</Badge><Badge v="dot">Live</Badge><Badge tone="accent2">Accent 2</Badge><Badge tone="ink">Ink</Badge></div>
			<div className="dp-cell" style={{ width: '100%' }}><small>Progress {p}%</small><div className="dp-prog" style={{ ['--v' as string]: `${p}%` }}><i /></div><div className="dp-rowwrap"><Btn size="sm" kind="secondary" onClick={() => setP(Math.max(0, p - 15))}>−15</Btn><Btn size="sm" onClick={() => setP(Math.min(100, p + 15))}>+15</Btn></div></div>
			<div className="dp-rowwrap" style={{ gap: 36 }}><div className="dp-ring-load" /><div className="dp-dots-load"><i /><i /><i /></div><div className="dp-bars-load"><i /><i /><i /><i /></div><div className="dp-pixel-load">{Array.from({ length: 8 }, (_, i) => <i key={i} />)}</div><span className="dp-type-load">Loading</span></div>
			<div style={{ display: 'grid', gap: 8 }}><div className="dp-skel" /><div className="dp-skel" style={{ width: '70%' }} /><div className="dp-skel" style={{ width: '45%' }} /></div>
		</div>
	);
}

function Experimental() {
	const mag = useRef<HTMLSpanElement>(null);
	const tilt = useRef<HTMLDivElement>(null);
	const spot = useRef<HTMLDivElement>(null);
	return (
		<div className="dp-rowwrap" style={{ gap: 48, alignItems: 'start' }}>
			<div className="dp-cell" style={{ padding: 30 }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - (r.left + r.width / 2); const y = e.clientY - (r.top + r.height / 2); if (mag.current) mag.current.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`; }} onMouseLeave={() => { if (mag.current) mag.current.style.transform = ''; }}>
				<small>Magnetic button</small><span ref={mag} className="dp-magnet"><Btn arrow>Pull me</Btn></span>
			</div>
			<div className="dp-cell"><small>Tilt card</small>
				<div ref={tilt} className="dp-tilt" style={{ width: 260 }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5; e.currentTarget.style.transform = `perspective(700px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}>
					<Card><h3>Tilt</h3><p>Follows the pointer in 3D.</p></Card>
				</div>
			</div>
			<div className="dp-cell"><small>Spotlight card</small>
				<div ref={spot} className="dp-spot" style={{ width: 260, borderRadius: 'var(--radius)' }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); }}>
					<Card><h3>Spotlight</h3><p>A light follows the cursor.</p></Card>
				</div>
			</div>
		</div>
	);
}

export function ComponentLab() {
	const { current } = useLab();
	const [open, setOpen] = useState(true);
	return (
		<>
			<SpecBar note="all components below use this design" />
			<main className="lab-page">
				<PageHead kicker="03 · Study" title={<>Every <em>component</em>, every state.</>} lead="Buttons, inputs, cards, navigation, menus, tabs, dialogs, tables, badges and loaders, plus a few experimental interactions. They all read the working design, so re-roll above and watch every one change." />
				<Buttons />
				<Inputs />
				<Cards />
				<Navigation />
				<Sec title="Menus, tabs, dialogs and alerts" note="Real behaviour: arrow keys in the menu and tabs, Escape to close, a native modal dialog.">
					<Scope spec={current}><Tabs /><Dialogs /></Scope>
				</Sec>
				<Sec title="Tables" note="Click a heading to sort; the filter narrows rows.">
					<Scope spec={current}><Table /></Scope>
				</Sec>
				<Sec title="Badges, progress and loading" note="Status and waiting states.">
					<Scope spec={current}><Feedback /></Scope>
				</Sec>
				<Sec title="Experimental interactions" note="Pointer-driven effects: magnetic, tilt and spotlight." actions={<button className="lb" data-sm="" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Show'}</button>}>
					{open && <Scope spec={current}><Experimental /></Scope>}
				</Sec>
				<i hidden>{SUBJECT_BY_ID[current.subject]?.id}</i>
			</main>
		</>
	);
}
