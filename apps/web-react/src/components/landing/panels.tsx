import type { ReactNode } from 'react';
import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { ArrowIcon, ButtonLink } from '@/components/ui/Button';
import Magnet from '@/components/reactbits/Magnet';
import SplitText from '@/components/reactbits/SplitText';
import { LINKS } from '@/lib/links';
import { course, GAMES, LIVE, PRINCIPLES, STEP_KINDS, TEMPO } from './data';
import { ContactSheet } from './ContactSheet';
import { GamePreview } from './GamePreview';
import { HandsFigure } from './HandsFigure';
import { OrbitalType } from './OrbitalType';
import { RisingInk } from './RisingInk';
import { NightDither } from './NightDither';
import { RankBadge } from './RankBadge';
import { Keyboard } from './Keyboard';
import { Phrase } from './Phrase';

// The panels of the score, left to right. Each is a measure group; widths apply only while the page is pinned.

function Panel({ id, labelled, children, label, night = false, band = false }: { id: string; labelled?: boolean; children: ReactNode; label?: string; night?: boolean; band?: boolean; width?: number }) {
	return (
		<section id={id} aria-label={label} aria-labelledby={labelled ? `${id}-title` : undefined} className={`land ${night ? 'night' : ''} ${band ? 'land-band' : ''}`}>
			{night && <NightDither />}
			<div className="land-in">{children}</div>
		</section>
	);
}

const H2 = 'font-serif text-[clamp(32px,4.4vw,56px)] leading-[1.04] tracking-[-0.02em] max-w-[20ch]';
const LEDE = 'text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.6] text-ink-2 max-w-[56ch]';

export function GetStarted({ large = false }: { large?: boolean }) {
	return (
		<Magnet magnetStrength={4} padding={36} maxOffset={6} wrapperClassName="inline-block">
			<ButtonLink to={LINKS.getStarted} variant="primary" size={large ? 'lg' : 'md'}>
				Get started <ArrowIcon />
			</ButtonLink>
		</Magnet>
	);
}

export function Header() {
	return (
		<header className="night sticky top-0 z-40 h-16 border-b border-line bg-bg/85 backdrop-blur-md">
			<div className="mx-auto flex h-full max-w-[1180px] items-center gap-8 px-[clamp(16px,4vw,40px)]">
				<LogoWordmark className="h-6 w-auto" />
				<nav aria-label="Main" className="flex gap-7 text-[15px] font-medium text-ink-2 max-md:hidden">
					{[LINKS.learn, LINKS.practice, LINKS.competitive].map((l) => (
						<a key={l.href} href="#" data-unwired={l.href} className="transition-colors duration-150 hover:text-ink">
							{l.label === 'Competitive' ? 'Ranked' : l.label === 'Learning path' ? 'Learn' : l.label}
						</a>
					))}
				</nav>
				<div className="ml-auto flex items-center gap-4">
					<a href="#" data-unwired={LINKS.signIn.href} className="text-[15px] font-medium max-sm:hidden">
						Sign in
					</a>
					<ButtonLink to={LINKS.getStarted} variant="primary">
						Get started <ArrowIcon />
					</ButtonLink>
				</div>
			</div>
		</header>
	);
}

export function Opening() {
	return (
		<Panel id="rest" label="Rest your fingers" night>
			<div className="grid items-center gap-[clamp(32px,5vw,72px)] lg:grid-cols-[1fr_auto]">
				<div>
					<h1 id="hero-title" className="font-serif text-[clamp(44px,5.4vw,80px)] leading-[0.98] tracking-[-0.03em]">
						<span className="block">
							<SplitText tag="span" text="Learn to type properly," splitType="words" effect="rise" trigger="load" delay={70} duration={0.9} textAlign="left" />
						</span>
						<span className="block">
							<SplitText tag="span" text="one key at a time." splitType="words" effect="rise" trigger="load" delay={400} duration={0.9} textAlign="left" />
						</span>
					</h1>
					<p className={`${LEDE} mt-[clamp(14px,3vh,28px)]`}>
						Short lessons, games and a clear road from your first two keys to fluent typing. Built for complete beginners, and for self-taught typists who want to do it right.
					</p>
					<ul className="mt-4 mb-[clamp(24px,4vh,40px)] flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
						{['Free', 'Starts from zero', 'No ads or tracking'].map((f) => (
							<li key={f} className="flex items-center gap-2">
								<span aria-hidden="true" className="h-[2px] w-3 bg-accent" />
								{f}
							</li>
						))}
					</ul>
					<div className="flex flex-wrap items-center gap-x-6 gap-y-3">
						<GetStarted large />
						<p className="text-[15px] text-ink-2">
							Begin with <b className="font-semibold text-ink">F and J</b>, about four minutes. <a href="#score" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">See the whole course</a>
						</p>
					</div>
				</div>
				<OrbitalType className="justify-self-center max-lg:order-first" />
			</div>
		</Panel>
	);
}

export function HandsPanel() {
	return (
		<Panel id="hands" labelled>
			<div className="grid items-center gap-[clamp(24px,4vw,64px)] lg:grid-cols-[0.8fr_1.2fr]">
				<div>
					<h2 id="hands-title" className={H2}>
						<RisingInk>Every finger has a number, and a home.</RisingInk>
					</h2>
					<p className={`${LEDE} mt-5`}>
						Counted from the thumb, 1, to the little finger, 5, on each hand. Your fingers rest on the home row; the small bumps on F and J let your index fingers find it without looking. Type on the staff and the hands answer.
					</p>
					<p className="mt-5 max-w-[48ch] text-[15.5px] leading-[1.6] text-ink-2">
						<b className="font-semibold text-ink">Lesson 1</b> starts with the two index fingers on F and J. Each lesson after that adds one or two keys, always with the finger that owns them. sqwer watches which finger you actually use and brings a key back until the habit settles.
					</p>
				</div>
				<figure>
					<HandsFigure />
				</figure>
			</div>
		</Panel>
	);
}

export function Chapters() {
	return (
		<Panel id="score" labelled band>
			<h2 id="score-title" className={H2}>
				<RisingInk>{`One score, ${course.chapters.length} measures, ${course.lessons} lessons.`}</RisingInk>
			</h2>
			<p className={`${LEDE} mt-5`}>
				Each chapter adds a few keys or one skill, and gives you everything the next chapter needs. Start at the beginning, or let a one-minute placement test find your chapter.
			</p>
			<p className="mt-5 text-[15px]">
				<a href="#" data-unwired={LINKS.typingTest.href} className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
					Take the placement test
				</a>
			</p>
			<div className="mt-[clamp(32px,5vw,56px)]">
				<ContactSheet />
			</div>
			<p className="mt-[clamp(28px,4vw,48px)] text-[15px]">
				<b className="font-serif text-[20px] font-normal">The end of the score.</b> <span className="text-ink-2">The whole course, and the rank of Virtuoso or Legend for those who earn it.</span>{' '}
				<a href="#" data-unwired={LINKS.learn.href} className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
					Open the full roadmap
				</a>
			</p>
		</Panel>
	);
}

export function Practise() {
	const maxSteps = Math.max(...STEP_KINDS.map((k) => course.steps[k.id]));
	const totalSteps = Object.values(course.steps).reduce((a, b) => a + b, 0);
	return (
		<Panel id="practise" labelled>
			<div className="grid gap-[clamp(28px,4vw,64px)] lg:grid-cols-[0.8fr_1.2fr]">
				<div>
					<h2 id="practise-title" className={H2}>
						<RisingInk>Every lesson is a short étude.</RisingInk>
					</h2>
					<p className={`${LEDE} mt-5`}>
						Lessons mix eight kinds of exercise, so repetition never feels like repetition. Across the course there are {totalSteps} of them.
					</p>
				</div>
				<div>
					<dl className="grid gap-x-8 gap-y-[clamp(12px,2vh,18px)] sm:grid-cols-2">
						{STEP_KINDS.map((k) => (
							<div key={k.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
								<dt className="text-[14.5px] font-semibold">{k.name}</dt>
								<dd className="font-mono text-[13px] text-ink-2">{course.steps[k.id]}</dd>
								<dd className="col-span-2 mt-1.5 h-[6px] rounded-[2px] bg-surface-2">
									<span className="block h-full rounded-[2px] bg-accent" style={{ width: `${(course.steps[k.id] / maxSteps) * 100}%` }} />
								</dd>
								<dd className="col-span-2 mt-1 text-[13.5px] leading-[1.45] text-ink-2">{k.line}</dd>
							</div>
						))}
					</dl>
					<p className="mt-4 text-[13px] text-ink-3">Counts of exercises across all {course.lessons} lessons, on one scale from 0 to {maxSteps}.</p>
				</div>
			</div>
		</Panel>
	);
}

export function Games() {
	return (
		<section id="games" aria-labelledby="games-title" className="land night games">
			<div className="land-in">
				<h2 id="games-title" className={H2}>
					<RisingInk>Practice that feels like a game.</RisingInk>
				</h2>
				<p className={`${LEDE} mt-5`}>Every lesson mixes short drills with games, so repetition never feels like repetition.</p>
				<div className="game-grid">
					{GAMES.map((g) => (
						<article key={g.kind} className="game">
							<GamePreview kind={g.kind} />
							<h3>{g.title}</h3>
							<p>{g.body}</p>
						</article>
					))}
				</div>
			</div>
		</section>
	);
}

export function Grow() {
	return (
		<Panel id="grow" labelled band>
			<h2 id="grow-title" className={H2}>
				<RisingInk>Watch yourself grow.</RisingInk>
			</h2>
			<p className={`${LEDE} mt-5`}>
				Earn up to three stars in every lesson and climb ten ranks, from Novice to Legend. Your progress is measured against yourself, never against others.
			</p>
			<ol className="mt-[clamp(32px,5vw,56px)] grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
				{course.ranks.map((r) => (
					<li key={r.level} data-rise className="flex flex-col items-start gap-3">
						<RankBadge level={r.level} tier={r.tier} size={80} />
						<span className="font-serif text-[22px] leading-tight">{r.name}</span>
						<span className="text-[13.5px] leading-[1.5] text-ink-2">{r.note}</span>
					</li>
				))}
			</ol>
		</Panel>
	);
}

export function Technique() {
	return (
		<Panel id="technique" labelled>
			<div className="grid gap-[clamp(24px,4vw,56px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
				<div>
					<h2 id="technique-title" className={H2}>
						<RisingInk>Already type? See how your hands really type.</RisingInk>
					</h2>
					<p className={`${LEDE} mt-5`}>
						Self-taught typists often use their own fingering. The finger map records which finger you use for every key, and the finger speed assessment measures each finger, so you know exactly what to retrain.
					</p>
					<ul className="mt-6 flex flex-col gap-3 text-[15.5px]">
						{['Keys you type with a non-standard finger', 'Habits that depend on the neighbouring key', 'The speed and accuracy of each finger'].map((c) => (
							<li key={c} className="flex gap-3 border-t border-line pt-3">
								<svg viewBox="0 0 24 24" height={20} fill="none" stroke="var(--teal)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
									<path d="M5 12.5l4.5 4.5L19 7.5" />
								</svg>
								{c}
							</li>
						))}
						<li className="border-t border-line pt-3">
							<a href="#" data-unwired={LINKS.fingerMap.href} className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
								Map your fingers
							</a>
						</li>
					</ul>
				</div>
				<div>
					<Keyboard label="A keyboard where each key is tinted with its finger’s colour and marked with its number." highlight={['KeyF', 'KeyJ']} />
				</div>
			</div>
		</Panel>
	);
}

export function Tempo() {
	return (
		<Panel id="tempo" labelled>
			<h2 id="tempo-title" className={H2}>
				<RisingInk>Measure your tempo.</RisingInk>
			</h2>
			<p className={`${LEDE} mt-5`}>
				Eight tests, from a one-minute placement to a two-minute endurance run. When you are ready, ranked runs place you in one of eleven leagues, every result replayed on the server before it counts.
			</p>
			<figure className="mt-[clamp(20px,4vh,40px)] max-w-[1100px]">
				<div className="relative h-[150px] max-md:hidden" role="img" aria-label={`Speeds in words per minute. Tempo: ${TEMPO.map((t) => `${t.term} ${t.wpm}`).join(', ')}. Ranked leagues begin at: ${course.leagues.map((l) => `${l.name} ${l.from}`).join(', ')}.`}>
					<div className="absolute inset-x-0 top-[64px] h-px bg-ink" />
					{TEMPO.map((t, i) => (
						<div key={t.term} className="absolute top-0 h-full" style={{ left: `${(t.wpm / 300) * 100}%` }}>
							<span className={`absolute w-px bg-ink-3 ${i % 2 ? 'top-[40px] h-6' : 'top-[18px] h-[46px]'}`} />
							<span className={`absolute -translate-x-1/2 font-serif text-[15px] whitespace-nowrap text-ink-2 ${i % 2 ? 'top-[20px]' : 'top-[-4px]'}`}>{t.term}</span>
						</div>
					))}
					{course.leagues.map((l, i) => (
						<div key={l.id} className="absolute top-0 h-full" style={{ left: `${(l.from / 300) * 100}%` }}>
							<span className="absolute top-[64px] h-4 w-px bg-ink" />
							<span className={`absolute text-[12.5px] font-semibold whitespace-nowrap ${l.from >= 290 ? '-translate-x-full' : '-translate-x-1/2'} ${i % 2 ? 'top-[118px]' : 'top-[88px]'}`}>{l.name}</span>
						</div>
					))}
				</div>
				<div className="mt-2 flex justify-between font-mono text-[12px] text-ink-3 tabular-nums max-md:hidden">
					{[0, 50, 100, 150, 200, 250, 300].map((v) => (
						<span key={v}>{v}</span>
					))}
				</div>
				<dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[14px] md:hidden">
					{course.leagues.map((l) => (
						<div key={l.id} className="flex justify-between border-b border-line py-1.5">
							<dt className="font-semibold">{l.name}</dt>
							<dd className="font-mono text-ink-2 tabular-nums">{l.from}+</dd>
						</div>
					))}
				</dl>
				<figcaption className="mt-3 text-[13px] text-ink-3">Words per minute. Tempo terms mark everyday speeds; each league begins where its mark sits (Silver from 50, Zenith from 300). A word is five characters.</figcaption>
			</figure>
			<ul className="mt-[clamp(18px,4vh,36px)] grid max-w-[1180px] gap-x-8 gap-y-[clamp(10px,2vh,18px)] md:grid-cols-2 xl:grid-cols-4">
				{course.exams.map((e) => (
					<li key={e.id} className="grid grid-cols-[1fr_auto] gap-x-3 border-t border-line pt-3">
						<span className="font-serif text-[18px] leading-tight">{e.title}</span>
						<span className="text-[12.5px] text-ink-2">{e.duration}</span>
						<span className="col-span-2 mt-1 text-[13.5px] leading-[1.5] text-ink-2">{e.purpose}</span>
					</li>
				))}
			</ul>
		</Panel>
	);
}

export function Begin() {
	return (
		<Panel id="begin" labelled night>
			<ul className="grid gap-[clamp(20px,3vw,40px)] md:grid-cols-3">
				{PRINCIPLES.map((p) => (
					<li key={p.title}>
						<h3 className="font-serif text-[clamp(20px,2vw,24px)] leading-tight">{p.title}</h3>
						<p className="mt-2 text-[15px] leading-[1.6] text-ink-2">{p.body}</p>
					</li>
				))}
			</ul>
			<div className="mt-[clamp(28px,6vh,64px)] grid items-center gap-10 lg:grid-cols-[1fr_auto]">
				<div className="flex flex-col items-start gap-[clamp(20px,4vh,36px)]">
					<h2 id="begin-title" className="font-serif text-[clamp(40px,min(6vw,11vh),84px)] leading-none tracking-[-0.025em] max-w-[12ch]">
						Begin with two keys.
					</h2>
					<GetStarted large />
				</div>
				<div>
					<Phrase groups={['f', 'j']} size="lg" label="F and J, both with the index finger, 2." className="justify-self-center" />
				</div>
			</div>
			<footer className="mt-[clamp(28px,6vh,64px)] flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-5 text-[13.5px] text-ink-2">
				<LogoWordmark className="h-5 w-auto text-ink" />
				<span>Free. No advertising, no tracking.</span>
				<span className="text-ink-3" data-unwired="live-figures">
					Live figures on <span translate="no">sqwer</span> are not connected yet: {LIVE.items.join(', ')}.
				</span>
			</footer>
		</Panel>
	);
}
