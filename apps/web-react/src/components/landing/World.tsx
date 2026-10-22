'use client';

import { useId, useRef } from 'react';
import { gsap, MEDIA, useGSAP } from '@/lib/motion';
import { course } from './data';
import { NightDither } from './NightDither';
import { RisingInk } from './RisingInk';

// The scroll journey: you scroll into a dark world (a circle opens from the middle of the page), the four parts of
// the course turn around you on rings of type, and the circle closes again to bring you back to the page.
// One pinned scene, scrubbed. Under 700px wide and with reduced motion it is a plain dark band with the parts listed.

const RADII = [352, 292, 232, 172];
const SIZES = [34, 30, 26, 22];

export function World() {
	const root = useRef<HTMLElement>(null);
	const id = useId().replace(/:/g, '');
	const circle = (r: number) => `M 400 400 m -${r} 0 a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 -${2 * r} 0`;
	const keysOf = (pi: number) => course.parts[pi].chapters.flatMap((n) => course.chapters.find((c) => c.number === n)!.newKeys.filter((k) => k.length === 1)).slice(0, 14).join(' ');

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add(`${MEDIA.motion} and (min-width: 700px)`, () => {
				const el = root.current!;
				el.dataset.pinned = '';
				const dark = el.querySelector<HTMLElement>('.world-dark')!;
				const light = el.querySelector<HTMLElement>('.world-light')!;
				const rings = gsap.utils.toArray<SVGGElement>(el.querySelectorAll('.world-ring'));
				const notes = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.world-note'));
				const tl = gsap.timeline({
					defaults: { ease: 'none' },
					scrollTrigger: { trigger: el, start: 'top top+=64', end: () => `+=${Math.round(innerHeight * 3.1)}`, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
				});
				tl.fromTo(dark, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 1.1, ease: 'power2.inOut' }, 0)
					.to(light, { scale: 1.18, opacity: 0, duration: 0.9, ease: 'power2.in' }, 0)
					.to(rings, { rotation: (i) => (i % 2 ? -150 : 150), svgOrigin: '400 400', duration: 5.2 }, 0.6);
				notes.forEach((note, i) => {
					const at = 1.3 + i * 0.95;
					tl.fromTo(note, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, at).to(note, { opacity: 0, y: -14, duration: 0.3, ease: 'power2.in' }, at + 0.65);
				});
				tl.to(dark, { clipPath: 'circle(0% at 50% 50%)', duration: 1.1, ease: 'power2.inOut' }, 5.4).fromTo(light, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out' }, 5.6);
				return () => {
					delete el.dataset.pinned;
					gsap.set([dark, light, ...rings, ...notes], { clearProps: 'all' });
				};
			});
			return () => mm.revert();
		},
		{ scope: root }
	);

	return (
		<section ref={root} id="world" aria-labelledby="world-title" className="world">
			<div className="world-stage">
				<div className="world-light">
					<h2 id="world-title" className="font-serif text-[clamp(40px,6vw,84px)] leading-none tracking-[-0.025em]">
						<RisingInk>Step inside the course.</RisingInk>
					</h2>
					<p className="mt-5 max-w-[46ch] text-[clamp(16.5px,1.4vw,18.5px)] leading-[1.6] text-ink-2">
						Four movements, twelve chapters. Keep scrolling and the course turns around you, then brings you back to the sheet.
					</p>
				</div>
				<div className="world-dark night">
					<NightDither lazy />
					<svg className="world-rings" viewBox="0 0 800 800" aria-hidden="true">
						<defs>
							{RADII.map((r, i) => (
								<path key={i} id={`${id}r${i}`} d={circle(r)} />
							))}
						</defs>
						{course.parts.map((p, i) => (
							<g key={p.id} className="world-ring">
								<circle cx="400" cy="400" r={RADII[i] + SIZES[i] * 0.9} fill="none" stroke="var(--line-strong)" strokeWidth="1" />
								<text fontFamily="var(--font-altera-serif), Georgia, serif" fontSize={SIZES[i]} fill={i % 2 ? 'var(--ink-2)' : 'var(--ink)'}>
									<textPath href={`#${id}r${i}`} textLength={2 * Math.PI * RADII[i] - 6} lengthAdjust="spacing">
										{`${p.title} · ${p.title} · ${p.title} · ${p.title} · `}
									</textPath>
								</text>
							</g>
						))}
					</svg>
					<div className="world-notes">
						{course.parts.map((p, i) => (
							<div key={p.id} className="world-note">
								<p className="font-serif text-[clamp(26px,3.4vw,44px)] leading-[1.05]">{p.title}</p>
								<p className="mt-2 font-mono text-[clamp(13px,1.3vw,16px)] text-accent">{keysOf(i)}</p>
								<p className="mt-2 text-[14.5px] text-ink-2">Chapters {p.chapters[0]} to {p.chapters[p.chapters.length - 1]}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
