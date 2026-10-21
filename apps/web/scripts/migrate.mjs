// Applies pending database migrations (apps/web/drizzle/*.sql), recording each in sqwer_migrations.
//
//   npm run db:migrate -w web
//
// Uses MIGRATION_DATABASE_URL when set (the owner role, which may change the schema), otherwise
// DATABASE_URL. Run it before starting a version with new migrations when the app itself connects
// with the restricted role (DATABASE_MIGRATIONS=manual); see docs/operations/DEPLOYMENT.md.
//
// The restricted application role (DATABASE_APP_ROLE, default sqwer_app) is then created if needed
// and given row access to every table, including new ones, and nothing more (src/lib/server/db/roles.ts).
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
