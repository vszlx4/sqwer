import { FINGERS, pressesFor, qwertyAnsi, type Finger } from '@sqwer/layouts';
import type { ResultRecord } from '#lib/results/types.ts';

/** Fingers that are weakest for most typists, used until there is enough data about the learner. */
const USUALLY_WEAK: Finger[] = ['lp', 'rp', 'lr', 'rr'];

export interface WeakKeys {
	/** Keys from the pool typed by the weakest fingers. */
	keys: string;
	fingers: Finger[];
	/** Whether the choice comes from the learner's own results or from the usual weak fingers. */
	basis: 'data' | 'default';
}

/**
 * The learner's weakest fingers, and the keys they type within a pool. Mistakes from recent
 * examinations count against each finger, and the finger speed assessment adds how slow and
 * inaccurate each finger is. Without data, the little and ring fingers are practised.
 */
export function weakKeys(pool: string, results: readonly ResultRecord[], fingers = 2): WeakKeys {
	const layout = qwertyAnsi('pc');
	const fingerOf = (ch: string): Finger | undefined => pressesFor(layout, ch).at(-1)?.finger;
	const keys = [...new Set(pool)].filter((c) => c.trim());
	const available = new Set(keys.map(fingerOf).filter((f): f is Finger => !!f && !f.endsWith('t')));

	const score = new Map<Finger, number>();
	let evidence = 0;
	for (const r of results.slice(-30)) {
		for (const [ch, n] of Object.entries(r.detail?.missedKeys ?? {})) {
			const f = fingerOf(ch.toLowerCase());
			if (!f) continue;
			score.set(f, (score.get(f) ?? 0) + n);
			evidence += n;
		}
		if (r.exam === 'finger-speed' && r.fingers) {
			const speeds = Object.values(r.fingers).map((s) => s!.wpm);
			const top = Math.max(...speeds, 1);
			for (const [f, s] of Object.entries(r.fingers) as [Finger, { wpm: number; accuracy: number }][]) {
				score.set(f, (score.get(f) ?? 0) + (100 - s.accuracy) * 2 + ((top - s.wpm) / top) * 30);
				evidence += 10;
			}
		}
	}

	const ranked = evidence >= 15 ? FINGERS.filter((f) => available.has(f) && (score.get(f) ?? 0) > 0).sort((a, b) => (score.get(b) ?? 0) - (score.get(a) ?? 0)) : [];
	const basis = ranked.length ? 'data' : 'default';
	const chosen = (ranked.length ? ranked : USUALLY_WEAK.filter((f) => available.has(f))).slice(0, fingers);
	const picked = keys.filter((k) => chosen.includes(fingerOf(k)!));
	return { keys: picked.join('') || keys.join(''), fingers: chosen, basis };
}
