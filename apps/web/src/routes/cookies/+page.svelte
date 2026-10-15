<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

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
		{ name: 'sqwer:pending-lesson', purpose: 'Your result in the first lesson when taken without an account, so it can be saved if you create one.', lasts: 'Until you create an account or remove it', sent: 'When you create an account' },
		{ name: 'sqwer:sound', purpose: 'Whether sound is on in the rhythm game.', lasts: 'Until you remove it', sent: 'Never' },
		{ name: 'sqwer:device', purpose: 'A random identifier for this browser, created only when you are signed in, to keep its usage statistics separate from your other devices.', lasts: 'Until you remove it', sent: 'With your usage statistics, while signed in' }
	];

	const INDEXED: Item[] = [
		{ name: 'results', purpose: 'Your examination results, including replays.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' },
		{ name: 'finger-observations', purpose: 'Your finger map entries.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' },
		{ name: 'usage', purpose: 'Your usage statistics, recorded only while you are signed in.', lasts: 'Until you remove it', sent: 'Synchronised to your account while signed in' }
	];
</script>

<Seo title="Cookie Policy" description="The one cookie and the browser storage sqwer uses, what each is for and how to remove them." />

<Prose
	kicker="Legal"
	title="Cookie Policy"
	lede="sqwer uses one strictly necessary cookie, and browser storage only for features you use. Nothing is used for advertising, analytics or tracking, and nothing is set by third parties. This is why sqwer does not show a cookie consent banner."
	updated={LEGAL.updated}
	crumbs={[{ href: '/cookies', label: 'Cookie Policy' }]}
>
	<h2>1. Cookies</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th></tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row"><code>sqwer_session</code></th>
					<td>Keeps you signed in. Set only when you sign in. It cannot be read by scripts and is sent only to sqwer, over encrypted connections.</td>
					<td>Until you sign out, or 30 days without use</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>
		This cookie is strictly necessary to provide the account you ask for, so the law does not require your consent for
		it. If you never sign in, sqwer sets no cookie at all.
	</p>

	<h2>2. Browser storage</h2>
	<p>
		sqwer also keeps information in your browser’s storage so that features work without an account and between visits.
		Each item is needed for a feature you use, set by sqwer itself, and never shared with anyone else.
	</p>
	<h3>Local storage</h3>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th><th scope="col">Sent to sqwer</th></tr>
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
				<tr><th scope="col">Name</th><th scope="col">Purpose</th><th scope="col">Lasts</th><th scope="col">Sent to sqwer</th></tr>
			</thead>
			<tbody>
				{#each INDEXED as item (item.name)}
					<tr><th scope="row"><code>{item.name}</code></th><td>{item.purpose}</td><td>{item.lasts}</td><td>{item.sent}</td></tr>
				{/each}
			</tbody>
		</table>
	</div>

	<h2>3. What sqwer does not use</h2>
	<ul>
		<li>No advertising, analytics or tracking cookies, pixels or fingerprinting.</li>
		<li>No third-party scripts, fonts or embeds: everything is served by sqwer itself.</li>
		<li>The bot protection on account forms runs in your browser on our own server and sets no cookies.</li>
	</ul>

	<h2>4. Removing cookies and storage</h2>
	<p>
		You can remove the cookie and all stored items at any time in your browser’s settings, usually under “Privacy” or
		“Site data”, by clearing the data for this website. Removing the cookie signs you out. Removing browser storage
		deletes your settings and any practice data that is not saved to an account; data saved to your account is not
		affected and returns when you sign in again.
	</p>

	<h2>5. Changes and contact</h2>
	<p>
		If we change the cookies or storage we use, this page is updated first. If we ever wanted to use something that is not
		strictly necessary, we would ask for your consent before setting it. Questions:
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>
</Prose>
