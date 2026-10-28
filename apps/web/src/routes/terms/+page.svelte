<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL, LEGAL } from '#lib/site/links.ts';

	const doc = LEGAL_DOCUMENTS.terms;
	const mail = `mailto:${CONTACT_EMAIL}`;

	const toc = [
		{ id: 'introduction', label: 'Introduction and acceptance' },
		{ id: 'definitions', label: 'Definitions and interpretation' },
		{ id: 'operator', label: 'The operator' },
		{ id: 'service', label: 'The Service' },
		{ id: 'eligibility', label: 'Eligibility' },
		{ id: 'accounts', label: 'Accounts and credentials' },
		{ id: 'progress', label: 'Courses, results and ranks' },
		{ id: 'content', label: 'Your Content' },
		{ id: 'use', label: 'Acceptable use' },
		{ id: 'verification', label: 'Verification and security measures' },
		{ id: 'ip', label: 'Intellectual property' },
		{ id: 'privacy', label: 'Privacy and data protection' },
		{ id: 'health', label: 'Health, safety and accessibility' },
		{ id: 'availability', label: 'Availability and changes to the Service' },
		{ id: 'warranties', label: 'Disclaimer of warranties' },
		{ id: 'liability', label: 'Limitation of liability' },
		{ id: 'termination', label: 'Suspension and termination' },
		{ id: 'changes', label: 'Changes to these Terms' },
		{ id: 'notices', label: 'Notices and communications' },
		{ id: 'law', label: 'Governing law and disputes' },
		{ id: 'general', label: 'General provisions' }
	];
</script>

<Seo title={doc.title} description="The terms that govern the use of sqwer, its courses, examinations and accounts." />

<Prose
	kicker="Legal"
	title={doc.title}
	lede="These Terms and Conditions form a binding agreement between you and the operator of sqwer. They set out your rights and obligations when you use the website, with or without an account. Please read them carefully."
	crumbs={[{ href: '/legal', label: 'Legal center' }, { href: doc.href, label: doc.title }]}
	{doc}
	{toc}
>
	<section class="summary" aria-labelledby="summary-title">
		<h2 id="summary-title">Summary</h2>
		<p>This summary is for convenience. It does not replace the full Terms below.</p>
		<ul>
			<li>sqwer is a free, non-commercial typing education service run by an individual. Nothing is sold and no payment details are ever requested.</li>
			<li>Accounts are for people aged 16 or older. You are responsible for keeping your password and recovery codes safe.</li>
			<li>You keep ownership of everything you provide. You must have the right to any picture you upload.</li>
			<li>Use sqwer fairly: do not disrupt it, attack it, automate it, or copy its materials.</li>
			<li>You can download your data and delete your account at any time. The mandatory consumer protections of your country always apply.</li>
		</ul>
	</section>

	<h2 id="introduction">1. Introduction and acceptance</h2>
	<p>
		1.1. These Terms and Conditions (the “Terms”) govern your access to and use of the sqwer website and every feature
		offered through it (together, the “Service”).
	</p>
	<p>
		1.2. You accept these Terms when you create an account, by ticking the acceptance box on the registration form. The
		version you accepted and the time of acceptance are recorded with your account. If you use the Service without an
		account, these Terms apply to that use from the moment you begin using it.
	</p>
	<p>
		1.3. If you do not agree with these Terms, you must not create an account and should not use the Service.
	</p>
	<p>
		1.4. These Terms incorporate, by reference, the <a href="/privacy">Privacy Policy</a>, the
		<a href="/cookies">Cookie and Storage Policy</a>, the <a href="/copyright">Content and Copyright Policy</a> and the
		<a href="/security">Security and Vulnerability Disclosure Policy</a> (together, the “Policies”). In the event of a
		conflict between these Terms and a Policy on the processing of personal data, the Privacy Policy prevails.
	</p>

	<h2 id="definitions">2. Definitions and interpretation</h2>
	<p>2.1. In these Terms:</p>
	<dl>
		<dt>“Account”</dt>
		<dd>A registered user account on the Service, identified by an email address and protected by a password.</dd>
		<dt>“Course Materials”</dt>
		<dd>The lessons, exercises, games, word lists, instructions, explanations, illustrations and other learning materials made available through the Service.</dd>
		<dt>“Results”</dt>
		<dd>The measurements produced by your use of the Service, including speeds, accuracy, timelines, keystroke records, finger map entries and statistics.</dd>
		<dt>“Progress”</dt>
		<dd>Stars, points, ranks, streaks, completed lessons and similar indicators of your advancement in the Courses.</dd>
		<dt>“Your Content”</dt>
		<dd>Any material you provide to the Service, namely your display name, username, headline, pronouns, biography and profile picture.</dd>
		<dt>“we”, “us”, “our”</dt>
		<dd>The operator of sqwer identified in section 3.</dd>
		<dt>“you”, “your”</dt>
		<dd>The person using the Service, whether or not they hold an Account.</dd>
	</dl>
	<p>
		2.2. Headings are for convenience and do not affect interpretation. The words “including” and “for example” introduce
		examples and do not limit the general words that precede them. References to a law include that law as amended or
		replaced.
	</p>

	<h2 id="operator">3. The operator</h2>
	<p>
		3.1. The Service is operated by <strong>{LEGAL.operatorName}</strong>, a private individual resident in
		{LEGAL.operatorCountry}, as a personal, free and non-commercial educational project. The Service is not operated by a
		company and is not carried on as a business or trade.
	</p>
	<p>3.2. You may contact the operator at <a href={mail}>{CONTACT_EMAIL}</a>. Communications are handled in English or Arabic.</p>

	<h2 id="service">4. The Service</h2>
	<p>4.1. The Service is a platform for learning and practicing touch typing. It currently comprises:</p>
	<ul>
		<li><strong>Getting started:</strong> a short placement activity that suggests where to begin;</li>
		<li><strong>Courses:</strong> structured lessons, exercises and games with stars, points and ranks;</li>
		<li><strong>Examinations:</strong> typing tests and the finger speed assessment;</li>
		<li><strong>Finger map:</strong> a record of which finger you use for each key;</li>
		<li><strong>History:</strong> your previous Results, with replays; and</li>
		<li><strong>Accounts:</strong> optional registration that saves your data across devices, with an optional public profile.</li>
	</ul>
	<p>
		4.2. The Service is provided free of charge. No part of it is sold, no subscription is offered, no advertising is
		shown, and we will never ask you for payment details.
	</p>
	<p>
		4.3. The Examinations, the Finger map and the first Course lesson may be used without an Account. The remainder of
		the Courses requires an Account, because Progress is saved to it.
	</p>
	<p>
		4.4. The Service is intended for personal learning and for teaching. It is not a professional, academic or
		employment qualification, and Results are not a certified measurement of ability.
	</p>

	<h2 id="eligibility">5. Eligibility</h2>
	<p>
		5.1. You must be at least <strong>16 years old</strong> to create an Account, and you confirm this on the registration
		form. The confirmation and its time are recorded with your Account.
	</p>
	<p>
		5.2. If the law of your country requires a higher age to consent to the processing of personal data or to enter
		into this agreement without parental authorization, you may create an Account only once you have reached that age.
	</p>
	<p>
		5.3. If we learn that an Account belongs to a person who does not meet these requirements, we will delete it in
		accordance with the <a href="/privacy#children">Privacy Policy</a>.
	</p>

	<h2 id="accounts">6. Accounts and credentials</h2>
	<p>6.1. An Account is personal to one individual. You must not share it, transfer it, or create Accounts by automated means or on behalf of others.</p>
	<p>6.2. You must provide an email address that you are entitled to use. We do not verify the address by email, so you are responsible for its accuracy.</p>
	<p>
		6.3. You must keep your password and recovery codes confidential and must not reuse a password that you use
		elsewhere. You are responsible for activity carried out through your Account, except where it results from our
		breach of these Terms or of the law.
	</p>
	<p>
		6.4. The Service does not send email. Your recovery codes are the only means of resetting a forgotten password. If
		you lose your password and all of your recovery codes, access to the Account cannot be restored; you may, however,
		ask us to delete it.
	</p>
	<p>
		6.5. If you suspect unauthorized access to your Account, change your password immediately (which signs out every
		other device) and inform us at <a href={mail}>{CONTACT_EMAIL}</a>.
	</p>

	<h2 id="progress">7. Courses, results and ranks</h2>
	<p>7.1. Progress measures your own learning. It has no monetary value, cannot be exchanged for money or anything else, and cannot be sold, transferred or inherited.</p>
	<p>7.2. Results depend on your keyboard, browser, device and environment. They are provided for practice and self-assessment only.</p>
	<p>
		7.3. We may improve the Course Materials and the way Progress is calculated. Where a lesson changes, we will
		endeavor to preserve your Progress, but stars, points or ranks may be recalculated so that the same rules apply to
		all learners.
	</p>
	<p>7.4. You must not obtain Results or Progress by automated input, scripts or any means other than your own typing.</p>
	<p>
		7.5. Examinations earn experience points (XP), which add up to an account level. The competitive test sets a speed
		tier and a place on the leaderboards. XP, levels, tiers and places have no monetary value and are not a
		qualification.
	</p>
	<p>
		7.6. Competitive results are checked automatically for plausibility, and we may exclude results, remove leaderboard
		entries or reset XP that we reasonably believe were obtained unfairly, for example with scripts, macros or another
		person typing. Where reasonable, we will tell you why, and you may ask for a review.
	</p>

	<h2 id="content">8. Your Content</h2>
	<p>8.1. You retain all ownership rights in Your Content.</p>
	<p>
		8.2. You grant us a worldwide, non-exclusive, royalty-free, non-transferable license to host, store, reproduce,
		resize and display Your Content, solely for the purpose of providing the Service to you and, where you choose to
		make your profile public, displaying it on your public profile. The license ends when you delete the relevant
		content or your Account, subject to the backup period stated in the Privacy Policy.
	</p>
	<p>8.3. By providing Your Content, you represent and warrant that:</p>
	<ol type="a">
		<li>you are its author, or you hold all rights, licenses and permissions necessary to provide it and to grant the license in clause 8.2;</li>
		<li>it does not infringe any copyright, trade mark, design right, right of privacy, right of publicity or other right of any person;</li>
		<li>where it depicts an identifiable person other than you, that person has consented to its use; and</li>
		<li>it complies with the <a href="/copyright">Content and Copyright Policy</a> and with clause 9.</li>
	</ol>
	<p>
		8.4. When you upload a profile picture, you confirm the warranties in clause 8.3 by ticking the confirmation box.
		The time of that confirmation is recorded.
	</p>
	<p>
		8.5. We do not review Your Content before it is published. We may remove or disable any of Your Content, or reset a
		username, that we reasonably believe breaches these Terms, the Content and Copyright Policy or the law, or that is the
		subject of a valid notice of infringement. Where reasonable, we will tell you what was removed and why, and you may
		respond under the counter-notice procedure in the Content and Copyright Policy.
	</p>

	<h2 id="use">9. Acceptable use</h2>
	<p>9.1. You must use the Service lawfully, fairly and only for its intended purpose. In particular, you must not:</p>
	<ol type="a">
		<li>upload or display material that is unlawful, defamatory, obscene, sexually explicit, violent, hateful, discriminatory, harassing or threatening;</li>
		<li>upload material that infringes the intellectual property, privacy or other rights of any person;</li>
		<li>impersonate any person or organization, or misrepresent your affiliation with them;</li>
		<li>choose a username or display name that is misleading, offensive, or that uses another person’s name or trade mark without permission;</li>
		<li>access, or attempt to access, any Account, system or data without authorization;</li>
		<li>probe, scan or test the vulnerability of the Service, except in accordance with the <a href="/security">Security and Vulnerability Disclosure Policy</a>;</li>
		<li>interfere with, overload or disrupt the Service or the infrastructure on which it runs, including by denial-of-service attacks;</li>
		<li>introduce malicious code, or use the Service to distribute it;</li>
		<li>use automated means, such as bots, scrapers or scripts, to access the Service, create Accounts, submit forms or collect content, except standard search engine indexing of public pages;</li>
		<li>copy, reproduce, republish, frame, sell or exploit the Service or the Course Materials, or present them as your own; or</li>
		<li>use the Service in any way that breaches the law applicable to you or to us.</li>
	</ol>

	<h2 id="verification">10. Verification and security measures</h2>
	<p>
		10.1. To protect Accounts and the Service, account forms use a verification check operated by sqwer itself, which
		combines a background proof-of-work computation with a challenge to be answered by a person. Requests are also
		subject to rate limits, and an Account is locked temporarily after repeated failed sign-in attempts.
	</p>
	<p>10.2. You must not circumvent, disable, solve by automated means or otherwise interfere with these measures.</p>

	<h2 id="ip">11. Intellectual property</h2>
	<p>
		11.1. The Service, including the sqwer name and logo, the website’s design, layout, illustrations, hand and keyboard
		artwork, software, Course Materials, word lists and text, is owned by the operator or used under license, and is
		protected by copyright, trade mark and other intellectual property laws.
	</p>
	<p>
		11.2. Subject to these Terms, we grant you a personal, revocable, non-exclusive, non-transferable license to use the
		Service for your own learning, and to use it to teach others, for example in a classroom. No other right is granted,
		and nothing in these Terms transfers ownership of any part of the Service to you.
	</p>
	<p>
		11.3. Typefaces are used under license from their foundries, and open-source software is used under its respective
		license. Those licenses take precedence over these Terms for the components they cover. Where the source code of
		sqwer is published under an open-source license, that license governs the code only; it does not extend to the sqwer
		name and logo, the typefaces, the illustrations or the Course Materials.
	</p>
	<p>
		11.4. If you send us suggestions or feedback, you permit us to use them to improve the Service without obligation to
		you. This does not affect your rights in Your Content.
	</p>
	<p>11.5. Your Results, Progress, finger map and Your Content remain yours, and you may download them at any time from <strong>Account → Your data</strong>.</p>

	<h2 id="privacy">12. Privacy and data protection</h2>
	<p>
		12.1. We process personal data as described in the <a href="/privacy">Privacy Policy</a>, in accordance with the
		data protection laws that apply to you, including where applicable the General Data Protection Regulation (EU)
		2016/679, the UK GDPR, the Personal Data Protection Law of the Kingdom of Saudi Arabia and the Lei Geral de Proteção
		de Dados of Brazil.
	</p>
	<p>12.2. The cookie and browser storage used by the Service are described in the <a href="/cookies">Cookie and Storage Policy</a>.</p>

	<h2 id="health">13. Health, safety and accessibility</h2>
	<p>
		13.1. The guidance in the Service on posture, finger placement and technique is general educational information. It
		is not medical advice and does not replace the advice of a qualified health professional.
	</p>
	<p>
		13.2. Take regular breaks. If typing causes pain, numbness, tingling or discomfort, stop and seek professional
		advice.
	</p>
	<p>
		13.3. Some games contain moving elements and sound. The Service respects your device’s reduced-motion setting, and
		sound can be switched off. Our commitments and known limitations are set out in the
		<a href="/accessibility">Accessibility Statement</a>.
	</p>

	<h2 id="availability">14. Availability and changes to the Service</h2>
	<p>
		14.1. We aim to keep the Service available and its content accurate, but, as a free service operated by an
		individual, we do not guarantee that it will be uninterrupted, timely or free from errors.
	</p>
	<p>14.2. We may modify, suspend or withdraw any feature, for example for maintenance, security or improvement.</p>
	<p>
		14.3. If we decide to discontinue the Service permanently, we will announce it on the website at least
		<strong>30 days</strong> in advance, so that you can download your data, and we will then delete account data in
		accordance with the Privacy Policy.
	</p>

	<h2 id="warranties">15. Disclaimer of warranties</h2>
	<p>
		15.1. The Service is provided free of charge, on an “as is” and “as available” basis. To the fullest extent permitted
		by the law that applies to you, we make no warranties or representations, express or implied, including as to
		fitness for a particular purpose, accuracy of Results or uninterrupted availability, beyond those expressly stated in
		these Terms.
	</p>
	<p>15.2. Nothing in this section limits any warranty or guarantee that cannot be excluded under the law of your country.</p>

	<h2 id="liability">16. Limitation of liability</h2>
	<p>16.1. Nothing in these Terms excludes or limits our liability for:</p>
	<ol type="a">
		<li>death or personal injury caused by our negligence;</li>
		<li>fraud or fraudulent misrepresentation;</li>
		<li>gross negligence or wilful misconduct; or</li>
		<li>any other liability that cannot be excluded or limited under applicable law.</li>
	</ol>
	<p>16.2. Subject to clause 16.1, and to the extent permitted by law, we are not liable for:</p>
	<ol type="a">
		<li>indirect, incidental, special or consequential loss;</li>
		<li>loss of data held only in your browser, which you can protect by creating an Account or downloading your data; or</li>
		<li>loss arising from your failure to keep your credentials confidential, or from events beyond our reasonable control.</li>
	</ol>
	<p>
		16.3. Because the Service is provided free of charge, and subject to clause 16.1, our total liability arising out of
		or in connection with these Terms is limited to the amount required by mandatory law.
	</p>

	<h2 id="termination">17. Suspension and termination</h2>
	<p>17.1. You may end this agreement at any time by deleting your Account from <strong>Account → Your data</strong>. Deletion is immediate and permanent.</p>
	<p>
		17.2. We may suspend or delete an Account, or restrict access to the Service, where you seriously or repeatedly
		breach these Terms, where your use creates a risk to the Service or to other people, or where the law requires it.
		Unless doing so would compromise security or an investigation, or is prohibited by law, we will notify you of the
		reason and give you an opportunity to respond and to download your data first.
	</p>
	<p>
		17.3. On termination, your right to use the Account ends, and your data is deleted in accordance with the Privacy
		Policy. Sections 8.3, 11, 15, 16, 20 and 21 survive termination to the extent relevant.
	</p>

	<h2 id="changes">18. Changes to these Terms</h2>
	<p>
		18.1. We may amend these Terms, for example to reflect new features or changes in the law. Each version carries a
		version number and effective date, shown at the top of this page, and previous versions are available on request.
	</p>
	<p>
		18.2. For material changes, we will publish a notice on the website at least <strong>30 days</strong> before they
		take effect, unless a shorter period is required by law or for security reasons. If you do not agree, you may delete
		your Account before the changes take effect. Your continued use of the Service after that date constitutes
		acceptance of the amended Terms.
	</p>

	<h2 id="notices">19. Notices and communications</h2>
	<p>19.1. Because the Service does not send email, notices to users are published on the website and, where relevant, shown in your Account.</p>
	<p>19.2. Notices to us must be sent to <a href={mail}>{CONTACT_EMAIL}</a>. Requests concerning your Account should be sent from the email address registered to it, so that we can confirm they come from you.</p>

	<h2 id="law">20. Governing law and disputes</h2>
	<p>20.1. These Terms are governed by the laws of {LEGAL.operatorCountry}.</p>
	<p>
		20.2. If a dispute arises, please contact us first. We will make a good-faith effort to resolve it amicably within
		30 days of receiving your written description of the matter.
	</p>
	<p>20.3. Disputes that cannot be resolved amicably fall within the jurisdiction of the competent courts of {LEGAL.operatorCountry}.</p>
	<p>
		20.4. If you are a consumer resident in another country, you retain the protection of the mandatory provisions of
		the law of your country of residence, and you may bring proceedings in the courts of that country where its law
		permits. Nothing in this section affects your right to complain to a data protection authority.
	</p>

	<h2 id="general">21. General provisions</h2>
	<ol type="a">
		<li><strong>Entire agreement.</strong> These Terms and the Policies constitute the entire agreement between you and us concerning the Service and supersede any prior understanding.</li>
		<li><strong>Severability.</strong> If any provision is held invalid or unenforceable, it shall be limited to the minimum extent necessary and the remaining provisions remain in full force.</li>
		<li><strong>No waiver.</strong> A failure or delay in exercising a right does not waive it.</li>
		<li><strong>Assignment.</strong> You may not transfer your rights under these Terms. We may transfer this agreement to a successor operator of the Service, who must honor these Terms and the Privacy Policy; we will give notice on the website in advance.</li>
		<li><strong>Events beyond control.</strong> Neither party is responsible for a failure caused by events beyond its reasonable control, including failures of infrastructure providers, networks or power supplies.</li>
		<li><strong>No third-party rights.</strong> No person other than you and us has any right to enforce these Terms.</li>
		<li><strong>Language.</strong> These Terms are written in English. If a translation is provided, the English version prevails, except where the law of your country requires otherwise.</li>
	</ol>
</Prose>
