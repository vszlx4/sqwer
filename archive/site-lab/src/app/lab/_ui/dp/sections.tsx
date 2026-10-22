'use client';

// Content sections: eight ways to lay out the same six features, plus stats, steps, a mosaic, a quote and a closing call.

import { useRef } from 'react';
import { R, useDp } from './ctx';
import { Arrow, Badge, Btn, Card, Field, Heading, Marquee, Pic, Section, Title } from './parts';

const pad = (n: number) => String(n + 1).padStart(2, '0');

export function Features({ layout }: { layout?: string }) {
	const { spec, sub } = useDp();
	const l = layout ?? spec.features;
	const f = sub.features;
	const scroller = useRef<HTMLDivElement>(null);
	const head = <Heading eyebrow="What you get" title={headFor(sub.id)} hl={hlFor(sub.id)} sub={subFor(sub.id)} />;

	let body;
	switch (l) {
		case 'bento':
			body = (
				<div className="dp-bento">
					{f.map((x, i) => (
						<Card key={x.title} className={`dp-b${i}`} {...{}}>
							<div {...R(i)} className="dp-bento-in">
								{i === 0 && <Pic fill className="dp-bento-pic" seed={31} />}
								<Badge v="soft">{x.tag}</Badge>
								<h3>{x.title}</h3>
								<p>{x.body}</p>
							</div>
						</Card>
					))}
				</div>
			);
			break;
		case 'list':
			body = (
				<ul className="dp-rows">
					{f.map((x, i) => (
						<li key={x.title} className="dp-row dp-h" {...R(i)}>
							<small>{pad(i)}</small>
							<h3>{x.title}</h3>
							<p>{x.body}</p>
							<span className="dp-row-tag">{x.tag}<Arrow /></span>
						</li>
					))}
				</ul>
			);
			break;
		case 'zigzag':
			body = (
				<div className="dp-zig">
					{f.slice(0, 4).map((x, i) => (
						<div key={x.title} className="dp-zig-row" {...R(0)}>
							<Pic ratio="5/4" seed={40 + i} caption={x.tag} />
							<div>
								<small className="dp-num">{pad(i)}</small>
								<h3>{x.title}</h3>
								<p>{x.body}</p>
								<Btn v="arrow" kind="secondary" arrow>Read more</Btn>
							</div>
						</div>
					))}
				</div>
			);
			break;
		case 'strip':
			body = (
				<>
					<div className="dp-strip-ctl">
						<Btn kind="secondary" onClick={() => scroller.current?.scrollBy({ left: -360, behavior: 'smooth' })}>Prev</Btn>
						<Btn onClick={() => scroller.current?.scrollBy({ left: 360, behavior: 'smooth' })} arrow>Next</Btn>
					</div>
					<div className="dp-strip" ref={scroller} data-lenis-prevent tabIndex={0} role="region" aria-label="Features, scrolls sideways">
						{f.map((x, i) => (
							<Card key={x.title} className="dp-strip-card">
								<Pic ratio="4/3" seed={50 + i} />
								<Badge v="outline">{x.tag}</Badge>
								<h3>{x.title}</h3>
								<p>{x.body}</p>
							</Card>
						))}
					</div>
				</>
			);
			break;
		case 'numbered':
			body = (
				<ol className="dp-numbered">
					{f.map((x, i) => (
						<li key={x.title} {...R(i % 2)}>
							<b aria-hidden="true">{pad(i)}</b>
							<div>
								<h3>{x.title}</h3>
								<p>{x.body}</p>
							</div>
						</li>
					))}
				</ol>
			);
			break;
		case 'rules':
			body = (
				<div className="dp-cols">
					{[f.slice(0, 2), f.slice(2, 4), f.slice(4, 6)].map((col, ci) => (
						<div key={ci} className="dp-col" {...R(ci)}>
							{col.map((x, i) => (
								<article key={x.title}>
									<small>{x.tag}</small>
									<h3>{x.title}</h3>
									<p data-drop={ci === 0 && i === 0 ? '' : undefined}>{x.body}</p>
								</article>
							))}
						</div>
					))}
				</div>
			);
			break;
		case 'spec':
			body = (
				<table className="dp-spec">
					<thead><tr><th>Ref.</th><th>Item</th><th>Detail</th><th>Class</th></tr></thead>
					<tbody>
						{f.map((x, i) => (
							<tr key={x.title} className="dp-h">
								<td>{pad(i)}</td>
								<th scope="row">{x.title}</th>
								<td>{x.body}</td>
								<td><Badge v="outline">{x.tag}</Badge></td>
							</tr>
						))}
					</tbody>
				</table>
			);
			break;
		default:
			body = (
				<div className="dp-grid3">
					{f.map((x, i) => (
						<Card key={x.title}>
							<div {...R(i % 3)} className="dp-card-in">
								<Badge>{x.tag}</Badge>
								<h3>{x.title}</h3>
								<p>{x.body}</p>
								<span className="dp-more">Learn more <Arrow /></span>
							</div>
						</Card>
					))}
				</div>
			);
	}
	return (
		<Section id="features">
			{head}
			{body}
		</Section>
	);
}

function headFor(id: string) {
	return ({ typing: 'Everything a beginner needs, nothing they don’t.', atelier: 'Six pieces that define the season.', studio: 'Selected work, in the rooms it was made for.', kitchen: 'Tonight’s menu, as it stands.', observatory: 'Datasets built to be cited.', kids: 'Things to make and do this week.', athletic: 'Pick your session.', product: 'Why it’s different.' } as Record<string, string>)[id] ?? 'What we do';
}
function hlFor(id: string) {
	return ({ typing: 'nothing they don’t', atelier: 'define the season', studio: 'the rooms', kitchen: 'as it stands', observatory: 'cited', kids: 'make and do', athletic: 'your session', product: 'different' } as Record<string, string>)[id];
}
function subFor(id: string) {
	return ({ typing: 'Each part of the course exists to answer a question a new typist actually has.', atelier: 'Cut in one workshop, finished by hand, and meant to be repaired rather than replaced.', studio: 'Identity, wayfinding and exhibition design for museums, theatres and cities.', kitchen: 'Seven courses; the order follows the market, not a template.', observatory: 'Every series carries its method, its uncertainty and its changelog.', kids: 'Short, clear and low on mess, for grown-ups with ten minutes.', athletic: 'Six sessions a week, all paces welcome.', product: 'Six decisions we would not compromise on.' } as Record<string, string>)[id];
}

export function Ticker() {
	const { sub } = useDp();
	return <Marquee items={sub.ticker} />;
}

export function Stats() {
	const { sub } = useDp();
	return (
		<Section tone="alt">
			<dl className="dp-stats">
				{sub.stats.map((s, i) => (
					<div key={s.l} {...R(i)}>
						<dt>{s.v}</dt>
						<dd>{s.l}</dd>
					</div>
				))}
			</dl>
		</Section>
	);
}

export function Steps() {
	const { sub } = useDp();
	return (
		<Section>
			<Heading eyebrow="How it works" title="Three steps, in this order." hl="in this order" />
			<ol className="dp-steps">
				{sub.steps.map((s, i) => (
					<li key={s.title} {...R(i)}>
						<span className="dp-step-n">{i + 1}</span>
						<h3>{s.title}</h3>
						<p>{s.body}</p>
					</li>
				))}
			</ol>
		</Section>
	);
}

export function Showcase() {
	const { sub } = useDp();
	return (
		<Section>
			<Heading eyebrow="Gallery" title="A closer look." hl="closer" />
			<div className="dp-mosaic">
				{sub.gallery.map((g, i) => (
					<div key={g} className={`dp-m${i}`} {...R(i)}>
						<Pic fill seed={60 + i} caption={g} />
					</div>
				))}
			</div>
		</Section>
	);
}

export function Quote() {
	const { sub } = useDp();
	return (
		<Section tone="alt">
			<figure className="dp-quote" {...R(0)}>
				<blockquote>{sub.quote.text}</blockquote>
				<figcaption><b>{sub.quote.who}</b><span>{sub.quote.role}</span></figcaption>
			</figure>
		</Section>
	);
}

export function Closing() {
	const { sub } = useDp();
	return (
		<Section tone="accent">
			<div className="dp-closing">
				<div {...R(0)}>
					<Title as="h2" text={sub.closing.title} />
					<p className="dp-lead">{sub.closing.sub}</p>
				</div>
				<form className="dp-signup" onSubmit={(e) => e.preventDefault()} {...R(1)}>
					<Field label="Email address" placeholder="you@example.com" type="email" />
					<Btn type="submit" arrow>{sub.closing.button}</Btn>
				</form>
			</div>
		</Section>
	);
}
