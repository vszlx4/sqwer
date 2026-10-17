// Applies pending database migrations (apps/web/drizzle/*.sql), recording each in sqwer_migrations.
//
//   npm run db:migrate -w web
//
// Uses MIGRATION_DATABASE_URL when set (the owner role, which may change the schema), otherwise
// DATABASE_URL. Run it before starting a version with new migrations when the app itself connects
// with the restricted role (DATABASE_MIGRATIONS=manual); see DEPLOYMENT.md.
//
// With DATABASE_APP_ROLE set (for example sqwer_app), that role is then given row access to every
// table, including new ones, and nothing more (see grantAppRole).
import { grantAppRole, open } from './lib/db.mjs';

const db = await open({ migrate: true, owner: true });
try {
	console.log(db.applied.length ? `Applied: ${db.applied.join(', ')}` : 'The database schema is up to date.');
	const role = process.env.DATABASE_APP_ROLE?.trim();
	if (role) console.log(`Row access for ${role} on ${(await grantAppRole(db.query, role)).length} tables.`);
} finally {
	await db.close();
}
