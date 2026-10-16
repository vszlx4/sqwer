import { mergeObservations, type FingerObservation } from '@sqwer/fingermap';
import { idbDelete, idbGet, idbSet } from '#lib/storage/idb.ts';

const KEY = 'finger-observations';

/**
 * The user's tagged keystrokes. Always kept in this browser (IndexedDB); when
 * signed in, also synced to the account.
 */
class FingerMapStore {
	observations = $state.raw<FingerObservation[]>([]);
	loaded = $state(false);
	/** True while the map is linked to a signed-in account. */
	synced = $state(false);
	/** Set when saving fails; data still lives in memory for this visit. */
	error = $state<string | null>(null);

	private loading: Promise<void> | null = null;
	private pushTimer: ReturnType<typeof setTimeout> | undefined;
	private account = false;

	load(): Promise<void> {
		this.loading ??= idbGet<FingerObservation[]>(KEY)
			.then((saved) => {
				if (Array.isArray(saved)) this.observations = saved;
			})
			.catch(() => {
				this.error = 'Your browser blocked local storage, so finger data will only be kept for this visit.';
			})
			.finally(() => {
				this.loaded = true;
			});
		return this.loading;
	}

	/** Links the map to the signed-in account, merging both copies. */
	async attach(signedIn: boolean) {
		this.account = signedIn;
		if (!signedIn) {
			this.synced = false;
			return;
		}
		await this.load();
		try {
			const res = await fetch('/api/fingermap');
			if (!res.ok) throw new Error(String(res.status));
			const remote = ((await res.json()) as { observations: FingerObservation[] }).observations;
			const merged = mergeObservations(this.observations, remote);
			this.observations = merged;
			await this.saveLocal();
			if (merged.length !== remote.length) await this.push();
			this.synced = true;
		} catch {
			this.synced = false;
			this.error = 'Your finger map could not be synced with your account. It is still saved in this browser.';
		}
	}

	private async saveLocal() {
		try {
			await idbSet(KEY, $state.snapshot(this.observations));
		} catch {
			this.error = 'The finger map could not be saved in this browser. Export it to keep a copy.';
		}
	}

	private async push() {
		const res = await fetch('/api/fingermap', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ observations: $state.snapshot(this.observations) })
		});
		if (!res.ok) throw new Error(String(res.status));
		this.error = null;
	}

	private async persist() {
		await this.saveLocal();
		if (!this.account) return;
		clearTimeout(this.pushTimer);
		this.pushTimer = setTimeout(() => {
			this.push().catch(() => {
				this.error = 'Recent changes could not be saved to your account. They are still saved in this browser.';
			});
		}, 800);
	}

	add(list: FingerObservation[]) {
		this.observations = [...this.observations, ...list];
		return this.persist();
	}

	/** Remove the most recent `n` observations. */
	undo(n = 1) {
		this.observations = this.observations.slice(0, Math.max(0, this.observations.length - n));
		return this.persist();
	}

	replace(list: FingerObservation[]) {
		this.observations = list;
		return this.persist();
	}

	/** Discards this browser's copy after the map was cleared from the account, without syncing. */
	async forget() {
		await this.load();
		clearTimeout(this.pushTimer);
		this.observations = [];
		await idbDelete(KEY).catch(() => {});
	}

	async clear() {
		this.observations = [];
		try {
			await idbDelete(KEY);
		} catch {
			this.error = 'Browser storage could not be cleared.';
		}
		if (this.account) await this.push().catch(() => {});
	}
}

export const fingerMap = new FingerMapStore();
