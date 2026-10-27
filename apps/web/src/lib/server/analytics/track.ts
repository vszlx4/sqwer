import { randomUUID } from 'node:crypto';
import type { ServerEventName } from '#lib/analytics/shared.ts';
import { db, schema } from '../db/index.ts';

/*
 * Server-recorded events: registrations, sign-ins (success and failure), completed tests and lessons. No
 * visitor id, address or browser data, so consent-independent; successes link to the account (cleared on
 * deletion). Fire-and-forget; failures are only logged.
 */

type Props = Record<string, string | number | boolean | null>;

const pending = new Set<Promise<void>>();

export function track(name: ServerEventName, opts: { userId?: string | null; props?: Props } = {}): void {
	const job = (async () => {
		try {
			await (await db())
				.insert(schema.analyticsEvents)
				.values({
					id: randomUUID(),
					occurredAt: new Date(),
					source: 'server',
					name,
					userId: opts.userId ?? null,
					authenticated: !!opts.userId,
					props: opts.props ?? null
				});
		} catch (e) {
			console.warn(JSON.stringify({ kind: 'analytics', event: name, error: String((e as Error)?.message ?? e).slice(0, 200) }));
		}
	})();
	pending.add(job);
	void job.finally(() => pending.delete(job));
}

/** For tests: waits until every event recorded so far has been written. */
export async function flushTracking() {
	while (pending.size) await Promise.all([...pending]);
}
