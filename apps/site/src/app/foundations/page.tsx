import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SplitText from '@/components/reactbits/SplitText';
import { LogoMark } from '@/components/brand/LogoMark';
import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { EaseDemo } from '@/components/motion/EaseDemo';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowIcon, Button } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Foundations' };

// The current design guide (DESIGN_GUIDE.md, MOTION.md) rendered on the new stack: the baseline the new
// design starts from. Update this page as the new guidelines replace the old ones.

const CORE = [
	['accent', 'Primary action, caret, current item'],
	['on-accent', 'Text on the accent'],
	['bg', 'Page background'],
	['surface', 'Cards, panels'],
	['surface-2', 'Hover on surface, tracks'],
	['line', 'Hairlines, card borders'],
	['line-strong', 'Inputs, buttons, popovers'],
	['ink', 'Primary text'],
	['ink-2', 'Secondary text'],
	['ink-3', 'Tertiary text, on bg only'],
	['untyped', 'Text not yet typed'],
	['error', 'Errors, wrong keys']
];

const SUPPORT = [
	['blue', 'Information, speed'],
	['green', 'Success, accuracy'],
	['amber', 'Stars, rewards'],
	['orange', 'Streaks, energy'],
	['violet', 'Ranks, levels'],
	['rose', 'Highlights']
];

const FINGERS = [
	['f-pinky', 'Little finger'],
	['f-ring', 'Ring finger'],
	['f-middle', 'Middle finger'],
	['f-index', 'Index finger'],
	['f-thumb', 'Thumb']
];

const TYPE: { label: string; spec: string; sample: ReactNode }[] = [
	{ label: 'Hero h1', spec: 'Altera Serif 400 · clamp(42px, 5.4vw, 74px) / 1', sample: <span className="font-serif text-[clamp(42px,5.4vw,74px)] leading-none tracking-[-0.025em]">Type <b className="font-extrabold">properly</b></span> },
	{ label: 'Section h2', spec: 'Altera Serif 400 · clamp(30px, 4vw, 48px) / 1.08', sample: <span className="font-serif text-[clamp(30px,4vw,48px)] leading-[1.08] tracking-[-0.015em]">One key at a time</span> },
	{ label: 'Kicker', spec: 'Neue Montreal 700 · 13px · uppercase · 0.08em', sample: <span className="text-[13px] font-bold tracking-[0.08em] text-ink-2 uppercase">The course</span> },
	{ label: 'Lede', spec: 'Neue Montreal 400 · 17 to 19px / 1.6 · ink-2', sample: <span className="text-[clamp(17px,1.5vw,19px)] leading-[1.6] text-ink-2">Short lessons, games and a clear road from your first two keys to fluent typing.</span> },
	{ label: 'Body', spec: 'Neue Montreal 400 · 16px / 1.6', sample: <span className="text-base leading-[1.6]">Every figure carries a label, a unit and a definition.</span> },
	{ label: 'UI label', spec: 'Neue Montreal 600 · 14.5px', sample: <span className="text-[14.5px] font-semibold">Email address</span> },
	{ label: 'Typing text', spec: 'Geist Mono · clamp(21px, 2.3vw, 29px) / 1.65', sample: <span className="font-mono text-[clamp(21px,2.3vw,29px)] leading-[1.65]"><span className="text-ink">the quick </span><span className="text-untyped">brown fox</span></span> },
	{ label: 'Figure', spec: 'Neue Montreal 700 · tabular numerals', sample: <span className="text-[32px] font-bold tabular-nums">87 WPM · 98.4%</span> }
];

function Swatch({ token, job }: { token: string; job: string }) {
	return (
		<li className="flex items-center gap-3">
			<span className="size-11 shrink-0 rounded border border-line" style={{ background: `var(--${token})` }} />
			<span className="min-w-0">
				<span className="block font-mono text-[13px] font-semibold">--{token}</span>
				<span className="block text-[13px] text-ink-2">{job}</span>
			</span>
		</li>
	);
}

function Section({ id, kicker, title, lede, children }: { id: string; kicker: string; title: string; lede: string; children: ReactNode }) {
	return (
		<section id={id} className="border-t border-line py-[clamp(48px,7vw,88px)]">
			<Reveal className="mb-8 max-w-[680px]">
				<p className="mb-3 text-[13px] font-bold tracking-[0.08em] text-ink-2 uppercase">{kicker}</p>
				<h2 className="text-[clamp(30px,4vw,48px)] leading-[1.08] tracking-[-0.015em]">{title}</h2>
				<p className="mt-3 text-[17px] leading-[1.6] text-ink-2">{lede}</p>
			</Reveal>
			{children}
		</section>
	);
}

export default function Foundations() {
	return (
		<main id="content" className="mx-auto w-full max-w-[1180px] px-[clamp(16px,4vw,40px)] pb-24">
			<header className="flex flex-col gap-5 pt-[clamp(40px,8vh,96px)] pb-[clamp(40px,6vw,72px)]">
				<LogoWordmark className="h-[26px] w-auto self-start text-ink" />
				<SplitText tag="h1" text="Foundations" splitType="chars" effect="rise" trigger="load" delay={30} textAlign="left" className="text-[clamp(42px,5.4vw,74px)] leading-none tracking-[-0.025em]" />
				<p className="max-w-[60ch] text-[clamp(17px,1.5vw,19px)] leading-[1.6] text-ink-2">
					The current sqwer design guide, rebuilt on the new stack. It is the starting point for the new design: as decisions
					change, they change here first.
				</p>
			</header>

			<Section id="colour" kicker="Colour" title="One accent with one job" lede="Lime marks the single most important action. Every token switches with the theme; try the switch in the corner.">
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
					{CORE.map(([t, j]) => <Swatch key={t} token={t} job={j} />)}
				</ul>
				<h3 className="mt-10 mb-4 text-[15px] font-semibold">Supporting colours</h3>
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
					{SUPPORT.map(([t, j]) => <Swatch key={t} token={t} job={j} />)}
				</ul>
				<h3 className="mt-10 mb-4 text-[15px] font-semibold">Finger colours</h3>
				<ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
					{FINGERS.map(([t, j]) => <Swatch key={t} token={t} job={j} />)}
				</ul>
			</Section>

			<Section id="type" kicker="Typography" title="Serif titles, sans for the rest" lede="PP Altera Serif for h1 and h2, PP Neue Montreal for everything else, Geist Mono for typing text. Emphasis by weight, never decoration.">
				<dl className="flex flex-col">
					{TYPE.map((t) => (
						<div key={t.label} className="grid grid-cols-[200px_1fr] items-baseline gap-6 border-b border-line py-5 max-md:grid-cols-1 max-md:gap-2">
							<dt>
								<span className="block text-[14px] font-semibold">{t.label}</span>
								<span className="block text-[12.5px] text-ink-2">{t.spec}</span>
							</dt>
							<dd className="min-w-0">{t.sample}</dd>
						</div>
					))}
				</dl>
			</Section>

			<Section id="actions" kicker="Actions" title="One hierarchy everywhere" lede="At most one primary action per region. Secondary for alternatives. Danger only behind a confirmation.">
				<div className="flex flex-wrap items-center gap-3">
					<Button variant="primary" size="lg">Get started <ArrowIcon /></Button>
					<Button size="lg">Take a typing test</Button>
					<Button variant="primary">Primary</Button>
					<Button>Secondary</Button>
					<Button variant="danger">Delete my account</Button>
					<Button disabled>Disabled</Button>
				</div>
			</Section>

			<Section id="shape" kicker="Shape and depth" title="Square-ish, warm shadows" lede="Every radius is 3px. Shadows are brown-tinted in light mode and pure black in dark mode.">
				<Reveal stagger={0.08} className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
					{[
						['Card', 'border-line bg-surface shadow-card'],
						['Popover', 'border-line-strong bg-bg shadow-pop'],
						['Lifted card', 'border-line bg-surface shadow-lift']
					].map(([label, cls]) => (
						<div key={label} className={`flex h-32 items-end rounded border p-4 ${cls}`}>
							<span className="text-[14px] font-semibold">{label}</span>
						</div>
					))}
				</Reveal>
				<div className="mt-8 flex items-center gap-6 text-ink">
					<LogoMark className="size-12" />
					<LogoWordmark className="h-8 w-auto" />
				</div>
			</Section>

			<Section id="motion" kicker="Motion" title="Fast in, gentle out" lede="The easing vocabulary, registered once for GSAP and Tailwind. Sections on this page rise in with ScrollTrigger while Lenis smooths the scroll.">
				<EaseDemo />
			</Section>
		</main>
	);
}
