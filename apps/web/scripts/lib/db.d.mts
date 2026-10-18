// Types for db.mjs, the database helper of the command-line scripts.
export type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export function open(options?: { migrate?: boolean; owner?: boolean }): Promise<{
	query: Query;
	close: () => Promise<void>;
	applied: string[];
}>;

export function grantAppRole(query: Query, role: string): Promise<string[]>;
export function ensureAppRole(query: Query, role: string): Promise<void>;
export function appRoleName(env?: Record<string, string | undefined>): string | null;
