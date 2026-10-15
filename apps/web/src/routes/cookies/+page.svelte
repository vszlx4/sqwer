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
		{ name: 'sqwer:theme', purpose: 'Your colour theme, applied before the page appears so that it does not flash.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:settings', purpose: 'Your typing test and keyboard preferences.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:level', purpose: 'How you described your typing in Getting started.', lasts: 'Until you remove it', sent: 'Copied to your account when you sign in' },
		{ name: 'sqwer:start', purpose: 'The course lesson you chose to start from.', lasts: 'Until you remove it', sent: 'Copied to your account when you sign in' },
		{ name: 'sqwer:pending-lesson', purpose: 'Your result in the first lesson when taken without an account, so that it can be saved if you create one.', lasts: 'Until you create an account or remove it', sent: 'When you create an account' },
		{ name: 'sqwer:sound', purpose: 'Whether sound is on in the rhythm game.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:device', purpose: 'A random identifier for this browser, created only while you are signed in, so that its usage statistics are kept separate from your other devices.', lasts: 'Until you remove it', sent: 'With your usage statistics, while signed in' }
	];

	const INDEXED: Item[] = [
		{ name: 'results', purpose: 'Your examination results, including replays.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' },
		{ name: 'finger-observations', purpose: 'Your finger map entries.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' },
		{ name: 'usage', purpose: 'Your usage statistics, recorded only while you are signed in.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' }
	];

	const toc = [
		{ id: 'about', label: 'About this policy' },
		{ id: 'law', label: 'Legal framework' },
		{ id: 'cookie', label: 'The cookie sqwer sets' },
		{ id: 'storage', label: 'Browser storage' },
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
	lede="sqwer uses one strictly necessary cookie, and browser storage only for features you use. Nothing is used for advertising, analytics or tracking, and nothing is set by third parties. For this reason, sqwer does not display a cookie consent banner."
	crumbs={[{ href: '/legal', label: 'Legal centre' }, { href: doc.href, label: doc.title }]}
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
		2.2. Every item in this policy falls within that exemption: each is required for a feature you choose to use, such
		as staying signed in, keeping your settings, or saving practice data without an account. None is used for any other
		purpose. Consent is therefore not required, and no consent banner is shown. If sqwer ever proposed to use anything
		that is not strictly necessary, it would ask for your consent before doing so, and you could withdraw it at any time.
	</p>

	<h2 id="cookie">3. The cookie sqwer sets</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Duration</th><th scope="col">Attributes</th></tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row"><code>sqwer_session</code></th>
					<td>Keeps you signed in. Set only when you sign in or create an account. It contains a random token; the server stores only a hash of it.</td>
					<td>30 days, renewed while you use sqwer; removed when you sign out</td>
					<td><code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code>, first-party only</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		3.1. <code>HttpOnly</code> means scripts cannot read the cookie; <code>Secure</code> means it is sent only over
		encrypted connections; <code>SameSite=Lax</code> means other websites cannot use it to make requests on your behalf.
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

	<h2 id="other">5. Other device features</h2>
	<ul>
		<li><strong>Speech:</strong> the listening exercises use a voice built into your device. Only voices that run on your device are used; the words are not sent anywhere.</li>
		<li><strong>Sound:</strong> the rhythm game plays sounds generated in your browser. No audio is recorded.</li>
		<li><strong>Verification:</strong> the check on account forms performs a computation in your browser and stores nothing on your device.</li>
	</ul>

	<h2 id="not-used">6. What sqwer does not use</h2>
	<ul>
		<li>No advertising, analytics, social media or tracking cookies, pixels, beacons or fingerprinting.</li>
		<li>No third-party scripts, fonts, embeds or content delivery networks: everything is served by sqwer itself.</li>
		<li>No cross-site tracking. Browser signals such as Global Privacy Control or Do Not Track are respected by default, because there is nothing to opt out of.</li>
	</ul>

	<h2 id="manage">7. Managing and removing</h2>
	<p>
		7.1. You can remove the cookie and all stored items at any time by clearing the site data for sqwer in your browser:
	</p>
	<ul>
		<li><strong>Chrome and Edge:</strong> Settings → Privacy and security → Site settings (or Cookies and site permissions) → View data stored on sites.</li>
		<li><strong>Firefox:</strong> Settings → Privacy &amp; Security → Cookies and Site Data → Manage Data.</li>
		<li><strong>Safari:</strong> Settings → Privacy → Manage Website Data.</li>
	</ul>
	<p>
		7.2. Removing the cookie signs you out. Removing browser storage deletes your settings and any practice data that is
		not saved to an account; data saved to your account is not affected and returns when you sign in again. You can also
		block cookies entirely, in which case you can still use sqwer without an account.
	</p>

	<h2 id="changes">8. Changes and contact</h2>
	<p>
		8.1. This policy is updated before any change to the cookies or storage sqwer uses takes effect. Questions:
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>
</Prose>
