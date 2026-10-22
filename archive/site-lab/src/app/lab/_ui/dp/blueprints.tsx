'use client';

// Ten complete page types. Each composes the same parts under the active design, with its own structure and behaviour.

import { useState, type ReactNode } from 'react';
import { R, useDp } from './ctx';
import { Hero, TopNav } from './heroes';
import { Arrow, Badge, Btn, Card, Eyebrow, Field, Footer, Heading, Marquee, Nav, Pic, Section, Title } from './parts';
import { Closing, Features, Quote, Showcase, Stats, Steps, Ticker } from './sections';

import { BLUEPRINT_META, type BlueprintMeta } from '../../_engine/blueprints';

export type Blueprint = BlueprintMeta & { render: () => ReactNode };

const Landing = () => (
	<>
		<TopNav />
		<Hero />
		<Ticker />
		<Features />
		<Stats />
		<Steps />
		<Showcase />
		<Quote />
		<Closing />
		<Footer />
	</>
);

function Portfolio() {
	const { sub } = useDp();
	const arts = ['geo', 'landscape', 'collage', 'orbital', 'halftone', 'blob'];
	return (
		<>
			<Nav />
			<Section>
				<Eyebrow>{sub.eyebrow}</Eyebrow>
				<h1 className="dp-title dp-mega" data-lvl="h1">{sub.brand} makes <em className="dp-hl">work</em> that has to be looked at.</h1>
				<p className="dp-lead">{sub.sub}</p>
			</Section>
			<Section>
				<div className="dp-folio">
					{sub.items.map((it, i) => (
						<article key={it.name} className="dp-folio-item dp-h" data-i={i} {...R(i % 2)}>
							<Pic fill kind={arts[i % arts.length]} seed={70 + i} />
							<div className="dp-folio-meta"><h3>{it.name}</h3><span>{it.meta}</span></div>
						</article>
					))}
				</div>
			</Section>
			<Marquee items={sub.ticker} />
			<Section tone="alt">
				<div className="dp-two">
					<Heading eyebrow="About" title="A small team with a long memory." hl="long memory" />
					<div className="dp-prose"><p>{sub.sub}</p><p>{sub.quote.text}</p><Btn arrow kind="secondary">{sub.cta2}</Btn></div>
				</div>
			</Section>
			<Closing />
			<Footer />
		</>
	);
}

function Editorial() {
	const { sub } = useDp();
	return (
		<>
			<header className="dp-mast">
				<div className="dp-wrap">
					<div className="dp-mast-top"><span>Thursday 22 October 2026</span><span>Issue 214</span><span>£4.50</span></div>
					<h1 className="dp-mast-name">{sub.brand}</h1>
					<nav className="dp-mast-nav" aria-label="Sections">{sub.nav.concat(['Opinion', 'Archive']).map((n) => <a key={n} href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{n}</a>)}</nav>
				</div>
			</header>
			<Section>
				<div className="dp-article">
					<div className="dp-article-main">
						<Eyebrow>{sub.eyebrow}</Eyebrow>
						<Title text={sub.title} hl={sub.hl} />
						<p className="dp-lead">{sub.sub}</p>
						<p className="dp-byline"><b>By {sub.quote.who}</b> · 11 min read · Updated 06:40</p>
						<Pic ratio="16/9" seed={80} caption={sub.gallery[0]} />
						<div className="dp-body-cols">
							<p data-drop>{sub.features[0].body} {sub.features[1].body} {sub.features[2].body}</p>
							<blockquote className="dp-pull">{sub.quote.text}</blockquote>
							<p>{sub.features[3].body} {sub.features[4].body} {sub.steps[0].body} {sub.steps[1].body}</p>
							<p>{sub.steps[2].body} {sub.features[5].body}</p>
						</div>
					</div>
					<aside className="dp-article-side">
						<h3>Most read</h3>
						<ol>{sub.features.slice(0, 5).map((f, i) => <li key={f.title}><b>{i + 1}</b><a href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{f.title}</a><small>{f.tag}</small></li>)}</ol>
						<Card><h3>The morning briefing</h3><p>One email at 06:30. Nothing else.</p><Field placeholder="you@example.com" /><Btn>Subscribe</Btn></Card>
					</aside>
				</div>
			</Section>
			<Footer />
		</>
	);
}

function Learn() {
	const { sub } = useDp();
	const [tab, setTab] = useState(1);
	const [open, setOpen] = useState(0);
	const tabs = ['Overview', 'Syllabus', 'Reviews'];
	const done = 4;
	return (
		<>
			<Nav />
			<Section>
				<p className="dp-crumbs">Courses / Beginners / <b>{sub.brand}</b></p>
				<div className="dp-learn-head">
					<div>
						<Title text="Touch typing in twelve lessons." hl="twelve lessons" />
						<p className="dp-lead">{sub.sub}</p>
						<div className="dp-chips"><Badge>Beginner</Badge><Badge v="outline">12 lessons</Badge><Badge v="outline">10 min a day</Badge><Badge v="dot">4.9 · 2,310 reviews</Badge></div>
					</div>
					<div className="dp-ring" role="img" aria-label={`${done} of 12 lessons done`}>
						<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="10" /><circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="10" strokeDasharray={`${(done / 12) * 327} 327`} transform="rotate(-90 60 60)" /></svg>
						<b>{done}/12</b><small>lessons done</small>
					</div>
				</div>
				<div className="dp-tabs" role="tablist" aria-label="Course sections">
					{tabs.map((t, i) => <button key={t} role="tab" aria-selected={tab === i} className="dp-tab dp-h" onClick={() => setTab(i)}>{t}</button>)}
				</div>
				<div className="dp-learn-body">
					<div role="tabpanel">
						{tab === 0 && <div className="dp-prose"><p>{sub.features[0].body}</p><p>{sub.features[1].body}</p><p>{sub.features[2].body}</p></div>}
						{tab === 1 && (
							<ul className="dp-syllabus">
								{sub.items.map((it, i) => (
									<li key={it.name} data-open={open === i ? '' : undefined}>
										<button className="dp-h" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
											<small>{String(i + 1).padStart(2, '0')}</small><b>{it.name}</b><em>{i < done ? 'Done' : it.price}</em>
										</button>
										{open === i && <p>Keys practised: <code>{it.meta}</code>. About ten minutes. The lesson repeats any key you miss more than twice.</p>}
									</li>
								))}
							</ul>
						)}
						{tab === 2 && <div className="dp-grid3">{[0, 1, 2].map((i) => <Card key={i}><p>“{sub.quote.text}”</p><small>{sub.quote.who} · {sub.quote.role}</small></Card>)}</div>}
					</div>
					<aside><Card className="dp-enrol"><h3>Free for schools</h3><p>Start lesson five where you stopped.</p><ul className="dp-ticks">{['Works on any keyboard', 'No account to begin', 'Progress by class', 'Offline after first load'].map((t) => <li key={t}>{t}</li>)}</ul><Btn arrow>Continue lesson 5</Btn></Card></aside>
				</div>
			</Section>
			<Footer />
		</>
	);
}

function Product() {
	const { sub } = useDp();
	const [img, setImg] = useState(0);
	const [qty, setQty] = useState(1);
	const [col, setCol] = useState(0);
	const [added, setAdded] = useState(false);
	const kinds = ['landscape', 'geo', 'orbital', 'blob'];
	return (
		<>
			<Nav />
			<Section>
				<div className="dp-pdp">
					<div className="dp-gallery">
						<Pic ratio="1/1" kind={kinds[img]} seed={90 + img} caption={sub.gallery[img]} />
						<div className="dp-thumbs">{kinds.map((k, i) => <button key={k} aria-label={`Image ${i + 1}`} aria-pressed={img === i} className="dp-thumb dp-h" onClick={() => setImg(i)}><Pic ratio="1/1" kind={k} seed={90 + i} /></button>)}</div>
					</div>
					<div className="dp-buy">
						<Eyebrow>{sub.eyebrow}</Eyebrow>
						<Title text={sub.items[0].name} />
						<p className="dp-price">{sub.items[0].price}</p>
						<p className="dp-lead">{sub.sub}</p>
						<div className="dp-seg" role="radiogroup" aria-label="Finish">{sub.items.slice(0, 3).map((it, i) => <button key={it.name} role="radio" aria-checked={col === i} className="dp-h" onClick={() => setCol(i)}>{it.meta.split('·')[0]}</button>)}</div>
						<div className="dp-buy-row">
							<div className="dp-qty"><button aria-label="Fewer" className="dp-h" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><output aria-live="polite">{qty}</output><button aria-label="More" className="dp-h" onClick={() => setQty(qty + 1)}>+</button></div>
							<Btn arrow onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 1600); }}>{added ? 'Added ✓' : `Add to bag · ${qty}`}</Btn>
						</div>
						<table className="dp-spec dp-spec-sm"><tbody>{sub.stats.map((s) => <tr key={s.l}><th scope="row">{s.l}</th><td>{s.v}</td></tr>)}</tbody></table>
						<div className="dp-faq">{sub.features.slice(0, 3).map((f) => <details key={f.title}><summary className="dp-h">{f.title}</summary><p>{f.body}</p></details>)}</div>
					</div>
				</div>
			</Section>
			<Quote />
			<Footer />
		</>
	);
}

function Store() {
	const { sub } = useDp();
	const cats = ['All', ...Array.from(new Set(sub.features.map((f) => f.tag)))].slice(0, 5);
	const [cat, setCat] = useState('All');
	const [bag, setBag] = useState(0);
	const arts = ['landscape', 'geo', 'blob', 'halftone', 'collage', 'orbital'];
	const rows = sub.items.map((it, i) => ({ ...it, cat: sub.features[i % sub.features.length].tag, art: arts[i] }));
	const shown = rows.filter((r) => cat === 'All' || r.cat === cat);
	return (
		<>
			<Nav />
			<Section>
				<div className="dp-shop-head"><Title text="The new season" hl="new season" as="h2" /><Badge v="dot">{bag} in bag</Badge></div>
				<div className="dp-chips" role="group" aria-label="Filter">{cats.map((c) => <button key={c} aria-pressed={cat === c} className="dp-chip dp-h" onClick={() => setCat(c)}>{c}</button>)}</div>
				<div className="dp-products">
					{shown.map((r, i) => (
						<Card key={r.name} className="dp-product">
							<div {...R(i % 3)}>
								<Pic ratio="4/5" kind={r.art} seed={100 + i} />
								<div className="dp-product-meta"><h3>{r.name}</h3><span>{r.meta}</span><b>{r.price}</b></div>
								<Btn kind="secondary" size="sm" onClick={() => setBag(bag + 1)}>Add to bag</Btn>
							</div>
						</Card>
					))}
					{shown.length === 0 && <p>Nothing in this category yet.</p>}
				</div>
			</Section>
			<Ticker />
			<Footer />
		</>
	);
}

function Agency() {
	const { sub } = useDp();
	const [on, setOn] = useState(0);
	const arts = ['geo', 'collage', 'orbital', 'halftone', 'sketch', 'blob'];
	return (
		<>
			<Nav />
			<header className="dp-agency">
				<div className="dp-wrap">
					<h1 className="dp-title dp-mega" data-lvl="h1">{sub.title}</h1>
				</div>
			</header>
			<Marquee items={sub.ticker} speed={20} />
			<Section>
				<div className="dp-cases">
					<ul>
						{sub.items.map((it, i) => (
							<li key={it.name} data-on={on === i ? '' : undefined}>
								<button className="dp-h" onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}>
									<small>{String(i + 1).padStart(2, '0')}</small><b>{it.name}</b><em>{it.meta}</em><Arrow />
								</button>
							</li>
						))}
					</ul>
					<div className="dp-case-pic"><Pic ratio="4/5" kind={arts[on]} seed={110 + on} caption={sub.items[on].name} /></div>
				</div>
			</Section>
			<Stats />
			<Closing />
			<Footer />
		</>
	);
}

function Restaurant() {
	const { sub } = useDp();
	const [sent, setSent] = useState(false);
	return (
		<>
			<Nav />
			<Hero layout="cover" />
			<Section>
				<Heading eyebrow="Tonight" title="Seven courses, in this order." hl="in this order" align="center" />
				<ul className="dp-menu">
					{sub.items.map((it, i) => (
						<li key={it.name} {...R(i % 2)}>
							<div><b>{it.name}</b><small>{it.meta}</small></div>
							<i aria-hidden="true" />
							<span>{it.price}</span>
						</li>
					))}
				</ul>
			</Section>
			<Section tone="alt">
				<div className="dp-two">
					<Card>
						<h3>Opening hours</h3>
						<dl className="dp-hours">{[['Tuesday – Thursday', '19:00 – 23:00'], ['Friday – Saturday', '18:30 – 00:00'], ['Sunday – Monday', 'Closed']].map(([d, h]) => <div key={d}><dt>{d}</dt><dd>{h}</dd></div>)}</dl>
						<p>{sub.footer}</p>
					</Card>
					<form className="dp-booking" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
						<h3>Reserve a table</h3>
						<Field label="Name" placeholder="Your name" />
						<div className="dp-pair"><Field label="Date" type="date" /><Field label="Guests" type="number" placeholder="2" /></div>
						<Btn type="submit" arrow>{sent ? 'Request sent ✓' : sub.closing.button}</Btn>
					</form>
				</div>
			</Section>
			<Footer />
		</>
	);
}

function EventPage() {
	const { sub } = useDp();
	const [day, setDay] = useState(0);
	const days = ['Friday', 'Saturday', 'Sunday'];
	const slots = ['08:00', '09:30', '11:00', '13:00', '15:30'];
	return (
		<>
			<Nav />
			<Hero layout="poster" />
			<Section>
				<Heading eyebrow="Programme" title="Three days, one start line." hl="one start line" />
				<div className="dp-tabs" role="tablist">{days.map((d, i) => <button key={d} role="tab" aria-selected={day === i} className="dp-tab dp-h" onClick={() => setDay(i)}>{d}</button>)}</div>
				<ol className="dp-schedule">{slots.map((t, i) => { const it = sub.items[(i + day * 2) % sub.items.length]; return <li key={t} className="dp-h"><time>{t}</time><b>{it.name}</b><span>{it.meta}</span><Badge v="outline">{it.price}</Badge></li>; })}</ol>
			</Section>
			<Section tone="alt">
				<Heading eyebrow="Tickets" title="Choose how you join." hl="how you join" />
				<div className="dp-grid3">
					{[['Spectator', 'Free', ['Access to the start village', 'Live results screen']], ['Runner', '£35', ['Timed entry', 'Bib and finisher medal', 'Baggage drop']], ['Club', '£120', ['Reserved start pen', 'Hospitality tent', 'Four runners']]].map(([n, p, f], i) => (
						<Card key={n as string} className={i === 1 ? 'dp-featured' : ''}><Badge v={i === 1 ? 'solid' : 'outline'}>{n as string}</Badge><p className="dp-price">{p as string}</p><ul className="dp-ticks">{(f as string[]).map((x) => <li key={x}>{x}</li>)}</ul><Btn kind={i === 1 ? 'primary' : 'secondary'}>Choose</Btn></Card>
					))}
				</div>
			</Section>
			<Footer />
		</>
	);
}

function Docs() {
	const { sub } = useDp();
	const [copied, setCopied] = useState(false);
	const tree = [['Getting started', ['Introduction', 'Quickstart', 'Authentication']], ['Datasets', ['Sea surface', 'Ice edge', 'Carbon']], ['API', ['Endpoints', 'Pagination', 'Errors']]] as const;
	return (
		<div className="dp-docs">
			<Nav />
			<div className="dp-wrap dp-docs-grid">
				<nav className="dp-tree" aria-label="Documentation">{tree.map(([g, items]) => <div key={g}><h3>{g}</h3><ul>{items.map((x, i) => <li key={x} data-on={g === 'API' && i === 0 ? '' : undefined}><a href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{x}</a></li>)}</ul></div>)}</nav>
				<article className="dp-doc">
					<p className="dp-crumbs">API / <b>Endpoints</b></p>
					<Title text="Request a time series." hl="time series" />
					<p className="dp-lead">Fetch any dataset as JSON, CSV or NetCDF. Every response carries its method version and uncertainty.</p>
					<div className="dp-code">
						<div><span>curl</span><button className="dp-h" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? 'Copied ✓' : 'Copy'}</button></div>
						<pre><code>{`curl "https://api.halden.example/v4/sst\n  ?lat=62.4&lon=-14.2\n  &from=2024-01-01&to=2024-12-31\n  &format=json" \\\n  -H "Authorization: Bearer $TOKEN"`}</code></pre>
					</div>
					<div className="dp-callout"><b>Note</b> Requests are limited to 600 a minute. Bulk downloads are not.</div>
					<h2 className="dp-h2">Parameters</h2>
					<table className="dp-spec dp-spec-sm"><thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody>{[['lat', 'number', 'Latitude in degrees, −90 to 90'], ['lon', 'number', 'Longitude in degrees, −180 to 180'], ['from', 'date', 'First day, ISO 8601'], ['format', 'string', 'json, csv or netcdf']].map(([a, b, c]) => <tr key={a}><th scope="row"><code>{a}</code></th><td>{b}</td><td>{c}</td></tr>)}</tbody></table>
				</article>
				<aside className="dp-toc"><h3>On this page</h3><ul>{['Request a time series', 'Parameters', 'Responses', 'Errors'].map((x, i) => <li key={x} data-on={i === 0 ? '' : undefined}><a href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{x}</a></li>)}</ul><p>{sub.footer}</p></aside>
			</div>
		</div>
	);
}

const RENDER: Record<string, () => ReactNode> = { landing: Landing, portfolio: Portfolio, editorial: Editorial, learn: Learn, product: Product, store: Store, agency: Agency, restaurant: Restaurant, event: EventPage, docs: Docs };

export const BLUEPRINTS: Blueprint[] = BLUEPRINT_META.map((m) => ({ ...m, render: RENDER[m.id] }));

export const BLUEPRINT_BY_ID = Object.fromEntries(BLUEPRINTS.map((b) => [b.id, b])) as Record<string, Blueprint>;

export { Features, Closing };
