'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fingerColour, fingerFor, fingerName, fingerNumber } from '@/lib/fingering';

// The typeable staff: the home row set on five lines, each letter numbered with its finger.
// While it is on screen, typing the row lights each numeral in turn and moves the playhead.

const ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

type StaffProps = {
	/** Called with the index of the letter just typed, or -1 on reset. */
	onProgress?: (index: number) => void;
	className?: string;
};

export function Staff({ onProgress, className = '' }: StaffProps) {
	const root = useRef<HTMLDivElement>(null);
	const stage = useRef<HTMLDivElement>(null);
	const letters = useRef<(HTMLLIElement | null)[]>([]);
	const [playX, setPlayX] = useState<number | null>(null);
	const [done, setDone] = useState(-1);
	const [demo, setDemo] = useState(-1);
	/** The wrong key just pressed, shown struck through beside the playhead. */
	const [miss, setMiss] = useState<string | null>(null);
	const [touched, setTouched] = useState(false);
	const [visible, setVisible] = useState(false);
	const [message, setMessage] = useState('');

	// Only listen while the staff is on screen, so the rest of the page keeps its keyboard.
	useEffect(() => {
		const el = root.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
		io.observe(el);
		return () => io.disconnect();
	}, []);

	// One demonstration pass before the visitor types anything; none under reduced motion.
	useEffect(() => {
		if (touched || !visible || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		let i = -1;
		const id = setInterval(() => {
			i += 1;
			if (i >= ROW.length) {
				clearInterval(id);
				setDemo(-1);
				return;
			}
			setDemo(i);
		}, 420);
		const start = setTimeout(() => setDemo(0), 900);
		return () => {
			clearInterval(id);
			clearTimeout(start);
		};
	}, [touched, visible]);

	useEffect(() => {
		if (!visible) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
			const t = e.target as HTMLElement | null;
			if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
			const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
			if (key === 'Escape') {
				setDone(-1);
				setMiss(null);
				onProgress?.(-1);
				return;
			}
			if (key.length !== 1 || key === ' ') return;
			setTouched(true);
			setDemo(-1);
			const next = done + 1 >= ROW.length ? 0 : done + 1;
			const expected = ROW[next];
			if (key === expected) {
				e.preventDefault();
				setMiss(null);
				setDone(next);
				onProgress?.(next);
				const f = fingerFor(expected)!;
				setMessage(next === ROW.length - 1 ? 'That is the whole home row. Lesson 1 starts with F and J.' : `${expected.toUpperCase()}: ${fingerName(f)}, finger ${fingerNumber(f)}.`);
			} else {
				const f = fingerFor(expected)!;
				setMiss(key);
				setMessage(`You pressed ${key.toUpperCase()}. Next is ${expected.toUpperCase()}, with your ${fingerName(f).toLowerCase()}.`);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [visible, done, onProgress]);

	const active = touched ? done : demo;
	const complete = done === ROW.length - 1;

	// The playhead sits just after the last lit letter, or before the first; measured, since letters are justified.
	useLayoutEffect(() => {
		const measure = () => {
			const box = stage.current?.getBoundingClientRect();
			const first = letters.current[0]?.getBoundingClientRect();
			if (!box || !first) return;
			if (active < 0) return setPlayX(first.left - box.left - 18);
			const r = letters.current[active]?.getBoundingClientRect();
			const n = letters.current[active + 1]?.getBoundingClientRect();
			if (r) setPlayX(n ? (r.right + n.left) / 2 - box.left : r.right - box.left + 18);
		};
		measure();
		addEventListener('resize', measure);
		return () => removeEventListener('resize', measure);
	}, [active]);

	return (
		<div ref={root} className={className}>
			<div ref={stage} className="relative isolate overflow-hidden py-[clamp(16px,min(4vw,3.4vh),48px)]">
				{/* The chord: a faint wash of the five finger colours behind the staff. */}
				<div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.16] [background:linear-gradient(90deg,var(--f-pinky),var(--f-ring)_18%,var(--f-middle)_32%,var(--f-index)_46%,var(--f-thumb)_50%,var(--f-index)_54%,var(--f-middle)_68%,var(--f-ring)_82%,var(--f-pinky))] [mask-image:linear-gradient(transparent,#000_30%,#000_70%,transparent)]" />
				{/* Five staff lines. */}
				<div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 flex h-[clamp(104px,min(14vw,16.5vh),176px)] -translate-y-1/2 flex-col justify-between">
					{[0, 1, 2, 3, 4].map((i) => (
						<span key={i} className="h-px bg-line-strong" />
					))}
				</div>
				<p className="sr-only">The home row with finger numbers: A, little finger 5. S, ring finger 4. D, middle finger 3. F, index finger 2. J, index finger 2. K, middle finger 3. L, ring finger 4. Semicolon, little finger 5. Thumbs, 1, rest on the space bar.</p>
				{/* The bar line between the hands. */}
				<span aria-hidden="true" className="absolute top-[16%] bottom-[16%] left-1/2 w-px bg-ink-3" />
				<ol aria-hidden="true" className="relative mx-auto flex w-full max-w-[1180px] items-end justify-between px-[clamp(16px,4vw,40px)]">
					{ROW.map((ch, i) => {
						const f = fingerFor(ch)!;
						const lit = i <= active;
						const isNext = miss !== null && i === done + 1;
						return (
							<li key={ch} ref={(el) => { letters.current[i] = el; }} className="flex flex-col items-center">
								<span
									className="font-serif text-[clamp(20px,min(2.6vw,3.6vh),34px)] leading-none font-extrabold transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
									style={{ color: fingerColour(f), opacity: lit || active < 0 ? 1 : 0.35, transform: i === active ? 'translateY(-6px) scale(1.18)' : undefined }}
								>
									{fingerNumber(f)}
								</span>
								<span
									className={`mt-[clamp(8px,min(1.4vw,1.5vh),18px)] font-mono text-[clamp(40px,min(6.4vw,9vh),92px)] leading-none transition-colors duration-200 ${isNext ? 'text-accent' : lit ? 'text-ink' : 'text-untyped'}`}
								>
									{ch}
								</span>
								{/* The bumps on F and J. */}
								<span className="mt-2 h-[3px] w-[clamp(20px,2.4vw,34px)] rounded-[2px]" style={{ background: fingerColour(f), opacity: ch === 'f' || ch === 'j' ? 1 : 0 }} />
							</li>
						);
					})}
				</ol>
				{/* Playhead, with a wrong press shown struck through beside it. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-[14%] bottom-[14%] left-0 w-[2px] bg-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
					style={{ transform: `translateX(${playX ?? 0}px)`, opacity: playX === null ? 0 : 1 }}
				>
					{miss && <span className="absolute -top-1 left-2 font-mono text-[clamp(18px,1.8vw,24px)] leading-none text-error line-through decoration-2">{miss}</span>}
				</div>
			</div>
			<div className="mx-auto flex max-w-[1180px] flex-wrap items-baseline justify-between gap-x-8 gap-y-2 px-[clamp(16px,4vw,40px)] text-[14px] text-ink-2">
				<p aria-live="polite" className="min-h-[1.5em] font-medium text-ink">
					{message || (complete ? '' : 'Try it: rest your fingers on the home row and type a s d f j k l ;')}
				</p>
				<p className="[@media(pointer:coarse)]:hidden">Escape starts again. The small bumps on F and J guide your index fingers.</p>
				<p className="hidden [@media(pointer:coarse)]:block">Typing practice needs a physical keyboard.</p>
			</div>
		</div>
	);
}
