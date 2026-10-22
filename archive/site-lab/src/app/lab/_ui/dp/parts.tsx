'use client';

// The shared pieces every page is made from. Each reads the active spec from context, and each accepts a variant `v`
// so the component lab can show every variant under one design.

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Art } from '../Art';
import { R, useDp } from './ctx';

export function Arrow({ className }: { className?: string }) {
	return (
		<svg className={className} width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" aria-hidden="true">
			<path d="M2 8h11M9 4l4 4-4 4" />
		</svg>
	);
}

export function Btn({ children, v, kind = 'primary', state, size, arrow, onClick, type = 'button', disabled }: { children: ReactNode; v?: string; kind?: 'primary' | 'secondary'; state?: string; size?: 'sm' | 'lg'; arrow?: boolean; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean }) {
	const { spec } = useDp();
	return (
		<button type={type} className="dp-btn dp-h" data-v={v ?? spec.button} data-k={kind} data-state={state} data-size={size} disabled={disabled || state === 'disabled'} onClick={onClick}>
			<span>{children}</span>
			{arrow && <Arrow className="dp-btn-arrow" />}
		</button>
	);
}

export function Badge({ children, v = 'solid', tone = 'accent' }: { children: ReactNode; v?: 'solid' | 'outline' | 'soft' | 'dot'; tone?: 'accent' | 'accent2' | 'ink' }) {
	return (
		<span className="dp-badge" data-v={v} data-tone={tone}>
			{v === 'dot' && <i aria-hidden="true" />}
			{children}
		</span>
	);
}

export function Card({ children, v, className = '', style, tilt = 0 }: { children: ReactNode; v?: string; className?: string; style?: CSSProperties; tilt?: number }) {
	const { spec } = useDp();
	return (
		<div className={`dp-card dp-h ${className}`} data-v={v ?? spec.card} style={{ ...style, '--tilt': `${tilt}deg` } as CSSProperties}>
			{children}
		</div>
	);
}

export function Field({ label, placeholder, v, type = 'text', state, hint, error, value, onChange, id }: { label?: string; placeholder?: string; v?: string; type?: string; state?: string; hint?: string; error?: string; value?: string; onChange?: (s: string) => void; id?: string }) {
	const { spec } = useDp();
	const [own, setOwn] = useState('');
	const val = value ?? own;
	return (
		<label className="dp-field" data-state={state} data-error={error ? '' : undefined}>
			{label && <span className="dp-label">{label}</span>}
			<input id={id} className="dp-input" data-v={v ?? spec.input} type={type} placeholder={placeholder} value={val} disabled={state === 'disabled'} onChange={(e) => (onChange ? onChange(e.target.value) : setOwn(e.target.value))} aria-invalid={error ? true : undefined} />
			{(error || hint) && <span className="dp-hint">{error ?? hint}</span>}
		</label>
	);
}

/** Headline with the highlighted phrase set apart. */
export function Title({ text, hl, as: Tag = 'h1', className = '' }: { text: string; hl?: string; as?: 'h1' | 'h2' | 'h3'; className?: string }) {
	const at = hl ? text.indexOf(hl) : -1;
	return (
		<Tag className={`dp-title ${className}`} data-lvl={Tag}>
			{at < 0 ? text : (
				<>
					{text.slice(0, at)}
					<em className="dp-hl">{hl}</em>
					{text.slice(at + (hl?.length ?? 0))}
				</>
			)}
		</Tag>
	);
}

export function Eyebrow({ children }: { children: ReactNode }) {
	return <p className="dp-eyebrow">{children}</p>;
}

export function Pic({ kind, seed = 1, ratio = '4/3', caption, className = '', label, fill = false }: { kind?: string; seed?: number; ratio?: string; caption?: string; className?: string; label?: string; fill?: boolean }) {
	const { spec, c } = useDp();
	return (
		<figure className={`dp-pic ${className}`} data-t={spec.treat} style={fill ? undefined : { aspectRatio: ratio }}>
			<div className="dp-pic-frame">
				<Art kind={kind ?? spec.art} scheme={c} seed={seed} label={label ?? caption} />
			</div>
			{caption && <figcaption>{caption}</figcaption>}
		</figure>
	);
}

export function Heading({ eyebrow, title, hl, sub, align }: { eyebrow?: string; title: string; hl?: string; sub?: string; align?: 'center' }) {
	return (
		<div className="dp-heading" data-align={align} {...R()}>
			{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
			<Title as="h2" text={title} hl={hl} />
			{sub && <p className="dp-lead">{sub}</p>}
		</div>
	);
}

export function Section({ children, tone, id, className = '' }: { children: ReactNode; tone?: 'alt' | 'accent' | 'ink'; id?: string; className?: string }) {
	return (
		<section id={id} className={`dp-section ${className}`} data-tone={tone}>
			<div className="dp-wrap">{children}</div>
		</section>
	);
}

export function Marquee({ items, speed = 28 }: { items: string[]; speed?: number }) {
	const row = [...items, ...items];
	return (
		<div className="dp-marquee" aria-hidden="true">
			<div className="dp-marquee-track" style={{ animationDuration: `${speed}s` }}>
				{[0, 1].map((k) => (
					<span key={k}>
						{row.map((t, i) => (
							<b key={i}>
								{t}
								<i />
							</b>
						))}
					</span>
				))}
			</div>
		</div>
	);
}

export function Nav({ light }: { light?: boolean }) {
	const { spec, sub } = useDp();
	const [open, setOpen] = useState(false);
	const v = spec.nav;
	const links = sub.nav.map((n, i) => (
		<a key={n} href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>
			{v === 'index' && <small>{String(i + 1).padStart(2, '0')}</small>}
			{v === 'prompt' && <small>./</small>}
			{n}
		</a>
	));
	return (
		<nav className="dp-nav" data-v={v} data-light={light ? '' : undefined} aria-label="Primary">
			<div className="dp-wrap dp-nav-in">
				<a href="#" className="dp-brand" onClick={(e) => e.preventDefault()}>
					<span className="dp-mark">{sub.mark}</span>
					<span className="dp-brand-name">{sub.brand}</span>
				</a>
				<div className="dp-nav-links" data-open={open ? '' : undefined}>{links}</div>
				<div className="dp-nav-end">
					<Btn size="sm" v={v === 'prompt' ? 'brackets' : undefined}>{sub.cta}</Btn>
					<button type="button" className="dp-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
						<span /><span />
					</button>
				</div>
			</div>
		</nav>
	);
}

export function Footer() {
	const { sub } = useDp();
	return (
		<footer className="dp-footer">
			<div className="dp-wrap dp-footer-in">
				<div>
					<span className="dp-brand-name dp-footer-brand">{sub.brand}</span>
					<p>{sub.footer}</p>
				</div>
				<div className="dp-footer-links">
					{sub.nav.map((n) => (
						<a key={n} href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{n}</a>
					))}
				</div>
				<small>© 2026 · Designed in Atlas</small>
			</div>
		</footer>
	);
}
