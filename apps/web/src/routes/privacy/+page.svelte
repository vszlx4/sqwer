<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
</script>

<Seo title="Privacy Policy" description="How sqwer collects, uses, stores and protects personal data." />

<Prose
	kicker="Legal"
	title="Privacy Policy"
	lede="This policy explains what personal data sqwer processes, why it is processed, how long it is kept and the rights available to you."
	updated="14 October 2026"
	crumbs={[{ href: '/privacy', label: 'Privacy Policy' }]}
>
	<h2>1. Who is responsible</h2>
	<p>
		sqwer is the controller of the personal data described in this policy. Enquiries regarding privacy may be sent to
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>

	<h2>2. Using sqwer without an account</h2>
	<p>The typing test and the finger map can be used without an account. In that case, sqwer stores the following only in your browser:</p>
	<ul>
		<li><strong>Settings</strong>, such as the theme, test options and keyboard type, in local storage.</li>
		<li>
			<strong>Finger map entries</strong>, consisting of the key pressed, the neighbouring keys, the finger selected and
			the time of the entry, in IndexedDB storage.
		</li>
	</ul>
	<ul>
		<li>
			<strong>Results</strong> — for each test or assessment, including attempts that were not completed: speed,
			accuracy, a per-second timeline, the words shown, the time taken for each word and the sequence of keystrokes, so
			that the result can be replayed.
		</li>
		<li>
			<strong>Usage statistics</strong> — active time on each section of the site, active days and hours, the number of
			tests started, completed and not completed, keystroke and word counts, and per-word counts and speeds.
		</li>
	</ul>
	<p>
		This information is not transmitted to our servers unless you are signed in. Usage statistics describe how sqwer is
		used; they do not identify you and are not shared with anyone. Time is counted only while the page is visible and
		has been used within the previous minute.
	</p>

	<h2>3. Data processed when you create an account</h2>
	<dl>
		<dt>Account data</dt>
		<dd>Your email address and a one-way cryptographic hash of your password. Your password itself is never stored.</dd>
		<dt>Profile data</dt>
		<dd>The display name, username, biography, typing experience, goal, target speed, keyboard type, avatar colour and visibility setting that you provide.</dd>
		<dt>Profile picture</dt>
		<dd>If you upload one: a 256 × 256 pixel image, cropped and re-encoded in your browser before upload, which removes embedded information such as location.</dd>
		<dt>Results</dt>
		<dd>The results described in section 2, for tests taken while signed in, including the keystroke sequence used for replays.</dd>
		<dt>Usage statistics</dt>
		<dd>The usage statistics described in section 2, stored separately for each device so that totals can be combined. They can be deleted at any time from Account → Statistics.</dd>
		<dt>Recovery codes</dt>
		<dd>One-way hashes of your recovery codes and whether each code has been used.</dd>
		<dt>Sessions</dt>
		<dd>For each signed-in device: a hash of the session identifier, a short browser description (for example, “Chrome on macOS”), and the sign-in and last-activity times.</dd>
		<dt>Security activity</dt>
		<dd>Records of security events on your account, such as sign-ins, failed sign-in attempts and password changes, with the browser description and time.</dd>
		<dt>Finger map</dt>
		<dd>The finger map entries described in section 2, synchronised to your account while you are signed in.</dd>
	</dl>
	<p>
		The legal basis for processing this data is the performance of our agreement with you, namely providing the account
		and its features. Security records are processed on the basis of our legitimate interest in protecting accounts
		against unauthorised access.
	</p>

	<h2>4. Public profiles</h2>
	<p>
		Your profile is private by default. If you choose to make it public, your profile picture, display name, username, biography,
		experience, goal, target speed, keyboard type, membership date and a summary of your finger map become visible at
		your profile address. Your email address is never displayed. Public profiles are excluded from search engines.
	</p>

	<h2>5. Bot protection and server logs</h2>
	<p>
		To protect the sign-up, sign-in and password reset forms against automated abuse, sqwer uses a self-hosted
		proof-of-work check that runs in your browser. It does not contact any third party and does not use cookies.
	</p>
	<p>
		Our server processes your IP address in order to deliver the website and to limit repeated requests. IP addresses
		used for rate limiting are held in memory for no longer than one hour. Security logs written by the server record IP
		addresses only in the form of a keyed hash.
	</p>

	<h2>6. What we do not do</h2>
	<ul>
		<li>We do not use advertising, analytics or tracking technologies.</li>
		<li>We do not sell, rent or share personal data for marketing purposes.</li>
		<li>We do not load scripts, fonts or other resources from third parties.</li>
		<li>We do not send email. Password recovery is provided through recovery codes.</li>
	</ul>

	<h2>7. Cookies</h2>
	<p>
		sqwer uses a single strictly necessary cookie to keep you signed in. Details are set out in the
		<a href="/cookies">Cookie Policy</a>.
	</p>

	<h2>8. Retention</h2>
	<ul>
		<li>Account, profile and finger map data are retained until you delete your account.</li>
		<li>Sessions expire after at most 30 days without use, and expired sessions are deleted.</li>
		<li>Security activity records are retained while your account exists.</li>
		<li>When you delete your account, all associated data is deleted immediately from the live database.</li>
	</ul>

	<h2>9. Security</h2>
	<p>
		Passwords and recovery codes are stored only as one-way hashes. Session cookies are protected against access by
		scripts and are transmitted only over encrypted connections in production. Sign-in attempts are limited, and an
		account is temporarily locked after repeated failed attempts.
	</p>

	<h2>10. Your rights</h2>
	<p>Depending on the law that applies to you, you may have the right to:</p>
	<ul>
		<li>access the personal data held about you, which you can download at any time from <strong>Account → Your data</strong>;</li>
		<li>correct inaccurate data, which you can do from <strong>Account → Profile</strong>;</li>
		<li>delete your data, which you can do from <strong>Account → Your data</strong>;</li>
		<li>receive your data in a portable format;</li>
		<li>object to or restrict certain processing; and</li>
		<li>lodge a complaint with your local data protection authority.</li>
	</ul>
	<p>
		To exercise a right that is not available through your account settings, contact
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We respond to such requests within one month.
	</p>

	<h2>11. Children</h2>
	<p>
		Accounts are available only to persons aged 16 or older. sqwer does not knowingly process the personal data of
		children under 16 for account purposes. The typing test and the finger map can be used without an account.
	</p>

	<h2>12. Changes to this policy</h2>
	<p>
		If this policy changes, the revised version will be published on this page with an updated date. Significant changes
		will be indicated on the website.
	</p>
</Prose>
