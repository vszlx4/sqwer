<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	// sqwer is a free, non-commercial project run by an individual.
	const operator = `${LEGAL.operatorName || 'an individual'}, based in ${LEGAL.operatorCountry}, as a free, non-commercial project`;
	const host = LEGAL.webHost ? `${LEGAL.webHost}, on servers in ${LEGAL.webHostLocation}` : `our hosting provider, on servers in ${LEGAL.webHostLocation}`;
</script>

<Seo title="Privacy Policy" description="What personal data sqwer processes, why, for how long, who receives it and the rights you have." />

<Prose
	kicker="Legal"
	title="Privacy Policy"
	lede="This policy explains what personal data sqwer processes when you use the website, why it is processed, how long it is kept, who receives it and how you can exercise your rights."
	updated={LEGAL.updated}
	crumbs={[{ href: '/privacy', label: 'Privacy Policy' }]}
>
	<section class="summary" aria-labelledby="summary-title">
		<h2 id="summary-title">The short version</h2>
		<ul>
			<li>You can practise without an account. Without one, your settings and practice data stay in your browser.</li>
			<li>An account stores your email address, profile, results and course progress so that they are available on every device.</li>
			<li>sqwer is free and non-commercial. We never ask for payment details, show advertising, use analytics or tracking tools, sell data or share it for marketing.</li>
			<li>Account data is stored in the European Union (Ireland). Only the providers that host sqwer receive it, and only to run the service.</li>
			<li>You can download or delete everything at any time from <strong>Account → Your data</strong>.</li>
		</ul>
	</section>

	<nav class="toc" aria-label="Contents">
		<ol>
			<li><a href="#controller">Who is responsible</a></li>
			<li><a href="#scope">What this policy covers</a></li>
			<li><a href="#visitors">Data processed when you visit</a></li>
			<li><a href="#account">Data processed when you have an account</a></li>
			<li><a href="#purposes">Purposes and legal bases</a></li>
			<li><a href="#recipients">Who receives your data</a></li>
			<li><a href="#transfers">International transfers</a></li>
			<li><a href="#retention">How long data is kept</a></li>
			<li><a href="#security">How data is protected</a></li>
			<li><a href="#rights">Your rights</a></li>
			<li><a href="#automated">Recommendations and automated decisions</a></li>
			<li><a href="#public">Public profiles</a></li>
			<li><a href="#children">Children</a></li>
			<li><a href="#cookies">Cookies and device storage</a></li>
			<li><a href="#changes">Changes to this policy</a></li>
		</ol>
	</nav>

	<h2 id="controller">1. Who is responsible</h2>
	<p>
		sqwer is operated by {operator} (“we”, “us”). We decide why and how the personal data described in this policy is
		processed, and are therefore its <strong>controller</strong>. For any question about your data or this policy, write
		to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>
	{#if LEGAL.euRepresentative || LEGAL.ukRepresentative}
		<p>
			Because we are established outside the European Union and the United Kingdom, we have appointed representatives for
			data protection matters:
		</p>
		<ul>
			{#if LEGAL.euRepresentative}<li><strong>European Union:</strong> {LEGAL.euRepresentative}</li>{/if}
			{#if LEGAL.ukRepresentative}<li><strong>United Kingdom:</strong> {LEGAL.ukRepresentative}</li>{/if}
		</ul>
	{/if}
	<p>
		We have not appointed a data protection officer, because the processing described here does not require one. The
		contact address above handles all privacy matters.
	</p>

	<h2 id="scope">2. What this policy covers</h2>
	<p>
		This policy applies to the sqwer website and everything on it: the <strong>Courses</strong> and their lessons and
		games, the <strong>Examinations</strong> (typing tests and the finger speed assessment), the <strong>Finger map</strong>,
		<strong>History</strong>, <strong>Getting started</strong> and your <strong>account</strong>. It applies wherever you
		live. Where the law of your country gives you stronger rights, those rights apply in addition.
	</p>

	<h2 id="visitors">3. Data processed when you visit</h2>
	<h3>Technical data</h3>
	<p>
		To deliver any page, our server necessarily receives your <strong>IP address</strong>, the page requested, the time,
		and the browser information your browser sends. We use this only to deliver the website and to protect it against
		abuse:
	</p>
	<ul>
		<li>IP addresses used to limit repeated requests are held in memory only, for no longer than one hour.</li>
		<li>
			Security records written by the server (for example, a blocked automated sign-up attempt) contain your IP address
			only as a keyed, one-way hash, which cannot be reversed into the address.
		</li>
		<li>We do not build profiles of visitors, and we do not use analytics or tracking tools.</li>
	</ul>
	<h3>Data kept only in your browser</h3>
	<p>
		Without an account, sqwer stores your settings, your finger map, your examination results and your answers in Getting
		started <strong>only in your browser</strong>. This information is not sent to us. The
		<a href="/cookies">Cookie Policy</a> lists every item and how to remove it.
	</p>
	<h3>Bot protection</h3>
	<p>
		The sign-up, sign-in and password reset forms are protected by a proof-of-work check that runs in your browser on our
		own server. It does not contact any third party and does not set cookies.
	</p>

	<h2 id="account">4. Data processed when you have an account</h2>
	<p>When you create an account and while you use it, we process the following. All of it comes from you or from your use of sqwer.</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Category</th><th scope="col">What it contains</th></tr>
			</thead>
			<tbody>
				<tr><th scope="row">Account</th><td>Your email address and a one-way hash of your password. Your password itself is never stored.</td></tr>
				<tr><th scope="row">Profile</th><td>Display name, username, biography, typing experience, goal, target speed, keyboard type, avatar colour and whether your profile is public.</td></tr>
				<tr><th scope="row">Profile picture</th><td>If you upload one: a 256 × 256 pixel image, cropped and re-encoded in your browser before upload, which removes embedded information such as location.</td></tr>
				<tr><th scope="row">Examination results</th><td>For each test or assessment, including attempts not completed: speed, accuracy, a per-second timeline, the words shown, the time taken for each word and the sequence of keystrokes, so that the result can be replayed.</td></tr>
				<tr><th scope="row">Course progress</th><td>For each lesson: the best stars, accuracy and speed, the number of attempts and when it was first completed; the calendar days on which you completed a lesson (for your streak); the level you described and the lesson you chose to start from. Points and ranks are calculated from these.</td></tr>
				<tr><th scope="row">Finger map</th><td>Each entry: the key pressed, the neighbouring keys, the finger you selected and the time.</td></tr>
				<tr><th scope="row">Usage statistics</th><td>Recorded only while you are signed in: active time per section of the site, active days and hours, tests started and completed, keystroke and word counts, and per-word counts and speeds. Kept separately for each of your devices, using a random device identifier.</td></tr>
				<tr><th scope="row">Recovery codes</th><td>One-way hashes of your recovery codes and whether each has been used.</td></tr>
				<tr><th scope="row">Signed-in devices</th><td>For each device: a hash of the session identifier, a short browser description (for example, “Chrome on macOS”), and the sign-in and last-activity times.</td></tr>
				<tr><th scope="row">Security activity</th><td>Security events on your account, such as sign-ins, failed sign-in attempts and password changes, with the browser description and time.</td></tr>
			</tbody>
		</table>
	</div>
	<p>
		The only information we ask you for is what the sign-up and profile forms request: your email address and a password
		to create the account, and the optional profile details listed above. Everything else arises from your use of the
		features you choose. We never ask for payment details, identity documents or sensitive information such as health
		data.
	</p>

	<h2 id="purposes">5. Purposes and legal bases</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Purpose</th><th scope="col">Data</th><th scope="col">Legal basis</th></tr>
			</thead>
			<tbody>
				<tr>
					<td>Delivering the website</td>
					<td>Technical data</td>
					<td>Our legitimate interest in operating the website (Art. 6(1)(f) GDPR)</td>
				</tr>
				<tr>
					<td>Providing your account, courses, results, finger map, statistics and data export</td>
					<td>Account data (section 4)</td>
					<td>Performance of our agreement with you, the <a href="/terms">Terms and Conditions</a> (Art. 6(1)(b) GDPR)</td>
				</tr>
				<tr>
					<td>Showing your public profile, if you make it public</td>
					<td>Public profile fields (section 12)</td>
					<td>Performance of our agreement with you, at your request (Art. 6(1)(b) GDPR)</td>
				</tr>
				<tr>
					<td>Protecting accounts and the service against unauthorised access and abuse</td>
					<td>Technical data, signed-in devices, security activity</td>
					<td>Our legitimate interest in keeping the service and your account secure (Art. 6(1)(f) GDPR)</td>
				</tr>
				<tr>
					<td>Answering your messages and requests</td>
					<td>Your email and its contents</td>
					<td>Our legitimate interest in responding, or our legal obligation when you exercise your rights (Art. 6(1)(f) and (c) GDPR)</td>
				</tr>
				<tr>
					<td>Complying with the law and defending legal claims</td>
					<td>The data relevant to the matter</td>
					<td>Legal obligation, or our legitimate interest in establishing and defending claims (Art. 6(1)(c) and (f) GDPR)</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		Where we rely on legitimate interests, we have weighed them against your interests and rights; you may object (see
		section 10). We do not rely on your consent for any processing in this policy. The same purposes and bases apply under
		the UK GDPR, the Saudi Personal Data Protection Law (PDPL), Brazil’s LGPD and comparable laws.
	</p>

	<h2 id="recipients">6. Who receives your data</h2>
	<p>We do not sell, rent or share personal data for marketing, and we do not show advertising. Only these providers receive personal data, solely to run sqwer on our behalf and under contracts that bind them to protect it:</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Provider</th><th scope="col">Role</th><th scope="col">Location of the data</th></tr>
			</thead>
			<tbody>
				<tr>
					<td>Supabase Pte. Ltd. (Singapore)</td>
					<td>Hosts the database that stores account data</td>
					<td>European Union (Ireland), on Amazon Web Services infrastructure</td>
				</tr>
				<tr>
					<td>{LEGAL.webHost || 'Our web hosting provider'}</td>
					<td>Hosts the server that delivers the website and therefore processes technical data</td>
					<td>{LEGAL.webHostLocation}</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		We may disclose personal data where the law requires it, for example in response to a valid order from a court or
		authority, and only to the extent required. If sqwer were ever transferred to a new operator, your data would pass to
		them only under this policy, and you would be told in advance.
	</p>

	<h2 id="transfers">7. International transfers</h2>
	<p>
		sqwer is used worldwide and operated from {LEGAL.operatorCountry}. Account data is stored in the European Union, and
		the website is served from {LEGAL.webHostLocation}. This means your data may be processed outside your own country:
	</p>
	<ul>
		<li>
			<strong>From the EU, EEA and UK:</strong> access to data by us and by Supabase Pte. Ltd. from outside the European
			Economic Area is protected by the European Commission’s Standard Contractual Clauses, including the UK Addendum,
			which form part of our agreement with Supabase.
		</li>
		<li>
			<strong>From the Kingdom of Saudi Arabia:</strong> data is transferred outside the Kingdom in accordance with the
			PDPL and its Regulation on Personal Data Transfer outside the Kingdom, with appropriate safeguards.
		</li>
		<li>
			<strong>From other countries:</strong> we apply the same safeguards and the protections described in this policy,
			whatever your location.
		</li>
	</ul>
	<p>You can ask us for more information about these safeguards at any time.</p>

	<h2 id="retention">8. How long data is kept</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Data</th><th scope="col">Kept for</th></tr>
			</thead>
			<tbody>
				<tr><td>Account, profile, profile picture, examination results, course progress, finger map and recovery codes</td><td>Until you delete them or your account</td></tr>
				<tr><td>Usage statistics</td><td>Until you delete them (Account → Statistics) or your account</td></tr>
				<tr><td>Signed-in devices</td><td>Until you sign out, or 30 days without use, after which the session is deleted</td></tr>
				<tr><td>Security activity on your account</td><td>While your account exists</td></tr>
				<tr><td>IP addresses for limiting repeated requests</td><td>In memory only, at most one hour</td></tr>
				<tr><td>Server security logs (hashed IP addresses)</td><td>At most 14 days</td></tr>
				<tr><td>Database backups</td><td>14 days; data you delete disappears from backups within 14 days</td></tr>
				<tr><td>Emails you send us</td><td>As long as needed to deal with your message, and no longer than two years</td></tr>
				<tr><td>Data in your browser</td><td>Until you remove it (see the <a href="/cookies">Cookie Policy</a>)</td></tr>
			</tbody>
		</table>
	</div>
	<p>When you delete your account, all data listed in section 4 is deleted from the live database immediately.</p>

	<h2 id="security">9. How data is protected</h2>
	<ul>
		<li>Passwords and recovery codes are stored only as one-way hashes; session identifiers are stored only as hashes.</li>
		<li>The website is served only over encrypted connections, and the session cookie cannot be read by scripts.</li>
		<li>Connections between our server and the database are encrypted and the database’s identity is verified. The database is not reachable through any public interface.</li>
		<li>Sign-in attempts are limited, and an account is locked temporarily after repeated failed attempts.</li>
		<li>Access to the systems that hold personal data is restricted to the operator.</li>
	</ul>
	<p>
		If a personal data breach occurs that is likely to put your rights at risk, we will inform the competent authorities
		and, where required, you, within the time limits set by law.
	</p>

	<h2 id="rights">10. Your rights</h2>
	<h3>Your right to object</h3>
	<p class="callout">
		Where we process your data on the basis of our legitimate interests (section 5),
		you have the right to object at any time, on grounds relating to your particular situation. We will then stop, unless
		we have compelling legitimate grounds that override your interests, or the processing is needed for legal claims.
	</p>
	<p>We give everyone the following rights, wherever they live:</p>
	<ul>
		<li><strong>Right to be informed and right of access:</strong> to know what data we hold about you and receive a copy. Download it at any time from <strong>Account → Your data</strong>.</li>
		<li><strong>Right to rectification:</strong> to correct inaccurate or incomplete data, from <strong>Account → Profile</strong> or by writing to us.</li>
		<li><strong>Right to erasure</strong> (deletion): delete your account from <strong>Account → Your data</strong>, your usage statistics from <strong>Account → Statistics</strong>, or ask us to delete specific data.</li>
		<li><strong>Right to data portability:</strong> to receive your data in a structured, machine-readable format (the download is in JSON).</li>
		<li><strong>Right to restriction of processing:</strong> to ask us to limit how we use your data, for example while a correction is checked.</li>
		<li><strong>Right to object:</strong> as described above.</li>
		<li><strong>Right to withdraw consent:</strong> we do not rely on consent for the processing in this policy. If we ever ask for your consent, you may withdraw it at any time, as easily as you gave it, without affecting processing that took place before.</li>
		<li><strong>Right to lodge a complaint</strong> with a data protection authority (see below).</li>
	</ul>
	<p>
		For any request not available in your account settings, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
		from the email address of your account, so that we can confirm the request is yours. We respond within 30 days, or
		sooner where the law that protects you requires it. Requests are free of charge.
	</p>
	<h3>Data protection authorities</h3>
	<ul>
		<li><strong>European Union and EEA:</strong> the authority in the country where you live or work, listed by the <a href="https://www.edpb.europa.eu/about-edpb/about-edpb/members_en" rel="noopener">European Data Protection Board</a>. In Ireland, where account data is stored, this is the <a href="https://www.dataprotection.ie" rel="noopener">Data Protection Commission</a>.</li>
		<li><strong>United Kingdom:</strong> the <a href="https://ico.org.uk/make-a-complaint/" rel="noopener">Information Commissioner’s Office</a>.</li>
		<li><strong>Kingdom of Saudi Arabia:</strong> the <a href="https://sdaia.gov.sa" rel="noopener">Saudi Data and Artificial Intelligence Authority (SDAIA)</a>.</li>
		<li><strong>Brazil:</strong> the <a href="https://www.gov.br/anpd" rel="noopener">Autoridade Nacional de Proteção de Dados (ANPD)</a>.</li>
		<li><strong>Elsewhere:</strong> the data protection authority of your country.</li>
	</ul>
	<p>We would appreciate the chance to resolve your concern first, but you may contact an authority at any time.</p>

	<h2 id="automated">11. Recommendations and automated decisions</h2>
	<p>
		sqwer calculates your results, stars, points and rank automatically, and may recommend where to start the course based
		on your placement test. These are suggestions about your practice only. They have no legal or similarly significant
		effect on you, and you can always choose any chapter yourself. We do not make decisions about you based solely on
		automated processing within the meaning of Article 22 GDPR.
	</p>

	<h2 id="public">12. Public profiles</h2>
	<p>
		Your profile is private by default. If you make it public, your profile picture, display name, username, biography,
		experience, goal, target speed, keyboard type, membership date and a summary of your finger map become visible to
		anyone at your profile address. Your email address is never shown. Public profiles ask search engines not to index
		them. You can make your profile private again at any time from <strong>Account → Profile</strong>.
	</p>

	<h2 id="children">13. Children</h2>
	<p>
		Accounts are available only to people aged 16 or older, which you confirm when signing up. We do not knowingly
		process account data of children under 16; if you believe a child has created an account, contact us and we will
		delete it. The examinations, the finger map and the first lesson can be used without an account, in which case no
		practice data is sent to us.
	</p>

	<h2 id="cookies">14. Cookies and device storage</h2>
	<p>
		sqwer sets one strictly necessary cookie to keep you signed in, and stores your settings and practice data in your
		browser. Nothing is used for advertising, analytics or tracking. Details are in the <a href="/cookies">Cookie Policy</a>.
	</p>
	<p>
		The listening exercises in the Courses use a voice built into your device. The words are spoken on your device and
		are not sent to us or to anyone else.
	</p>

	<h2 id="changes">15. Changes to this policy</h2>
	<p>
		We update this policy when our practices or the law change. The current version is always on this page with the date
		of the last update. If we make a significant change, we will announce it on the website before it takes effect.
	</p>
</Prose>
