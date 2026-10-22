'use client';

import { createContext, useContext, type CSSProperties } from 'react';
import type { Scheme } from '../../_engine/color';
import type { Subject } from '../../_engine/content';
import type { DesignSpec } from '../../_engine/types';

export type DpCtx = { spec: DesignSpec; c: Scheme; sub: Subject; interactive: boolean };

export const DpContext = createContext<DpCtx | null>(null);

export function useDp(): DpCtx {
	const v = useContext(DpContext);
	if (!v) throw new Error('useDp outside <Dp>');
	return v;
}

/** Marks an element for the scroll-reveal observer; `i` is its position in the stagger. */
export const R = (i = 0) => ({ 'data-r': '', style: { '--i': i } as CSSProperties });
