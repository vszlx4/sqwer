/*
 * One job at a time, the most needed first: the word in play before the look-ahead, the look-ahead before slow clips,
 * then in the order asked. A key asked for again joins the job already there, moved up when it is needed sooner.
 */

import { NEED_RANK, type Need } from '#lib/voice/clip.ts';

interface Job<T> {
	need: Need;
	seq: number;
	work: () => Promise<T>;
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (reason: unknown) => void;
	started: boolean;
}

export class NeedQueue<T> {
	#jobs = new Map<string, Job<T>>();
	#running = false;
	#seq = 0;
	readonly #onBusy?: (busy: boolean) => void;

	/** `onBusy(true)` when work starts after a quiet spell, `onBusy(false)` once nothing is left. */
	constructor(onBusy?: (busy: boolean) => void) {
		this.#onBusy = onBusy;
	}

	/** Jobs waiting or running. */
	get size(): number {
		return this.#jobs.size;
	}

	run(key: string, need: Need, work: () => Promise<T>): Promise<T> {
		const kept = this.#jobs.get(key);
		if (kept) {
			if (!kept.started && NEED_RANK[need] < NEED_RANK[kept.need]) kept.need = need;
			return kept.promise;
		}
		let resolve!: (value: T) => void;
		let reject!: (reason: unknown) => void;
		const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
		this.#jobs.set(key, { need, seq: ++this.#seq, work, promise, resolve, reject, started: false });
		if (!this.#running) {
			this.#onBusy?.(true);
			this.#next();
		}
		return promise;
	}

	#next() {
		let pick: [string, Job<T>] | null = null;
		for (const entry of this.#jobs) {
			const j = entry[1];
			if (!pick || NEED_RANK[j.need] < NEED_RANK[pick[1].need] || (j.need === pick[1].need && j.seq < pick[1].seq)) pick = entry;
		}
		if (!pick) {
			this.#running = false;
			this.#onBusy?.(false);
			return;
		}
		this.#running = true;
		const [key, job] = pick;
		job.started = true;
		void Promise.resolve()
			.then(job.work)
			.then(job.resolve, job.reject)
			.finally(() => {
				this.#jobs.delete(key);
				this.#next();
			});
	}
}
