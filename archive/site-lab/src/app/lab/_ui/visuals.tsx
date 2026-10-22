'use client';

/* eslint-disable react/display-name */

// Visual previews for the picker dialogs: each option is shown rendered under the current design where that is cheap.

import type { ReactNode } from 'react';
import { TYPE_BY_ID } from '../_engine/fonts';
import { resolveScheme } from '../_engine/palettes';
import type { DesignSpec, Opt } from '../_engine/types';
import { Art } from './Art';
import { Backdrop } from './Backdrop';
import { Thumb } from './dp/Dp';
import { Hero, TopNav } from './dp/heroes';
import { Badge, Btn, Card, Field, Nav, Pic } from './dp/parts';
import { Features } from './dp/sections';
import { PALETTE_BY_ID } from '../_engine/palettes';

export function visualFor(key: string, spec: DesignSpec): ((o: Opt) => ReactNode) | undefined {
	const sc = resolveScheme(spec.palette, spec.mode, spec.custom);
	const mini = (patch: Partial<DesignSpec>, el: ReactNode, w = 420, ratio = 0.3) => (
		<div style={{ width: '100%' }}>
			<Thumb spec={{ ...spec, ...patch }} width={w} ratio={ratio}>
				<div style={{ padding: 18, display: 'grid', placeItems: 'center', minHeight: '100%' }}>{el}</div>
			</Thumb>
		</div>
	);
	switch (key) {
		case 'palette':
			return (o) => {
				const p = PALETTE_BY_ID[o.id];
				const s = o.id === 'custom' ? sc : resolveScheme(o.id, spec.mode);
				return (
					<span style={{ display: 'grid', width: '100%', height: 74, gridTemplateColumns: '2fr 1fr 1fr', background: s.bg }}>
						<span style={{ background: s.bg, color: s.ink, display: 'grid', placeContent: 'center', fontFamily: 'Georgia, serif', fontSize: 28 }}>Aa</span>
						<span style={{ background: s.accent }} />
						<span style={{ background: s.accent2 }} />
						<i hidden>{p?.name}</i>
					</span>
				);
			};
		case 'type':
			return (o) => {
				const t = TYPE_BY_ID[o.id];
				return t ? (
					<span style={{ padding: '12px 14px', width: '100%', background: '#f5f1e8', color: '#111', display: 'grid', gap: 2 }}>
						<span style={{ fontFamily: t.display, fontWeight: t.dw, fontStyle: t.italic ? 'italic' : 'normal', fontSize: 26, lineHeight: 1, textTransform: t.caseD, letterSpacing: `${t.tr}em` }}>Quick fox</span>
						<span style={{ fontFamily: t.body, fontSize: 12 }}>The five boxing wizards jump</span>
					</span>
				) : null;
			};
		case 'bg':
			return (o) => (
				<span style={{ position: 'absolute', inset: 0, background: sc.bg }}>
					<Backdrop id={o.id} scheme={sc} mode={spec.mode} intensity={0.75} live={false} />
				</span>
			);
		case 'art':
			return (o) => <span style={{ width: '100%', aspectRatio: '4/3', display: 'block' }}><Art kind={o.id} scheme={sc} seed={3} /></span>;
		case 'layout':
			return (o) => <div style={{ width: '100%' }}><Thumb spec={{ ...spec, layout: o.id }} width={1280} ratio={0.62}><TopNav /><Hero layout={o.id} /></Thumb></div>;
		case 'features':
			return (o) => <div style={{ width: '100%' }}><Thumb spec={{ ...spec, features: o.id }} width={1280} ratio={0.62}><Features layout={o.id} /></Thumb></div>;
		case 'nav':
			return (o) => <div style={{ width: '100%' }}><Thumb spec={{ ...spec, nav: o.id }} width={1000} ratio={0.1}><Nav /></Thumb></div>;
		case 'button':
			return (o) => mini({ button: o.id }, <Btn v={o.id} arrow>Get started</Btn>);
		case 'card':
			return (o) => mini({ card: o.id }, <Card v={o.id}><Badge v="soft">New</Badge><h3 style={{ margin: '8px 0 4px' }}>Card title</h3><p style={{ margin: 0 }}>A short line of body text.</p></Card>, 420, 0.46);
		case 'input':
			return (o) => mini({ input: o.id }, <div style={{ width: '90%' }}><Field v={o.id} label="Email" placeholder="you@example.com" /></div>, 420, 0.3);
		case 'treat':
			return (o) => <div style={{ width: '100%' }}><Thumb spec={{ ...spec, treat: o.id }} width={420} ratio={0.62}><div style={{ padding: 22 }}><Pic ratio="4/3" seed={2} /></div></Thumb></div>;
		case 'shadow':
			return (o) => mini({ shadow: o.id }, <Card v="flat"><b>Shadow</b></Card>, 360, 0.38);
		case 'surface':
			return (o) => <div style={{ width: '100%' }}><Thumb spec={{ ...spec, surface: o.id }} width={360} ratio={0.4}><div style={{ padding: 20 }}><h3>Surface</h3><p>Texture overlay on the page.</p></div></Thumb></div>;
		default:
			return undefined;
	}
}
