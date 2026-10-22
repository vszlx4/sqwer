import SplitText from '@/components/reactbits/SplitText';
import { LogoWordmark } from '@/components/brand/LogoWordmark';
import { ArrowIcon, ButtonLink } from '@/components/ui/Button';
import { LINKS } from '@/lib/links';

// The new landing page. This is the starting canvas: the current hero copy on the new stack
// (React Bits SplitText, GSAP, Lenis). The new design is built here, section by section.

export default function Home() {
	return (
		<main id="content" className="mx-auto w-full max-w-[1180px] px-[clamp(16px,4vw,40px)]">
			<header className="flex h-[70px] items-center">
				<LogoWordmark className="h-[26px] w-auto text-ink" />
			</header>

			<section className="flex min-h-[calc(100dvh-70px)] flex-col justify-center gap-6 pb-24">
				<p className="text-[13px] font-bold tracking-[0.08em] text-ink-2 uppercase">A typing course for everyone</p>
				<SplitText
					tag="h1"
					text="Learn to type properly, one key at a time."
					splitType="words"
					effect="rise"
					trigger="load"
					delay={60}
					duration={0.9}
					textAlign="left"
					className="max-w-[13ch] text-[clamp(42px,5.4vw,74px)] leading-none tracking-[-0.025em]"
				/>
				<p className="max-w-[52ch] text-[clamp(17px,1.5vw,19px)] leading-[1.6] text-ink-2">
					Short lessons, games and a clear road from your first two keys to fluent typing. Built for complete beginners,
					and for self-taught typists who want to do it right.
				</p>
				<div className="flex flex-wrap gap-3">
					<ButtonLink to={LINKS.getStarted} variant="primary" size="lg">
						Get started <ArrowIcon />
					</ButtonLink>
					<ButtonLink to={LINKS.typingTest} size="lg" />
				</div>
			</section>
		</main>
	);
}
