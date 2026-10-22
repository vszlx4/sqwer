'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { labStore, useLab } from '../_engine/store';
import { WORLDS } from '../_engine/worlds';
import { Thumb } from './dp/Dp';

/** A rotating showcase of worlds plus the working design, with the one-click Surprise. */
export function HomeLive() {
	const { current, ready, saved, favs } = useLab();
	const router = useRouter();
	const [i, setI] = useState(0);
	const [auto, setAuto] = useState(true);
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setI(Math.floor(Math.random() * WORLDS.length)), []);
	useEffect(() => {
		if (!auto || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const t = setInterval(() => setI((x) => (x + 1) % WORLDS.length), 5200);
		return () => clearInterval(t);
	}, [auto]);
	const w = WORLDS[i];
	return (
		<section className="lab-sec" style={{ marginTop: 0 }}>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(280px,1fr)', gap: 20 }} className="home-live">
				<div className="lab-card" style={{ overflow: 'hidden' }}>
					<Link href={`/lab/styles/${w.id}`} aria-label={`Open ${w.name}`} style={{ display: 'block' }}>
						<Thumb key={w.id} spec={w.spec} ratio={0.58} />
					</Link>
					<div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', borderTop: '1px solid var(--l-line)' }}>
						<div>
							<div className="lab-mono">Now showing · {i + 1}/{WORLDS.length}</div>
							<strong style={{ fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>{w.name}</strong>
						</div>
						<div className="lab-actions">
							<button type="button" className="lb" data-sm="" onClick={() => { setAuto(false); setI((i + WORLDS.length - 1) % WORLDS.length); }}>‹</button>
							<button type="button" className="lb" data-sm="" onClick={() => { setAuto(false); setI((i + 1) % WORLDS.length); }}>›</button>
							<button type="button" className="lb" data-sm="" onClick={() => { labStore.startFrom(w.id); router.push('/lab/mixer'); }}>Mix from this</button>
						</div>
					</div>
				</div>
				<div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
					<div className="lab-card" style={{ padding: 18, display: 'grid', gap: 12 }}>
						<div className="lab-mono">Your working design</div>
						<strong style={{ fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400, fontSize: '1.5rem' }}>{ready ? current.name : '…'}</strong>
						<Thumb spec={current} ratio={0.5} />
						<div className="lab-actions">
							<button type="button" className="lb" data-primary="" onClick={() => { labStore.surprise(); router.push('/lab/mixer'); }}>Surprise me</button>
							<Link href="/lab/mixer" className="lb">Continue in mixer</Link>
						</div>
					</div>
					<div className="lab-card" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
						<div><div className="lab-mono">Saved</div><strong style={{ fontSize: '1.6rem', fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400 }}>{saved.length}</strong></div>
						<div><div className="lab-mono">Favourites</div><strong style={{ fontSize: '1.6rem', fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400 }}>{favs.length}</strong></div>
						<Link href="/lab/saved" className="lb" style={{ alignSelf: 'center' }}>Library →</Link>
					</div>
				</div>
			</div>
			<style>{`@media (max-width: 980px){.home-live{grid-template-columns:1fr!important}}`}</style>
		</section>
	);
}
