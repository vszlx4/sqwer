'use client';

// Shared controls for the lab's own interface: page header, pickers, locks, sliders, copy, toast, the spec bar.

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { Scheme } from '../_engine/color';
import { optionName } from '../_engine/dims';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import type { ChoiceDim, DesignSpec, Opt, RangeDim } from '../_engine/types';
import { WORLDS } from '../_engine/worlds';

export function PageHead({ kicker, title, lead, children }: { kicker: string; title: ReactNode; lead?: string; children?: ReactNode }) {
	return (
		<header className="lab-head">
			<p className="lab-kicker">{kicker}</p>
			<h1 className="lab-title">{title}</h1>
			{lead && <p className="lab-lead">{lead}</p>}
			{children && <div className="lab-actions">{children}</div>}
		</header>
	);
}

export function Sec({ title, note, actions, children }: { title: string; note?: string; actions?: ReactNode; children: ReactNode }) {
	return (
		<section className="lab-sec">
			<div className="lab-sec-head">
				<div>
					<h2 className="lab-h2">{title}</h2>
					{note && <p>{note}</p>}
				</div>
				{actions && <div className="lab-actions">{actions}</div>}
			</div>
			{children}
		</section>
	);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
const toastListeners = new Set<(m: string) => void>();
export function toast(m: string) {
	toastListeners.forEach((l) => l(m));
}
export function Toaster() {
	const [msg, setMsg] = useState('');
	useEffect(() => {
		const l = (m: string) => {
			setMsg(m);
			clearTimeout(toastTimer);
			toastTimer = setTimeout(() => setMsg(''), 2200);
		};
		toastListeners.add(l);
		return () => void toastListeners.delete(l);
	}, []);
	return msg ? <div className="lab-toast" role="status">{msg}</div> : null;
}

export async function copyText(text: string, what = 'Copied') {
	try {
		await navigator.clipboard.writeText(text);
		toast(`${what} to clipboard`);
	} catch {
		toast('Copy blocked by the browser; select the text instead');
	}
}

export function CopyBtn({ text, label = 'Copy', small = true }: { text: string | (() => string); label?: string; small?: boolean }) {
	return (
		<button type="button" className="lb" data-sm={small ? '' : undefined} onClick={() => copyText(typeof text === 'function' ? text() : text, label === 'Copy' ? 'Copied' : label)}>
			{label}
		</button>
	);
}

export function download(name: string, text: string, type = 'application/json') {
	const url = URL.createObjectURL(new Blob([text], { type }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Swatches({ s, n = 5 }: { s: Scheme; n?: number }) {
	const c = [s.bg, s.surface2, s.ink, s.accent, s.accent2].slice(0, n);
	return <span className="lab-sw" aria-hidden="true">{c.map((x, i) => <i key={i} style={{ background: x }} />)}</span>;
}

/** Four-square dot used in the rail and tiles to show a palette at a glance. */
export function Dots({ s }: { s: Scheme }) {
	return (
		<span className="lab-dots" aria-hidden="true">
			{[s.bg, s.accent, s.ink, s.accent2].map((x, i) => <i key={i} style={{ background: x }} />)}
		</span>
	);
}

/** A dialog that lists options with a visual for each; used for palettes, type, backgrounds and so on. */
export function PickDialog({ open, onClose, title, opts, value, onPick, visual, search = true }: { open: boolean; onClose: () => void; title: string; opts: Opt[]; value: string; onPick: (id: string) => void; visual?: (o: Opt) => ReactNode; search?: boolean }) {
	const ref = useRef<HTMLDialogElement>(null);
	const [q, setQ] = useState('');
	useEffect(() => {
		const d = ref.current;
		if (!d) return;
		if (open && !d.open) d.showModal();
		if (!open && d.open) d.close();
	}, [open]);
	const shown = opts.filter((o) => !q || (o.name + ' ' + (o.note ?? '')).toLowerCase().includes(q.toLowerCase()));
	return (
		<dialog ref={ref} className="lab-dialog" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
			<div className="lab-dialog-in">
				<div className="lab-dialog-head">
					<h2>{title}</h2>
					{search && <input className="lab-input" placeholder={`Search ${opts.length}…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search options" />}
					<button type="button" className="lb" onClick={onClose}>Close</button>
				</div>
				<div className="lab-dialog-body" data-lenis-prevent role="radiogroup" aria-label={title}>
					{open && shown.map((o) => (
						<button key={o.id} type="button" role="radio" aria-checked={o.id === value} className="lab-pick" onClick={() => { onPick(o.id); onClose(); }}>
							{visual && <span className="lab-pick-vis">{visual(o)}</span>}
							<span className="lab-pick-name">{o.name}<small>{o.fams?.join(' · ') ?? o.note ?? ''}</small></span>
						</button>
					))}
					{shown.length === 0 && <p className="lab-note">Nothing matches “{q}”.</p>}
				</div>
			</div>
		</dialog>
	);
}

export function LockBtn({ k }: { k: string }) {
	const { locks } = useLab();
	const on = locks.includes(k);
	return (
		<button type="button" className="ctl-lock" aria-pressed={on} aria-label={on ? `Unlock ${k}` : `Lock ${k}`} title={on ? 'Locked: randomise will not change this' : 'Lock this choice'} onClick={() => labStore.toggleLock(k)}>
			{on ? '●' : '○'}
		</button>
	);
}

export function ChoiceCtl({ dim, value, onChange, visual, lockable = true }: { dim: ChoiceDim; value: string; onChange: (id: string) => void; visual?: (o: Opt) => ReactNode; lockable?: boolean }) {
	const [open, setOpen] = useState(false);
	const i = Math.max(0, dim.opts.findIndex((o) => o.id === value));
	const step = useCallback((d: number) => onChange(dim.opts[(i + d + dim.opts.length) % dim.opts.length].id), [dim.opts, i, onChange]);
	const cur = dim.opts[i];
	return (
		<div className="ctl">
			<div className="ctl-row">
				<span>{dim.label}</span>
				{lockable && <LockBtn k={dim.key as string} />}
			</div>
			<div className="ctl-val">
				<button type="button" className="lb" aria-label={`Previous ${dim.label}`} onClick={() => step(-1)}>‹</button>
				<button type="button" className="ctl-pick" onClick={() => setOpen(true)} aria-haspopup="dialog">
					<span>{cur?.name ?? value}</span>
					<small className="lab-mono">{dim.opts.length}</small>
				</button>
				<button type="button" className="lb" aria-label={`Next ${dim.label}`} onClick={() => step(1)}>›</button>
			</div>
			<PickDialog open={open} onClose={() => setOpen(false)} title={dim.label} opts={dim.opts} value={value} onPick={onChange} visual={visual} />
		</div>
	);
}

export function RangeCtl({ dim, value, onChange, lockable = true }: { dim: RangeDim; value: number; onChange: (n: number) => void; lockable?: boolean }) {
	const id = useId();
	const shown = dim.digits !== undefined ? value.toFixed(dim.digits) : String(value);
	return (
		<div className="ctl">
			<div className="ctl-row">
				<label htmlFor={id}>{dim.label}</label>
				<span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{shown}{dim.unit ?? ''}</span>
				{lockable && <LockBtn k={dim.key as string} />}
			</div>
			<input id={id} className="lab-range" type="range" min={dim.min} max={dim.max} step={dim.step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
		</div>
	);
}

/** The current design as a compact bar on study pages: name, quick start-from, roll, and a way to the mixer. */
export function SpecBar({ note }: { note?: string }) {
	const { current, ready } = useLab();
	const s = resolveScheme(current.palette, current.mode, current.custom);
	return (
		<div className="lab-specbar" role="region" aria-label="Current design">
			<div className="grow">
				<Dots s={s} />
				<div>
					<strong>{ready ? current.name : 'Loading design…'}</strong>
					<div className="lab-mono">{optionName('type', current.type)} · {current.mode}{note ? ` · ${note}` : ''}</div>
				</div>
			</div>
			<select className="lab-select" style={{ width: 'auto', maxWidth: 200 }} aria-label="Start from a style world" value="" onChange={(e) => e.target.value && labStore.startFrom(e.target.value)}>
				<option value="">Start from a world…</option>
				{WORLDS.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
			</select>
			<button type="button" className="lb" onClick={() => labStore.roll()}>Re-roll</button>
			<button type="button" className="lb" data-primary="" onClick={() => labStore.surprise()}>Surprise me</button>
			<Link className="lb" href="/lab/mixer">Open mixer →</Link>
		</div>
	);
}

export function useCurrent(): DesignSpec {
	return useLab().current;
}

export function Hydrate() {
	useEffect(() => labStore.hydrate(), []);
	return null;
}
