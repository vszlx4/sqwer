'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import course from '@/content/course.json';
import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { Hands, type LegendItem } from '@/components/landing/Hands';
import { Keyboard } from '@/components/landing/Keyboard';
import { Phrase } from '@/components/landing/Phrase';
import { Staff } from '@/components/landing/Staff';
import { ArrowIcon } from '@/components/ui/Button';
import { LINKS } from '@/lib/links';
import { FINGERS, fingerFor, fingerNumber, type Finger } from '@/lib/fingering';
import { gsap, MEDIA, ScrollTrigger, useGSAP } from '@/lib/motion';
import { TIERS, TIER_OF } from '@/lib/system';
import './fingering.css';

// Direction "Fingering": typing taught as notation. Every letter carries its finger number; the course is one
// score of twelve measures. Content comes from src/content/course.json (the real course).

const PART_COLOUR = ['var(--teal)', 'var(--sky)', 'var(--iris)', 'var(--coral)'];
/** Ranks a steady learner reaches around these chapters (from the current landing page). */
const RANK_AT: Record<number, number> = { 1: 2, 3: 3, 4: 4, 7: 5, 9: 6, 10: 7, 12: 9 };
const HOME: Record<Finger, string> = { lp: 'A', lr: 'S', lm: 'D', li: 'F', lt: 'Space', rt: 'Space', ri: 'J', rm: 'K', rr: 'L', rp: ';' };

const STEP_KINDS: { id: keyof typeof course.steps; name: string; line: string }[] = [
	{ id: 'drill', name: 'Drills', line: 'Short timed passages over the keys you know.' },
	{ id: 'falling', name: 'Falling letters and words', line: 'Type each before it lands.' },
	{ id: 'echo', name: 'Echo', line: 'Letters light up and fade; type them from memory.' },
	{ id: 'keyhunt', name: 'Key hunt', line: 'Find the lit key by touch before its light runs out.' },
	{ id: 'race', name: 'Races', line: 'Beat the pacer to the end of a passage.' },
	{ id: 'intro', name: 'Key introductions', line: 'Each new key, its finger and its place.' },
	{ id: 'listen', name: 'Listen and type', line: 'Hear a word, type it without seeing it.' },
	{ id: 'checkpoint', name: 'Checkpoints', line: 'One at the end of every chapter.' }
];

const GAMES = [
	{ kind: 'falling', title: 'Falling letters', body: 'Letters drop from the top. Type each one before it lands.' },
	{ kind: 'words', title: 'Falling words', body: 'Whole words fall instead of letters, faster as you go.' },
	{ kind: 'listen', title: 'Listen and type', body: 'Hear a word and type it, without seeing it first.' },
	{ kind: 'keyhunt', title: 'Key hunt', body: 'A key lights up. Find it by touch before its light runs out.' },
	{ kind: 'race', title: 'Race', body: 'Type a passage before the pacer reaches the finish line.' },
	{ kind: 'echo', title: 'Echo', body: 'The letters of a word light up one at a time and fade. Type the word from memory.' }
] as const;

const PRINCIPLES = [
	{ title: 'Free to learn', body: 'The whole course is free. An account saves your progress, stars and rank on every device.' },
	{ title: 'Your data stays yours', body: 'No advertising or tracking. Export or delete everything at any time.' },
	{ title: 'Clear definitions', body: 'Every figure is defined, and the same rules are applied to every result.' }
];

/** Placeholder figures from the database; shown as not connected until the site is wired. */
const LIVE = { wired: false, items: ['lessons typed today', 'new typists this week', 'tests taken today'] };

const TEMPO = [
	{ wpm: 20, term: 'Largo' },
	{ wpm: 40, term: 'Andante' },
	{ wpm: 60, term: 'Moderato' },
	{ wpm: 80, term: 'Allegro' },
	{ wpm: 100, term: 'Presto' }
];

const STEPS = [
	{ id: 'rest', label: 'Rest your fingers' },
	{ id: 'score', label: 'Follow the score' },
	{ id: 'practise', label: 'Practise with games' },
	{ id: 'grow', label: 'Watch yourself grow' },
	{ id: 'begin', label: 'Begin' }
];

function Section({ id, title, lede, children, className = '' }: { id: string; title: ReactNode; lede?: ReactNode; children?: ReactNode; className?: string }) {
	return (
		<section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-[136px] mx-auto w-full max-w-[1180px] px-[clamp(16px,4vw,40px)] py-[clamp(72px,10vw,136px)] ${className}`}>
			<h2 id={`${id}-title`} className="max-w-[20ch] text-[clamp(32px,4.4vw,56px)] leading-[1.04] tracking-[-0.02em]">
				{title}
			</h2>
			{lede && <p className="mt-5 max-w-[62ch] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.65] text-ink-2">{lede}</p>}
			{children}
		</section>
	);
}

function Etude({ kind }: { kind: (typeof GAMES)[number]['kind'] }) {
	return (
		<div aria-hidden="true" className="etude rounded-[3px] bg-bg">
			{kind === 'falling' && ['f', 'j', 'k', 'd', 'g'].map((l, n) => <span key={l} className="note" style={{ left: `${12 + n * 18}%`, ['--n' as string]: n }}>{l}</span>)}
			{kind === 'words' && ['steady', 'hand', 'river', 'quiet'].map((w, n) => <span key={w} className="note word" style={{ left: `${6 + n * 23}%`, ['--n' as string]: n }}>{w}</span>)}
			{kind === 'listen' && (
				<>
					<span className="wave">{[0, 1, 2, 3, 4, 5, 6, 7].map((n) => <i key={n} style={{ ['--n' as string]: n }} />)}</span>
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
			{kind === 'echo' && <span className="echo">{['s', 'k', 'd', 'l'].map((k, n) => <b key={n} style={{ ['--n' as string]: n }}>{k}</b>)}</span>}
		</div>
	);
}

/** Get started, the one action; it links to the current /start flow once wired. */
function GetStarted({ large = false }: { large?: boolean }) {
	const to = LINKS.getStarted;
	return (
		<a href={to.wired ? to.href : '#'} data-unwired={to.wired ? undefined : to.href} className={`group inline-flex items-center gap-3 rounded-[3px] bg-accent font-semibold text-on-accent transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px ${large ? 'min-h-14 px-7 text-[17px]' : 'min-h-11 px-5 text-[15px]'}`}>
			Get started <ArrowIcon />
		</a>
	);
}

export function Fingering() {
	const page = useRef<HTMLDivElement>(null);
	const scorePin = useRef<HTMLDivElement>(null);
	const track = useRef<HTMLOListElement>(null);
	const [lit, setLit] = useState<Finger | null>(null);
	const [step, setStep] = useState('rest');
	const [measure, setMeasure] = useState(0);

	// The hands light the finger of the letter just typed on the staff, then the home row plays itself.
	const onProgress = (i: number) => {
		const ch = 'asdfjkl;'[i];
		setLit(ch ? fingerFor(ch) : null);
	};

	// Guidance rail: which step of the way the reader is in.
	useEffect(() => {
		const els = STEPS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) if (e.isIntersecting) setStep(e.target.id);
		}, { rootMargin: '-45% 0px -50% 0px' });
		els.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, []);

	// The one authored motion: the score pins and slides sideways under a fixed playhead.
	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(`${MEDIA.motion} and (min-width: 900px)`, () => {
				const t = track.current;
				const pin = scorePin.current;
				if (!t || !pin) return;
				const distance = () => t.scrollWidth - pin.clientWidth;
				gsap.to(t, {
					x: () => -distance(),
					ease: 'none',
					scrollTrigger: {
						trigger: pin,
						start: 'top top+=120',
						end: () => `+=${distance()}`,
						scrub: 0.6,
						pin: true,
						invalidateOnRefresh: true,
						anticipatePin: 1,
						onUpdate: (self) => setMeasure(Math.min(course.chapters.length - 1, Math.floor(self.progress * course.chapters.length)))
					}
				});
				gsap.from('[data-rank-note]', { autoAlpha: 0, y: 24, stagger: 0.06, duration: 0.6, ease: 'out-expo', scrollTrigger: { trigger: '#grow', start: 'top 70%', once: true } });
			});
			return () => mm.revert();
		},
		{ scope: page }
	);

	useEffect(() => () => ScrollTrigger.refresh(), []);

	const legend = Object.fromEntries(
		FINGERS.map((f) => [f, { value: String(fingerNumber(f)), sub: HOME[f] === 'Space' ? '' : HOME[f], lit: lit === f } satisfies LegendItem])
	) as Partial<Record<Finger, LegendItem>>;
	const maxSteps = Math.max(...STEP_KINDS.map((k) => course.steps[k.id]));
	const totalSteps = Object.values(course.steps).reduce((a, b) => a + b, 0);

	return (
		<div ref={page} className="bg-bg text-ink selection:bg-accent selection:text-on-accent">
			<header className="sticky top-14 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-[1180px] items-center gap-8 px-[clamp(16px,4vw,40px)]">
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
						<GetStarted />
					</div>
				</div>
			</header>

			{/* Guidance rail on wide screens. */}
			<nav aria-label="Your way through" className="fixed top-1/2 left-5 z-20 hidden -translate-y-1/2 flex-col gap-3 2xl:flex">
				{STEPS.map((s, i) => (
					<a key={s.id} href={`#${s.id}`} aria-current={step === s.id ? 'step' : undefined} className="group flex items-center gap-3 text-[13px]">
						<span className={`grid size-7 place-items-center rounded-full border font-serif text-[14px] font-extrabold transition-colors duration-200 ${step === s.id ? 'border-accent bg-accent text-on-accent' : 'border-line-strong text-ink-3'}`}>{i + 1}</span>
						<span className={`transition-opacity duration-200 ${step === s.id ? 'font-semibold text-ink opacity-100' : 'text-ink-2 opacity-0 group-hover:opacity-100'}`}>{s.label}</span>
					</a>
				))}
			</nav>

			<main id="content">
				{/* First viewport: headline, the live staff, the one action. */}
				<section id="rest" aria-labelledby="hero-title" className="scroll-mt-[136px] flex min-h-[calc(100dvh-120px)] flex-col justify-between pt-[clamp(36px,6vh,72px)] pb-[clamp(28px,5vh,56px)]">
					<div className="mx-auto grid w-full max-w-[1180px] gap-x-12 gap-y-6 px-[clamp(16px,4vw,40px)] lg:grid-cols-[1fr_auto]">
						<h1 id="hero-title" className="text-[clamp(44px,6.1vw,88px)] leading-[0.98] tracking-[-0.03em] [text-wrap:wrap] lg:col-span-2">
							<span className="lg:block">Learn to type properly,</span> <span className="lg:block">one key at a time.</span>
						</h1>
						<div className="flex max-w-[72ch] flex-col gap-3 lg:col-span-2">
							<p className="text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.6] text-ink-2">
								Short lessons, games and a clear road from your first two keys to fluent typing. Built for complete beginners, and for self-taught typists who want to do it right.
							</p>
							<ul className="flex flex-wrap gap-x-5 gap-y-1 text-[14px] font-semibold">
								{['Free', 'Starts from zero', 'No ads or tracking'].map((f) => (
									<li key={f} className="flex items-center gap-2">
										<span aria-hidden="true" className="h-[2px] w-3 bg-accent" />
										{f}
									</li>
								))}
							</ul>
						</div>
					</div>
					<Staff onProgress={onProgress} className="my-[clamp(20px,4vh,40px)] max-md:order-3" />
					<div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-[clamp(16px,4vw,40px)] max-md:order-2 max-md:mt-8">
						<GetStarted large />
						<p className="text-[15px] text-ink-2">
							Begin with <b className="font-semibold text-ink">F and J</b>, about four minutes. <a href="#score" className="font-semibold text-ink">See the whole course</a>
						</p>
					</div>
				</section>

				{/* Where the fingers rest. */}
				<Section
					id="hands"
					title="Every finger has a number, and a home."
					lede="Counted from the thumb, 1, to the little finger, 5, on each hand. Your fingers rest on the home row; the small bumps on F and J let your index fingers find it without looking. Type on the staff above and the hands answer."
				>
					<figure className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
						<Hands label="Two hands on the home row. Left: little finger 5 on A, ring 4 on S, middle 3 on D, index 2 on F. Right: index 2 on J, middle 3 on K, ring 4 on L, little 5 on semicolon. Thumbs, 1, on the space bar." legend={legend} legendSize={12} tone={lit ? Object.fromEntries(FINGERS.map((f) => [f, f === lit ? 1 : 0.35])) : undefined} />
						<figcaption className="flex flex-col gap-4 text-[15.5px] leading-[1.6] text-ink-2">
							<p>
								<b className="font-semibold text-ink">Lesson 1</b> starts with the two index fingers on F and J. Each lesson after that adds one or two keys, always with the finger that owns them.
							</p>
							<p>sqwer watches which finger you actually use and, when a habit drifts, the course brings that key back until it settles.</p>
						</figcaption>
					</figure>
				</Section>

				{/* The score: twelve measures in four movements, scrolled sideways. */}
				<section id="score" aria-labelledby="score-title" className="scroll-mt-[120px] border-y border-line bg-surface">
					<div className="mx-auto max-w-[1180px] px-[clamp(16px,4vw,40px)] pt-[clamp(72px,10vw,136px)]">
						<h2 id="score-title" className="max-w-[22ch] text-[clamp(32px,4.4vw,56px)] leading-[1.04] tracking-[-0.02em]">
							One score, {course.chapters.length} measures, {course.lessons} lessons.
						</h2>
						<p className="mt-5 max-w-[62ch] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.65] text-ink-2">
							Each chapter adds a few keys or one skill, and gives you everything the next chapter needs. Start at the beginning, or let a one-minute placement test find your chapter.
						</p>
					</div>
					<div ref={scorePin} className="relative flex flex-col justify-center overflow-hidden py-[clamp(40px,6vw,72px)] min-[900px]:min-h-[calc(100dvh-120px)]">
						<div aria-hidden="true" className="pointer-events-none absolute top-[12%] bottom-[12%] left-[max(clamp(16px,4vw,40px),calc((100%-1180px)/2+40px))] z-10 w-[2px] bg-accent max-[899px]:hidden">
							<span className="absolute -top-7 left-0 text-[12.5px] font-semibold whitespace-nowrap text-accent">{measure === 0 ? 'You start here' : `Chapter ${measure + 1}`}</span>
						</div>
						<ol ref={track} data-lenis-prevent className="flex w-max gap-0 pl-[max(clamp(16px,4vw,40px),calc((100vw-1180px)/2+40px))] pr-[clamp(16px,4vw,40px)] max-[899px]:w-auto max-[899px]:snap-x max-[899px]:snap-mandatory max-[899px]:overflow-x-auto">
							{course.chapters.map((c, i) => {
								const part = course.parts.findIndex((p) => p.chapters.includes(c.number));
								const startsPart = course.parts[part]?.chapters[0] === c.number;
								const rank = RANK_AT[c.number] ? course.ranks[RANK_AT[c.number] - 1] : null;
								const keys = c.newKeys.filter((k) => k.length === 1);
								const groups = keys.length ? [keys.slice(0, 5).join(''), keys.slice(5, 10).join('')].filter(Boolean) : c.words.slice(0, 3);
								const current = i === measure;
								return (
									<li key={c.number} className="relative flex w-[clamp(280px,27vw,350px)] shrink-0 snap-start flex-col border-l border-line-strong px-6 pb-2 min-[900px]:min-h-[min(52vh,480px)]">
										{/* The movement as a bracket over its measures; its name where the bracket starts. */}
										<span aria-hidden="true" className="absolute top-0 right-0 left-0 h-[2px]" style={{ background: PART_COLOUR[part] }} />
										{startsPart && (
											<span className="absolute top-0 left-4 -translate-y-1/2 bg-surface px-2 text-[12.5px] font-semibold whitespace-nowrap" style={{ color: PART_COLOUR[part] }}>
												{course.parts[part].title}
											</span>
										)}
										<span aria-hidden="true" className="block h-10" />
										<p className={`font-serif text-[clamp(44px,4.6vw,64px)] leading-none font-extrabold transition-colors duration-300 ${current ? 'text-ink' : 'text-ink-3'}`}>{c.number}</p>
										<h3 className="mt-3 font-serif text-[clamp(24px,2.2vw,30px)] leading-[1.1]">{c.title}</h3>
										<p className="mt-2 text-[15px] leading-[1.55] text-ink-2">{c.summary}</p>
										<Phrase groups={groups} label={keys.length ? `New keys: ${keys.join(' ')}` : `Practised words: ${groups.join(', ')}`} className="mt-6" />
										<p className="mt-5 font-mono text-[13px] text-ink-2">{c.lessons.length} lessons{keys.length ? '' : c.newKeys.length ? ' · both Shift keys' : ''}</p>
										{rank && (
											<p className="mt-auto pt-6 text-[13.5px]">
												Around here: <b className="font-semibold">{rank.name}</b>
											</p>
										)}
									</li>
								);
							})}
							<li className="relative flex w-[clamp(240px,22vw,300px)] shrink-0 snap-start flex-col justify-center pr-6 pl-10">
								{/* Final bar line: a thin line, then a thick one. */}
								<span aria-hidden="true" className="absolute inset-y-0 left-0 w-px bg-ink" />
								<span aria-hidden="true" className="absolute inset-y-0 left-[5px] w-[4px] bg-ink" />
								<p className="font-serif text-[26px] leading-tight">The end of the score.</p>
								<p className="mt-2 text-[15px] text-ink-2">The whole course, and the rank of Virtuoso or Legend for those who earn it.</p>
								<a href="#" data-unwired={LINKS.learn.href} className="mt-5 text-[15px] font-semibold">
									Open the full roadmap
								</a>
							</li>
						</ol>
					</div>
				</section>

				{/* Every lesson is a short étude: the step kinds, measured on one scale. */}
				<Section
					id="practise"
					title="Every lesson is a short étude."
					lede={`Lessons mix eight kinds of exercise, so repetition never feels like repetition. Across the course there are ${totalSteps} of them.`}
				>
					<dl className="mt-12 grid gap-x-12 gap-y-5 md:grid-cols-2">
						{STEP_KINDS.map((k) => (
							<div key={k.id} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4">
								<dt className="text-[16px] font-semibold">{k.name}</dt>
								<dd className="font-mono text-[14px] text-ink-2">{course.steps[k.id]}</dd>
								<dd className="col-span-2 mt-2 h-[6px] rounded-[2px] bg-surface-2">
									<span className="block h-full rounded-[2px] bg-accent" style={{ width: `${(course.steps[k.id] / maxSteps) * 100}%` }} />
								</dd>
								<dd className="col-span-2 mt-2 text-[14px] text-ink-2">{k.line}</dd>
							</div>
						))}
					</dl>
					<p className="mt-4 text-[13px] text-ink-3">Counts of exercises across all {course.lessons} lessons, on one scale from 0 to {maxSteps}.</p>

					<h3 className="mt-[clamp(64px,8vw,104px)] font-serif text-[clamp(26px,3vw,38px)] leading-[1.1] font-normal">Practice that feels like a game.</h3>
					<ul className="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
						{GAMES.map((g) => (
							<li key={g.kind}>
								<Etude kind={g.kind} />
								<h4 className="mt-4 font-serif text-[22px]">{g.title}</h4>
								<p className="mt-1 text-[15px] leading-[1.55] text-ink-2">{g.body}</p>
							</li>
						))}
					</ul>
				</Section>

				{/* Ranks as a rising scale. */}
				<section id="grow" aria-labelledby="grow-title" className="scroll-mt-[120px] border-y border-line bg-surface">
					<div className="mx-auto max-w-[1180px] px-[clamp(16px,4vw,40px)] py-[clamp(72px,10vw,136px)]">
						<h2 id="grow-title" className="max-w-[20ch] text-[clamp(32px,4.4vw,56px)] leading-[1.04] tracking-[-0.02em]">
							Watch yourself grow.
						</h2>
						<p className="mt-5 max-w-[62ch] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.65] text-ink-2">
							Earn up to three stars in every lesson and climb ten ranks, from Novice to Legend. Your progress is measured against yourself, never against others.
						</p>
						<div className="relative mt-14 overflow-x-auto pb-2" data-lenis-prevent>
							<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 flex h-[180px] min-w-[900px] flex-col justify-between">
								{[0, 1, 2, 3, 4].map((i) => (
									<span key={i} className="h-px bg-line-strong" />
								))}
							</div>
							<ol className="relative grid min-w-[900px] grid-cols-10 gap-2">
								{course.ranks.map((r, i) => {
									const tier = TIERS[TIER_OF[r.tier] ?? 'bronze'];
									return (
										<li key={r.level} data-rank-note className="relative flex flex-col items-center text-center">
											<span aria-hidden="true" className="relative block h-[180px] w-full">
												{/* An engraved notehead in its tier's metal, with a hairline stem. */}
												<span className="absolute left-1/2 w-px bg-ink" style={{ top: `${118 - i * 15}px`, height: '48px', marginLeft: '9px' }} />
												<span
													className="absolute left-1/2 h-[16px] w-[22px] -translate-x-1/2 rotate-[-20deg] rounded-[50%] border border-ink"
													style={{ top: `${158 - i * 15}px`, background: tier.face[1] }}
												/>
											</span>
											<span className="mt-4 font-serif text-[18px] leading-tight">{r.name}</span>
											<span className="mt-1 text-[12.5px] leading-snug text-ink-2">{r.note}</span>
										</li>
									);
								})}
							</ol>
						</div>
					</div>
				</section>

				{/* Already type? */}
				<Section
					id="technique"
					title="Already type? See how your hands really type."
					lede="Self-taught typists often use their own fingering. The finger map records which finger you use for every key, and the finger speed assessment measures each finger, so you know exactly what to retrain."
				>
					<div className="mt-12 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
						<Keyboard label="A keyboard where each key is tinted with its finger’s colour and marked with its number." highlight={['KeyF', 'KeyJ']} />
						<ul className="flex flex-col gap-4 text-[15.5px]">
							{['Keys you type with a non-standard finger', 'Habits that depend on the neighbouring key', 'The speed and accuracy of each finger'].map((c) => (
								<li key={c} className="flex gap-3 border-t border-line pt-4">
									<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="var(--teal)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
										<path d="M5 12.5l4.5 4.5L19 7.5" />
									</svg>
									{c}
								</li>
							))}
							<li className="border-t border-line pt-4">
								<a href="#" data-unwired={LINKS.fingerMap.href} className="font-semibold">
									Map your fingers
								</a>
							</li>
						</ul>
					</div>
				</Section>

				{/* Tests and the ranked leagues on one tempo scale. */}
				<section aria-labelledby="tempo-title" className="border-t border-line">
					<div className="mx-auto max-w-[1180px] px-[clamp(16px,4vw,40px)] py-[clamp(72px,10vw,136px)]">
						<h2 id="tempo-title" className="max-w-[22ch] text-[clamp(32px,4.4vw,56px)] leading-[1.04] tracking-[-0.02em]">
							Measure your tempo.
						</h2>
						<p className="mt-5 max-w-[62ch] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.65] text-ink-2">
							Eight tests, from a one-minute placement to a two-minute endurance run. When you are ready, ranked runs place you in one of eleven leagues, every result replayed on the server before it counts.
						</p>
						<figure className="mt-14">
							{/* One measured scale, 0 to 300 words per minute: tempo terms above, leagues below. */}
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
						<ul className="mt-14 grid gap-x-10 gap-y-6 md:grid-cols-2">
							{course.exams.map((e) => (
								<li key={e.id} className="grid grid-cols-[1fr_auto] gap-x-4 border-t border-line pt-4">
									<span className="font-serif text-[21px]">{e.title}</span>
									<span className="text-[13px] text-ink-2">{e.duration}</span>
									<span className="col-span-2 mt-1 text-[14.5px] leading-[1.55] text-ink-2">{e.purpose}</span>
								</li>
							))}
						</ul>
					</div>
				</section>

				{/* Principles and the live line. */}
				<section aria-labelledby="principles-title" className="border-t border-line">
					<div className="mx-auto max-w-[1180px] px-[clamp(16px,4vw,40px)] py-[clamp(64px,8vw,104px)]">
						<h2 id="principles-title" className="sr-only">
							Commitments
						</h2>
						<ul className="grid gap-10 md:grid-cols-3">
							{PRINCIPLES.map((p) => (
								<li key={p.title}>
									<h3 className="font-serif text-[24px] leading-tight">{p.title}</h3>
									<p className="mt-2 text-[15.5px] leading-[1.6] text-ink-2">{p.body}</p>
								</li>
							))}
						</ul>
						<p className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 text-[13.5px] text-ink-3" data-unwired="live-figures">
							<span className="font-semibold text-ink-2">
								Today on <span translate="no">sqwer</span>
							</span>
							{LIVE.items.map((it) => (
								<span key={it}>
									<span className="font-mono">{LIVE.wired ? '' : 'Not connected'}</span> {it}
								</span>
							))}
						</p>
					</div>
				</section>

				{/* Close: the first two keys on a staff over the chord, and the one action. */}
				<section id="begin" aria-labelledby="begin-title" className="relative isolate scroll-mt-[120px] overflow-hidden border-t border-line">
					<div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.16] [background:linear-gradient(90deg,var(--f-pinky),var(--f-ring)_18%,var(--f-middle)_32%,var(--f-index)_46%,var(--f-thumb)_50%,var(--f-index)_54%,var(--f-middle)_68%,var(--f-ring)_82%,var(--f-pinky))] [mask-image:linear-gradient(transparent,#000_35%,#000_75%,transparent)]" />
					<div className="mx-auto grid max-w-[1180px] gap-12 px-[clamp(16px,4vw,40px)] py-[clamp(88px,12vw,168px)] lg:grid-cols-[1fr_auto] lg:items-center">
						<div className="flex flex-col items-start gap-8">
							<h2 id="begin-title" className="max-w-[14ch] text-[clamp(40px,6vw,84px)] leading-[1] tracking-[-0.025em]">
								Begin with two keys.
							</h2>
							<GetStarted large />
						</div>
						<Phrase groups={['f', 'j']} size="lg" label="F and J, both with the index finger, 2." className="justify-self-center" />
					</div>
					<footer className="border-t border-line">
						<div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 px-[clamp(16px,4vw,40px)] py-8 text-[14px] text-ink-2">
							<LogoWordmark className="h-5 w-auto text-ink" />
							<span>Free. No advertising, no tracking.</span>
						</div>
					</footer>
				</section>
			</main>
		</div>
	);
}
