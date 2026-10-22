import type { CSSProperties, ReactNode } from 'react';
import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { ArrowIcon, ButtonLink } from '@/components/ui/Button';
import Magnet from '@/components/reactbits/Magnet';
import SplitText from '@/components/reactbits/SplitText';
import { LINKS } from '@/lib/links';
import { TIERS, TIER_OF } from '@/lib/system';
import { course, GAMES, LIVE, PART_COLOUR, PRINCIPLES, RANK_AT, STEP_KINDS, TEMPO } from './data';
import { HandsFigure } from './HandsFigure';
import { HeroStaff } from './HeroStaff';
import { Keyboard } from './Keyboard';
import { Phrase } from './Phrase';
import './etude.css';

// The panels of the score, left to right. Each is a measure group; widths apply only while the page is pinned.

const w = (px: number): CSSProperties => ({ ['--pw' as string]: `${px}px` });

function Panel({ id, labelled, width, children, label }: { id: string; labelled?: boolean; width: number; children: ReactNode; label?: string }) {
	return (
		<section data-panel={id} id={id} aria-label={label} aria-labelledby={labelled ? `${id}-title` : undefined} className="panel" style={w(width)}>
			<div className="panel-in">{children}</div>
		</section>
	);
}

const H2 = 'font-serif text-[clamp(32px,min(4.4vw,6.4vh),56px)] leading-[1.04] tracking-[-0.02em] max-w-[20ch]';
const LEDE = 'text-[clamp(16px,min(1.4vw,2.2vh),18.5px)] leading-[1.6] text-ink-2 max-w-[56ch]';

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
		<header className="sticky top-0 z-40 h-16 border-b border-line bg-bg/90 backdrop-blur-md">
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
		<Panel id="rest" width={0} label="Rest your fingers">
			<h1 id="hero-title" className="font-serif text-[clamp(40px,min(5.6vw,9vh),84px)] leading-[0.98] tracking-[-0.03em]">
				<span className="block">
					<SplitText tag="span" text="Learn to type properly," splitType="words" effect="rise" trigger="load" delay={70} duration={0.9} textAlign="left" />
				</span>
				<span className="block">
					<SplitText tag="span" text="one key at a time." splitType="words" effect="rise" trigger="load" delay={400} duration={0.9} textAlign="left" />
				</span>
			</h1>
			<p className={`${LEDE} mt-[clamp(10px,2.2vh,22px)]`}>
				Short lessons, games and a clear road from your first two keys to fluent typing. Built for complete beginners, and for self-taught typists who want to do it right.
			</p>
			<ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
				{['Free', 'Starts from zero', 'No ads or tracking'].map((f) => (
					<li key={f} className="flex items-center gap-2">
						<span aria-hidden="true" className="h-[2px] w-3 bg-accent" />
						{f}
					</li>
				))}
			</ul>
			<HeroStaff className="staff-wide my-[clamp(8px,2.4vh,28px)] max-md:order-2" />
			<div className="flex flex-wrap items-center gap-x-6 gap-y-3 max-md:order-1 max-md:mb-6">
				<GetStarted large />
				<p className="text-[15px] text-ink-2">
					Begin with <b className="font-semibold text-ink">F and J</b>, about four minutes. <a href="#score" className="font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">See the whole course</a>
				</p>
			</div>
		</Panel>
	);
}

export function HandsPanel() {
	return (
		<Panel id="hands" labelled width={1180}>
			<div className="grid items-center gap-[clamp(24px,4vw,64px)] lg:grid-cols-[0.8fr_1.2fr]">
				<div>
					<h2 id="hands-title" className={H2} data-rise>
						Every finger has a number, and a home.
					</h2>
					<p className={`${LEDE} mt-5`}>
						Counted from the thumb, 1, to the little finger, 5, on each hand. Your fingers rest on the home row; the small bumps on F and J let your index fingers find it without looking. Type on the staff and the hands answer.
					</p>
					<p className="mt-5 max-w-[48ch] text-[15.5px] leading-[1.6] text-ink-2">
						<b className="font-semibold text-ink">Lesson 1</b> starts with the two index fingers on F and J. Each lesson after that adds one or two keys, always with the finger that owns them. sqwer watches which finger you actually use and brings a key back until the habit settles.
					</p>
				</div>
				<figure data-rise>
					<HandsFigure />
				</figure>
			</div>
		</Panel>
	);
}

export function ScorePanels() {
	return (
		<>
			<Panel id="score" labelled width={560}>
				<h2 id="score-title" className={H2} data-rise>
					One score, {course.chapters.length} measures, {course.lessons} lessons.
				</h2>
				<p className={`${LEDE} mt-5`}>
					Each chapter adds a few keys or one skill, and gives you everything the next chapter needs. Start at the beginning, or let a one-minute placement test find your chapter.
				</p>
				<p className="mt-6 text-[15px]">
					<a href="#" data-unwired={LINKS.typingTest.href} className="font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
						Take the placement test
					</a>
				</p>
			</Panel>
			<div className="measures" data-lenis-prevent>
				<ol className="measures-in">
					{course.chapters.map((c, i) => {
						const part = course.parts.findIndex((p) => p.chapters.includes(c.number));
						const startsPart = course.parts[part]?.chapters[0] === c.number;
						const rank = RANK_AT[c.number] ? course.ranks[RANK_AT[c.number] - 1] : null;
						const keys = c.newKeys.filter((k) => k.length === 1);
						const groups = keys.length ? [keys.slice(0, 5).join(''), keys.slice(5, 10).join('')].filter(Boolean) : c.words.slice(0, 3);
						return (
							<li key={c.number} data-chapter={c.number} data-index={i} className="measure">
								<span aria-hidden="true" className="absolute top-0 right-0 left-0 h-[2px]" style={{ background: PART_COLOUR[part] }} />
								{startsPart && (
									<span className="absolute top-0 left-4 -translate-y-1/2 bg-bg px-2 text-[12.5px] font-semibold whitespace-nowrap" style={{ color: PART_COLOUR[part] }}>
										{course.parts[part].title}
									</span>
								)}
								<span aria-hidden="true" className="block h-10" />
								<p className="measure-n font-serif text-[clamp(44px,min(4.6vw,8vh),64px)] leading-none font-extrabold text-ink-3">{c.number}</p>
								<h3 className="mt-3 font-serif text-[clamp(22px,min(2.2vw,3.6vh),30px)] leading-[1.1]">{c.title}</h3>
								<p className="mt-2 text-[15px] leading-[1.55] text-ink-2">{c.summary}</p>
								<Phrase groups={groups} label={keys.length ? `New keys: ${keys.join(' ')}` : `Practised words: ${groups.join(', ')}`} className="mt-6" />
								<p className="mt-5 font-mono text-[13px] text-ink-2">
									{c.lessons.length} lessons{keys.length ? '' : c.newKeys.length ? ' · both Shift keys' : ''}
								</p>
								{rank && (
									<p className="mt-auto pt-6 text-[13.5px]">
										Around here: <b className="font-semibold">{rank.name}</b>
									</p>
								)}
							</li>
						);
					})}
					<li className="measure measure-end">
						<span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-ink" />
						<span aria-hidden="true" className="absolute inset-y-0 left-[5px] w-[4px] bg-ink" />
						<p className="font-serif text-[26px] leading-tight">The end of the score.</p>
						<p className="mt-2 text-[15px] text-ink-2">The whole course, and the rank of Virtuoso or Legend for those who earn it.</p>
						<a href="#" data-unwired={LINKS.learn.href} className="mt-5 text-[15px] font-semibold underline decoration-line-strong underline-offset-4 hover:decoration-ink">
							Open the full roadmap
						</a>
					</li>
				</ol>
			</div>
		</>
	);
}

function Etude({ kind }: { kind: (typeof GAMES)[number]['kind'] }) {
	const n = (i: number) => ({ ['--n' as string]: i }) as CSSProperties;
	return (
		<div aria-hidden="true" className="etude rounded-[3px] bg-bg">
			{kind === 'falling' && ['f', 'j', 'k', 'd', 'g'].map((l, i) => <span key={l} className="note" style={{ left: `${12 + i * 18}%`, ...n(i) }}>{l}</span>)}
			{kind === 'words' && ['steady', 'hand', 'river', 'quiet'].map((t, i) => <span key={t} className="note word" style={{ left: `${6 + i * 23}%`, ...n(i) }}>{t}</span>)}
			{kind === 'listen' && (
				<>
					<span className="wave">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <i key={i} style={n(i)} />)}</span>
					<span className="typed">steady</span>
				</>
			)}
			{kind === 'keyhunt' && (
				<>
					<span className="keys">{['a', 's', 'd', 'f', 'j', 'k', 'l'].map((k) => <b key={k} className={k === 'j' ? 'on' : ''}>{k}</b>)}</span>
					<span className="fuse" />
				</>
			)}
			{kind === 'race' && (
				<>
					<span className="lane" style={{ top: 38 }}><i style={{ background: 'var(--accent)' }} /></span>
					<span className="lane" style={{ top: 74 }}><i style={{ background: 'var(--ink-3)', animationDuration: '4.4s' }} /></span>
				</>
			)}
			{kind === 'echo' && <span className="echo">{['s', 'k', 'd', 'l'].map((k, i) => <b key={i} style={n(i)}>{k}</b>)}</span>}
		</div>
	);
}

export function Practise() {
	const maxSteps = Math.max(...STEP_KINDS.map((k) => course.steps[k.id]));
	const totalSteps = Object.values(course.steps).reduce((a, b) => a + b, 0);
	return (
		<Panel id="practise" labelled width={1480}>
			<div className="grid gap-[clamp(28px,4vw,64px)] xl:grid-cols-[0.82fr_1.18fr]">
				<div>
					<h2 id="practise-title" className={H2} data-rise>
						Every lesson is a short étude.
					</h2>
					<p className={`${LEDE} mt-5`}>
						Lessons mix eight kinds of exercise, so repetition never feels like repetition. Across the course there are {totalSteps} of them.
					</p>
					<dl className="mt-[clamp(20px,4vh,40px)] grid gap-x-8 gap-y-[clamp(8px,1.8vh,16px)] sm:grid-cols-2">
						{STEP_KINDS.map((k) => (
							<div key={k.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
								<dt className="text-[14.5px] font-semibold">{k.name}</dt>
								<dd className="font-mono text-[13px] text-ink-2">{course.steps[k.id]}</dd>
								<dd className="col-span-2 mt-1.5 h-[6px] rounded-[2px] bg-surface-2">
									<span className="block h-full rounded-[2px] bg-accent" style={{ width: `${(course.steps[k.id] / maxSteps) * 100}%` }} />
								</dd>
							</div>
						))}
					</dl>
					<p className="mt-3 text-[13px] text-ink-3">Counts of exercises across all {course.lessons} lessons, on one scale from 0 to {maxSteps}.</p>
				</div>
				<div>
					<h3 className="font-serif text-[clamp(24px,min(3vw,4.4vh),36px)] leading-[1.1]">
						Practice that feels like a game.
					</h3>
					<ul className="mt-[clamp(16px,3vh,28px)] grid gap-x-6 gap-y-[clamp(14px,3vh,28px)] sm:grid-cols-2 lg:grid-cols-3">
						{GAMES.map((g) => (
							<li key={g.kind}>
								<Etude kind={g.kind} />
								<h4 className="mt-3 font-serif text-[20px]">{g.title}</h4>
								<p className="mt-1 text-[14.5px] leading-[1.5] text-ink-2">{g.body}</p>
							</li>
						))}
					</ul>
				</div>
			</div>
		</Panel>
	);
}

export function Grow() {
	return (
		<Panel id="grow" labelled width={1280}>
			<h2 id="grow-title" className={H2} data-rise>
				Watch yourself grow.
			</h2>
			<p className={`${LEDE} mt-5`}>
				Earn up to three stars in every lesson and climb ten ranks, from Novice to Legend. Your progress is measured against yourself, never against others.
			</p>
			<div className="ranks" data-lenis-prevent>
				<div aria-hidden="true" className="ranks-staff">
					{[0, 1, 2, 3, 4].map((i) => (
						<span key={i} className="h-px bg-line-strong" />
					))}
				</div>
				<ol className="ranks-in">
					{course.ranks.map((r, i) => {
						const tier = TIERS[TIER_OF[r.tier] ?? 'bronze'];
						return (
							<li key={r.level} className="flex flex-col items-center text-center">
								<span aria-hidden="true" className="relative block h-[180px] w-full">
									<span className="absolute left-1/2 w-px bg-ink" style={{ top: `${118 - i * 15}px`, height: '48px', marginLeft: '9px' }} />
									<span className="absolute left-1/2 h-[16px] w-[22px] -translate-x-1/2 rotate-[-20deg] rounded-[50%] border border-ink" style={{ top: `${158 - i * 15}px`, background: tier.face[1] }} />
								</span>
								<span className="mt-4 font-serif text-[18px] leading-tight">{r.name}</span>
								<span className="mt-1 text-[12.5px] leading-snug text-ink-2">{r.note}</span>
							</li>
						);
					})}
				</ol>
			</div>
		</Panel>
	);
}

export function Technique() {
	return (
		<Panel id="technique" labelled width={1400}>
			<div className="grid gap-[clamp(24px,4vw,56px)] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
				<div>
					<h2 id="technique-title" className={H2} data-rise>
						Already type? See how your hands really type.
					</h2>
					<p className={`${LEDE} mt-5`}>
						Self-taught typists often use their own fingering. The finger map records which finger you use for every key, and the finger speed assessment measures each finger, so you know exactly what to retrain.
					</p>
					<ul className="mt-6 flex flex-col gap-3 text-[15.5px]">
						{['Keys you type with a non-standard finger', 'Habits that depend on the neighbouring key', 'The speed and accuracy of each finger'].map((c) => (
							<li key={c} className="flex gap-3 border-t border-line pt-3">
								<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="var(--teal)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
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
		<Panel id="tempo" labelled width={1380}>
			<h2 id="tempo-title" className={H2} data-rise>
				Measure your tempo.
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
		<Panel id="begin" labelled width={0}>
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
