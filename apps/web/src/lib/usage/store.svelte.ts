import { idbGet, idbSet } from '#lib/storage/idb.ts';
import type { ResultRecord } from '#lib/results/types.ts';
import { emptyUsage, type ExamUsage, type Usage } from './types.ts';

const KEY = 'usage';
const DEVICE_KEY = 'sqwer:device';
const MAX_WORDS = 4000;

const dayKey = (t: number) => {
	const d = new Date(t);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function deviceId(): string {
	try {
		let id = localStorage.getItem(DEVICE_KEY);
		if (!id) {
			id = crypto.randomUUID();
			localStorage.setItem(DEVICE_KEY, id);
		}
		return id;
	} catch {
		return 'unknown';
	}
}

/**
 * Usage statistics, recorded only while signed in: they are part of the account's Statistics page,
 * so nothing is stored for visitors without an account. Synced per device to the account.
 */
class UsageStore {
	data = $state.raw<Usage>(emptyUsage());
	loaded = $state(false);
	private loading: Promise<void> | null = null;
	private account = false;
	private dirty = false;
	private syncTimer: ReturnType<typeof setTimeout> | undefined;

	load(): Promise<void> {
		this.loading ??= idbGet<Usage>(KEY)
			.then((saved) => {
				if (saved?.version === 1) this.data = { ...emptyUsage(), ...saved };
			})
			.catch(() => {})
			.finally(() => (this.loaded = true));
		return this.loading;
	}

	attach(signedIn: boolean) {
		this.account = signedIn;
		if (signedIn) this.scheduleSync(2000);
	}

	private update(fn: (u: Usage) => void) {
		if (!this.account) return;
		const next = structuredClone($state.snapshot(this.data)) as Usage;
		fn(next);
		next.lastSeen = Date.now();
		this.data = next;
		this.dirty = true;
	}

	visit() {
		this.update((u) => u.visits++);
	}

	/** Adds active time to a section of the site. */
	tick(section: string, ms: number) {
		if (ms <= 0) return;
		const now = Date.now();
		this.update((u) => {
			u.activeMs += ms;
			u.sections[section] = (u.sections[section] ?? 0) + ms;
			u.days[dayKey(now)] = (u.days[dayKey(now)] ?? 0) + ms;
			u.hours[new Date(now).getHours()] = (u.hours[new Date(now).getHours()] ?? 0) + ms;
			const keys = Object.keys(u.days).sort();
			for (const k of keys.slice(0, Math.max(0, keys.length - 400))) delete u.days[k];
		});
	}

	testStarted(exam: string) {
		this.update((u) => {
			u.tests.started++;
			examOf(u, exam).started++;
		});
	}

	/** Records a completed or abandoned test, including its words. */
	testEnded(record: ResultRecord) {
		this.update((u) => {
			const e = examOf(u, record.exam);
			const ms = record.seconds * 1000;
			u.tests.ms += ms;
			e.ms += ms;
			if (record.status === 'completed') {
				u.tests.completed++;
				e.completed++;
			} else {
				u.tests.abandoned++;
				e.abandoned++;
			}
			const d = record.detail;
			if (!d) return;
			u.typing.keystrokes += d.keystrokes.total;
			u.typing.incorrect += d.keystrokes.incorrect;
			u.typing.backspaces += d.keystrokes.backspaces;
			for (const w of d.words) {
				u.typing.words++;
				if (w.ok) u.typing.correctWords++;
				const cur = u.words[w.w] ?? { n: 0, ok: 0, sumWpm: 0, bestWpm: 0 };
				cur.n++;
				if (w.ok) {
					cur.ok++;
					cur.bestWpm = Math.max(cur.bestWpm, w.wpm);
				}
				cur.sumWpm += w.wpm;
				u.words[w.w] = cur;
			}
			const words = Object.entries(u.words);
			if (words.length > MAX_WORDS) {
				words.sort((a, b) => b[1].n - a[1].n);
				u.words = Object.fromEntries(words.slice(0, MAX_WORDS));
			}
		});
		this.save();
	}

	mappingEntries(n: number) {
		this.update((u) => (u.mapping.entries += n));
	}

	async save() {
		if (!this.dirty || !this.account) return;
		try {
			await idbSet(KEY, $state.snapshot(this.data));
		} catch {
			// Storage unavailable: statistics last for this visit only.
		}
		if (this.account) this.scheduleSync(30_000);
	}

	private scheduleSync(ms: number) {
		clearTimeout(this.syncTimer);
		this.syncTimer = setTimeout(() => this.sync(), ms);
	}

	/** Sends this device's statistics to the account. */
	sync(keepalive = false): Promise<unknown> {
		if (!this.account) return Promise.resolve();
		this.dirty = false;
		return fetch('/api/usage', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ deviceId: deviceId(), usage: $state.snapshot(this.data) }),
			keepalive
		}).catch(() => {});
	}

	/** Starts this browser's statistics again after they were cleared from the account, without syncing. */
	async forget() {
		await this.load();
		clearTimeout(this.syncTimer);
		this.data = emptyUsage();
		this.dirty = false;
		await idbSet(KEY, $state.snapshot(this.data)).catch(() => {});
	}

	async reset() {
		this.data = emptyUsage();
		this.dirty = true;
		await this.save();
	}
}

function examOf(u: Usage, id: string): ExamUsage {
	u.tests.byExam[id] ??= { started: 0, completed: 0, abandoned: 0, ms: 0 };
	return u.tests.byExam[id]!;
}

export const usage = new UsageStore();

/** Section of the site a path belongs to, for time statistics. */
export function sectionOf(path: string): string {
	if (path === '/') return 'Home';
	if (path.startsWith('/start') || path.startsWith('/journey')) return 'Getting started';
	if (path.startsWith('/learn')) return 'Courses';
	if (path.startsWith('/competitive')) return 'Competitive';
	if (path.startsWith('/exams') || path.startsWith('/test')) return 'Examinations';
	if (path.startsWith('/map')) return 'Finger map';
	if (path.startsWith('/history')) return 'History';
	if (path.startsWith('/account') || path.startsWith('/u/')) return 'Account';
	if (path.startsWith('/about') || path.startsWith('/faq')) return 'Learning';
	if (['/privacy', '/terms', '/cookies'].some((p) => path.startsWith(p))) return 'Legal';
	return 'Other';
}
