'use client';

import { useRef } from 'react';
import { gsap, MEDIA, useGSAP } from '@/lib/motion';
import { READING } from './data';

// The one scroll-driven moment: a long sentence typed out by scrolling. The section pins; as you scroll, each
// character appears at a caret and the line slides left so the caret stays put. Below 700px wide, and under
// reduced motion, it is simply the sentence as a paragraph.

export function Reading() {
	const root = useRef<HTMLElement>(null);
	const line = useRef<HTMLParagraphElement>(null);
	const caret = useRef<HTMLSpanElement>(null);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(`${MEDIA.motion} and (min-width: 700px)`, () => {
				const el = root.current!;
				const text = line.current!;
				const chars = [...text.querySelectorAll<HTMLElement>('[data-c]')];
				el.dataset.typing = '';
				let shown = -1;
				const paint = (n: number) => {
					if (n > shown) for (let i = shown + 1; i <= n; i++) chars[i].style.opacity = '1';
					else for (let i = shown; i > n; i--) chars[i].style.opacity = '';
					shown = n;
				};
				const anchor = () => el.clientWidth * 0.34;
				const st = gsap.to({}, {
					scrollTrigger: {
						trigger: el,
						start: 'top top+=64',
						end: () => `+=${Math.max(2200, chars.length * 13)}`,
						pin: true,
						scrub: 0.4,
						anticipatePin: 1,
						invalidateOnRefresh: true,
						onUpdate: (self) => {
							const n = Math.round(self.progress * (chars.length - 1));
							paint(self.progress <= 0 ? -1 : n);
							const at = n >= 0 && chars[n] ? chars[n].offsetLeft + chars[n].offsetWidth : 0;
							const x = Math.min(0, anchor() - at);
							gsap.set(text, { x });
							if (caret.current) gsap.set(caret.current, { x: at + x, opacity: self.progress >= 1 ? 0.35 : 1 });
						}
					}
				});
				return () => {
					st.scrollTrigger?.kill();
					chars.forEach((c) => (c.style.opacity = ''));
					gsap.set([text, caret.current], { clearProps: 'all' });
					delete el.dataset.typing;
				};
			});
			return () => mm.revert();
		},
		{ scope: root }
	);

	return (
		<section ref={root} id="reading" aria-label="Why the fingers matter" className="reading">
			<div className="reading-stage">
				<p className="sr-only">{READING}</p>
				<p ref={line} aria-hidden="true" className="reading-line">
					{[...READING].map((ch, i) => (
						<span key={i} data-c className="reading-c">
							{ch}
						</span>
					))}
				</p>
				<span ref={caret} aria-hidden="true" className="reading-caret" />
			</div>
		</section>
	);
}
