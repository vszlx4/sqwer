'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SUBJECT_BY_ID } from '../_engine/content';
import { labStore, useLab } from '../_engine/store';
import { BLUEPRINTS, BLUEPRINT_BY_ID } from './dp/blueprints';
import { Dp, Thumb, VIEWPORTS, Viewport } from './dp/Dp';
import { SpecBar } from './kit';
import { useState } from 'react';

export function BlueprintGallery() {
	const { current } = useLab();
	const router = useRouter();
	return (
		<>
			<SpecBar note="blueprints use their own fitting content" />
			<div className="lab-page" style={{ paddingTop: 28 }}>
				<div className="lab-grid" style={{ ['--min' as string]: '420px' }}>
					{BLUEPRINTS.map((b) => (
						<article key={b.id} className="lab-tile">
							<Link href={`/lab/blueprints/${b.id}`} aria-label={`Open ${b.name}`} style={{ display: 'block' }}>
								<Thumb spec={{ ...current, subject: b.subject }} blueprint={b.id} ratio={0.7} />
							</Link>
							<div className="lab-tile-meta">
								<div className="lab-tile-row"><strong>{b.name}</strong><span className="lab-mono">{b.kind} · {SUBJECT_BY_ID[b.subject].name}</span></div>
								<p>{b.blurb}</p>
								<div className="lab-actions">
									<Link href={`/lab/blueprints/${b.id}`} className="lb" data-sm="">Open full size</Link>
									<button className="lb" data-sm="" onClick={() => { labStore.setBlueprint(b.id); router.push('/lab/workbench'); }}>Tune in workbench</button>
								</div>
							</div>
						</article>
					))}
				</div>
			</div>
		</>
	);
}

export function BlueprintView({ id }: { id: string }) {
	const { current, vp } = useLab();
	const b = BLUEPRINT_BY_ID[id];
	const [match, setMatch] = useState(true);
	const i = BLUEPRINTS.indexOf(b);
	const prev = BLUEPRINTS[(i + BLUEPRINTS.length - 1) % BLUEPRINTS.length];
	const next = BLUEPRINTS[(i + 1) % BLUEPRINTS.length];
	return (
		<main>
			<div className="lab-specbar" role="region" aria-label="Blueprint controls">
				<div className="grow">
					<Link href="/lab/blueprints" className="lb" data-sm="">← All pages</Link>
					<div><strong>{b.name}</strong><div className="lab-mono">{b.kind} · rendered in “{current.name}”</div></div>
				</div>
				<label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.8rem', color: 'var(--l-ink2)' }}><input type="checkbox" checked={match} onChange={(e) => setMatch(e.target.checked)} /> Fitting content</label>
				<div className="lab-seg" role="group" aria-label="Viewport">
					{VIEWPORTS.map((v) => <button key={v.id} onClick={() => labStore.setViewport(v.id)} aria-pressed={vp === v.id}>{v.name}</button>)}
				</div>
				<Link href={`/lab/blueprints/${prev.id}`} className="lb" data-sm="">‹ {prev.name}</Link>
				<Link href={`/lab/blueprints/${next.id}`} className="lb" data-sm="">{next.name} ›</Link>
				<button className="lb" data-primary="" onClick={() => labStore.surprise()}>Surprise me</button>
			</div>
			<div style={{ background: 'repeating-conic-gradient(#12100d 0 25%, #0f0d0b 0 50%) 0 0 / 22px 22px', padding: vp === 'desktop' ? 0 : 28 }}>
				<Viewport vp={vp}>
					<Dp spec={match ? { ...current, subject: b.subject } : current} blueprint={id} />
				</Viewport>
			</div>
		</main>
	);
}
