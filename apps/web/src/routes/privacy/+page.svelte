<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	const doc = LEGAL_DOCUMENTS.privacy;
	const mail = `mailto:${CONTACT_EMAIL}`;
	const host = LEGAL.webHost || 'Our web hosting provider';

	const toc = [
		{ id: 'controller', label: 'Who is responsible' },
		{ id: 'scope', label: 'Scope and definitions' },
		{ id: 'principles', label: 'Our privacy principles' },
		{ id: 'visitors', label: 'Data processed when you visit' },
		{ id: 'account', label: 'Data processed with an account' },
		{ id: 'required', label: 'Which data is required' },
		{ id: 'purposes', label: 'Purposes and legal bases' },
		{ id: 'recipients', label: 'Recipients and processors' },
		{ id: 'transfers', label: 'International transfers' },
		{ id: 'retention', label: 'Retention' },
		{ id: 'security', label: 'Security of processing' },
		{ id: 'breaches', label: 'Personal data breaches' },
		{ id: 'rights', label: 'Your rights' },
		{ id: 'regions', label: 'Information for specific regions' },
		{ id: 'complaints', label: 'Complaints and authorities' },
		{ id: 'automated', label: 'Automated decisions and profiling' },
		{ id: 'public', label: 'Public profiles' },
		{ id: 'children', label: 'Children' },
		{ id: 'cookies', label: 'Cookies, storage and device voices' },
		{ id: 'changes', label: 'Changes and version history' }
	];
</script>

<Seo title={doc.title} description="What personal data sqwer processes, why, on what legal basis, for how long, who receives it and the rights you have." />

<Prose
	kicker="Legal"
	title={doc.title}
	lede="This Privacy Policy explains how personal data is processed when you use sqwer: what is collected, why, on which legal basis, for how long, who receives it, how it is protected, and how you can exercise your rights."
	crumbs={[{ href: '/legal', label: 'Legal centre' }, { href: doc.href, label: doc.title }]}
	{doc}
	{toc}
>
	<section class="summary" aria-labelledby="summary-title">
		<h2 id="summary-title">Summary</h2>
		<ul>
			<li>You can practise without an account. Without one, your settings and practice data stay in your browser and are not sent to us.</li>
			<li>With an account, we store only what the registration and profile forms ask for, and the results and progress your practice produces.</li>
			<li>sqwer is free and non-commercial. We never ask for payment details, show advertising, use third-party analytics or tracking tools, sell data or share it for marketing.</li>
			<li>We count page visits with our own first-party analytics <strong>only if you allow it</strong> in the banner shown on your first visit. You can change your choice at any time under <strong>Analytics preferences</strong> at the foot of every page.</li>
			<li>Account data is stored in the European Union (Ireland). Only the providers that host sqwer receive it, and only to run the service.</li>
			<li>You can download or delete all of your data at any time from <strong>Account → Your data</strong>, and you may object to processing based on legitimate interests.</li>
		</ul>
	</section>

	<h2 id="controller">1. Who is responsible</h2>
	<p>
		1.1. The controller of the personal data described in this Policy is <strong>{LEGAL.operatorName}</strong>, a private
		individual resident in {LEGAL.operatorCountry}, who operates sqwer as a free, non-commercial project (“we”, “us”).
		The controller decides why and how your personal data is processed and is responsible for complying with data
		protection law.
	</p>
	<dl>
		<dt>Controller</dt>
		<dd>{LEGAL.operatorName}, {LEGAL.operatorCountry}</dd>
		<dt>Privacy contact</dt>
		<dd><a href={mail}>{CONTACT_EMAIL}</a> (English or Arabic)</dd>
		<dt>Data protection officer</dt>
		<dd>Not appointed. The processing described here does not involve large-scale monitoring or special categories of data, so a data protection officer is not required. The privacy contact handles all matters.</dd>
		{#if LEGAL.euRepresentative}
			<dt>EU representative</dt>
			<dd>{LEGAL.euRepresentative}</dd>
		{/if}
		{#if LEGAL.ukRepresentative}
			<dt>UK representative</dt>
			<dd>{LEGAL.ukRepresentative}</dd>
		{/if}
	</dl>

	<h2 id="scope">2. Scope and definitions</h2>
	<p>
		2.1. This Policy applies to all processing of personal data through the sqwer website: Getting started, the Courses,
		the Examinations, the Finger map, History, accounts and public profiles. It applies wherever you live. Where the law
		of your country gives you stronger rights, those rights apply in addition.
	</p>
	<p>
		2.2. It does not apply to websites of others that are linked from sqwer, such as the websites of data protection
		authorities, which have their own policies.
	</p>
	<p>
		2.3. Terms such as “personal data”, “processing”, “controller”, “processor” and “data subject” have the meanings given
		in Article 4 of the General Data Protection Regulation (EU) 2016/679 (“GDPR”) and in the equivalent provisions of the
		other laws listed in section 14.
	</p>

	<h2 id="principles">3. Our privacy principles</h2>
	<p>
		3.1. The processing described in this Policy is designed around the privacy principles of ISO/IEC 29100 and Article
		5 GDPR:
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Principle</th><th scope="col">How it is applied in sqwer</th></tr>
			</thead>
			<tbody>
				<tr><th scope="row">Lawfulness, fairness and transparency</th><td>Every purpose has a stated legal basis (section 7); this Policy describes all processing in plain language.</td></tr>
				<tr><th scope="row">Purpose limitation</th><td>Data is used only for the purposes in section 7, never for advertising, profiling for marketing or sale.</td></tr>
				<tr><th scope="row">Consent and choice</th><td>Visit statistics are collected only after you allow them, refusing is as easy as allowing, and your choice can be changed at any time (paragraph 4.4).</td></tr>
				<tr><th scope="row">Data minimisation</th><td>Only an email address and password are required. Practice without an account keeps data in your browser. Analytics stores general device, browser and system labels instead of the user agent, and never your IP address.</td></tr>
				<tr><th scope="row">Accuracy</th><td>You can view and correct your data at any time from your account.</td></tr>
				<tr><th scope="row">Storage limitation</th><td>Each category has a defined retention period (section 10); deletion is immediate and self-service.</td></tr>
				<tr><th scope="row">Integrity and confidentiality</th><td>Encryption in transit, hashing of secrets, access restriction and verified database connections (section 11).</td></tr>
				<tr><th scope="row">Accountability</th><td>Records of acceptance, a register of documents with versions, and a security event log for each account.</td></tr>
			</tbody>
		</table>
	</div>

	<h2 id="visitors">4. Data processed when you visit</h2>
	<h3>Technical data</h3>
	<p>
		4.1. To deliver any page, our server necessarily receives your <strong>IP address</strong>, the address of the page
		requested, the date and time, and the information your browser sends (such as its type and language). This data is
		used only to deliver the website and to protect it against abuse:
	</p>
	<ul>
		<li>IP addresses used to limit repeated requests are held in the server’s memory only, for at most one hour, and are never written to storage.</li>
		<li>Security records written by the server (for example, a blocked automated sign-up attempt) contain your IP address only as a keyed, one-way hash that cannot be reversed into the address.</li>
		<li>Technical data is not used for analytics. Visit statistics are collected only as described in paragraph 4.4, and only with your consent. We do not build profiles of visitors and do not combine technical data with other sources.</li>
	</ul>
	<h3>Verification on account forms</h3>
	<p>
		4.2. To protect accounts from automated abuse (fake registrations, password guessing and credential stuffing), the
		registration, sign-in and password reset forms are protected in several ways, all checked on our server:
	</p>
	<ul>
		<li><strong>A signed form ticket</strong> issued when the page loads, which shows that the form was opened in a browser and when. It contains a short hash of your browser’s user agent, not the user agent itself.</li>
		<li><strong>A summary of how the form was filled</strong>: how many keys were pressed (not which keys), whether a pointer was used, how many fields were focused or pasted into, how long the form was open, and whether the browser reports that it is under automation. Nothing you type is included, and the summary is discarded once the request has been checked.</li>
		<li><strong>Request characteristics</strong> such as the user agent and language headers, and recent failed attempts from your address or network, which together decide whether a verification is needed. Most people sign in without one.</li>
		<li><strong>A verification</strong>. Where Cloudflare Turnstile is enabled, your browser runs Cloudflare’s check, and our server confirms the result with Cloudflare, sending the verification token and your IP address. Otherwise, or if Cloudflare cannot be reached, sqwer’s own check is used: your browser performs a short computation and you type the characters shown or answer a short text question. sqwer’s own check uses no third party and sets no cookie.</li>
	</ul>
	<p>
		4.2.1. The legal basis is our legitimate interest in keeping accounts and the service secure (Article 6(1)(f) GDPR),
		which these measures serve with as little data as possible. Used tokens are recorded only as one-way hashes, until
		they would have expired anyway, so that none can be reused. No decision with legal or similarly significant effects is
		made by these measures alone: a person who is asked to verify can always complete the verification.
	</p>
	<h3>Data kept only in your browser</h3>
	<p>
		4.3. Without an account, sqwer stores your settings, your finger map, your examination results and your answers in
		Getting started <strong>only in your browser</strong>. This information is not sent to us. Every item is listed in the
		<a href="/cookies">Cookie and Storage Policy</a>, with instructions for removing it.
	</p>

	<h3 id="analytics">Usage analytics</h3>
	<p>
		4.4. sqwer measures how the website is used with its own analytics system, which runs on our servers alongside the
		website. No analytics provider, advertising network or other third party receives this data, and it is never used
		for advertising or sold. Analytics has two parts, which rely on different legal bases.
	</p>
	<p>
		4.4.1. <strong>Visit statistics, only with your consent.</strong> On your first visit a banner asks whether sqwer may
		count your visit. Until you select <strong>Allow</strong>, nothing described in this paragraph is collected and no
		analytics identifier is stored in your browser. If you allow it, your browser sends us, for each page you open:
	</p>
	<ul>
		<li>the page address, without its query string or fragment (except the <code>utm_source</code>, <code>utm_medium</code> and <code>utm_campaign</code> campaign tags), and the date and time;</li>
		<li>on the first page of a visit only, the name of the website that linked to sqwer (for example, <code>google.com</code>), never the full address of the linking page;</li>
		<li>how long the page was visible on your screen;</li>
		<li>a random visitor identifier stored in your browser’s local storage, and a random visit identifier stored in its session storage that is replaced after 30 minutes without activity. Neither is derived from your device, IP address or any other information about you;</li>
		<li>whether you were signed in at the time and, if you were, a link to your account.</li>
	</ul>
	<p>
		4.4.2. From the user agent your browser sends with each request, our server records only three general labels: the
		type of device (desktop, mobile or tablet), the browser family (for example, Firefox) and the operating system family
		(for example, Android). The user agent itself, your IP address, your screen size, your language and your location are
		not stored for analytics. Requests from automated clients such as search engine crawlers are not recorded. No
		fingerprinting technique is used.
	</p>
	<p>
		4.4.3. The legal basis is your consent (Art. 6(1)(a) GDPR). Storing and reading the analytics identifiers in your
		browser also relies on your consent, as required by Article 5(3) of the ePrivacy Directive (2002/58/EC) and its
		national implementations, including the UK Privacy and Electronic Communications Regulations 2003. Refusing has no
		effect on anything else on sqwer. You may withdraw consent at any time under <strong>Analytics preferences</strong> at
		the foot of every page. Withdrawal deletes both identifiers from your browser at once and stops collection; it does
		not affect the lawfulness of collection before withdrawal. If your browser sends a Global Privacy Control or Do Not
		Track signal, sqwer treats it as a refusal and does not ask.
	</p>
	<p>
		4.4.4. <strong>Account and product events, recorded by our server.</strong> Our server records that certain actions
		took place: a registration, a successful or failed sign-in (with the general reason for a failure, such as an
		incorrect password, but never the email address or password entered), a password reset, completion of profile
		setup, a completed test or lesson, a verified ranked result, a placement, a cleared data category and an account
		deletion. Each record holds the type of action, the time, a few details of the action itself (for example, the
		lesson completed) and, for actions taken while signed in, a link to the account. These records contain no visitor
		identifier, IP address, user agent or device information. The legal basis is our legitimate interest in
		understanding how sqwer is used, keeping the service reliable and detecting abuse such as repeated failed sign-ins
		(Art. 6(1)(f) GDPR). You may object at any time (section 13).
	</p>
	<p>
		4.4.5. <strong>Who can see analytics.</strong> Analytics is shown only in aggregated form on a dashboard available to
		the controller and to administrators designated by the controller. Administrator rights are assigned in the database
		from the server’s command line and cannot be obtained through the website. The dashboard and its exports never show
		email addresses, account identifiers or visitor identifiers. Statistics derived from analytics may be published only
		in aggregated form that does not identify anyone.
	</p>
	<p>
		4.4.6. <strong>Retention.</strong> Individual analytics records are deleted automatically 13 months after they were
		made. Before deletion, each day is summarised into daily totals (such as the number of page views and registrations
		that day), which contain no personal data and are kept to show long-term trends. When an account is deleted, the
		link between its analytics records and the account is removed at once; the remaining records cannot be attributed to
		anyone without the browser identifiers, which are kept only on the visitor’s device. Your analytics records are
		included in the download available under <strong>Account → Your data</strong>.
	</p>

	<h2 id="account">5. Data processed with an account</h2>
	<p>5.1. When you create and use an account, we process the following categories. All of it is provided by you or generated by your use of sqwer; we do not obtain personal data about you from any other source.</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Category</th><th scope="col">What it contains</th></tr>
			</thead>
			<tbody>
				<tr><th scope="row">Account</th><td>Your email address and a one-way hash of your password (scrypt). Your password itself is never stored.</td></tr>
				<tr><th scope="row">Records of acceptance</th><td>The version of the Terms and Conditions and Privacy Policy you accepted at registration and the time of acceptance, and the time you confirmed that you are at least 16 years old.</td></tr>
				<tr><th scope="row">Profile</th><td>Display name, username, and optionally a headline, pronouns and biography; typing experience, goal, target speed, keyboard type, avatar colour, banner style, which showcase items to display, and whether your profile is public. Pronouns are optional and shown only if you enter them; do not enter information you do not want others to see.</td></tr>
				<tr><th scope="row">Profile picture</th><td>If you upload one: a 256 × 256 pixel image, cropped and re-encoded in your browser before upload, which removes embedded information such as location and camera details; and the time you confirmed that you hold the rights to it.</td></tr>
				<tr><th scope="row">Examination results</th><td>For each test or assessment, including attempts not completed: speed, accuracy, a per-second timeline, the words shown, the time taken for each word and the sequence of keystrokes, so that the result can be replayed.</td></tr>
				<tr><th scope="row">Course progress</th><td>For each lesson: the best stars, accuracy and speed, the number of attempts and when it was first completed; the calendar days on which you completed a lesson (for your streak); the level you described and the lesson you chose to start from. Points and ranks are calculated from these.</td></tr>
				<tr><th scope="row">Finger map</th><td>Each entry: the key pressed, the neighbouring keys, the finger you selected and the time.</td></tr>
				<tr><th scope="row">Experience and competitive results</th><td>For each saved examination result, the experience points (XP) it earned, worked out from its length, speed and accuracy, and its speed; for competitive results, whether they passed the automated plausibility check. Your account level is calculated from your XP and course points.</td></tr>
				<tr><th scope="row">Leaderboard setting</th><td>Whether you appear on the leaderboards (on unless you switch it off).</td></tr>
				<tr><th scope="row">Usage statistics</th><td>Recorded only while you are signed in: active time per section of the site, active days and hours, tests started and completed, keystroke and word counts, and per-word counts and speeds. Kept separately for each of your devices by means of a random device identifier.</td></tr>
				<tr><th scope="row">Recovery codes</th><td>One-way hashes of your recovery codes and whether each has been used.</td></tr>
				<tr><th scope="row">Signed-in devices</th><td>For each device: a hash of the session identifier, a short browser description (for example, “Chrome on macOS”), and the sign-in and last-activity times.</td></tr>
				<tr><th scope="row">Security activity</th><td>Security events on your account, such as sign-ins, failed sign-in attempts and password changes, with the browser description and time.</td></tr>
				<tr><th scope="row">Correspondence</th><td>If you write to us: your email address, the content of your message and our reply.</td></tr>
			</tbody>
		</table>
	</div>
	<p>
		5.2. We never ask for, and you should not provide, payment details, identity documents, or special categories of
		personal data such as health, religious or biometric data. Typing results are not used to identify you and are not
		biometric data within the meaning of Article 9 GDPR.
	</p>

	<h2 id="required">6. Which data is required</h2>
	<p>
		6.1. Your email address, a password and the two confirmations on the registration form are required to create an
		account, because the account cannot be provided without them; fields marked with an asterisk (*) are required.
		Without them, you can still use the Examinations, the Finger map and the first lesson without an account.
	</p>
	<p>
		6.2. All profile details and the profile picture are optional. Results, progress and usage statistics are generated
		only when you use the corresponding features. You are under no statutory obligation to provide any personal data.
	</p>

	<h2 id="purposes">7. Purposes and legal bases</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Purpose</th><th scope="col">Data</th><th scope="col">Legal basis</th></tr>
			</thead>
			<tbody>
				<tr>
					<td>Delivering the website and its pages</td>
					<td>Technical data</td>
					<td>Legitimate interest in operating the website (Art. 6(1)(f) GDPR)</td>
				</tr>
				<tr>
					<td>Providing your account, courses, results, finger map, statistics and data download</td>
					<td>Account data (section 5)</td>
					<td>Performance of the contract with you, namely the <a href="/terms">Terms and Conditions</a> (Art. 6(1)(b) GDPR)</td>
				</tr>
				<tr>
					<td>Showing your public profile, if you choose to make it public</td>
					<td>Public profile fields (section 17)</td>
					<td>Performance of the contract, at your request (Art. 6(1)(b) GDPR)</td>
				</tr>
				<tr>
					<td>Showing the leaderboards, which list display names, pictures, levels and best competitive speeds</td>
					<td>Leaderboard entries (section 17)</td>
					<td>Legitimate interest in offering a fair competitive feature that typists expect (Art. 6(1)(f) GDPR); you can object at any time by switching off “Appear on leaderboards”</td>
				</tr>
				<tr>
					<td>Checking competitive results for plausibility, so that the tiers and leaderboards stay fair</td>
					<td>Competitive results, including their keystroke timings</td>
					<td>Legitimate interest in preventing cheating (Art. 6(1)(f) GDPR)</td>
				</tr>
				<tr>
					<td>Recording acceptance of the Terms, the age confirmation and the rights confirmation for pictures</td>
					<td>Records of acceptance; picture confirmation time</td>
					<td>Legitimate interest in demonstrating compliance and handling infringement claims, and accountability (Art. 6(1)(f) and Art. 5(2) GDPR)</td>
				</tr>
				<tr>
					<td>Measuring visits: pages viewed, time on page, referring sites, campaign tags, device type, browser and operating system (paragraph 4.4.1)</td>
					<td>Visit statistics and the analytics identifiers in your browser</td>
					<td>Your consent (Art. 6(1)(a) GDPR; Art. 5(3) ePrivacy Directive), which you may withdraw at any time</td>
				</tr>
				<tr>
					<td>Understanding how sqwer is used and keeping it reliable: registrations, sign-ins, completed tests and lessons, and other account and product events (paragraph 4.4.4)</td>
					<td>Account and product events</td>
					<td>Legitimate interest in improving and operating the service and detecting abuse (Art. 6(1)(f) GDPR)</td>
				</tr>
				<tr>
					<td>Protecting accounts and the service against unauthorised access, automated abuse and fraud</td>
					<td>Technical data, verification check, signed-in devices, security activity</td>
					<td>Legitimate interest in keeping the service and your account secure (Art. 6(1)(f) GDPR; Recital 49)</td>
				</tr>
				<tr>
					<td>Handling reports of infringing or unlawful content</td>
					<td>The reported content, the notice and the parties’ contact details</td>
					<td>Legal obligation, and legitimate interest in protecting the rights of others (Art. 6(1)(c) and (f) GDPR)</td>
				</tr>
				<tr>
					<td>Answering messages and requests to exercise your rights</td>
					<td>Correspondence</td>
					<td>Legal obligation for rights requests, otherwise legitimate interest in responding (Art. 6(1)(c) and (f) GDPR)</td>
				</tr>
				<tr>
					<td>Complying with the law and establishing, exercising or defending legal claims</td>
					<td>The data relevant to the matter</td>
					<td>Legal obligation, or legitimate interest (Art. 6(1)(c) and (f) GDPR)</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		7.1. Where we rely on legitimate interests, we have balanced them against your interests, rights and freedoms and
		concluded that the processing is necessary, limited and expected; you may object at any time (section 13). The only
		processing based on consent is the measurement of visits (paragraph 4.4.1). We do not use personal data for any
		purpose other than those listed.
	</p>
	<p>
		7.2. Equivalent bases apply under the UK GDPR, the Saudi Personal Data Protection Law (“PDPL”), Brazil’s Lei Geral de
		Proteção de Dados (“LGPD”, Art. 7 II, V and IX) and comparable laws.
	</p>

	<h2 id="recipients">8. Recipients and processors</h2>
	<p>
		8.1. We do not sell, rent or share personal data for marketing or advertising. Only the following service providers
		receive personal data, solely to operate sqwer on our behalf, as processors bound by written agreements under Article
		28 GDPR that require confidentiality, security and deletion at the end of the service:
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Provider</th><th scope="col">Service</th><th scope="col">Data</th><th scope="col">Location</th></tr>
			</thead>
			<tbody>
				<tr>
					<td>Supabase Pte. Ltd., Singapore</td>
					<td>Managed PostgreSQL database</td>
					<td>All account data (section 5)</td>
					<td>European Union (Ireland), on Amazon Web Services infrastructure</td>
				</tr>
				<tr>
					<td>{host}</td>
					<td>Server that runs the website</td>
					<td>Technical data; account data in transit</td>
					<td>{LEGAL.webHostLocation}</td>
				</tr>
				<tr>
					<td>Cloudflare, Inc., United States (only where Turnstile is enabled)</td>
					<td>Bot protection on the registration, sign-in and password reset forms</td>
					<td>IP address, browser and device characteristics observed by the check, the verification token</td>
					<td>Cloudflare’s global network; transfers to the United States under the EU–US Data Privacy Framework and Standard Contractual Clauses</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		8.2. Sub-processors engaged by these providers, such as Amazon Web Services EMEA SARL for Supabase’s infrastructure,
		are bound by equivalent obligations. Supabase publishes its current list of sub-processors on its website.
	</p>
	<p>
		8.3. If you make your profile public, the fields listed in section 17 are visible to anyone who visits it.
	</p>
	<p>
		8.4. We may disclose personal data where required by law, for example in response to a binding order of a court or
		public authority, and then only to the extent required. If sqwer were transferred to another operator, your data
		would pass to them only under this Policy, and you would be informed in advance on the website.
	</p>

	<h2 id="transfers">9. International transfers</h2>
	<p>
		9.1. sqwer is used worldwide and operated from {LEGAL.operatorCountry}. Account data is stored in the European Union
		and the website is served from {LEGAL.webHostLocation}. Your data may therefore be processed outside your own
		country, subject to the following safeguards:
	</p>
	<ul>
		<li>
			<strong>From the EU, EEA and UK:</strong> access to data from outside the European Economic Area, by the controller
			in {LEGAL.operatorCountry} or by Supabase Pte. Ltd. in Singapore, is covered by the European Commission’s Standard
			Contractual Clauses (Decision (EU) 2021/914) and the UK International Data Transfer Addendum, incorporated in the
			data processing agreement with Supabase, together with supplementary technical measures: encryption in transit,
			encryption at rest and strict access control.
		</li>
		<li>
			<strong>From the Kingdom of Saudi Arabia:</strong> personal data is transferred outside the Kingdom in accordance
			with Article 29 of the PDPL and the Regulation on Personal Data Transfer outside the Kingdom, with appropriate
			safeguards and limited to the minimum data necessary.
		</li>
		<li>
			<strong>From Brazil:</strong> transfers rely on the mechanisms of Article 33 LGPD, including standard contractual
			clauses.
		</li>
		<li><strong>From other countries:</strong> the same safeguards and the protections of this Policy apply, whatever your location.</li>
	</ul>
	<p>9.2. You may request a copy of the relevant safeguards by writing to <a href={mail}>{CONTACT_EMAIL}</a>.</p>

	<h2 id="retention">10. Retention</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Data</th><th scope="col">Retention period</th></tr>
			</thead>
			<tbody>
				<tr><td>Account, profile, profile picture, examination results, course progress, finger map and recovery codes</td><td>Until you delete them or your account</td></tr>
				<tr><td>Records of acceptance and picture confirmation times</td><td>While your account (or picture) exists</td></tr>
				<tr><td>Usage statistics</td><td>Until you delete them (Account → Statistics) or your account</td></tr>
				<tr><td>Signed-in devices</td><td>Until you sign out, or after 30 days without use</td></tr>
				<tr><td>Security activity on your account</td><td>While your account exists</td></tr>
				<tr><td>IP addresses and network prefixes used for rate limiting and risk scoring</td><td>In server memory only, at most one day</td></tr>
				<tr><td>Used verification challenges, form tickets and verification tokens</td><td>One-way hashes only, until the token would have expired (at most two hours)</td></tr>
				<tr><td>Server security logs (hashed IP addresses)</td><td>At most 14 days</td></tr>
				<tr><td>Analytics records: visit statistics and account and product events (paragraph 4.4)</td><td>13 months, then deleted automatically; only daily totals without personal data are kept</td></tr>
				<tr><td>Analytics identifiers in your browser</td><td>The visitor identifier until you withdraw consent or clear your browser storage; the visit identifier until the browser tab is closed</td></tr>
				<tr><td>Database backups</td><td>14 days on a rolling basis; deleted data disappears from backups within 14 days</td></tr>
				<tr><td>Correspondence and infringement notices</td><td>As long as needed to deal with the matter, and no longer than two years, unless needed for a legal claim</td></tr>
				<tr><td>Data in your browser</td><td>Until you remove it (see the <a href="/cookies">Cookie and Storage Policy</a>)</td></tr>
			</tbody>
		</table>
	</div>
	<p>10.1. When you delete your account, all data listed in section 5 is deleted from the live database immediately and irreversibly.</p>
	<p>
		10.2. You may also clear one category of data while keeping the rest of your account: your learning path, practice
		results, ranked results, finger map or usage statistics (Account → Your data → Clear part of your data). The data
		in that category is deleted from the live database immediately and irreversibly, and we record only the time it
		was cleared, so that copies still held in your browsers are discarded rather than uploaded again.
	</p>

	<h2 id="security">11. Security of processing</h2>
	<p>
		11.1. In accordance with Article 32 GDPR, we apply technical and organisational measures appropriate to the risk,
		selected with reference to the controls of ISO/IEC 27001 and ISO/IEC 27002 and the privacy controls of ISO/IEC 27701.
		They include:
	</p>
	<ul>
		<li><strong>Cryptography:</strong> TLS on every connection to the website; TLS with certificate verification between the server and the database; encryption at rest by the database provider; passwords hashed with scrypt; recovery codes and session identifiers stored only as SHA-256 hashes.</li>
		<li><strong>Access control:</strong> access to systems holding personal data is limited to the operator; the database is not reachable through any public data interface, and row-level security is enabled on every table.</li>
		<li><strong>Authentication:</strong> rate limits, a temporary lock after repeated failed sign-ins, single-use recovery codes, and the ending of every session when a password is changed.</li>
		<li><strong>Application security:</strong> validation and sanitisation of all input, protection against cross-site request forgery, strict security headers, and no third-party scripts.</li>
		<li><strong>Logging and monitoring:</strong> security events are recorded with hashed IP addresses and shown to you in your account.</li>
		<li><strong>Resilience:</strong> regular database backups with restricted access, retained for at most 14 days.</li>
	</ul>
	<p>11.2. The full description is in the <a href="/security">Security and Vulnerability Disclosure Policy</a>.</p>

	<h2 id="breaches">12. Personal data breaches</h2>
	<p>
		12.1. Security incidents are handled following the process of ISO/IEC 27035: detection, assessment, containment,
		eradication, recovery and review. If a personal data breach occurs, we will notify the competent supervisory
		authority without undue delay and, where feasible, within <strong>72 hours</strong> of becoming aware of it, where the
		breach is likely to result in a risk to your rights and freedoms (Art. 33 GDPR; Art. 20 PDPL and its Implementing
		Regulation; Art. 48 LGPD).
	</p>
	<p>
		12.2. Where a breach is likely to result in a high risk to you, we will also inform you without undue delay, by a
		notice on the website and in your account, describing the nature of the breach, its likely consequences, the measures
		taken and what you can do to protect yourself.
	</p>

	<h2 id="rights">13. Your rights</h2>
	<h3>Your right to object</h3>
	<p class="callout">
		Where we process your data on the basis of legitimate interests (section 7), you have the right to object at any time,
		on grounds relating to your particular situation (Art. 21 GDPR). We will then stop the processing unless we
		demonstrate compelling legitimate grounds that override your interests, rights and freedoms, or the processing is
		needed to establish, exercise or defend legal claims.
	</p>
	<p>13.1. We give everyone the following rights, wherever they live:</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Right</th><th scope="col">What it means</th><th scope="col">How to exercise it</th></tr>
			</thead>
			<tbody>
				<tr><th scope="row">Information</th><td>To be told how your data is processed (Art. 13 GDPR).</td><td>This Policy.</td></tr>
				<tr><th scope="row">Access</th><td>To confirm whether we process your data and receive a copy (Art. 15 GDPR).</td><td>Account → Your data → Download, or by email.</td></tr>
				<tr><th scope="row">Rectification</th><td>To correct inaccurate or complete incomplete data (Art. 16 GDPR).</td><td>Account → Profile, or by email.</td></tr>
				<tr><th scope="row">Erasure</th><td>To have your data deleted (Art. 17 GDPR).</td><td>Account → Your data → Clear part of your data, or Delete account; or by email.</td></tr>
				<tr><th scope="row">Restriction</th><td>To limit processing, for example while accuracy is checked (Art. 18 GDPR).</td><td>By email.</td></tr>
				<tr><th scope="row">Portability</th><td>To receive your data in a structured, machine-readable format (Art. 20 GDPR).</td><td>The download is provided in JSON.</td></tr>
				<tr><th scope="row">Objection</th><td>To object to processing based on legitimate interests (Art. 21 GDPR).</td><td>By email.</td></tr>
				<tr><th scope="row">Automated decisions</th><td>Not to be subject to solely automated decisions with legal or similarly significant effects (Art. 22 GDPR).</td><td>No such decisions are made (section 16).</td></tr>
				<tr><th scope="row">Withdraw consent</th><td>To withdraw consent at any time, where processing is based on it (Art. 7(3) GDPR).</td><td>Analytics preferences, at the foot of every page (paragraph 4.4.3).</td></tr>
				<tr><th scope="row">Complaint</th><td>To complain to a data protection authority (Art. 77 GDPR).</td><td>See section 15.</td></tr>
			</tbody>
		</table>
	</div>
	<h3>How requests are handled</h3>
	<ol>
		<li>Send your request to <a href={mail}>{CONTACT_EMAIL}</a> from the email address registered to your account, so that we can confirm it comes from you. If you write from another address, we may ask for proportionate confirmation, never for an identity document unless strictly necessary.</li>
		<li>We acknowledge the request and respond within <strong>one month</strong> of receipt. This may be extended by two further months for complex or numerous requests, in which case we tell you within the first month. Shorter periods apply where your law requires them, such as the periods under the PDPL and the LGPD.</li>
		<li>Requests are free of charge. We may refuse, or charge a reasonable fee for, requests that are manifestly unfounded or excessive, as the law allows, and will explain why.</li>
		<li>If we cannot comply with a request, we will tell you the reasons and your right to complain to an authority.</li>
	</ol>

	<h2 id="regions">14. Information for specific regions</h2>
	<h3>European Union, EEA and United Kingdom</h3>
	<p>
		The GDPR applies to the processing of personal data of people in the EU and EEA, and the UK GDPR and Data Protection
		Act 2018 to people in the United Kingdom (Art. 3(2) GDPR). All rights in section 13 apply in full.
	</p>
	<h3>Kingdom of Saudi Arabia</h3>
	<p>
		The Personal Data Protection Law (Royal Decree M/19 of 9/2/1443H) and its Implementing Regulations apply. You have the
		right to be informed, to access your data, to obtain a copy in a readable format, to request correction, completion
		or updating, and to request destruction of data that is no longer needed. Requests are answered within the period
		set by the Implementing Regulations.
	</p>
	<h3>Brazil</h3>
	<p>
		The LGPD (Law No. 13.709/2018) applies. In addition to the rights in section 13, you may request confirmation of the
		existence of processing, anonymisation, information about the entities with which data is shared, and review of
		decisions taken solely on automated processing (Art. 18 and 20 LGPD).
	</p>
	<h3>United States</h3>
	<p>
		sqwer is non-commercial and does not meet the thresholds of state consumer privacy laws such as the California
		Consumer Privacy Act. Nevertheless: we do not sell or share personal information for cross-context behavioural
		advertising, do not use sensitive personal information, and honour the rights in section 13 for all users. A Global
		Privacy Control or Do Not Track signal from your browser is honoured as a refusal of analytics. sqwer is
		not directed at children under 13 (Children’s Online Privacy Protection Act).
	</p>
	<h3>Other countries</h3>
	<p>We apply this Policy to everyone. If your law gives you additional rights, contact us and we will honour them.</p>

	<h2 id="complaints">15. Complaints and authorities</h2>
	<p>15.1. We would appreciate the opportunity to resolve your concern first, but you may contact a supervisory authority at any time:</p>
	<ul>
		<li><strong>European Union and EEA:</strong> the authority in the country where you live, work or where an infringement occurred, listed by the <a href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en" rel="noopener noreferrer">European Data Protection Board</a>. In Ireland, where account data is stored, this is the <a href="https://www.dataprotection.ie" rel="noopener noreferrer">Data Protection Commission (DPC)</a>, 6 Pembroke Row, Dublin 2, D02 X963, Ireland.</li>
		<li><strong>United Kingdom:</strong> the <a href="https://ico.org.uk/make-a-complaint/" rel="noopener noreferrer">Information Commissioner’s Office</a>.</li>
		<li><strong>Kingdom of Saudi Arabia:</strong> the <a href="https://sdaia.gov.sa" rel="noopener noreferrer">Saudi Data and Artificial Intelligence Authority (SDAIA)</a>.</li>
		<li><strong>Brazil:</strong> the <a href="https://www.gov.br/anpd" rel="noopener noreferrer">Autoridade Nacional de Proteção de Dados (ANPD)</a>.</li>
		<li><strong>Elsewhere:</strong> the data protection authority of your country.</li>
	</ul>

	<h2 id="automated">16. Automated decisions and profiling</h2>
	<p>
		16.1. sqwer calculates your results, stars, points and rank automatically, and may recommend where to begin the
		Courses based on your placement activity. These are suggestions about your own practice. They have no legal or
		similarly significant effect, you may always choose any chapter yourself, and no decision about you is based solely on
		automated processing within the meaning of Article 22 GDPR. We do not profile users for marketing or any other
		purpose.
	</p>
	<p>
		16.2. Competitive results are checked automatically: a result counts towards speed tiers and the leaderboards only
		if its duration, accuracy and keystroke timings are consistent with a person typing. A result that does not pass is
		kept in your history but not ranked. This affects only your place on a leaderboard; if you believe a result was
		wrongly excluded, write to us and we will review it by hand.
	</p>
	<p>
		16.3. The pace of the Courses adapts to how each exercise goes, and weak-finger lessons choose fingers from your
		results. Both happen in your browser and only change the practice offered to you.
	</p>

	<h2 id="public">17. Public profiles</h2>
	<p>
		17.1. Your profile is private by default. If you make it public, your profile picture, banner, display name,
		username, headline, pronouns, biography, experience, goal, target speed, keyboard type, membership date and a summary
		of your finger map become visible to anyone at your profile address, together with the showcase items you choose:
		your course rank and points, your best speed and accuracy and the number of lessons completed, and your daily
		streak. Each showcase item can be switched off. Your email address is never shown. Public profiles instruct search engines
		not to index them. You can make your profile private again at any time from <strong>Account → Profile</strong>.
	</p>
	<p>
		17.2. <strong>Leaderboards.</strong> Unless you switch off “Appear on leaderboards” in <strong>Account →
		Profile</strong>, the Competitive page lists your display name, profile picture, account level and best verified
		competitive speed and tier. Because your picture is shown there, it can be viewed by anyone while you appear on a
		leaderboard, even if your profile is private. Your name links to your profile only when the profile is public.
		Switching the setting off removes you from the leaderboards at once.
	</p>

	<h2 id="children">18. Children</h2>
	<p>
		18.1. Accounts are available only to people aged 16 or older, who confirm their age when registering. We do not
		knowingly process account data of children under 16. If you believe that a child has created an account, contact us
		and we will delete it without delay.
	</p>
	<p>18.2. The Examinations, the Finger map and the first lesson can be used without an account, in which case no practice data is sent to us.</p>

	<h2 id="cookies">19. Cookies, storage and device voices</h2>
	<p>
		19.1. sqwer sets one strictly necessary cookie to keep you signed in, and stores your settings and practice data in
		your browser. With your consent only, it also stores two analytics identifiers in your browser (paragraph 4.4). Nothing
		is used for advertising or cross-site tracking, and no third party sets cookies through sqwer. Details are in the
		<a href="/cookies">Cookie and Storage Policy</a>.
	</p>
	<p>
		19.2. The listening exercises in the Courses use a voice built into your device. Only voices that run on your device
		are used, so the words are spoken locally and are not sent to us or to any speech service.
	</p>

	<h2 id="changes">20. Changes and version history</h2>
	<p>
		20.1. We review this Policy at least once a year and whenever our processing or the law changes. The current version
		is always published on this page with its version number and effective date. Material changes are announced on the
		website at least 30 days before they take effect.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Version</th><th scope="col">Effective</th><th scope="col">Changes</th></tr>
			</thead>
			<tbody>
				<tr><td>2.3</td><td>{doc.effective}</td><td>First-party usage analytics: visit statistics with consent, account and product events, administrator access, 13-month retention and the consent banner.</td></tr>
				<tr><td>2.2</td><td>16 October 2026</td><td>Experience and levels, competitive results and their checks, leaderboards, and the adaptive pace of the Courses.</td></tr>
				<tr><td>2.1</td><td>15 October 2026</td><td>Profile headline, pronouns, banner and showcase choices, and what public profiles show.</td></tr>
				<tr><td>2.0</td><td>15 October 2026</td><td>Controller named; records of acceptance and picture rights confirmation; new verification check; principles, security, breach and regional sections expanded.</td></tr>
				<tr><td>1.0</td><td>14 October 2026</td><td>First published version.</td></tr>
			</tbody>
		</table>
	</div>
</Prose>
