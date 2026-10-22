// The mixing logic: normalising stored specs, randomising around locks, fusing two worlds, naming results.

import { DIMS, DESIGN_KEYS } from './dims';
import { PALETTE_BY_ID } from './palettes';
import { NEIGHBOURS, type DesignSpec, type Fam } from './types';
import { DEFAULT_SPEC, WORLDS, WORLD_BY_ID } from './worlds';

export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Seeded random source so a roll can be reproduced. */
export function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Fills missing keys and repairs unknown option ids, so old saves and hand-edited JSON always render. */
export function normalize(input: Partial<DesignSpec> | null | undefined): DesignSpec {
	const s: DesignSpec = { ...DEFAULT_SPEC, ...(input ?? {}), custom: { ...DEFAULT_SPEC.custom, ...(input?.custom ?? {}) } };
	for (const d of DIMS) {
		const key = d.key as string;
		const v = (s as unknown as Record<string, unknown>)[key];
		if (d.kind === 'choice') {
			if (!d.opts.some((o) => o.id === v)) (s as unknown as Record<string, unknown>)[key] = (DEFAULT_SPEC as unknown as Record<string, unknown>)[key];
		} else {
			const n = typeof v === 'number' && Number.isFinite(v) ? v : ((DEFAULT_SPEC as unknown as Record<string, number>)[key]);
			(s as unknown as Record<string, number>)[key] = clamp(n, d.min, d.max);
		}
	}
	if (typeof s.name !== 'string' || !s.name) s.name = DEFAULT_SPEC.name;
	return s;
}

export function worldFamilies(spec: DesignSpec): Fam[] {
	const w = WORLD_BY_ID[spec.world];
	const pal = PALETTE_BY_ID[spec.palette];
	return w ? [w.fam, ...(pal?.fams ?? [])] : (pal?.fams ?? ['min']);
}

export type MixOptions = { chaos: number; seed?: number };

/**
 * Re-rolls every unlocked dimension. At low chaos choices come from the anchor's own family and its
 * neighbours; at high chaos any option is fair game. Numbers drift around the world's own values.
 */
export function randomise(spec: DesignSpec, locks: Set<string>, { chaos, seed }: MixOptions): DesignSpec {
	const r = rng(seed ?? Math.floor(Math.random() * 2 ** 31));
	const anchor = new Set<Fam>(worldFamilies(spec).slice(0, 1));
	const near = new Set<Fam>([...anchor].flatMap((f) => NEIGHBOURS[f]));
	const next: Record<string, unknown> = { ...spec };
	for (const d of DIMS) {
		const key = d.key as string;
		if (locks.has(key) || key === 'subject') continue;
		if (d.kind === 'choice') {
			if (key === 'mode') continue;
			let pool = d.opts.filter((o) => key !== 'palette' || o.id !== 'custom');
			if (chaos < 0.75 && pool.some((o) => o.fams)) {
				const tight = pool.filter((o) => o.fams?.some((f) => anchor.has(f)));
				const loose = pool.filter((o) => o.fams?.some((f) => anchor.has(f) || near.has(f)));
				const pick = r() < chaos ? (loose.length ? loose : pool) : tight.length ? tight : pool;
				pool = pick;
			}
			next[key] = pool[Math.floor(r() * pool.length)].id;
		} else {
			const base = (spec as unknown as Record<string, number>)[key];
			const range = d.max - d.min;
			const drift = (r() * 2 - 1) * range * (0.06 + chaos * 0.34);
			let v = clamp(base + drift, d.min, d.max);
			if (key === 'radius' && chaos < 0.7) v = Math.round(v / 2) * 2;
			if (key === 'border') v = Math.round(v * 2) / 2;
			next[key] = Math.round(v / d.step) * d.step;
		}
	}
	// Dark-native palettes read best dark; light-native best light, unless mode is locked.
	if (!locks.has('mode') && !locks.has('palette')) {
		const pal = PALETTE_BY_ID[next.palette as string];
		if (pal) next.mode = r() < 0.82 ? pal.native : pal.native === 'dark' ? 'light' : 'dark';
	}
	// Strong backgrounds under busy art need less intensity to stay legible.
	if (!locks.has('bgI') && (next.bgI as number) > 0.85 && chaos < 0.8) next.bgI = 0.8;
	return nameIt({ ...(next as unknown as DesignSpec), world: spec.world });
}

/** Fuses two different worlds: A supplies most decisions, B overwrites a handful. Respects locks. */
export function surprise(spec: DesignSpec, locks: Set<string>, seed?: number): DesignSpec {
	const r = rng(seed ?? Math.floor(Math.random() * 2 ** 31));
	const a = WORLDS[Math.floor(r() * WORLDS.length)];
	let b = WORLDS[Math.floor(r() * WORLDS.length)];
	for (let i = 0; i < 8 && (b.id === a.id || b.fam === a.fam); i++) b = WORLDS[Math.floor(r() * WORLDS.length)];
	const next: Record<string, unknown> = { ...spec };
	const keys = DESIGN_KEYS.filter((k) => !locks.has(k as string));
	for (const k of keys) next[k as string] = (a.spec as unknown as Record<string, unknown>)[k as string];
	// B's contribution: palette or type, plus 2 to 4 more, picked at random.
	const donate = [...keys].sort(() => r() - 0.5).slice(0, 3 + Math.floor(r() * 3));
	for (const k of donate) next[k as string] = (b.spec as unknown as Record<string, unknown>)[k as string];
	if (!locks.has('mode') && !locks.has('palette')) next.mode = PALETTE_BY_ID[next.palette as string]?.native ?? 'light';
	next.world = a.id;
	return { ...(next as unknown as DesignSpec), name: `${a.name} × ${b.name}` };
}

const ADJ = ['Quiet', 'Loud', 'Warm', 'Cold', 'Slow', 'Sharp', 'Soft', 'Bold', 'Dry', 'Bright', 'Dim', 'Wild', 'Calm', 'Crisp', 'Heavy'];
export function nameIt(spec: DesignSpec): DesignSpec {
	const pal = PALETTE_BY_ID[spec.palette]?.name ?? 'Custom';
	const adj = ADJ[(spec.radius + spec.border * 3 + spec.layout.length) % ADJ.length];
	return { ...spec, name: `${adj} ${pal.split(' ')[0]}` };
}

/** Applies a world's decisions, keeping any locked dimensions. */
export function applyWorld(spec: DesignSpec, id: string, locks: Set<string>): DesignSpec {
	const w = WORLD_BY_ID[id];
	if (!w) return spec;
	const next: Record<string, unknown> = { ...spec };
	for (const k of DESIGN_KEYS) if (!locks.has(k as string)) next[k as string] = (w.spec as unknown as Record<string, unknown>)[k as string];
	next.world = w.id;
	next.name = w.name;
	return next as unknown as DesignSpec;
}

/** Which dimensions differ between two specs. */
export function diff(a: DesignSpec, b: DesignSpec): string[] {
	return DESIGN_KEYS.filter((k) => (a as unknown as Record<string, unknown>)[k as string] !== (b as unknown as Record<string, unknown>)[k as string]).map(String);
}

export const encodeSpec = (s: DesignSpec) => (typeof window === 'undefined' ? '' : btoa(unescape(encodeURIComponent(JSON.stringify(s)))));
export function decodeSpec(str: string): DesignSpec | null {
	try {
		return normalize(JSON.parse(decodeURIComponent(escape(atob(str)))));
	} catch {
		return null;
	}
}
