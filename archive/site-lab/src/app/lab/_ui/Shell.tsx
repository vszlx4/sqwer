'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { resolveScheme } from '../_engine/palettes';
import { labStore, useLab } from '../_engine/store';
import { LAB_PAGES } from '../pages';
import { Dots, Hydrate, Toaster } from './kit';
import '../lab.css';
import './dp/dp.css';
import './dp/extra.css';

const STUDIO = ['/lab/mixer', '/lab/workbench'];

function Logo() {
	return (
		<svg className="lab-logo" viewBox="0 0 32 32" fill="none" aria-hidden="true">
			<circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.6" />
			<path d="M16 2v28M2 16h28" stroke="currentColor" strokeWidth="1" opacity=".45" />
			<rect x="10" y="10" width="12" height="12" fill="#ff5a2c" transform="rotate(45 16 16)" />
		</svg>
	);
}

export function Shell({ children }: { children: ReactNode }) {
	const path = usePathname();
	const { current } = useLab();
	const [menu, setMenu] = useState(false);
	const [forced, setForced] = useState<boolean | null>(null);
	const studio = STUDIO.includes(path);
	const collapsed = forced ?? studio;
	const s = resolveScheme(current.palette, current.mode, current.custom);

	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => { setMenu(false); setForced(null); }, [path]);

	const groups = ['Explore', 'Study', 'Make'] as const;
	return (
		<div className="lab-shell" data-collapsed={collapsed ? '' : undefined} data-menu={menu ? '' : undefined}>
			<Hydrate />
			<aside className="lab-rail" aria-label="Lab navigation">
				<Link href="/lab" className="lab-brand" aria-label="Atlas home">
					<Logo />
					<span className="lab-wordmark">Atlas<small>design lab</small></span>
				</Link>
				<nav className="lab-scroll" data-lenis-prevent>
					{groups.map((g) => (
						<div key={g} className="lab-group">
							<h2>{g}</h2>
							{LAB_PAGES.filter((p) => p.group === g).map((p) => {
								const i = LAB_PAGES.indexOf(p);
								const here = path === p.href || (p.href !== '/lab' && path.startsWith(p.href + '/'));
								return (
									<Link key={p.href} href={p.href} className="lab-link" aria-current={here ? 'page' : undefined} title={p.label}>
										<small>{String(i).padStart(2, '0')}</small>
										<span>{p.label}</span>
									</Link>
								);
							})}
						</div>
					))}
					<div className="lab-group">
						<h2>Chosen</h2>
						<Link href="/lab/directions/fingering" className="lab-link" title="Fingering direction">
							<small>↗</small>
							<span>Fingering</span>
						</Link>
					</div>
				</nav>
				<div className="lab-rail-foot">
					<Link href="/lab/mixer" className="lab-now" title="Open the current design in the mixer">
						<Dots s={s} />
						<div>
							<strong>{current.name}</strong>
							<span>Working design</span>
						</div>
					</Link>
					<div style={{ display: 'flex', gap: 6 }}>
						<button type="button" className="lb" data-sm="" style={{ flex: 1 }} onClick={() => labStore.undo()} aria-label="Undo"><span>Undo</span><b aria-hidden="true" style={{ display: collapsed ? 'inline' : 'none' }}>↶</b></button>
						<button type="button" className="lb" data-sm="" style={{ flex: 1 }} onClick={() => labStore.redo()} aria-label="Redo"><span>Redo</span><b aria-hidden="true" style={{ display: collapsed ? 'inline' : 'none' }}>↷</b></button>
					</div>
					<button type="button" className="lb" data-sm="" onClick={() => setForced(!collapsed)} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? '»' : '« Collapse'}</button>
				</div>
			</aside>
			{menu && <div className="lab-scrim" onClick={() => setMenu(false)} />}
			<div className="lab-main">
				<div className="lab-top">
					<Link href="/lab" className="lab-brand" style={{ padding: 0 }}><Logo /><span className="lab-wordmark">Atlas</span></Link>
					<button type="button" className="lb" onClick={() => setMenu(true)} aria-label="Open navigation">Menu</button>
				</div>
				<div id="content">{children}</div>
			</div>
			<Toaster />
		</div>
	);
}
