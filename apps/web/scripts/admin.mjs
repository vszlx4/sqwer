// Manages administrators (users who can open the analytics dashboard).
//
//   npm run admin -w web -- list
//   npm run admin -w web -- grant person@example.com
//   npm run admin -w web -- revoke person@example.com
//
// Uses the same database as the app (see scripts/lib/db.mjs). With the embedded database, stop
// the app first: it can be opened by one process at a time.
import { open } from './lib/db.mjs';

const [command, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const usage = 'Usage: npm run admin -w web -- list | grant <email> | revoke <email>';

if (!['list', 'grant', 'revoke'].includes(command) || (command !== 'list' && !email)) {
	console.error(usage);
	process.exit(2);
}

const db = await open();
try {
	if (command === 'list') {
		const rows = await db.query(`SELECT email, created_at FROM users WHERE role = 'admin' ORDER BY email`);
		if (!rows.length) console.log('There are no administrators.');
		for (const r of rows) console.log(`${r.email}  (account created ${new Date(r.created_at).toISOString().slice(0, 10)})`);
	} else {
		const role = command === 'grant' ? 'admin' : 'user';
		const rows = await db.query('UPDATE users SET role = $1 WHERE lower(email) = $2 RETURNING email', [role, email]);
		if (!rows.length) {
			console.error(`No account uses the email address ${email}.`);
			process.exitCode = 1;
		} else {
			console.log(command === 'grant' ? `${rows[0].email} is now an administrator.` : `${rows[0].email} is no longer an administrator.`);
		}
	}
} finally {
	await db.close();
}
