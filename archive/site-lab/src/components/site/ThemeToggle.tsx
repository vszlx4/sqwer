'use client';

import { useSyncExternalStore, type KeyboardEvent } from 'react';
import { applyTheme, readTheme, subscribeTheme, type ThemePreference } from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
	{ value: 'system', label: 'System', icon: 'M4 5h16v11H4zM9 20h6M12 16v4' },
	{ value: 'light', label: 'Light', icon: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
	{ value: 'dark', label: 'Dark', icon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z' }
];

/** Icon-only System / Light / Dark switch; arrow keys move between options (INTERACTIONS.md, section 2). */
export function ThemeToggle() {
	// null while server rendering: the saved choice is only known in the browser.
	const theme = useSyncExternalStore<ThemePreference | null>(subscribeTheme, readTheme, () => null);

	const choose = (value: ThemePreference) => applyTheme(value);

	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
		event.preventDefault();
		const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
		const index = OPTIONS.findIndex((o) => o.value === (theme ?? 'light'));
		const next = OPTIONS[(index + step + OPTIONS.length) % OPTIONS.length];
		choose(next.value);
		event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
	};

	return (
		<div role="radiogroup" aria-label="Theme" onKeyDown={onKeyDown} className="inline-flex gap-0.5 rounded bg-surface p-[3px]">
			{OPTIONS.map((o) => {
				const checked = theme === o.value;
				return (
					<button
						key={o.value}
						type="button"
						role="radio"
						aria-checked={checked}
						aria-label={o.label}
						title={o.label}
						data-value={o.value}
						tabIndex={checked || (theme === null && o.value === 'light') ? 0 : -1}
						onClick={() => choose(o.value)}
						className={`grid size-8 place-items-center rounded text-ink-2 transition-colors duration-[120ms] hover:text-ink ${checked ? 'bg-bg text-ink ring-1 ring-line-strong' : ''}`}
					>
						<svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
							<path d={o.icon} />
						</svg>
					</button>
				);
			})}
		</div>
	);
}
