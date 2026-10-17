import { randomUUID } from 'node:crypto';
import type { ServerEventName } from '#lib/analytics/shared.ts';
import { db, schema } from '../db/index.ts';

/*
 * Account and product events recorded by the server, where the browser could not be trusted to
 * report them: registrations, sign-ins (successful and failed), completed tests and lessons.
 * They carry no visitor identifier, address or browser details, so they do not depend on the
 * analytics consent; successful ones are linked to the account, which is cleared if the account is
 * deleted. Recording never delays or breaks the action itself: it runs in the background, and a
 * failure is only written to the server log.
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
