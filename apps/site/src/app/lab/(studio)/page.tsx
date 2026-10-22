import Link from 'next/link';
import { SUBJECTS } from '../_engine/content';
import { TYPE_PAIRS } from '../_engine/fonts';
import { ARTS, BGS, BUTTONS, CARDS, LAYOUTS } from '../_engine/options';
import { PALETTES } from '../_engine/palettes';
import { WORLDS } from '../_engine/worlds';
import { LAB_PAGES } from '../pages';
import { BLUEPRINT_META as BLUEPRINTS } from '../_engine/blueprints';
import { HomeLive } from '../_ui/HomeLive';
import { PageHead } from '../_ui/kit';

const FACTS: Record<string, string> = {
	'/lab/styles': `${WORLDS.length} worlds`,
	'/lab/blueprints': `${BLUEPRINTS.length} page types`,
	'/lab/components': `${BUTTONS.length} buttons · ${CARDS.length} cards`,
	'/lab/typography': `${TYPE_PAIRS.length} pairings`,
	'/lab/colour': `${PALETTES.length} palettes`,
	'/lab/backgrounds': `${BGS.length} grounds`,
	'/lab/motion': '8 reveals · 7 easings',
	'/lab/assets': `${ARTS.length} illustrators · 36 icons`,
	'/lab/layouts': `${LAYOUTS.length} compositions`,
	'/lab/mixer': '27 dimensions',
	'/lab/workbench': `${SUBJECTS.length} content sets`,
	'/lab/saved': 'Library & compare'
};

export default function Home() {
	return (
		<main className="lab-page">
			<PageHead
				kicker="Atlas · design exploration lab"
				title={<>A universe of <em>possible</em> websites.</>}
				lead={`${WORLDS.length} complete design worlds, ${PALETTES.length} palettes, ${TYPE_PAIRS.length} type pairings and ${BGS.length} backgrounds that all share one engine. Mix them, lock what you love, randomise the rest, and judge every combination as a real, rendered page.`}
			>
				<Link href="/lab/mixer" className="lb" data-primary="">Open the mixer →</Link>
				<Link href="/lab/styles" className="lb">Browse the styles</Link>
			</PageHead>

			<HomeLive />

			<section className="lab-sec">
				<div className="lab-sec-head">
					<div>
						<h2 className="lab-h2">The map</h2>
						<p>Every page below reads and writes the same working design, so a palette chosen in the colour lab appears in the component lab and in the mixer.</p>
					</div>
				</div>
				<div className="lab-grid" style={{ ['--min' as string]: '260px' }}>
					{LAB_PAGES.filter((p) => p.href !== '/lab').map((p, i) => (
						<Link key={p.href} href={p.href} className="lab-tile" style={{ textDecoration: 'none' }}>
							<div className="lab-tile-meta" style={{ padding: 18, minHeight: 150, alignContent: 'space-between' }}>
								<div className="lab-tile-row"><span className="lab-mono">{String(i + 1).padStart(2, '0')} · {p.group}</span><span className="lab-mono" style={{ color: 'var(--l-acc)' }}>{FACTS[p.href]}</span></div>
								<div>
									<strong style={{ fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{p.label}</strong>
									<p style={{ marginTop: 6 }}>{p.note}</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			</section>

			<section className="lab-sec">
				<div className="lab-sec-head"><div><h2 className="lab-h2">How it works</h2></div></div>
				<div className="lab-grid" style={{ ['--min' as string]: '300px' }}>
					{[
						['One spec', 'A design is a single object: palette, type, background, layout, components, imagery, motion and shape. Everything renders from it.'],
						['Real renders', 'Nothing is a mock-up. The same page code draws every thumbnail, every comparison and the full-size preview, in light and dark, at desktop, tablet and phone widths.'],
						['Lock and roll', 'Lock the dimensions you like, then randomise the rest at a restrained, balanced or radical intensity. Surprise me fuses two different worlds.'],
						['Take it with you', 'Copy CSS variables, a Tailwind v4 theme, W3C-style design tokens or a component configuration, and re-import any design later.']
					].map(([t, b]) => (
						<div key={t} className="lab-card" style={{ padding: 18, display: 'grid', gap: 8 }}>
							<strong style={{ fontFamily: 'var(--font-altera-serif), Georgia, serif', fontWeight: 400, fontSize: '1.3rem' }}>{t}</strong>
							<p className="lab-note">{b}</p>
						</div>
					))}
				</div>
			</section>
		</main>
	);
}
