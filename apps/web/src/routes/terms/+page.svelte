<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';
</script>

<Seo title="Terms and Conditions" description="The terms and conditions that govern the use of sqwer." />

<Prose
	kicker="Legal"
	title="Terms and Conditions"
	lede="These terms govern your use of sqwer. By using the website or creating an account, you agree to them."
	updated="14 October 2026"
	crumbs={[{ href: '/terms', label: 'Terms and Conditions' }]}
>
	<h2>1. The service</h2>
	<p>
		sqwer provides a typing test, a finger-mapping tool and optional user accounts. The service is provided free of
		charge for personal practice, teaching and learning.
	</p>

	<h2>2. Accounts</h2>
	<ul>
		<li>You must be at least 16 years old to create an account.</li>
		<li>You must provide an email address that you are entitled to use.</li>
		<li>You are responsible for keeping your password and recovery codes confidential.</li>
		<li>You are responsible for all activity that takes place under your account.</li>
		<li>
			sqwer does not send email. If you lose both your password and all of your recovery codes, access to the account
			cannot be restored.
		</li>
	</ul>

	<h2>3. Profile content</h2>
	<p>
		You are responsible for the display name, username and biography that you provide. They must not be unlawful,
		offensive, misleading or infringe the rights of others, and they must not impersonate any person or organisation.
		We may remove profile content or rename a username that breaches these terms.
	</p>

	<h2>4. Acceptable use</h2>
	<p>You agree not to:</p>
	<ul>
		<li>attempt to disrupt, overload or impair the service or the infrastructure on which it runs;</li>
		<li>attempt to gain unauthorised access to accounts, systems or data;</li>
		<li>create accounts by automated means or circumvent the bot protection;</li>
		<li>copy or republish the website, its design or its artwork as your own; or</li>
		<li>use the service for any unlawful purpose.</li>
	</ul>

	<h2>5. Suspension and termination</h2>
	<p>
		You may delete your account at any time from your account settings. We may suspend or delete an account that
		breaches these terms. Where reasonable, we will inform you of the reason.
	</p>

	<h2>6. Intellectual property</h2>
	<p>
		The sqwer name, logo, design, illustrations, word lists and text are the property of sqwer. Fonts are used under
		licence from their foundry. Your finger map and profile data remain yours.
	</p>

	<h2>7. Disclaimer</h2>
	<p>
		The service is provided “as is” and “as available”. We aim to keep it accurate and available but do not guarantee
		that it will be uninterrupted or free of errors. Guidance on typing technique is general information and does not
		constitute medical advice. If typing causes you pain or discomfort, stop and consult a qualified professional.
	</p>

	<h2>8. Limitation of liability</h2>
	<p>
		To the extent permitted by law, sqwer is not liable for indirect or consequential loss arising from the use of the
		service, including the loss of data stored in your browser. Nothing in these terms limits liability that cannot be
		limited by law.
	</p>

	<h2>9. Changes to these terms</h2>
	<p>
		We may update these terms. The revised version will be published on this page with an updated date. Continued use of
		the service after a change constitutes acceptance of the revised terms.
	</p>

	<h2>10. Contact</h2>
	<p>Questions regarding these terms may be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
</Prose>
