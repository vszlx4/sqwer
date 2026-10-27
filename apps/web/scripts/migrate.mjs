// Applies pending migrations (apps/web/drizzle/*.sql), recorded in sqwer_migrations.
//
//   npm run db:migrate -w web
//
// Uses MIGRATION_DATABASE_URL (owner) when set, else DATABASE_URL. Run before starting a version with new
// migrations when DATABASE_MIGRATIONS=manual. Then creates the restricted role (DATABASE_APP_ROLE, default
// sqwer_app) if needed and grants row access to every table (src/lib/server/db/roles.ts).
import { appRoleName, ensureAppRole, open } from './lib/db.mjs';

const db = await open({ migrate: true, owner: true });
try {
	console.log(db.applied.length ? `Applied: ${db.applied.join(', ')}` : 'The database schema is up to date.');
	const role = appRoleName();
	if (role) {
		await ensureAppRole(db.query, role);
		console.log(`The application role ${role} has row access to every table.`);
	}
} finally {
	await db.close();
}
