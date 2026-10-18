// Manages administrators (users who can open the analytics dashboard).
//
//   npm run admin -w web -- list
//   npm run admin -w web -- grant person@example.com
//   npm run admin -w web -- revoke person@example.com
//   npm run admin -w web -- signout person@example.com   (ends every session of one account)
//   npm run admin -w web -- signout-everyone             (ends every session, for example after a breach)
//   npm run admin -w web -- suspend person@example.com "reason"   (blocks sign-in, ends every session)
//   npm run admin -w web -- unsuspend person@example.com
//   npm run admin -w web -- reset-2fa person@example.com          (removes a lost authenticator app)
//
// Uses the same database as the app (see scripts/lib/db.mjs). With the embedded database, stop
// the app first: it can be opened by one process at a time.
import { open } from './lib/db.mjs';

const [command, rawEmail, ...rest] = process.argv.slice(2);
const reason = rest.join(' ').trim();
const email = rawEmail?.trim().toLowerCase();
const usage =
	'Usage: npm run admin -w web -- list | grant <email> | revoke <email> | signout <email> | signout-everyone | suspend <email> <reason> | unsuspend <email> | reset-2fa <email>';
const COMMANDS = ['list', 'grant', 'revoke', 'signout', 'signout-everyone', 'suspend', 'unsuspend', 'reset-2fa'];
const NO_EMAIL = ['list', 'signout-everyone'];

if (!COMMANDS.includes(command) || (!NO_EMAIL.includes(command) && !email) || (command === 'suspend' && !reason)) {
	console.error(usage);
	process.exit(2);
}

const db = await open();
try {
	if (command === 'suspend' || command === 'unsuspend' || command === 'reset-2fa') {
		const [user] = await db.query('SELECT id, email FROM users WHERE lower(email) = $1', [email]);
		if (!user) {
			console.error(`No account uses the email address ${email}.`);
			process.exitCode = 1;
		} else if (command === 'suspend') {
			await db.query('UPDATE users SET suspended_at = now(), suspended_reason = $2 WHERE id = $1', [user.id, reason.slice(0, 500)]);
			const ended = await db.query('DELETE FROM sessions WHERE user_id = $1 RETURNING id', [user.id]);
			await db.query("INSERT INTO security_events (user_id, type, device) VALUES ($1, 'account_suspended', 'Administrator')", [user.id]);
			console.log(`${user.email} is suspended; ${ended.length} session${ended.length === 1 ? '' : 's'} ended.`);
		} else if (command === 'unsuspend') {
			await db.query('UPDATE users SET suspended_at = NULL, suspended_reason = NULL WHERE id = $1', [user.id]);
			await db.query("INSERT INTO security_events (user_id, type, device) VALUES ($1, 'account_unsuspended', 'Administrator')", [user.id]);
			console.log(`${user.email} is no longer suspended.`);
		} else {
			await db.query('UPDATE users SET totp_secret = NULL, totp_pending = NULL, totp_enabled_at = NULL, totp_last_step = NULL WHERE id = $1', [user.id]);
			await db.query('UPDATE sessions SET mfa_verified_at = NULL WHERE user_id = $1', [user.id]);
			await db.query("INSERT INTO security_events (user_id, type, device) VALUES ($1, 'mfa_reset', 'Administrator')", [user.id]);
			console.log(`The authenticator app of ${user.email} was removed; it must be set up again before the next visit to the dashboard.`);
		}
	} else if (command === 'signout-everyone') {
		const rows = await db.query('DELETE FROM sessions RETURNING id');
		console.log(`Ended ${rows.length} session${rows.length === 1 ? '' : 's'}. Everyone must sign in again.`);
	} else if (command === 'signout') {
		const rows = await db.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE lower(email) = $1) RETURNING id', [email]);
		console.log(`Ended ${rows.length} session${rows.length === 1 ? '' : 's'} of ${email}.`);
	} else if (command === 'list') {
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
