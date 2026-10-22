'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Finger } from '@/lib/fingering';

// The finger just typed on the hero staff, shared with the hands further along the score.

const Ctx = createContext<{ lit: Finger | null; setLit: (f: Finger | null) => void }>({ lit: null, setLit: () => {} });

export function LitProvider({ children }: { children: ReactNode }) {
	const [lit, setLit] = useState<Finger | null>(null);
	return <Ctx.Provider value={{ lit, setLit }}>{children}</Ctx.Provider>;
}

export const useLit = () => useContext(Ctx);
