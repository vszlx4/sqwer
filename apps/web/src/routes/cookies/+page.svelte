<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';

	const doc = LEGAL_DOCUMENTS.cookies;

	interface Item {
		name: string;
		purpose: string;
		lasts: string;
		sent: string;
	}

	const LOCAL: Item[] = [
		{ name: 'sqwer:theme', purpose: 'Your color theme, applied before the page appears so that it does not flash.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:settings', purpose: 'Your typing test and keyboard preferences.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:level', purpose: 'How you described your typing in Getting started.', lasts: 'Until you remove it', sent: 'Copied to your account when you sign in' },
		{ name: 'sqwer:start', purpose: 'The course lesson you chose to start from.', lasts: 'Until you remove it', sent: 'Copied to your account when you sign in' },
		{ name: 'sqwer:pending-lesson', purpose: 'Your result in the first lesson when taken without an account, so that it can be saved if you create one.', lasts: 'Until you create an account or remove it', sent: 'When you create an account' },
		{ name: 'sqwer:sound', purpose: 'Whether sound is on in the Echo game.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:endless', purpose: 'For each endless game: your best run, the level adaptive difficulty reached and the difficulty you chose last.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:resets', purpose: 'When this browser last discarded its copy of data you cleared from your account, so that it is not uploaded again.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:pace', purpose: 'The adaptive pace of the Courses, which makes games and drills gentler or brisker according to how your exercises go.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:analytics-consent', purpose: 'Your answer to the analytics question (allow or refuse) and when you gave it, so that you are not asked again. It contains no identifier.', lasts: 'Until you remove it, or until what analytics collects changes and you are asked again', sent: 'Never' },
		{ name: 'sqwer:device', purpose: 'A random identifier for this browser, created only while you are signed in, so that its usage statistics are kept separate from your other devices.', lasts: 'Until you remove it', sent: 'With your usage statistics, while signed in' }
	];

	/** Set only after the visitor selects Allow in the analytics banner; removed on withdrawal. */
	const ANALYTICS: (Item & { store: string })[] = [
		{
			name: 'sqwer:analytics-id',
			store: 'Local storage',
			purpose: 'A random visitor identifier, so that repeat visits from this browser are counted as one visitor. It is not derived from your device or any information about you.',
			lasts: 'Until you withdraw consent or remove it',
			sent: 'With each analytics event'
		},
		{
			name: 'sqwer:analytics-session',
			store: 'Session storage',
			purpose: 'A random visit identifier and the time of your last activity, so that pages opened during one visit are grouped together. A new identifier is created after 30 minutes without activity.',
			lasts: 'Until the browser tab is closed, or you withdraw consent',
			sent: 'With each analytics event'
		}
	];

	const INDEXED: Item[] = [
		{ name: 'results', purpose: 'Your examination results, including replays.', lasts: 'Until you remove it', sent: 'Synchronized to your account while signed in' },
		{ name: 'finger-observations', purpose: 'Your finger map entries.', lasts: 'Until you remove it', sent: 'Synchronized to your account while signed in' },
		{ name: 'usage', purpose: 'Your usage statistics, recorded only while you are signed in.', lasts: 'Until you remove it', sent: 'Synchronized to your account while signed in' }
	];

	const toc = [
		{ id: 'about', label: 'About this policy' },
		{ id: 'law', label: 'Legal framework' },
		{ id: 'cookie', label: 'The cookie sqwer sets' },
		{ id: 'storage', label: 'Browser storage' },
		{ id: 'analytics', label: 'Analytics, only with consent' },
		{ id: 'other', label: 'Other device features' },
		{ id: 'not-used', label: 'What sqwer does not use' },
		{ id: 'manage', label: 'Managing and removing' },
		{ id: 'changes', label: 'Changes and contact' }
	];
</script>

<Seo title={doc.title} description="The single cookie and the browser storage sqwer uses, what each item is for, how long it lasts and how to remove it." />

<Prose
	kicker="Legal"
	title={doc.title}
	lede="sqwer uses one strictly necessary cookie and browser storage for features you use. Two analytics identifiers are stored only if you allow analytics in the banner shown on your first visit. Nothing is used for advertising or cross-site tracking, and nothing is set by third parties."
	crumbs={[{ href: '/legal', label: 'Legal center' }, { href: doc.href, label: doc.title }]}
	{doc}
	{toc}
>
	<h2 id="about">1. About this policy</h2>
	<p>
		1.1. This policy lists every cookie and every item of browser storage that sqwer uses, its purpose, its lifetime and
		whether its contents are sent to sqwer. It supplements the <a href="/privacy">Privacy Policy</a>.
	</p>
	<p>
		1.2. A <strong>cookie</strong> is a small text file a website asks your browser to keep and send back with each
		request. <strong>Browser storage</strong> (local storage and IndexedDB) lets a website keep information in your
		browser that is not sent automatically with requests.
	</p>

	<h2 id="law">2. Legal framework</h2>
	<p>
		2.1. Under Article 5(3) of the ePrivacy Directive 2002/58/EC, as implemented in the EU Member States, and regulation
		6 of the UK Privacy and Electronic Communications Regulations 2003, storing or accessing information on your device
		requires your consent, unless it is <strong>strictly necessary</strong> to provide a service you have explicitly
		requested.
	</p>
	<p>
		2.2. Every item in sections 3 and 4 falls within that exemption: each is required for a feature you choose to use,
		such as staying signed in, keeping your settings, saving practice data without an account, or remembering your
		answer to the analytics question. None is used for any other purpose, so consent is not required for them.
	</p>
	<p>
		2.3. The analytics identifiers in section 5 are not strictly necessary. They are stored only after you give consent
		by selecting <strong>Allow</strong> in the analytics banner, which offers <strong>No, thanks</strong> with equal
		prominence. Nothing is stored before you choose, and closing or ignoring the banner is not taken as consent. You can
		withdraw consent at any time under <strong>Analytics preferences</strong> at the foot of every page, which deletes
		both identifiers at once. A Global Privacy Control or Do Not Track signal from your browser is treated as a refusal.
	</p>

	<h2 id="cookie">3. The cookie sqwer sets</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Duration</th><th scope="col">Attributes</th></tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row"><code>__Host-sqwer_session</code></th>
					<td>Keeps you signed in. Set only when you sign in or create an account. It contains a random token; the server stores only a hash of it.</td>
					<td>30 days, renewed while you use sqwer, and at most 90 days after you sign in; removed when you sign out</td>
					<td><code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code>, <code>__Host-</code> prefix, first-party only</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		3.1. <code>HttpOnly</code> means scripts cannot read the cookie; <code>Secure</code> means it is sent only over
		encrypted connections; <code>SameSite=Lax</code> means other websites cannot use it to make requests on your behalf; the
		<code>__Host-</code> prefix means browsers accept it only from sqwer's own address over an encrypted connection, so no
		other site or subdomain can set or replace it.
		If you never sign in, sqwer sets no cookie at all.
	</p>

	<h2 id="storage">4. Browser storage</h2>
	<p>
		4.1. sqwer keeps the following items in your browser so that features work without an account and between visits.
		Each is set by sqwer itself and never shared with anyone else.
	</p>
	<h3>Local storage</h3>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Duration</th><th scope="col">Sent to sqwer</th></tr>
			</thead>
			<tbody>
				{#each LOCAL as item (item.name)}
					<tr><th scope="row"><code>{item.name}</code></th><td>{item.purpose}</td><td>{item.lasts}</td><td>{item.sent}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<h3>IndexedDB (database <code>sqwer</code>)</h3>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Duration</th><th scope="col">Sent to sqwer</th></tr>
			</thead>
			<tbody>
				{#each INDEXED as item (item.name)}
					<tr><th scope="row"><code>{item.name}</code></th><td>{item.purpose}</td><td>{item.lasts}</td><td>{item.sent}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2 id="analytics">5. Analytics, only with consent</h2>
	<p>
		5.1. If you allow analytics, sqwer stores the following items, which its own analytics uses to count visitors and
		visits. They are read only by sqwer and sent only to sqwer. What is collected, why and for how long is described in
		paragraph 4.4 of the <a href="/privacy#analytics">Privacy Policy</a>.
	</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Where</th><th scope="col">Purpose</th><th scope="col">Duration</th><th scope="col">Sent to sqwer</th></tr>
			</thead>
			<tbody>
				{#each ANALYTICS as item (item.name)}
					<tr><th scope="row"><code>{item.name}</code></th><td>{item.store}</td><td>{item.purpose}</td><td>{item.lasts}</td><td>{item.sent}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p>
		5.2. Analytics events are sent to <code>/api/analytics</code> on sqwer’s own server, which records them as described
		in the Privacy Policy. No analytics cookie is set, and no third-party analytics service is used.
	</p>

	<h2 id="other">6. Other device features</h2>
	<ul>
		<li><strong>Speech:</strong> the listening exercises use a voice built into your device. Only voices that run on your device are used; the words are not sent anywhere.</li>
		<li><strong>Sound:</strong> the Echo game plays soft notes generated in your browser, and can be muted. No audio is recorded.</li>
		<li><strong>Verification:</strong> sqwer’s own check on account forms performs a computation in your browser and stores nothing on your device. Where Cloudflare Turnstile is enabled, its check runs in a frame from challenges.cloudflare.com, under Cloudflare’s Turnstile privacy terms; Cloudflare states that the data is used only to tell people from bots and not for advertising.</li>
	</ul>

	<h2 id="not-used">7. What sqwer does not use</h2>
	<ul>
		<li>No advertising, social media or tracking cookies, pixels or fingerprinting, and no analytics cookies of any kind.</li>
		<li>No third-party analytics, scripts, fonts, embeds or content delivery networks: everything is served by sqwer itself, except Cloudflare’s verification frame where Turnstile is enabled (section 6).</li>
		<li>No cross-site tracking. Global Privacy Control and Do Not Track signals are honored as a refusal of analytics.</li>
	</ul>

	<h2 id="manage">8. Managing and removing</h2>
	<p>
		8.1. You can remove the cookie and all stored items at any time by clearing the site data for sqwer in your browser:
	</p>
	<ul>
		<li><strong>Chrome and Edge:</strong> Settings → Privacy and security → Site settings (or Cookies and site permissions) → View data stored on sites.</li>
		<li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data → Manage Data.</li>
		<li><strong>Safari:</strong> Settings → Privacy → Manage Website Data.</li>
	</ul>
	<p>
		8.2. Removing the cookie signs you out. Removing browser storage deletes your settings and any practice data that is
		not saved to an account; data saved to your account is not affected and returns when you sign in again. You can also
		block cookies entirely, in which case you can still use sqwer without an account.
	</p>

	<h2 id="changes">9. Changes and contact</h2>
	<p>
		9.1. This policy is updated before any change to the cookies or storage sqwer uses takes effect. Questions:
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>
</Prose>
