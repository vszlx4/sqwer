<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS, LEGAL_UPDATED } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	const documents = Object.values(LEGAL_DOCUMENTS);

	interface Standard {
		id: string;
		title: string;
		use: string;
		where: { href: string; label: string };
	}

	/** International standards used as references. sqwer is not certified against any of them. */
	const ISO: Standard[] = [
		{ id: 'ISO/IEC 27001', title: 'Information security management systems: requirements', use: 'Risk-based approach to managing the security of the service and its data.', where: { href: '/security#governance', label: 'Security policy, section 2' } },
		{ id: 'ISO/IEC 27002', title: 'Information security controls', use: 'Selection of controls: cryptography, secure authentication, access control, logging, backup, secure development and vulnerability management.', where: { href: '/security#measures', label: 'Security policy, section 3' } },
		{ id: 'ISO/IEC 27005', title: 'Information security risk management', use: 'Identification and assessment of security risks when features change.', where: { href: '/security#governance', label: 'Security policy, section 2' } },
		{ id: 'ISO 31000', title: 'Risk management: guidelines', use: 'General principles for assessing and treating risk.', where: { href: '/security#governance', label: 'Security policy, section 2' } },
		{ id: 'ISO/IEC 27701', title: 'Privacy information management', use: 'Controller privacy controls: purposes, legal bases, records, retention and handling of rights requests.', where: { href: '/privacy#purposes', label: 'Privacy Policy, sections 7 to 13' } },
		{ id: 'ISO/IEC 29100', title: 'Privacy framework', use: 'The privacy principles on which processing is designed.', where: { href: '/privacy#principles', label: 'Privacy Policy, section 3' } },
		{ id: 'ISO/IEC 29184', title: 'Online privacy notices and consent', use: 'Structure of the privacy notice, with a summary first, and recording of what was accepted, with its version and time.', where: { href: '/privacy', label: 'Privacy Policy; registration form' } },
		{ id: 'ISO/IEC 29134', title: 'Privacy impact assessment', use: 'Assessment of privacy risks before features are released; for example, usage statistics are recorded only for signed-in users.', where: { href: '/privacy#visitors', label: 'Privacy Policy, sections 4 and 5' } },
		{ id: 'ISO/IEC 20889', title: 'Privacy enhancing data de-identification', use: 'Pseudonymisation of IP addresses in security logs with a keyed, one-way hash.', where: { href: '/privacy#visitors', label: 'Privacy Policy, section 4' } },
		{ id: 'ISO/IEC 27035', title: 'Information security incident management', use: 'Process for detecting, containing, recovering from and reporting incidents and personal data breaches.', where: { href: '/security#incidents', label: 'Security policy, section 4' } },
		{ id: 'ISO/IEC 29147', title: 'Vulnerability disclosure', use: 'How vulnerabilities are reported, acknowledged and disclosed, and the security.txt contact.', where: { href: '/security#report', label: 'Security policy, section 6' } },
		{ id: 'ISO/IEC 30111', title: 'Vulnerability handling processes', use: 'Verification, severity rating and remediation targets for reported vulnerabilities.', where: { href: '/security#handling', label: 'Security policy, section 10' } },
		{ id: 'ISO 22301', title: 'Business continuity management systems', use: 'Backups, retention of backups and advance notice before any closure of the service.', where: { href: '/security#continuity', label: 'Security policy, section 5' } },
		{ id: 'ISO/IEC 40500', title: 'W3C Web Content Accessibility Guidelines', use: 'Accessibility requirements, applied in their current version, WCAG 2.2 Level AA.', where: { href: '/accessibility#standard', label: 'Accessibility Statement' } },
		{ id: 'ISO 9241-110', title: 'Ergonomics of human-system interaction: interaction principles', use: 'Error tolerance and controllability: confirmation before sign-out and deletion, clear error messages and required-field markers.', where: { href: '/accessibility#features', label: 'Accessibility Statement, section 4' } },
		{ id: 'ISO 8601', title: 'Date and time format', use: 'Dates and times in data downloads, in the document register and in security.txt.', where: { href: '/legal#register', label: 'Document register' } },
		{ id: 'ISO 639', title: 'Codes for the representation of names of languages', use: 'Language of every page and the preferred languages for security reports.', where: { href: '/.well-known/security.txt', label: 'security.txt' } },
		{ id: 'ISO/IEC 10646', title: 'Universal coded character set (Unicode)', use: 'Text encoding, and removal of control and direction-override characters from user input.', where: { href: '/security#measures', label: 'Security policy, section 3' } }
	];

	const OTHER: Standard[] = [
		{ id: 'W3C WCAG 2.2', title: 'Web Content Accessibility Guidelines', use: 'Target conformance Level AA, audited automatically on every main page.', where: { href: '/accessibility', label: 'Accessibility Statement' } },
		{ id: 'EN 301 549', title: 'Accessibility requirements for ICT products and services', use: 'European standard incorporating WCAG for web content.', where: { href: '/accessibility#standard', label: 'Accessibility Statement' } },
		{ id: 'RFC 9116', title: 'A file format to aid in security vulnerability disclosure', use: 'Security contact published at /.well-known/security.txt.', where: { href: '/.well-known/security.txt', label: 'security.txt' } },
		{ id: 'RFC 6265', title: 'HTTP state management mechanism (cookies)', use: 'The session cookie, with HttpOnly, Secure and SameSite attributes.', where: { href: '/cookies#cookie', label: 'Cookie and Storage Policy' } },
		{ id: 'RFC 8446', title: 'Transport Layer Security 1.3', use: 'Encryption between sqwer’s server and the database, with certificate verification.', where: { href: '/security#measures', label: 'Security policy, section 3' } },
		{ id: 'NIST SP 800-63B', title: 'Digital identity guidelines: authentication', use: 'Password rules: a minimum length rather than composition rules, long passwords allowed, throttling of failed attempts.', where: { href: '/security#measures', label: 'Security policy, section 3' } },
		{ id: 'OWASP ASVS', title: 'Application Security Verification Standard', use: 'Checklist for session management, input validation and security headers.', where: { href: '/security#measures', label: 'Security policy, section 3' } },
		{ id: 'FIRST CVSS', title: 'Common Vulnerability Scoring System', use: 'Severity rating of reported vulnerabilities.', where: { href: '/security#handling', label: 'Security policy, section 10' } }
	];

	const LAWS = [
		{ name: 'General Data Protection Regulation (EU) 2016/679', note: 'Applies to users in the EU and EEA.' },
		{ name: 'UK GDPR and Data Protection Act 2018', note: 'Applies to users in the United Kingdom.' },
		{ name: 'Personal Data Protection Law of the Kingdom of Saudi Arabia (Royal Decree M/19 of 9/2/1443H) and its Implementing Regulations', note: 'Applies to the operator and to users in the Kingdom.' },
		{ name: 'Lei Geral de Proteção de Dados (Law No. 13.709/2018)', note: 'Applies to users in Brazil.' },
		{ name: 'ePrivacy Directive 2002/58/EC and UK PECR 2003', note: 'Rules on cookies and device storage.' },
		{ name: 'Digital Services Act (Regulation (EU) 2022/2065)', note: 'Notice-and-action and statements of reasons for user content.' },
		{ name: 'Copyright Law of the Kingdom of Saudi Arabia (Royal Decree M/41 of 2/7/1424H)', note: 'Protection of works, and the content policy.' },
		{ name: 'Children’s Online Privacy Protection Act (United States)', note: 'Accounts are not offered to children under 16.' }
	];

	const toc = [
		{ id: 'operator', label: 'Operator' },
		{ id: 'register', label: 'Document register' },
		{ id: 'standards', label: 'International standards' },
		{ id: 'other-standards', label: 'Other technical standards' },
		{ id: 'laws', label: 'Laws considered' },
		{ id: 'contact', label: 'Contact' }
	];
</script>

<Seo title="Legal centre" description="Every legal and policy document of sqwer, with versions and effective dates, and the standards they follow." />

<Prose
	kicker="Legal"
	title="Legal centre"
	lede="All of sqwer’s legal and policy documents in one place, with their reference, version and effective date, together with the international standards and laws they follow."
	updated={LEGAL_UPDATED}
	crumbs={[{ href: '/legal', label: 'Legal centre' }]}
	{toc}
>
	<h2 id="operator">1. Operator</h2>
	<dl>
		<dt>Operator</dt>
		<dd>{LEGAL.operatorName}</dd>
		<dt>Status</dt>
		<dd>Private individual operating a free, non-commercial educational project. sqwer is not a company and sells nothing.</dd>
		<dt>Country</dt>
		<dd>{LEGAL.operatorCountry}</dd>
		<dt>Contact</dt>
		<dd><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> (English or Arabic)</dd>
		<dt>Data location</dt>
		<dd>European Union (Ireland)</dd>
	</dl>

	<h2 id="register">2. Document register</h2>
	<p>
		Each document has a permanent reference. When a document changes in substance, its version and effective date change
		and the change is recorded in the document. The versions of the Terms and Conditions and Privacy Policy accepted at
		registration are recorded with each account.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Reference</th><th scope="col">Document</th><th scope="col">Version</th><th scope="col">Effective</th></tr>
			</thead>
			<tbody>
				{#each documents as d (d.ref)}
					<tr>
						<td><code>{d.ref}</code></td>
						<td><a href={d.href}>{d.title}</a><br /><span class="muted">{d.summary}</span></td>
						<td>{d.version}</td>
						<td><time datetime={d.effectiveIso}>{d.effectiveIso}</time></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 id="standards">3. International standards</h2>
	<p class="callout">
		The standards below are used as references for designing and operating sqwer. sqwer has <strong>not</strong> been
		audited or certified against them, and no certification is claimed. Where a standard is listed, the column on the
		right shows where it is applied.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Standard</th><th scope="col">Subject</th><th scope="col">How it is applied</th><th scope="col">Where</th></tr>
			</thead>
			<tbody>
				{#each ISO as s (s.id)}
					<tr>
						<th scope="row" class="std">{s.id}</th>
						<td>{s.title}</td>
						<td>{s.use}</td>
						<td><a href={s.where.href}>{s.where.label}</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 id="other-standards">4. Other technical standards</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Standard</th><th scope="col">Subject</th><th scope="col">How it is applied</th><th scope="col">Where</th></tr>
			</thead>
			<tbody>
				{#each OTHER as s (s.id)}
					<tr>
						<th scope="row" class="std">{s.id}</th>
						<td>{s.title}</td>
						<td>{s.use}</td>
						<td><a href={s.where.href}>{s.where.label}</a></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 id="laws">5. Laws considered</h2>
	<p>The documents have been prepared with regard to the following laws. Where a law applies to you, its mandatory protections prevail over anything in sqwer’s documents.</p>
	<ul>
		{#each LAWS as law (law.name)}
			<li><strong>{law.name}.</strong> {law.note}</li>
		{/each}
	</ul>

	<h2 id="contact">6. Contact</h2>
	<p>
		For any legal, privacy, copyright, accessibility or security matter, write to
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Previous versions of any document are available on request.
	</p>
</Prose>

<style>
	.muted {
		font-size: 14px;
		color: var(--ink-2);
		font-weight: 400;
	}
	.std {
		white-space: nowrap;
		font-family: var(--font-mono);
		font-size: 13.5px;
	}
</style>
