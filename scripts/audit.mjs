// npm audit of production dependencies (CI). Fails on any advisory at moderate or above, except the reviewed
// exceptions below, each with its reason and the day it lapses.
import { execFileSync } from 'node:child_process';

const LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];
const FAIL_AT = LEVELS.indexOf('moderate');

/** Advisory id → why it can't reach sqwer, and the day to look again. */
const ACCEPTED = {
	'GHSA-fc5q-39xc-vjpf': {
		why: 'picomatch ReDoS: only the build tools (Vite, tinyglobby, fdir) match globs, from patterns in this repository; the built server never loads it. No fixed release yet.',
		until: '2027-01-31'
	}
};

function report() {
	try {
		return execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
	} catch (e) {
		// npm audit exits 1 when it finds anything; the report is still on stdout.
		if (e.stdout) return e.stdout;
		throw e;
	}
}

const { vulnerabilities = {}, error } = JSON.parse(report());
if (error) {
	console.error(`npm audit failed: ${error.summary ?? JSON.stringify(error)}`);
	process.exit(1);
}

// Each advisory once, however many packages depend on the affected one.
const advisories = new Map();
for (const { via } of Object.values(vulnerabilities)) {
	for (const v of via) {
		if (typeof v === 'object' && LEVELS.indexOf(v.severity) >= FAIL_AT) advisories.set(v.url?.split('/').pop() ?? v.title, v);
	}
}

const today = new Date().toISOString().slice(0, 10);
let failed = false;
for (const [id, v] of advisories) {
	const exception = ACCEPTED[id];
	const ok = !!exception && exception.until >= today;
	console.log(`${ok ? 'accepted' : 'FAIL'}: ${id} ${v.severity} ${v.name} ${v.range}: ${v.title}`);
	if (ok) console.log(`  ${exception.why} Review by ${exception.until}.`);
	else if (exception) console.log(`  The exception lapsed on ${exception.until}: look for a fix, then renew or remove it.`);
	failed ||= !ok;
}
if (!advisories.size) console.log('No advisories at moderate or above.');
process.exit(failed ? 1 : 0);
