'use client';

import { useState } from 'react';
import { FACES, FLEX_AXES, STACKS, TYPE_PAIRS } from '../_engine/fonts';
import { labStore, useLab } from '../_engine/store';
import { Dp } from './dp/Dp';
import { CopyBtn, PageHead, Sec, SpecBar } from './kit';

const RATIOS: [string, number][] = [['Minor second', 1.067], ['Major second', 1.125], ['Minor third', 1.2], ['Major third', 1.25], ['Perfect fourth', 1.333], ['Augmented fourth', 1.414], ['Perfect fifth', 1.5], ['Golden', 1.618]];

function Pairings() {
	const { current, favs } = useLab();
	const [q, setQ] = useState('');
	const list = TYPE_PAIRS.filter((t) => `${t.name} ${t.note} ${t.fams.join(' ')}`.toLowerCase().includes(q.toLowerCase()));
	return (
		<Sec title="Pairings" note="Click one to apply it to the working design. Faces marked system load from the visitor’s machine; the rest are self-hosted." actions={<input className="lab-input" style={{ width: 220 }} placeholder="Search pairings…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search pairings" />}>
			<div className="lab-grid" style={{ ['--min' as string]: '340px' }}>
				{list.map((t) => (
					<div key={t.id} className="lab-tile" data-on={current.type === t.id ? '' : undefined} style={current.type === t.id ? { borderColor: 'var(--l-acc)' } : undefined}>
						<button type="button" onClick={() => labStore.patch({ type: t.id })} style={{ all: 'unset', cursor: 'pointer', display: 'block', padding: 22, background: '#f4efe4', color: '#14110c' }} aria-label={`Apply ${t.name}`}>
							<div style={{ fontFamily: t.display, fontWeight: t.dw, fontStyle: t.italic ? 'italic' : 'normal', textTransform: t.caseD, letterSpacing: `${t.tr}em`, fontSize: 44, lineHeight: t.lh < 1 ? 0.95 : 1.05 }}>Quiet hands type</div>
							<div style={{ fontFamily: t.body, fontSize: 14, marginTop: 10, lineHeight: 1.5 }}>The five boxing wizards jump quickly. Pack my box with five dozen liquor jugs, and read it slowly.</div>
							<div style={{ fontFamily: t.mono, fontSize: 11, marginTop: 10, opacity: 0.7 }}>0123456789 — { '{ code: "mono" }' }</div>
						</button>
						<div className="lab-tile-meta">
							<div className="lab-tile-row"><strong>{t.name}</strong><button className="lab-fav" aria-pressed={favs.includes(`type:${t.id}`)} onClick={() => labStore.toggleFav(`type:${t.id}`)} aria-label="Favourite">{favs.includes(`type:${t.id}`) ? '★' : '☆'}</button></div>
							<p>{t.note}</p>
						</div>
					</div>
				))}
			</div>
		</Sec>
	);
}

function Scale() {
	const { current } = useLab();
	const [ratio, setRatio] = useState(1.25);
	const [base, setBase] = useState(17);
	const [lh, setLh] = useState(1.5);
	const steps = [-2, -1, 0, 1, 2, 3, 4, 5, 6];
	const names = ['caption', 'small', 'body', 'lead', 'h4', 'h3', 'h2', 'h1', 'display'];
	const css = steps.map((s, i) => `--text-${names[i]}: ${(base * ratio ** s / 16).toFixed(3)}rem;`).join('\n');
	return (
		<Sec title="Type scale" note="A modular scale from a base size and a ratio, set in the working design’s own faces." actions={<CopyBtn text={css} label="Copy scale" />}>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) minmax(0,1fr)', gap: 24 }} className="lab-two">
				<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 14, alignContent: 'start' }}>
					<label className="ctl"><span className="ctl-row"><span>Ratio</span></span><select className="lab-select" value={ratio} onChange={(e) => setRatio(Number(e.target.value))}>{RATIOS.map(([n, r]) => <option key={n} value={r}>{n} · {r}</option>)}</select></label>
					<label className="ctl"><span className="ctl-row"><span>Base size</span><span className="lab-mono">{base}px</span></span><input className="lab-range" type="range" min={12} max={24} value={base} onChange={(e) => setBase(Number(e.target.value))} /></label>
					<label className="ctl"><span className="ctl-row"><span>Body line height</span><span className="lab-mono">{lh}</span></span><input className="lab-range" type="range" min={1.1} max={1.9} step={0.05} value={lh} onChange={(e) => setLh(Number(e.target.value))} /></label>
					<pre className="lab-code" style={{ maxHeight: 220 }}>{css}</pre>
				</div>
				<div className="lab-card" style={{ overflow: 'hidden' }}>
					<Dp spec={current} live={false}>
						<div className="dp-demo" style={{ display: 'grid', gap: 6 }}>
							{[...steps].reverse().map((s) => {
								const i = steps.indexOf(s);
								const size = base * ratio ** s;
								const head = s >= 3;
								return (
									<div key={s} style={{ display: 'grid', gridTemplateColumns: '86px 1fr', alignItems: 'baseline', gap: 14, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
										<small>{names[i]} · {size.toFixed(1)}px</small>
										<div style={{ fontSize: Math.min(size, 120), lineHeight: head ? 1.05 : lh, fontFamily: head ? 'var(--f-display)' : 'var(--f-body)', fontWeight: head ? 'var(--w-display)' : 400, fontStyle: head ? 'var(--ital)' : 'normal', letterSpacing: head ? 'var(--tr)' : 0, textTransform: head ? ('var(--case)' as 'none') : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Typing, taught patiently</div>
									</div>
								);
							})}
						</div>
					</Dp>
				</div>
			</div>
			<style>{`@media (max-width: 980px){.lab-two{grid-template-columns:1fr!important}}`}</style>
		</Sec>
	);
}

function Variable() {
	const [vals, setVals] = useState<Record<string, number>>(Object.fromEntries(FLEX_AXES.map((a) => [a.tag, a.def])));
	const [text, setText] = useState('Variable type bends to fit');
	const fv = FLEX_AXES.map((a) => `"${a.tag}" ${vals[a.tag]}`).join(', ');
	return (
		<Sec title="Variable font playground" note="Roboto Flex is self-hosted with seven axes. Every slider is a real font axis, not a transform." actions={<CopyBtn text={`font-family: "Roboto Flex";\nfont-variation-settings: ${fv};`} label="Copy CSS" />}>
			<div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px,300px) minmax(0,1fr)', gap: 24 }} className="lab-two">
				<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 12, alignContent: 'start' }}>
					{FLEX_AXES.map((a) => (
						<label key={a.tag} className="ctl"><span className="ctl-row"><span>{a.name} <span className="lab-mono">{a.tag}</span></span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{vals[a.tag]}</span></span><input className="lab-range" type="range" min={a.min} max={a.max} value={vals[a.tag]} onChange={(e) => setVals({ ...vals, [a.tag]: Number(e.target.value) })} /></label>
					))}
					<button className="lb" data-sm="" onClick={() => setVals(Object.fromEntries(FLEX_AXES.map((a) => [a.tag, a.def])))}>Reset axes</button>
				</div>
				<div className="lab-card" style={{ padding: 28, background: '#f4efe4', color: '#14110c', display: 'grid', gap: 16, alignContent: 'center' }}>
					<input className="lab-input" style={{ background: 'transparent', color: '#14110c', borderColor: '#0003' }} value={text} onChange={(e) => setText(e.target.value)} aria-label="Sample text" />
					<div style={{ fontFamily: STACKS.flex, fontVariationSettings: fv, fontSize: 'clamp(2.4rem, 6vw, 6rem)', lineHeight: 1 }}>{text}</div>
					<div style={{ fontFamily: STACKS.flex, fontVariationSettings: fv, fontSize: 16, lineHeight: 1.5, maxWidth: '60ch' }}>Weight, width, optical size, slant, grade and two glyph-proportion axes all interpolate smoothly, so one file replaces a dozen static cuts.</div>
				</div>
			</div>
		</Sec>
	);
}

function Tester() {
	const [face, setFace] = useState('altera');
	const [size, setSize] = useState(64);
	const [weight, setWeight] = useState(400);
	const [track, setTrack] = useState(0);
	const [lead, setLead] = useState(1.1);
	const [caps, setCaps] = useState<'none' | 'uppercase' | 'lowercase' | 'capitalize'>('none');
	const [ital, setItal] = useState(false);
	const [text, setText] = useState('Handgloves, quiet and exact');
	const f = FACES.find((x) => x.id === face)!;
	return (
		<Sec title="Type tester" note="Thirty faces, any text, every property.">
			<div className="lab-card" style={{ padding: 16, display: 'grid', gap: 14 }}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: 14 }}>
					<label className="ctl"><span className="ctl-row"><span>Face</span></span><select className="lab-select" value={face} onChange={(e) => setFace(e.target.value)}>{FACES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
					{([['Size', size, setSize, 12, 200, 1, 'px'], ['Weight', weight, setWeight, 100, 900, 100, ''], ['Tracking', track, setTrack, -0.1, 0.4, 0.01, 'em'], ['Leading', lead, setLead, 0.8, 2, 0.05, '']] as const).map(([n, v, set, min, max, step, u]) => (
						<label key={n} className="ctl"><span className="ctl-row"><span>{n}</span><span className="lab-mono" style={{ color: 'var(--l-ink)' }}>{v}{u}</span></span><input className="lab-range" type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} /></label>
					))}
					<div className="ctl"><span className="ctl-row"><span>Case</span></span><div className="lab-seg">{(['none', 'uppercase', 'lowercase', 'capitalize'] as const).map((c) => <button key={c} aria-pressed={caps === c} onClick={() => setCaps(c)}>{c === 'none' ? 'Aa' : c === 'uppercase' ? 'AA' : c === 'lowercase' ? 'aa' : 'Ab'}</button>)}<button aria-pressed={ital} onClick={() => setItal(!ital)} style={{ fontStyle: 'italic' }}>It</button></div></div>
				</div>
				<textarea className="lab-input" rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-label="Text to set" />
				<div style={{ background: '#f4efe4', color: '#14110c', padding: 28, borderRadius: 3, overflow: 'hidden', fontFamily: f.stack, fontSize: size, fontWeight: weight, letterSpacing: `${track}em`, lineHeight: lead, textTransform: caps, fontStyle: ital ? 'italic' : 'normal', overflowWrap: 'anywhere' }}>{text}</div>
				<div className="lab-actions"><span className="lab-mono">{f.name} · {f.kind}</span><CopyBtn label="Copy CSS" text={`font-family: ${f.stack};\nfont-size: ${size}px;\nfont-weight: ${weight};\nletter-spacing: ${track}em;\nline-height: ${lead};\ntext-transform: ${caps};`} /></div>
			</div>
		</Sec>
	);
}

const FX: [string, string, string?][] = [
	['Outline', 'dp-fx-outline'], ['Gradient flow', 'dp-fx-grad'], ['Offset shadow', 'dp-fx-shadow'], ['Knockout', 'dp-fx-knock'], ['Extruded', 'dp-fx-stack'], ['Gradient mask', 'dp-fx-mask'],
	['Wide caps', 'dp-fx-wide'], ['Small caps', 'dp-fx-sc'], ['Wavy underline', 'dp-fx-under'], ['Highlighter', 'dp-fx-hl'], ['Focus blur', 'dp-fx-blur'], ['Sway', 'dp-fx-rotate'], ['Glitch', 'dp-glitch'], ['Ticker', 'dp-fx-marq']
];

function Effects() {
	const { current } = useLab();
	return (
		<Sec title="Text effects" note="Fourteen headline treatments in pure CSS, drawn with the working design’s type and colour.">
			<div className="lab-card" style={{ overflow: 'hidden' }}>
				<Dp spec={current} live={false}>
					<div className="dp-demo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 28 }}>
						{FX.map(([n, c]) => (
							<div key={n} className="dp-cell" style={{ minWidth: 0, width: '100%' }}>
								<small>{n}</small>
								<div style={{ fontFamily: 'var(--f-display)', fontWeight: 'var(--w-display)', fontStyle: 'var(--ital)', letterSpacing: 'var(--tr)', fontSize: 'clamp(2rem, 4vw, 3.4rem)', lineHeight: 1.05, maxWidth: '100%' }}>
									{c === 'dp-glitch' ? <span className={c} data-t="Signal">Signal</span> : c === 'dp-fx-marq' ? <div className={c}><span>Keep typing · keep typing · keep typing ·</span></div> : <span className={c}>Signal</span>}
								</div>
							</div>
						))}
					</div>
				</Dp>
			</div>
		</Sec>
	);
}

function Editorial() {
	const { current } = useLab();
	return (
		<Sec title="Editorial specimens" note="Drop caps, columns, pull quotes, hanging punctuation and running heads, using the design’s fonts.">
			<div className="lab-card" style={{ overflow: 'hidden' }}>
				<Dp spec={current} live={false}>
					<div className="dp-demo" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 36 }}>
						<article>
							<small>Running head · drop cap</small>
							<div style={{ borderTop: '2px solid var(--ink)', borderBottom: '1px solid var(--ink)', padding: '4px 0', display: 'flex', justifyContent: 'space-between', margin: '8px 0 14px' }}><small>THE LONG READ</small><small>PAGE 14</small></div>
							<div className="dp-body-cols" style={{ columnCount: 1 }}><p data-drop>Good typography is mostly invisible. Readers should feel the rhythm of a line before they notice a single letter, and the measure should let the eye find its next line without effort.</p></div>
						</article>
						<article>
							<small>Two columns, justified</small>
							<div className="dp-body-cols" style={{ marginTop: 14 }}><p>Columns narrow the measure so the eye travels less. Justified text needs hyphenation to avoid rivers of white space between words and to keep each line evenly grey.</p><p>Leave one em between columns at least, and balance the last line so no column ends on a single orphaned word.</p></div>
						</article>
						<article>
							<small>Pull quote · hanging punctuation</small>
							<blockquote className="dp-pull" style={{ columnSpan: 'none', textIndent: '-0.45em', margin: '14px 0 0' }}>“Letters are things, not pictures of things.”</blockquote>
						</article>
						<article>
							<small>Small caps · numerals</small>
							<p style={{ fontVariantCaps: 'all-small-caps', letterSpacing: '0.12em', fontSize: '1.6rem', margin: '14px 0 6px' }}>Issue No. 214 · 22 October 2026</p>
							<p style={{ fontVariantNumeric: 'oldstyle-nums proportional-nums', fontSize: '1.4rem', fontFamily: 'var(--f-display)' }}>0123456789 · 1,840 km · 38%</p>
						</article>
					</div>
				</Dp>
			</div>
		</Sec>
	);
}

export function TypographyLab() {
	return (
		<>
			<SpecBar />
			<main className="lab-page">
				<PageHead kicker="04 · Study" title={<>Type does <em>most</em> of the talking.</>} lead="Pairings that apply to the whole lab with one click, a modular scale generator, a real variable-font playground, a tester for thirty faces, expressive headline effects and editorial specimens." />
				<Pairings />
				<Scale />
				<Variable />
				<Tester />
				<Effects />
				<Editorial />
			</main>
		</>
	);
}
