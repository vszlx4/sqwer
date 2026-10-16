import { FIRST_LESSON } from './catalog.ts';
import { localDay, nextLessonId, rankFor, streak, totalPoints } from './progression.ts';
import { LEVELS, type Level } from './state.ts';
import type { LessonProgress } from './types.ts';

const LEVEL_KEY = 'sqwer:level';
const START_KEY = 'sqwer:start';
const PENDING_KEY = 'sqwer:pending-lesson';

interface Snapshot {
	progress: Record<string, LessonProgress>;
	days: string[];
	state: { level: Level | null; startLesson: string | null };
}

interface PendingResult {
	lessonId: string;
	stars: number;
	accuracy: number;
	wpm: number;
	day: string;
}

function read(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}
function write(key: string, value: string | null) {
	try {
		if (value === null) localStorage.removeItem(key);
		else localStorage.setItem(key, value);
	} catch {
		// Storage unavailable: the choice applies for this visit only.
	}
}

/**
 * Course progress. Progress is saved to the account; without one, only the first lesson
 * can be taken, and its result is kept until an account is created.
 */
class CourseStore {
	progress = $state.raw<Record<string, LessonProgress>>({});
	days = $state.raw<string[]>([]);
	level = $state<Level | null>(null);
	startLesson = $state<string | null>(null);
	signedIn = $state(false);
	loaded = $state(false);
	error = $state<string | null>(null);
	private attached: boolean | null = null;

	get points() {
		return totalPoints(this.progress);
	}
	get rank() {
		return rankFor(this.points, Object.values(this.progress).map((p) => p.stars));
	}
	get streak() {
		return streak(this.days, localDay());
	}
	get nextLesson() {
		return nextLessonId(this.progress, this.startLesson);
	}
	get started() {
		return Object.keys(this.progress).length > 0;
	}

	/** Called whenever the signed-in state is known or changes. */
	async attach(signedIn: boolean) {
		if (this.attached === signedIn) return;
		this.attached = signedIn;
		this.signedIn = signedIn;
		const localLevel = read(LEVEL_KEY);
		const localStart = read(START_KEY);
		if (!signedIn) {
			this.progress = {};
			this.days = [];
			this.level = LEVELS.includes(localLevel as Level) ? (localLevel as Level) : null;
			this.startLesson = localStart;
			this.loaded = true;
			return;
		}
		try {
			let snap = await this.request('GET');
			// Choices made before signing in carry over to the account.
			const carry: Partial<Snapshot['state']> = {};
			if (!snap.state.level && LEVELS.includes(localLevel as Level)) carry.level = localLevel as Level;
			if (!snap.state.startLesson && localStart) carry.startLesson = localStart;
			if (Object.keys(carry).length) snap = await this.request('PUT', carry);
			const pending = read(PENDING_KEY);
			if (pending) {
				snap = await this.request('POST', JSON.parse(pending) as PendingResult);
				write(PENDING_KEY, null);
			}
			this.apply(snap);
		} catch {
			this.error = 'Your course progress could not be loaded. Check your connection and reload the page.';
		} finally {
			this.loaded = true;
		}
	}

	private apply(snap: Snapshot) {
		this.progress = snap.progress;
		this.days = snap.days;
		this.level = snap.state.level;
		this.startLesson = snap.state.startLesson;
		this.error = null;
	}

	private async request(method: 'GET' | 'POST' | 'PUT', body?: unknown): Promise<Snapshot> {
		const res = await fetch('/api/courses', {
			method,
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined
		});
		if (!res.ok) throw new Error(`Course request failed: ${res.status}`);
		return res.json();
	}

	/** Saves a finished lesson. Returns false when the result could not be saved. */
	async record(lessonId: string, stars: number, accuracy: number, wpm: number): Promise<boolean> {
		const result: PendingResult = { lessonId, stars, accuracy, wpm, day: localDay() };
		if (!this.signedIn) {
			// Only the first lesson can be taken without an account; keep it for later.
			if (lessonId === FIRST_LESSON.id && stars > 0) write(PENDING_KEY, JSON.stringify(result));
			return true;
		}
		try {
			this.apply(await this.request('POST', result));
			return true;
		} catch {
			this.error = 'This result could not be saved. Check your connection and try the lesson again.';
			return false;
		}
	}

	async setLevel(level: Level | null) {
		this.level = level;
		write(LEVEL_KEY, level);
		if (this.signedIn) await this.request('PUT', { level }).then((s) => this.apply(s)).catch(() => {});
	}

	async setStart(lessonId: string | null) {
		this.startLesson = lessonId;
		write(START_KEY, lessonId);
		if (this.signedIn) await this.request('PUT', { startLesson: lessonId }).then((s) => this.apply(s)).catch(() => {});
	}

	/** Whether a guest finished the first lesson and has a result waiting for an account. */
	get hasPendingTrial() {
		return !this.signedIn && !!read(PENDING_KEY);
	}
}

export const courses = new CourseStore();
