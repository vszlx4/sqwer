<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	const doc = LEGAL_DOCUMENTS.security;
	const report = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Security vulnerability report')}`;

	const toc = [
		{ id: 'scope', label: 'Purpose and scope' },
		{ id: 'governance', label: 'Security governance' },
		{ id: 'measures', label: 'Security measures' },
		{ id: 'incidents', label: 'Incident management' },
		{ id: 'continuity', label: 'Backups and continuity' },
		{ id: 'report', label: 'Reporting a vulnerability' },
		{ id: 'rules', label: 'Rules of engagement' },
		{ id: 'safe-harbor', label: 'Safe harbor' },
		{ id: 'out-of-scope', label: 'Out of scope' },
		{ id: 'handling', label: 'How reports are handled' },
		{ id: 'recognition', label: 'Recognition' }
	];

	const TIMES = [
		{ severity: 'Critical (CVSS 9.0 to 10.0)', target: '7 days' },
		{ severity: 'High (7.0 to 8.9)', target: '30 days' },
		{ severity: 'Medium (4.0 to 6.9)', target: '90 days' },
		{ severity: 'Low (0.1 to 3.9)', target: 'Next scheduled update' }
	];
</script>

<Seo title={doc.title} description="How sqwer protects the service and your data, and how to report a security vulnerability responsibly." />

<Prose
	kicker="Legal"
	title={doc.title}
	lede="This policy describes how sqwer protects the service and the personal data it holds, how security incidents are managed, and how security researchers can report vulnerabilities in good faith."
	crumbs={[{ href: '/legal', label: 'Legal center' }, { href: doc.href, label: doc.title }]}
	{doc}
	{toc}
>
	<section class="summary" aria-labelledby="summary-title">
		<h2 id="summary-title">To report a vulnerability</h2>
		<p>
			Email <a href={report}>{CONTACT_EMAIL}</a> with the subject “Security vulnerability report”. Describe the issue and
			how to reproduce it. We acknowledge reports within three working days. Please give us reasonable time to fix the
			issue before disclosing it, and follow the rules of engagement below. The same contact is published in
			<a href="/.well-known/security.txt"><code>/.well-known/security.txt</code></a> (RFC 9116).
		</p>
	</section>

	<h2 id="scope">1. Purpose and scope</h2>
	<p>
		1.1. This policy applies to the sqwer website and its programming interfaces at the address where it is published,
		and to the systems that store sqwer’s data. Third-party services, such as the database provider’s own platform, are
		covered by their providers’ policies.
	</p>
	<p>
		1.2. It forms part of the <a href="/terms">Terms and Conditions</a>. Activity carried out in accordance with this
		policy is authorized for the purposes of clause 9.1(f) of the Terms.
	</p>

	<h2 id="governance">2. Security governance</h2>
	<p>
		2.1. sqwer is operated by {LEGAL.operatorName}, who is responsible for its security. Security is managed using the
		approach of ISO/IEC 27001: risks are identified and assessed with reference to ISO 31000 and ISO/IEC 27005, controls
		are selected from ISO/IEC 27002, and privacy controls from ISO/IEC 27701 and ISO/IEC 29100. sqwer is not certified
		against these standards; they are used as frameworks of good practice.
	</p>
	<p>2.2. Measures are reviewed when the service changes, after any incident, and at least once a year.</p>

	<h2 id="measures">3. Security measures</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Area</th><th scope="col">Measures</th></tr>
			</thead>
			<tbody>
				<tr><th scope="row">Encryption</th><td>HTTPS with HTTP Strict Transport Security on every page. TLS 1.3 with certificate verification between the server and the database. Encryption at rest by the database provider.</td></tr>
				<tr><th scope="row">Credentials</th><td>Passwords hashed with scrypt and a unique salt. Recovery codes and session identifiers stored only as SHA-256 hashes. Constant-time comparison of secrets.</td></tr>
				<tr><th scope="row">Authentication</th><td>Minimum password length of 10 characters; rate limits on sign-up, sign-in and password reset; a 15-minute lock after five failed sign-ins; single-use recovery codes; all sessions ended when the password changes.</td></tr>
				<tr><th scope="row">Sessions</th><td>A random token in an <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code> cookie, expiring after 30 days without use, revocable per device.</td></tr>
				<tr><th scope="row">Automated abuse</th><td>sqwer’s own verification on account forms (proof of work and a human challenge), a hidden trap field and a minimum form-completion time.</td></tr>
				<tr><th scope="row">Application</th><td>Validation and sanitization of all input; output escaping; same-origin checks against cross-site request forgery; uploaded images verified by content; no third-party scripts.</td></tr>
				<tr><th scope="row">Browser protections</th><td>Content Security Policy restricting all resources to sqwer’s own origin, <code>X-Frame-Options: DENY</code>, <code>X-Content-Type-Options: nosniff</code>, a strict referrer policy and a permissions policy that disables camera, microphone and location.</td></tr>
				<tr><th scope="row">Database</th><td>Hosted in the EU with the public data interface disabled, so it is reachable only by sqwer’s server; row-level security enabled on every table; changes to its structure applied only through versioned migrations.</td></tr>
				<tr><th scope="row">Logging</th><td>Security events recorded as structured logs with keyed hashes of IP addresses; account activity shown to each user.</td></tr>
				<tr><th scope="row">Secrets</th><td>Secrets and connection strings kept outside the source code, in files readable only by the service.</td></tr>
			</tbody>
		</table>
	</div>

	<h2 id="incidents">4. Incident management</h2>
	<p>4.1. Security incidents are managed following ISO/IEC 27035:</p>
	<ol>
		<li><strong>Detect and report:</strong> from monitoring, user reports or researchers.</li>
		<li><strong>Assess:</strong> determine whether personal data is affected and the level of risk.</li>
		<li><strong>Contain and eradicate:</strong> for example, revoke sessions, rotate secrets or disable a feature.</li>
		<li><strong>Recover:</strong> restore normal operation, from backups if necessary.</li>
		<li><strong>Notify:</strong> inform supervisory authorities within 72 hours where required, and affected users without undue delay where the risk is high, as described in the <a href="/privacy#breaches">Privacy Policy</a>.</li>
		<li><strong>Learn:</strong> record the incident and improve the measures that failed.</li>
	</ol>

	<h2 id="continuity">5. Backups and continuity</h2>
	<p>
		5.1. With reference to ISO 22301, the database is backed up regularly and backups are retained for at most 14 days
		with restricted access. Account data can also be downloaded by each user at any time. If the service is to be
		discontinued, users are given at least 30 days’ notice to download their data.
	</p>

	<h2 id="report">6. Reporting a vulnerability</h2>
	<p>
		6.1. This process follows ISO/IEC 29147 (vulnerability disclosure). Send your report to
		<a href={report}>{CONTACT_EMAIL}</a>, in English or Arabic, including:
	</p>
	<ul>
		<li>a description of the vulnerability and its potential impact;</li>
		<li>the affected address, parameter or feature;</li>
		<li>step-by-step instructions to reproduce it, with any proof-of-concept code or screenshots;</li>
		<li>the browser, device or tools used; and</li>
		<li>whether, and how, you would like to be credited.</li>
	</ul>
	<p>6.2. Do not include personal data of other people in your report. If you obtained any by accident, say so, and delete it.</p>

	<h2 id="rules">7. Rules of engagement</h2>
	<p>When researching vulnerabilities, you must:</p>
	<ol type="a">
		<li>use only accounts that you created yourself, and never access, modify or delete data belonging to others;</li>
		<li>stop and report immediately if you encounter personal data, credentials or another person’s account;</li>
		<li>not perform denial-of-service attacks, load testing or high-volume automated scanning;</li>
		<li>not use social engineering, phishing or physical attacks against the operator, users or providers;</li>
		<li>not attack the infrastructure of the hosting or database providers;</li>
		<li>not exploit a vulnerability beyond what is necessary to demonstrate it; and</li>
		<li>keep the details confidential until the issue is resolved or 90 days have passed since your report, whichever is earlier, unless agreed otherwise.</li>
	</ol>

	<h2 id="safe-harbor">8. Safe harbor</h2>
	<p>
		8.1. If you act in good faith and in accordance with this policy, we will consider your research authorized, will not
		pursue or support legal action against you for it, and will work with you to understand and resolve the issue. If a
		third party brings action against you for activity that complied with this policy, we will make it known that your
		actions were authorized. This does not authorize breaches of the law of your own jurisdiction.
	</p>

	<h2 id="out-of-scope">9. Out of scope</h2>
	<ul>
		<li>Reports from automated scanners without a demonstrated, exploitable impact.</li>
		<li>Missing security headers or cookie flags where no vulnerability results.</li>
		<li>Self-cross-site scripting, or attacks requiring physical access to a user’s device.</li>
		<li>Clickjacking on pages without sensitive actions.</li>
		<li>Email configuration such as SPF, DKIM or DMARC: sqwer does not send email.</li>
		<li>Rate limits on pages that do not affect accounts or data.</li>
		<li>Vulnerabilities in outdated browsers or in third-party platforms, which should be reported to their vendors.</li>
	</ul>

	<h2 id="handling">10. How reports are handled</h2>
	<p>10.1. Reports are handled following ISO/IEC 30111 (vulnerability handling processes):</p>
	<ol>
		<li>We acknowledge your report within <strong>three working days</strong>.</li>
		<li>We verify and assess it within <strong>ten working days</strong>, rating severity with the Common Vulnerability Scoring System (CVSS), and keep you informed.</li>
		<li>We remediate within the target times below, then confirm the fix with you.</li>
		<li>We agree a disclosure date with you; by default, details may be published once the issue is fixed or after 90 days.</li>
	</ol>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Severity</th><th scope="col">Target time to remediate</th></tr>
			</thead>
			<tbody>
				{#each TIMES as t (t.severity)}
					<tr><td>{t.severity}</td><td>{t.target}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 id="recognition">11. Recognition</h2>
	<p>
		11.1. sqwer is a free, non-commercial project and does not offer monetary rewards. With your permission, we will
		gladly acknowledge your contribution publicly once the issue is resolved.
	</p>
</Prose>
