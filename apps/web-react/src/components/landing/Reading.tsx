'use client';

import { useRef } from 'react';
import { gsap, MEDIA, useGSAP } from '@/lib/motion';
import { READING } from './data';

// The reading moment: a long sentence typed out by scrolling. The section pins briefly; characters fade in at a
// caret and the line glides left so the caret stays put. Progress is continuous (the caret and the letters move by
// fractions, never by whole characters), and the scrub is smoothed. Below 700px wide, and under reduced motion,
// it is simply the sentence as a paragraph.

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

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
				const N = chars.length;
				el.dataset.typing = '';
				let edges: number[] = [];
				const measure = () => {
					edges = chars.map((c) => c.offsetLeft + c.offsetWidth);
				};
				measure();
				let last = 0;
				const SOFT = 4; // characters over which a letter fades in
				const draw = (p: number) => {
					const f = p * N;
					const lo = Math.max(0, Math.floor(Math.min(f, last)) - SOFT - 1);
					const hi = Math.min(N - 1, Math.ceil(Math.max(f, last)) + 1);
					for (let j = lo; j <= hi; j++) {
						const o = clamp((f - j) / SOFT + 1 - 0.0);
						chars[j].style.opacity = o <= 0 ? '' : String(Math.min(1, o));
					}
					last = f;
					const i = clamp(Math.floor(f), 0, N - 1);
					const frac = f - Math.floor(f);
					const from = i === 0 ? 0 : edges[i - 1];
					const at = f >= N ? edges[N - 1] : from + (edges[i] - from) * frac;
					const x = Math.min(0, el.clientWidth * 0.34 - at);
					gsap.set(text, { x });
					if (caret.current) gsap.set(caret.current, { x: at + x, opacity: p <= 0 ? 0 : 1 });
				};
				const st = gsap.to({}, {
					scrollTrigger: {
						trigger: el,
						start: 'top top+=64',
						end: () => `+=${Math.max(1000, Math.round(N * 5))}`,
						pin: true,
						scrub: 1.1,
						anticipatePin: 1,
						invalidateOnRefresh: true,
						onRefresh: measure,
						onUpdate: (self) => draw(self.progress)
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
