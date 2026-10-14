<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
</script>

<Seo title="Cookie Policy" description="The cookies and browser storage used by sqwer." />

<Prose
	kicker="Legal"
	title="Cookie Policy"
	lede="sqwer uses one strictly necessary cookie and no advertising, analytics or tracking cookies. For this reason, no cookie consent banner is shown."
	updated="14 October 2026"
	crumbs={[{ href: '/cookies', label: 'Cookie Policy' }]}
>
	<h2>Cookies</h2>
	<dl>
		<dt>sqwer_session</dt>
		<dd>
			Keeps you signed in after you sign in. Strictly necessary. Set only when you sign in; expires after at most 30 days
			without use, or when you sign out. Not accessible to scripts and sent only to sqwer.
		</dd>
	</dl>
	<p>
		Strictly necessary cookies do not require consent because the account feature cannot function without them. If you
		do not sign in, no cookie is set.
	</p>

	<h2>Browser storage</h2>
	<p>sqwer also stores the following in your browser. This information is not sent to our servers unless stated otherwise.</p>
	<dl>
		<dt>sqwer:settings</dt>
		<dd>Your test and keyboard preferences (local storage).</dd>
		<dt>sqwer:theme</dt>
		<dd>Your chosen colour theme, applied before the page is displayed (local storage).</dd>
		<dt>finger-observations</dt>
		<dd>Your finger map entries (IndexedDB). When you are signed in, they are also synchronised to your account.</dd>
		<dt>results</dt>
		<dd>Your test and assessment results (IndexedDB). Synchronised to your account when you are signed in.</dd>
		<dt>usage</dt>
		<dd>Usage statistics for this browser (IndexedDB). Synchronised to your account when you are signed in.</dd>
		<dt>sqwer:device</dt>
		<dd>A random identifier for this browser, used only to keep its usage statistics separate from those of your other devices (local storage).</dd>
	</dl>

	<h2>Bot protection</h2>
	<p>The verification on the account forms runs in your browser and does not set cookies or contact third parties.</p>

	<h2>Managing cookies and storage</h2>
	<p>
		You can remove cookies and stored data at any time through your browser settings. Removing the session cookie signs
		you out. Removing browser storage deletes your settings and any finger map that is not saved to an account.
	</p>

	<h2>Contact</h2>
	<p>Questions regarding this policy may be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
</Prose>
