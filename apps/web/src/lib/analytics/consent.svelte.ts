/* Analytics consent, localStorage only. GPC/DNT count as refusal. Withdrawal deletes analytics ids. */

const KEY = 'sqwer:analytics-consent';
export const VISITOR_KEY = 'sqwer:analytics-id';
export const SESSION_KEY = 'sqwer:analytics-session';
/** Raised when what is collected changes, so that everyone is asked again. */
const VERSION = 1;

export type Choice = 'granted' | 'denied';

function read(): Choice | null {
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { v?: number; choice?: Choice } | null;
		return saved?.v === VERSION && (saved.choice === 'granted' || saved.choice === 'denied') ? saved.choice : null;
	} catch {
		return null;
	}
}

/** The browser asks sites not to track: Global Privacy Control or Do Not Track. */
export function browserOptOut(): boolean {
	const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
	return nav.globalPrivacyControl === true || navigator.doNotTrack === '1';
}

class Consent {
	/** null until the visitor has chosen. */
	choice = $state<Choice | null>(null);
	/** Whether the choice panel is showing. */
	open = $state(false);
	ready = $state(false);
	optOut = $state(false);

	load() {
		if (this.ready) return;
		this.optOut = browserOptOut();
		this.choice = this.optOut ? 'denied' : read();
		this.open = this.choice === null;
		this.ready = true;
	}

	get granted() {
		return this.choice === 'granted' && !this.optOut;
	}

	set(choice: Choice) {
		this.choice = choice;
		this.open = false;
		try {
			localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice, at: new Date().toISOString() }));
			if (choice === 'denied') {
				localStorage.removeItem(VISITOR_KEY);
				sessionStorage.removeItem(SESSION_KEY);
			}
		} catch {
			// Storage unavailable: the choice applies to this visit only.
		}
	}
}

export const consent = new Consent();
