'use client';

// <Dp> renders a whole page under a DesignSpec. <Thumb> shows one scaled down; <Viewport> constrains the width so the
// page's container queries respond like a real device. Everything is plain DOM and CSS variables.

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { SUBJECTS, SUBJECT_BY_ID } from '../../_engine/content';
import { resolveScheme } from '../../_engine/palettes';
import { specStyle } from '../../_engine/tokens';
import type { DesignSpec } from '../../_engine/types';
import type { Viewport as VP } from '../../_engine/store';
import { Backdrop } from '../Backdrop';
import { BLUEPRINT_BY_ID, BLUEPRINTS } from './blueprints';
import { DpContext, type DpCtx } from './ctx';

type DpProps = {
	spec: DesignSpec;
	blueprint?: string;
	interactive?: boolean;
	/** Run shader backgrounds. Off for thumbnails, which show a still wash instead. */
	live?: boolean;
	outline?: boolean;
	replay?: number;
	className?: string;
	style?: CSSProperties;
	/** Render something else under the spec, e.g. a component lab section. */
	children?: ReactNode;
};

function DpBase({ spec, blueprint = 'landing', interactive = true, live = true, outline = false, replay = 0, className = '', style, children }: DpProps) {
	const Page = (BLUEPRINT_BY_ID[blueprint] ?? BLUEPRINTS[0]).render;
	const c = useMemo(() => resolveScheme(spec.palette, spec.mode, spec.custom), [spec.palette, spec.mode, spec.custom]);
	const sub = SUBJECT_BY_ID[spec.subject] ?? SUBJECTS[0];
	const ctx = useMemo<DpCtx>(() => ({ spec, c, sub, interactive }), [spec, c, sub, interactive]);
	const ref = useRef<HTMLDivElement>(null);
	const [mounted, setMounted] = useState(false);
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);

	useEffect(() => {
		const root = ref.current;
		if (!mounted || !root || !interactive) return;
		if (replay) root.querySelectorAll('[data-r][data-in]').forEach((e) => e.removeAttribute('data-in'));
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			root.querySelectorAll('[data-r]').forEach((e) => e.setAttribute('data-in', ''));
			return;
		}
		const io = new IntersectionObserver(
			(es) => es.forEach((e) => {
				if (e.isIntersecting) {
					e.target.setAttribute('data-in', '');
					io.unobserve(e.target);
				}
			}),
			{ threshold: 0, rootMargin: '0px 0px -6% 0px' }
		);
		root.querySelectorAll('[data-r]:not([data-in])').forEach((e) => io.observe(e));
		return () => io.disconnect();
	}, [mounted, interactive, replay, spec, blueprint]);

	return (
		<DpContext.Provider value={ctx}>
			<div
				ref={ref}
				className={`dp ${className}`}
				data-reveal={spec.reveal}
				data-hover={spec.hover}
				data-surface={spec.surface}
				data-live={mounted ? '' : undefined}
				data-static={interactive ? undefined : ''}
				data-outline={outline ? '' : undefined}
				data-mode={spec.mode}
				style={{ ...specStyle(spec), ...style }}
			>
				<Backdrop id={spec.bg} scheme={c} mode={spec.mode} intensity={spec.bgI} live={live && interactive} />
				{spec.surface !== 'none' && <div className="dp-overlay" aria-hidden="true" />}
				<div className="dp-page">{children ?? <Page />}</div>
			</div>
		</DpContext.Provider>
	);
}

export const Dp = memo(DpBase);

/** Lazily mounts children once they are near the viewport, so a wall of previews only renders what is on screen. */
export function LazyMount({ children, height, className = '' }: { children: ReactNode; height?: number | string; className?: string }) {
	const ref = useRef<HTMLDivElement>(null);
	const [on, setOn] = useState(false);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: '300px' });
		io.observe(el);
		return () => io.disconnect();
	}, []);
	return <div ref={ref} className={className} style={{ minHeight: on ? undefined : height }}>{on ? children : null}</div>;
}

/** A page scaled down to fit its container. Non-interactive. */
export function Thumb({ spec, blueprint = 'landing', width = 1280, ratio = 0.66, className = '', crop = 0, children }: { spec: DesignSpec; blueprint?: string; width?: number; ratio?: number; className?: string; crop?: number; children?: ReactNode }) {
	const wrap = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(0);
	const [seen, setSeen] = useState(false);
	useEffect(() => {
		const el = wrap.current;
		if (!el) return;
		const ro = new ResizeObserver(() => setScale(el.clientWidth / width));
		ro.observe(el);
		const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin: '400px' });
		io.observe(el);
		return () => { ro.disconnect(); io.disconnect(); };
	}, [width]);
	const h = width * ratio;
	return (
		<div ref={wrap} className={`dp-thumb-wrap ${className}`} style={{ aspectRatio: `${width} / ${h}` }}>
			{seen && scale > 0 && (
				<div className="dp-thumb-in" style={{ width, height: h, transform: `scale(${scale})` }}>
					<Dp spec={spec} blueprint={blueprint} interactive={false} live={false} style={{ marginTop: -crop }}>{children}</Dp>
				</div>
			)}
		</div>
	);
}

export const VIEWPORTS: { id: VP; name: string; width: number | null }[] = [
	{ id: 'desktop', name: 'Desktop', width: null },
	{ id: 'tablet', name: 'Tablet · 820', width: 820 },
	{ id: 'mobile', name: 'Phone · 390', width: 390 }
];

export function Viewport({ vp, children }: { vp: VP; children: ReactNode }) {
	const w = VIEWPORTS.find((v) => v.id === vp)?.width;
	return (
		<div className="dp-viewport" data-vp={vp} style={{ width: w ? w : '100%', maxWidth: '100%' }}>
			{children}
		</div>
	);
}
