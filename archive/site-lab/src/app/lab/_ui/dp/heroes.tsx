'use client';

// Fifteen hero compositions. They share content and parts; what differs is the arrangement, scale and the way the
// picture and type relate.

import { R, useDp } from './ctx';
import { Arrow, Btn, Eyebrow, Nav, Pic, Title } from './parts';

export function Hero({ layout }: { layout?: string }) {
	const { spec, sub } = useDp();
	const l = layout ?? spec.layout;
	const title = <Title text={sub.title} hl={sub.hl} />;
	const lead = <p className="dp-lead" {...R(1)}>{sub.sub}</p>;
	const actions = (
		<div className="dp-actions" {...R(2)}>
			<Btn arrow>{sub.cta}</Btn>
			<Btn kind="secondary">{sub.cta2}</Btn>
		</div>
	);
	const stats = (
		<dl className="dp-stats-inline" {...R(3)}>
			{sub.stats.map((s) => (
				<div key={s.l}>
					<dt>{s.v}</dt>
					<dd>{s.l}</dd>
				</div>
			))}
		</dl>
	);

	switch (l) {
		case 'centered':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
						</div>
						<Pic className="dp-hero-pic" ratio="21/9" seed={2} />
					</div>
				</header>
			);
		case 'giant':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<Eyebrow>{sub.eyebrow}</Eyebrow>
						{title}
						<div className="dp-hero-row">
							<div>
								{lead}
								{actions}
							</div>
							<Pic className="dp-hero-pic" ratio="4/3" seed={3} />
						</div>
					</div>
				</header>
			);
		case 'editorial':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-ed-bar"><span>{sub.brand}</span><span>Vol. 12 · No. 4</span><span>{sub.eyebrow}</span></div>
						<div className="dp-ed-grid">
							<aside {...R(1)}>
								<h3>In this issue</h3>
								<ol>{sub.features.slice(0, 4).map((f, i) => <li key={f.title}><b>{String(i + 1).padStart(2, '0')}</b> {f.title}</li>)}</ol>
							</aside>
							<div className="dp-hero-text">
								{title}
								{lead}
								{actions}
							</div>
							<Pic className="dp-hero-pic" ratio="3/4" seed={4} caption={sub.gallery[0]} />
						</div>
					</div>
				</header>
			);
		case 'poster':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-poster-block">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
						</div>
						<div className="dp-poster-side">
							<Pic className="dp-hero-pic" ratio="1/1" seed={5} />
							{lead}
							{actions}
						</div>
					</div>
				</header>
			);
		case 'overlap':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<Pic className="dp-hero-pic" ratio="16/11" seed={6} />
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
						</div>
					</div>
				</header>
			);
		case 'index':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-ix-row"><small>00</small><Eyebrow>{sub.eyebrow}</Eyebrow></div>
						<div className="dp-ix-row"><small>01</small><div className="dp-hero-text">{title}</div></div>
						<div className="dp-ix-row"><small>02</small><div>{lead}{actions}</div></div>
						<div className="dp-ix-row">
							<small>03</small>
							<ul className="dp-ix-list">
								{sub.items.slice(0, 4).map((it, i) => (
									<li key={it.name} {...R(i)}>
										<b>{String(i + 1).padStart(2, '0')}</b>
										<span>{it.name}</span>
										<em>{it.meta}</em>
										<Arrow />
									</li>
								))}
							</ul>
						</div>
					</div>
				</header>
			);
		case 'sticker':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-st-badge dp-st-1">{sub.stats[0].v}<small>{sub.stats[0].l}</small></div>
						<div className="dp-st-badge dp-st-2">{sub.stats[1].v}<small>{sub.stats[1].l}</small></div>
						<Pic className="dp-st-pic dp-st-pa" ratio="1/1" seed={7} />
						<Pic className="dp-st-pic dp-st-pb" ratio="1/1" seed={8} />
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
						</div>
					</div>
				</header>
			);
		case 'terminal':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-term">
							<div className="dp-term-bar"><i /><i /><i /><span>{sub.brand} — zsh</span></div>
							<div className="dp-term-body">
								<p className="dp-prompt">{sub.eyebrow.toLowerCase()}</p>
								{title}
								{lead}
								<p className="dp-prompt dp-prompt-live">{sub.cta.toLowerCase()}</p>
								<div className="dp-actions" {...R(2)}><Btn v="brackets">{sub.cta}</Btn><Btn v="brackets" kind="secondary">{sub.cta2}</Btn></div>
							</div>
							<Pic className="dp-hero-pic" ratio="4/3" seed={9} />
						</div>
					</div>
				</header>
			);
		case 'hud':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-hud-col">
							{sub.stats.map((s) => <div key={s.l} {...R(1)}><small>{s.l}</small><b>{s.v}</b></div>)}
						</div>
						<div className="dp-hud-core">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							<div className="dp-hud-pic"><Pic ratio="1/1" seed={10} /><i /><i /><i /><i /></div>
							{actions}
						</div>
						<div className="dp-hud-col">{lead}<small>SIGNAL 98 %</small><small>LAT 51.4821° N</small><small>SYS NOMINAL</small></div>
					</div>
				</header>
			);
		case 'vertical':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-vert-title">{title}</div>
						<Pic className="dp-hero-pic" ratio="3/5" seed={11} />
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{lead}
							{actions}
						</div>
					</div>
				</header>
			);
		case 'chaos':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<Pic className="dp-ch-a" ratio="4/5" seed={12} />
						<Pic className="dp-ch-b" ratio="1/1" seed={13} />
						<div className="dp-ch-title">{title}</div>
						<div className="dp-ch-note"><Eyebrow>{sub.eyebrow}</Eyebrow>{lead}</div>
						<div className="dp-ch-act">{actions}</div>
					</div>
				</header>
			);
		case 'storyboard':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
						</div>
						<div className="dp-sb">
							{sub.steps.map((s, i) => (
								<figure key={s.title} {...R(i)}>
									<Pic ratio="4/3" seed={20 + i} />
									<figcaption><b>{i + 1}</b> {s.title}</figcaption>
								</figure>
							))}
						</div>
						{actions}
					</div>
				</header>
			);
		case 'cover':
			return (
				<header className="dp-hero" data-l={l}>
					<Pic className="dp-cover-pic" fill seed={14} />
					<div className="dp-cover-shade" />
					<div className="dp-wrap">
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
						</div>
					</div>
				</header>
			);
		case 'sidebar':
			return (
				<header className="dp-hero" data-l={l}>
					<div className="dp-wrap">
						<aside className="dp-side">
							<span className="dp-brand"><span className="dp-mark">{sub.mark}</span><span className="dp-brand-name">{sub.brand}</span></span>
							<ul>{sub.nav.map((n, i) => <li key={n} data-on={i === 0 ? '' : undefined}><a href="#" className="dp-link dp-h" onClick={(e) => e.preventDefault()}>{n}</a></li>)}</ul>
							{stats}
						</aside>
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
							<Pic className="dp-hero-pic" ratio="16/7" seed={15} />
						</div>
					</div>
				</header>
			);
		default:
			return (
				<header className="dp-hero" data-l="split">
					<div className="dp-wrap">
						<div className="dp-hero-text">
							<Eyebrow>{sub.eyebrow}</Eyebrow>
							{title}
							{lead}
							{actions}
							{stats}
						</div>
						<Pic className="dp-hero-pic" ratio="4/5" seed={1} />
					</div>
				</header>
			);
	}
}

/** Navigation is part of the sidebar hero when that layout is chosen. */
export function TopNav() {
	const { spec } = useDp();
	return spec.layout === 'sidebar' ? null : <Nav />;
}
