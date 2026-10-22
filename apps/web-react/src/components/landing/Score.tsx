'use client';

import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { useLenis } from 'lenis/react';
import { MOVEMENTS } from './data';
import { gsap, MEDIA, ScrollTrigger, useGSAP } from '@/lib/motion';
import './score.css';

// The landing page as one horizontal score. From 900px, with motion allowed, the page pins and its measures
// slide sideways under a fixed ultramarine playhead as the visitor scrolls down. Below that, or under reduced
// motion, the same panels are an ordinary vertical page (the chapters become a native snap row).
// The playhead names where you are; the timeline under it is the table of contents and can be clicked.

type Pos = { id: string; left: number; width: number };

export function Score({ children }: { children: ReactNode }) {
	const root = useRef<HTMLDivElement>(null);
	const viewport = useRef<HTMLDivElement>(null);
	const track = useRef<HTMLDivElement>(null);
	const fill = useRef<HTMLSpanElement>(null);
	const st = useRef<ScrollTrigger | null>(null);
	const pos = useRef<Pos[]>([]);
	const [pinned, setPinned] = useState(false);
	const [now, setNow] = useState({ movement: 0, chapter: 0 });
	const [ticks, setTicks] = useState<number[]>([]);
	const lenis = useLenis();

	/** Left edge of the playhead in viewport pixels. */
	const playheadX = () => parseFloat(getComputedStyle(root.current!).getPropertyValue('--g')) || 40;

	const measure = useCallback(() => {
		const t = track.current;
		if (!t) return;
		const origin = t.getBoundingClientRect().left;
		pos.current = [...t.querySelectorAll<HTMLElement>('[data-panel]')].map((el) => ({ id: el.dataset.panel!, left: el.getBoundingClientRect().left - origin, width: el.offsetWidth }));
		const total = t.scrollWidth - (viewport.current?.clientWidth ?? 0);
		setTicks(total > 0 ? pos.current.map((p) => Math.min(1, Math.max(0, (p.left - playheadX()) / total))) : []);
	}, []);

	/** Scrolls the page so that track x lands at the playhead. */
	const goTo = useCallback(
		(x: number, smooth = true) => {
			const s = st.current;
			const t = track.current;
			if (!s || !t || !viewport.current) return;
			const dist = t.scrollWidth - viewport.current.clientWidth;
			const p = dist > 0 ? Math.min(1, Math.max(0, x / dist)) : 0;
			const top = s.start + p * (s.end - s.start);
			const instant = !smooth || matchMedia(MEDIA.reduced).matches;
			if (lenis) lenis.scrollTo(top, { immediate: instant, duration: 1.6 });
			else window.scrollTo({ top, behavior: instant ? 'auto' : 'smooth' });
		},
		[lenis]
	);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(`${MEDIA.motion} and (min-width: 900px) and (min-height: 560px)`, () => {
				const t = track.current;
				const vp = viewport.current;
				if (!t || !vp) return;
				setPinned(true);
				root.current!.dataset.pinned = '';
				// Layout changes with the attribute: measure and refresh once the new layout is in.
				requestAnimationFrame(() => {
					measure();
					ScrollTrigger.refresh();
				});
				const distance = () => t.scrollWidth - vp.clientWidth;
				const tween = gsap.to(t, {
					x: () => -distance(),
					ease: 'none',
					scrollTrigger: {
						trigger: vp,
						start: 'top top+=64',
						end: () => `+=${distance()}`,
						scrub: 0.6,
						pin: true,
						anticipatePin: 1,
						invalidateOnRefresh: true,
						onRefresh: () => measure(),
						onUpdate: (self) => {
							if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
							const X = self.progress * distance() + playheadX();
							let m = 0;
							pos.current.forEach((p, i) => {
								if (X >= p.left) m = i;
							});
							let c = 0;
							if (pos.current[m]?.id === 'score') {
								const origin = t.getBoundingClientRect().left - Number(gsap.getProperty(t, 'x'));
								t.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
									if (X >= el.getBoundingClientRect().left - origin) c = Number(el.dataset.chapter);
								});
							}
							t.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => el.toggleAttribute('data-here', Number(el.dataset.chapter) === c));
							setNow((n) => (n.movement === m && n.chapter === c ? n : { movement: m, chapter: c }));
						}
					}
				});
				st.current = tween.scrollTrigger ?? null;

				// Each piece of content rises as its measure reaches the playhead's side of the screen.
				gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
					// Anything already on screen at load stays as it is; only what arrives from the right rises.
					if (el.getBoundingClientRect().left < window.innerWidth - 8) return;
					gsap.from(el, {
						opacity: 0,
						y: 28,
						duration: 0.8,
						ease: 'out-expo',
						scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left 92%', toggleActions: 'play none none none' }
					});
				});
				return () => {
					st.current = null;
					setPinned(false);
					delete root.current?.dataset.pinned;
					track.current?.querySelectorAll('[data-here]').forEach((el) => el.removeAttribute('data-here'));
					setNow({ movement: 0, chapter: 0 });
				};
			});
			return () => mm.revert();
		},
		{ scope: root }
	);

	useEffect(() => {
		addEventListener('resize', measure);
		return () => removeEventListener('resize', measure);
	}, [measure]);

	// Hash links to a movement slide the score instead of jumping.
	const onClick = (e: MouseEvent) => {
		if (!pinned) return;
		const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
		const id = a?.getAttribute('href')?.slice(1);
		const p = pos.current.find((x) => x.id === id);
		if (!a || !p) return;
		// Lenis also listens for hash links; this one is ours to handle, so it must not reach it.
		e.preventDefault();
		e.stopPropagation();
		goTo(p.left - playheadX());
	};

	// Keyboard users tabbing into a measure that is off screen bring it to the playhead.
	const onFocus = (e: FocusEvent) => {
		if (!pinned || !track.current || !viewport.current) return;
		// The browser's own focus scroll can nudge the clipped viewport sideways; undo it before measuring.
		viewport.current.scrollLeft = 0;
		const r = (e.target as HTMLElement).getBoundingClientRect();
		const v = viewport.current.getBoundingClientRect();
		if (r.left >= v.left + 8 && r.right <= v.right - 8) return;
		const trackLeft = track.current.getBoundingClientRect().left;
		goTo(r.left - trackLeft - playheadX() - 40, false);
	};

	const label = pinned ? (now.movement === 0 && now.chapter === 0 ? 'You start here' : now.chapter ? `Chapter ${now.chapter}` : MOVEMENTS[now.movement]?.label) : '';

	return (
		<div ref={root} className="score-root" onClick={onClick} onFocusCapture={onFocus}>
			<div ref={viewport} className="score-viewport" onScroll={(e) => { if (e.currentTarget.scrollLeft) e.currentTarget.scrollLeft = 0; }}>
				{pinned && (
					<div aria-hidden="true" className="score-playhead">
						<span>{label}</span>
					</div>
				)}
				<div ref={track} className="score-track">
					{children}
				</div>
				{pinned && (
					<nav aria-label="Your way through the score" className="score-timeline">
						<span aria-hidden="true" className="score-timeline-bar">
							<span ref={fill} className="score-timeline-fill" />
						</span>
						<ol>
							{MOVEMENTS.map((m, i) => (
								<li key={m.id} style={{ left: `${(ticks[i] ?? i / MOVEMENTS.length) * 100}%` }}>
									<a href={`#${m.id}`} aria-current={now.movement === i ? 'step' : undefined}>
										{m.short}
									</a>
								</li>
							))}
						</ol>
					</nav>
				)}
			</div>
		</div>
	);
}
