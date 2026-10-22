'use client';

// One small store for the whole lab: the working design, locks, saved designs, favourites and the compare shelf.
// It lives in localStorage (key atlas:v1) and is shared by every lab page, which is what keeps the pages one system.

import { useSyncExternalStore } from 'react';
import { applyWorld, decodeSpec, normalize, randomise, surprise } from './mix';
import type { DesignSpec, Saved } from './types';
import { DEFAULT_SPEC, WORLD_BY_ID } from './worlds';

export type Viewport = 'desktop' | 'tablet' | 'mobile';

export type LabState = {
	ready: boolean;
	current: DesignSpec;
	locks: string[];
	chaos: number;
	saved: Saved[];
	favs: string[];
	collections: string[];
	cmp: Saved[];
	hist: DesignSpec[];
	hi: number;
	vp: Viewport;
	blueprint: string;
	rail: boolean;
	lastRoll: number;
};

const KEY = 'atlas:v1';

const initial: LabState = {
	ready: false,
	current: DEFAULT_SPEC,
	locks: [],
	chaos: 0.35,
	saved: [],
	favs: [],
	collections: ['Shortlist', 'Rejected', 'For the landing page'],
	cmp: [],
	hist: [DEFAULT_SPEC],
	hi: 0,
	vp: 'desktop',
	blueprint: 'landing',
	rail: true,
	lastRoll: 0
};

let state = initial;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

const uid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());

function persist() {
	clearTimeout(timer);
	timer = setTimeout(() => {
		try {
			const { current, locks, chaos, saved, favs, collections, cmp, vp, blueprint, rail } = state;
			localStorage.setItem(KEY, JSON.stringify({ current, locks, chaos, saved, favs, collections, cmp, vp, blueprint, rail }));
		} catch {
			/* private mode or blocked storage: the lab still works, it just forgets on reload */
		}
	}, 250);
}

function set(patch: Partial<LabState>) {
	state = { ...state, ...patch };
	listeners.forEach((l) => l());
	persist();
}

let lastPush = 0;
function commit(next: DesignSpec, coalesce = false) {
	const now = Date.now();
	const { hi } = state;
	let { hist } = state;
	if (coalesce && now - lastPush < 700 && hi === hist.length - 1) hist = [...hist.slice(0, hi), next];
	else hist = [...hist.slice(0, hi + 1), next].slice(-60);
	lastPush = now;
	set({ current: next, hist, hi: hist.length - 1 });
}

export const labStore = {
	subscribe(l: () => void) {
		listeners.add(l);
		return () => listeners.delete(l);
	},
	get: () => state,

	hydrate() {
		if (state.ready) return;
		let stored: Partial<LabState> = {};
		try {
			stored = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		} catch {
			/* corrupted storage is ignored */
		}
		let current = normalize(stored.current);
		if (typeof location !== 'undefined') {
			const m = /[#&]d=([^&]+)/.exec(location.hash);
			const shared = m ? decodeSpec(m[1]) : null;
			if (shared) current = shared;
		}
		state = {
			...state,
			ready: true,
			current,
			locks: Array.isArray(stored.locks) ? stored.locks : [],
			chaos: typeof stored.chaos === 'number' ? stored.chaos : state.chaos,
			saved: Array.isArray(stored.saved) ? stored.saved.map((x) => ({ ...x, spec: normalize(x.spec) })) : [],
			favs: Array.isArray(stored.favs) ? stored.favs : [],
			collections: Array.isArray(stored.collections) ? stored.collections : state.collections,
			cmp: Array.isArray(stored.cmp) ? stored.cmp.map((x) => ({ ...x, spec: normalize(x.spec) })) : [],
			vp: stored.vp ?? 'desktop',
			blueprint: stored.blueprint ?? 'landing',
			rail: stored.rail ?? true,
			hist: [current],
			hi: 0
		};
		listeners.forEach((l) => l());
	},

	/** Change one or more dimensions of the working design. */
	patch(p: Partial<DesignSpec>, coalesce = false) {
		commit(normalize({ ...state.current, ...p }), coalesce);
	},
	replace(spec: DesignSpec) {
		commit(normalize(spec));
	},
	startFrom(worldId: string) {
		commit(applyWorld(state.current, worldId, new Set(state.locks)));
	},
	roll(chaos = state.chaos) {
		commit(randomise(state.current, new Set(state.locks), { chaos }));
		set({ lastRoll: Date.now() });
	},
	surprise() {
		commit(surprise(state.current, new Set(state.locks)));
		set({ lastRoll: Date.now() });
	},
	reset() {
		commit({ ...DEFAULT_SPEC, ...WORLD_BY_ID.nordic.spec });
		set({ locks: [] });
	},
	toggleLock(k: string) {
		set({ locks: state.locks.includes(k) ? state.locks.filter((x) => x !== k) : [...state.locks, k] });
	},
	setLocks: (locks: string[]) => set({ locks }),
	setChaos: (chaos: number) => set({ chaos }),
	undo() {
		if (state.hi > 0) set({ hi: state.hi - 1, current: state.hist[state.hi - 1] });
	},
	redo() {
		if (state.hi < state.hist.length - 1) set({ hi: state.hi + 1, current: state.hist[state.hi + 1] });
	},

	save(name?: string, collection?: string) {
		const spec = { ...state.current, name: name ?? state.current.name };
		const item: Saved = { id: uid(), name: spec.name, spec, at: Date.now(), collection };
		set({ saved: [item, ...state.saved] });
		return item;
	},
	saveSpec(spec: DesignSpec, name?: string) {
		const item: Saved = { id: uid(), name: name ?? spec.name, spec: { ...spec, name: name ?? spec.name }, at: Date.now() };
		set({ saved: [item, ...state.saved] });
		return item;
	},
	duplicate(id: string) {
		const src = state.saved.find((x) => x.id === id);
		if (!src) return;
		set({ saved: [{ ...src, id: uid(), name: `${src.name} copy`, spec: { ...src.spec, name: `${src.name} copy` }, at: Date.now() }, ...state.saved] });
	},
	update(id: string, p: Partial<Saved>) {
		set({ saved: state.saved.map((x) => (x.id === id ? { ...x, ...p } : x)) });
	},
	remove(id: string) {
		set({ saved: state.saved.filter((x) => x.id !== id), cmp: state.cmp.filter((x) => x.id !== id), favs: state.favs.filter((x) => x !== id) });
	},
	load(id: string) {
		const src = state.saved.find((x) => x.id === id);
		if (src) commit(normalize(src.spec));
	},
	addCollection(name: string) {
		const n = name.trim();
		if (n && !state.collections.includes(n)) set({ collections: [...state.collections, n] });
	},

	toggleFav(id: string) {
		set({ favs: state.favs.includes(id) ? state.favs.filter((x) => x !== id) : [...state.favs, id] });
	},

	addCompare(spec: DesignSpec, name?: string) {
		if (state.cmp.length >= 4) return false;
		set({ cmp: [...state.cmp, { id: uid(), name: name ?? spec.name, spec, at: Date.now() }] });
		return true;
	},
	removeCompare: (id: string) => set({ cmp: state.cmp.filter((x) => x.id !== id) }),
	clearCompare: () => set({ cmp: [] }),

	setViewport: (vp: Viewport) => set({ vp }),
	setBlueprint: (blueprint: string) => set({ blueprint }),
	setRail: (rail: boolean) => set({ rail }),

	exportAll: () => JSON.stringify({ atlas: 1, current: state.current, saved: state.saved, favs: state.favs, collections: state.collections }, null, 2),
	importAll(json: string): { ok: boolean; message: string } {
		try {
			const d = JSON.parse(json);
			if (d && typeof d === 'object' && 'palette' in d && 'type' in d && !('saved' in d)) {
				commit(normalize(d));
				return { ok: true, message: 'Imported one design as the working design.' };
			}
			const saved: Saved[] = (Array.isArray(d.saved) ? d.saved : []).map((x: Saved) => ({ ...x, id: uid(), spec: normalize(x.spec) }));
			if (d.current) commit(normalize(d.current));
			set({
				saved: [...saved, ...state.saved],
				favs: Array.from(new Set([...state.favs, ...(Array.isArray(d.favs) ? d.favs : [])])),
				collections: Array.from(new Set([...state.collections, ...(Array.isArray(d.collections) ? d.collections : [])]))
			});
			return { ok: true, message: `Imported ${saved.length} saved design${saved.length === 1 ? '' : 's'}.` };
		} catch {
			return { ok: false, message: 'That is not valid Atlas JSON.' };
		}
	}
};

const getServer = () => initial;

export function useLab(): LabState {
	return useSyncExternalStore(labStore.subscribe, labStore.get, getServer);
}
