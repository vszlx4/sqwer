import Link from 'next/link';
import { LINKS } from '@/lib/links';
import { PalettePicker } from './PalettePicker';
import { ThemeToggle } from './ThemeToggle';

/**
 * Design workspace tool, not part of the new design: switch page, palette and theme while the
 * new design is explored. Remove it when the site goes live.
 */
export function WorkspaceBar() {
	return (
		<nav
			aria-label="Design workspace"
			className="fixed right-4 bottom-4 z-[70] flex items-center gap-1 rounded border border-line-strong bg-bg/85 p-1 text-[13px] font-semibold shadow-pop backdrop-blur-md"
		>
			{[LINKS.home, LINKS.lab, LINKS.foundations].map((l) => (
				<Link key={l.href} href={l.href} className="rounded px-2.5 py-1.5 text-ink-2 transition-colors duration-[120ms] hover:bg-surface hover:text-ink">
					{l.href === '/' ? 'Landing' : l.label}
				</Link>
			))}
			<span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
			<PalettePicker />
			<ThemeToggle />
		</nav>
	);
}
