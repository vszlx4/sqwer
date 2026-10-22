'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { PALETTES, type PaletteId } from '@/lib/palettes';
import { applyPalette } from '@/lib/theme';
import { useTokens } from '@/lib/useTokens';

/** Chooses the colour palette; each option shows its light and dark accents and paper. */
export function PalettePicker() {
	const { palette, t } = useTokens();
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const listId = useId();

	useEffect(() => {
		if (!open) return;
		const close = (event: PointerEvent) => {
			if (!root.current?.contains(event.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', close);
		return () => document.removeEventListener('pointerdown', close);
	}, [open]);

	const choose = (id: PaletteId) => {
		applyPalette(id);
		setOpen(false);
		root.current?.querySelector<HTMLButtonElement>('[data-trigger]')?.focus();
	};

	const toggle = () => {
		setActive(Math.max(0, PALETTES.findIndex((p) => p.id === palette)));
		setOpen((o) => !o);
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (!open) return;
		if (event.key === 'Escape') {
			event.preventDefault();
			setOpen(false);
			root.current?.querySelector<HTMLButtonElement>('[data-trigger]')?.focus();
		} else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			setActive((i) => (i + (event.key === 'ArrowDown' ? 1 : -1) + PALETTES.length) % PALETTES.length);
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			choose(PALETTES[active].id);
		}
	};

	return (
		<div ref={root} className="relative" onKeyDown={onKeyDown}>
			<button
				type="button"
				data-trigger
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={listId}
				onClick={toggle}
				className="flex h-8 items-center gap-2 rounded px-2.5 text-ink-2 transition-colors duration-[120ms] hover:bg-surface hover:text-ink"
			>
				<span aria-hidden="true" className="size-3.5 rounded-sm ring-1 ring-line-strong" style={{ background: t.accent }} />
				<span className="max-sm:sr-only">Palette</span>
			</button>
			{open && (
				<ul
					id={listId}
					role="listbox"
					aria-label="Colour palette"
					aria-activedescendant={`${listId}-${PALETTES[active].id}`}
					tabIndex={-1}
					ref={(el) => el?.focus()}
					data-lenis-prevent
					className="absolute right-0 bottom-[calc(100%+10px)] w-[min(320px,calc(100vw-32px))] rounded border border-line-strong bg-bg p-1.5 shadow-pop outline-none"
				>
					{PALETTES.map((p, i) => (
						<li
							key={p.id}
							id={`${listId}-${p.id}`}
							role="option"
							aria-selected={p.id === palette}
							onPointerEnter={() => setActive(i)}
							onClick={() => choose(p.id)}
							className={`flex cursor-pointer items-center gap-3 rounded px-2.5 py-2 ${i === active ? 'bg-surface' : ''}`}
						>
							<span aria-hidden="true" className="flex shrink-0 overflow-hidden rounded-sm ring-1 ring-line">
								<span className="grid size-7 place-items-center" style={{ background: p.light.bg }}>
									<span className="size-3 rounded-[2px]" style={{ background: p.light.accent }} />
								</span>
								<span className="grid size-7 place-items-center" style={{ background: p.dark.bg }}>
									<span className="size-3 rounded-[2px]" style={{ background: p.dark.accent }} />
								</span>
							</span>
							<span className="min-w-0">
								<span className="block text-[14px] font-semibold text-ink">
									{p.name}
									{p.id === palette && <span className="ml-2 text-[12px] font-semibold text-ink-2">Current</span>}
								</span>
								<span className="block text-[12.5px] leading-snug font-normal text-ink-2">{p.mood}</span>
							</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
