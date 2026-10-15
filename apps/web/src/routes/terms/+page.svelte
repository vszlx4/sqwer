<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	const operator = LEGAL.operatorName
		? `${LEGAL.operatorName}${LEGAL.operatorAddress ? `, ${LEGAL.operatorAddress}` : ''}`
		: `its operator, based in ${LEGAL.operatorCountry}`;
</script>

<Seo title="Terms and Conditions" description="The terms that apply when you use sqwer, its courses, examinations and accounts." />

<Prose
	kicker="Legal"
	title="Terms and Conditions"
	lede="These terms are the agreement between you and sqwer. They apply when you use the website and when you create an account. Please read them; the short version is that sqwer is free, you keep your data, and you agree to use the service fairly."
	updated={LEGAL.updated}
	crumbs={[{ href: '/terms', label: 'Terms and Conditions' }]}
>
	<nav class="toc" aria-label="Contents">
		<ol>
			<li><a href="#who">Who we are</a></li>
			<li><a href="#service">The service</a></li>
			<li><a href="#accounts">Accounts</a></li>
			<li><a href="#progress">Courses, progress and ranks</a></li>
			<li><a href="#content">Your content</a></li>
			<li><a href="#use">Acceptable use</a></li>
			<li><a href="#ip">Intellectual property</a></li>
			<li><a href="#health">Health and comfort</a></li>
			<li><a href="#availability">Availability and changes</a></li>
			<li><a href="#liability">Warranties and liability</a></li>
			<li><a href="#ending">Suspension and ending the agreement</a></li>
			<li><a href="#law">Governing law and disputes</a></li>
			<li><a href="#general">General</a></li>
		</ol>
	</nav>

	<h2 id="who">1. Who we are</h2>
	<p>
		sqwer is operated by {operator} (“sqwer”, “we”, “us”). You can contact us at
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. How we handle personal data is explained in the
		<a href="/privacy">Privacy Policy</a>, and the cookie and browser storage we use in the <a href="/cookies">Cookie Policy</a>.
	</p>

	<h2 id="service">2. The service</h2>
	<p>
		sqwer is a place to learn and practise typing. It offers <strong>Getting started</strong>, the
		<strong>Courses</strong> (lessons, games, stars, points and ranks), the <strong>Examinations</strong> (typing tests and
		the finger speed assessment), the <strong>Finger map</strong>, <strong>History</strong> and optional accounts.
	</p>
	<ul>
		<li>sqwer is free of charge. Everything needed to learn and practise is, and will remain, free.</li>
		<li>The Examinations, the Finger map and the first course lesson can be used without an account. The rest of the Courses requires a free account, which saves your progress.</li>
		<li>If we ever offer optional paid extras, they will be described before purchase and governed by additional terms you accept at that time. They will not be required to learn.</li>
	</ul>

	<h2 id="accounts">3. Accounts</h2>
	<ul>
		<li>You must be at least 16 years old to create an account, and you confirm this when signing up.</li>
		<li>An account is for one person. Give an email address you are entitled to use; you may not create accounts by automated means.</li>
		<li>Keep your password and recovery codes confidential. You are responsible for activity under your account unless it results from our fault.</li>
		<li>sqwer does not send email. If you lose your password and all of your recovery codes, we cannot restore access to the account.</li>
		<li>Tell us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you believe your account has been accessed without your permission.</li>
	</ul>

	<h2 id="progress">4. Courses, progress and ranks</h2>
	<ul>
		<li>Stars, points, ranks and streaks measure your own progress. They have no monetary value, cannot be exchanged or transferred, and are not a qualification or certificate.</li>
		<li>Results depend on your keyboard, browser and device, and are provided for practice. They are not a formal assessment of your abilities.</li>
		<li>We may improve the Courses over time. If a lesson changes, we will try to keep your progress, but stars or points may be recalculated so that the same rules apply to everyone.</li>
	</ul>

	<h2 id="content">5. Your content</h2>
	<p>
		“Your content” means the display name, username, biography and profile picture you provide. You keep all rights in it.
		You give us a worldwide, non-exclusive, royalty-free licence to store and display it only to provide sqwer to you,
		and, if you make your profile public, to show it on your public profile. This licence ends when you delete the
		content or your account.
	</p>
	<p>
		Your content must not be unlawful, offensive, hateful, sexually explicit or misleading; must not infringe anyone’s
		rights; and must not impersonate a person or organisation. We may remove content or change a username that breaches
		these terms, and will tell you why where reasonable. To report content, write to
		<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
	</p>

	<h2 id="use">6. Acceptable use</h2>
	<p>When using sqwer, you agree not to:</p>
	<ul>
		<li>disrupt, overload or impair the service or the infrastructure it runs on;</li>
		<li>attempt to access accounts, systems or data without permission, or probe them for weaknesses without our written agreement;</li>
		<li>circumvent the bot protection or rate limits, or use automated means to create accounts or collect content;</li>
		<li>copy, republish or resell the website, its course content, design or artwork, or present them as your own; or</li>
		<li>use sqwer for any unlawful purpose.</li>
	</ul>
	<p>
		If you find a security issue, please report it responsibly to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
		and give us reasonable time to fix it before disclosing it.
	</p>

	<h2 id="ip">7. Intellectual property</h2>
	<p>
		The sqwer name and logo, the website’s design, illustrations, course lessons, games, word lists and text belong to us
		or our licensors and are protected by intellectual property law. Fonts are used under licence from their foundry. You
		may use sqwer for your own learning and teaching; nothing in these terms transfers ownership of any of it to you.
		Your results, progress, finger map and content remain yours, and you can download them at any time.
	</p>

	<h2 id="health">8. Health and comfort</h2>
	<p>
		The guidance in sqwer about posture, fingering and technique is general information, not medical advice. Take regular
		breaks. If typing causes pain, numbness or discomfort, stop and consult a qualified health professional.
	</p>

	<h2 id="availability">9. Availability and changes</h2>
	<p>
		We aim to keep sqwer available and accurate, but as a free service we cannot guarantee that it will always be
		available or free of errors. We may change, suspend or discontinue features. If we decide to close sqwer, we will
		announce it on the website at least 30 days in advance, so that you can download your data.
	</p>

	<h2 id="liability">10. Warranties and liability</h2>
	<p>
		sqwer is provided free of charge, “as is” and “as available”. To the extent the law allows, we make no promises about
		the service beyond those in these terms, and we are not liable for indirect or consequential loss, or for the loss of
		data stored only in your browser. Keep a copy of anything important by downloading your data.
	</p>
	<p>
		Nothing in these terms excludes or limits liability that cannot be excluded or limited by law, including liability
		for death or personal injury caused by negligence, for fraud, or for gross negligence or wilful misconduct. If you are
		a consumer, you keep all the rights that the mandatory consumer law of your country gives you, and nothing in these
		terms affects them.
	</p>

	<h2 id="ending">11. Suspension and ending the agreement</h2>
	<ul>
		<li>You may stop using sqwer and delete your account at any time from <strong>Account → Your data</strong>.</li>
		<li>We may suspend or delete an account that seriously or repeatedly breaches these terms, or where the law requires it. Where reasonable, we will warn you first and explain why.</li>
		<li>Sections 5 (licence ending), 7, 10, 12 and 13 continue to apply after the agreement ends, as far as relevant.</li>
	</ul>

	<h2 id="law">12. Governing law and disputes</h2>
	<p>
		These terms are governed by the laws of {LEGAL.operatorCountry}. If a dispute arises, please contact us first; most
		concerns can be resolved quickly by email. Disputes that cannot be resolved this way are subject to the courts of
		{LEGAL.operatorCountry}.
	</p>
	<p>
		If you are a consumer living elsewhere, you also benefit from the mandatory provisions of the law of your country of
		residence, and you may bring proceedings in the courts of that country where its law allows. Consumers in the
		European Union can also use the European Commission’s list of national bodies for out-of-court dispute resolution.
	</p>

	<h2 id="general">13. General</h2>
	<ul>
		<li><strong>Changes to these terms:</strong> we may update these terms, for example when we add features or the law changes. For significant changes, we will announce them on the website at least 30 days before they take effect. If you do not agree, you may delete your account before then; continuing to use sqwer afterwards means you accept the updated terms.</li>
		<li><strong>Whole agreement:</strong> these terms, together with the Privacy Policy and Cookie Policy, are the whole agreement between you and us about sqwer.</li>
		<li><strong>Severability:</strong> if a court finds part of these terms invalid, the rest remains in effect.</li>
		<li><strong>No waiver:</strong> if we do not enforce a right immediately, we may still enforce it later.</li>
		<li><strong>Transfer:</strong> we may transfer this agreement to another operator of sqwer, who must respect your rights under these terms and the Privacy Policy; we will tell you in advance.</li>
		<li><strong>Events beyond control:</strong> neither of us is responsible for failures caused by events beyond reasonable control, such as outages of infrastructure providers.</li>
		<li><strong>Language:</strong> these terms are written in English. If we provide a translation, the English version prevails, except where the law of your country requires otherwise.</li>
	</ul>
</Prose>
