import { idbGet, idbSet } from '#lib/storage/idb.ts';
import type { ExamId, ResultRecord } from './types.ts';

const KEY = 'results';
const MAX = 500;

const byTime = (a: ResultRecord, b: ResultRecord) => a.at - b.at;

/** Test and assessment results, kept in the browser and synced to the account when signed in. */
/** What the server works out for a saved result. */
export interface UploadOutcome {
	xp: number;
	verified: boolean;
}

class ResultsStore {
	list = $state.raw<ResultRecord[]>([]);
	loaded = $state(false);
	private loading: Promise<void> | null = null;
	private account = false;

	load(): Promise<void> {
		this.loading ??= idbGet<ResultRecord[]>(KEY)
			.then((saved) => {
				if (Array.isArray(saved)) this.list = saved.sort(byTime);
			})
			.catch(() => {})
			.finally(() => (this.loaded = true));
		return this.loading;
	}

	async attach(signedIn: boolean) {
		this.account = signedIn;
		if (!signedIn) return;
		await this.load();
		try {
			const res = await fetch('/api/results');
			if (!res.ok) return;
			const remote = ((await res.json()) as { results: ResultRecord[] }).results;
			const known = new Set(remote.map((r) => r.id));
			const localOnly = this.list.filter((r) => !known.has(r.id));
			const merged = new Map([...this.list, ...remote].map((r) => [r.id, r]));
			this.list = [...merged.values()].sort(byTime).slice(-MAX);
			await this.saveLocal();
			for (const r of localOnly) await this.upload(r);
		} catch {
			// Results remain in this browser and are uploaded on the next visit.
		}
	}

	private async saveLocal() {
		try {
			await idbSet(KEY, $state.snapshot(this.list));
		} catch {
			// Storage unavailable: results last for this visit only.
		}
	}

	private async upload(record: ResultRecord): Promise<UploadOutcome | null> {
		const res = await fetch('/api/results', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(record)
		});
		return res.ok ? ((await res.json()) as UploadOutcome) : null;
	}

	/** Saves a result locally and, when signed in, to the account. Resolves with the server's XP and check. */
	async add(record: ResultRecord): Promise<UploadOutcome | null> {
		await this.load();
		this.list = [...this.list, record].slice(-MAX);
		await this.saveLocal();
		if (!this.account) return null;
		return this.upload(record).catch(() => null);
	}

	/** Discards the results in this browser that match, after they were cleared from the account. */
	async forget(match: (r: ResultRecord) => boolean) {
		await this.load();
		this.list = this.list.filter((r) => !match(r));
		await this.saveLocal();
	}

	/** Completed results for an examination; abandoned attempts are excluded from comparisons. */
	forExam(exam: ExamId) {
		return this.list.filter((r) => r.exam === exam && r.status !== 'abandoned');
	}

	byId(id: string) {
		return this.list.find((r) => r.id === id) ?? null;
	}

	/** The completed result of the same examination before `record`. */
	previous(record: { id: string; exam: ExamId; at: number }) {
		const earlier = this.forExam(record.exam).filter((r) => r.id !== record.id && r.at < record.at);
		return earlier[earlier.length - 1] ?? null;
	}

	latest(exam: ExamId) {
		const list = this.forExam(exam);
		return list[list.length - 1] ?? null;
	}

	best(exam: ExamId) {
		return this.forExam(exam).reduce<ResultRecord | null>((b, r) => (!b || r.wpm > b.wpm ? r : b), null);
	}
}

export const results = new ResultsStore();
