<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { LEGAL_DOCUMENTS } from '#lib/site/legal.ts';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';

	const doc = LEGAL_DOCUMENTS.accessibility;
	const feedback = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Accessibility')}`;

	const toc = [
		{ id: 'commitment', label: 'Our commitment' },
		{ id: 'standard', label: 'Standard applied' },
		{ id: 'status', label: 'Conformance status' },
		{ id: 'features', label: 'Accessibility features' },
		{ id: 'limitations', label: 'Known limitations' },
		{ id: 'technology', label: 'Technical specifications' },
		{ id: 'assessment', label: 'Assessment approach' },
		{ id: 'feedback', label: 'Feedback and requests' }
	];
</script>

<Seo title={doc.title} description="The accessibility standard sqwer aims to meet, the features it provides, known limitations and how to ask for help." />

<Prose
	kicker="Legal"
	title={doc.title}
	lede="sqwer is meant to help everyone learn to type. This statement describes the accessibility standard we work to, the features available, the limitations we know of, and how to tell us about a barrier."
	crumbs={[{ href: '/legal', label: 'Legal centre' }, { href: doc.href, label: doc.title }]}
	{doc}
	{toc}
>
	<h2 id="commitment">1. Our commitment</h2>
	<p>
		1.1. We aim to make sqwer usable by as many people as possible, including people who use a keyboard only, screen
		readers, screen magnification, high contrast or reduced motion, and people with cognitive or learning differences.
		Accessibility is considered when every feature is designed and is tested before release.
	</p>

	<h2 id="standard">2. Standard applied</h2>
	<p>
		2.1. sqwer aims to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA</strong>,
		published by the World Wide Web Consortium. An earlier version of these guidelines, WCAG 2.0, is also published as
		the international standard ISO/IEC 40500. The requirements of WCAG are incorporated in the European standard EN 301
		549 for the accessibility of information and communication technology.
	</p>

	<h2 id="status">3. Conformance status</h2>
	<p>
		3.1. sqwer is <strong>partially conformant</strong> with WCAG 2.2 Level AA: most of the content conforms, but the
		exceptions listed in section 5 apply. Those exceptions arise mainly where timing or quick reactions are the essential
		purpose of an exercise.
	</p>

	<h2 id="features">4. Accessibility features</h2>
	<ul>
		<li><strong>Keyboard:</strong> every page and exercise can be used with a keyboard alone, with a visible focus indicator and a “Skip to content” link.</li>
		<li><strong>Screen readers:</strong> pages use semantic headings, landmarks and labels; illustrations that convey information have text alternatives, and decorative ones are hidden from assistive technology.</li>
		<li><strong>Colour and contrast:</strong> text meets the contrast ratios of Level AA in both light and dark themes; the finger colours are always accompanied by finger names or labels, so colour is never the only means of conveying information.</li>
		<li><strong>Motion:</strong> animations are reduced or removed when your device asks for reduced motion.</li>
		<li><strong>Sound:</strong> sound effects can be switched off. Listening exercises show the word instead when no voice is available on your device.</li>
		<li><strong>Text size:</strong> pages can be zoomed to 200% and reflow at narrow widths without loss of content.</li>
		<li><strong>Forms:</strong> every field has a visible label; required fields are marked with an asterisk (*) and announced as required; errors are described in text next to the field. Account forms have no time limit.</li>
		<li><strong>Verification:</strong> the check on account forms offers a text question as an alternative to the image of characters, so it can be completed without sight.</li>
		<li><strong>Consistency:</strong> navigation and help appear in the same place on every page.</li>
	</ul>

	<h2 id="limitations">5. Known limitations</h2>
	<div class="table-wrap">
		<table>
			<thead>
				<tr><th scope="col">Area</th><th scope="col">Limitation</th><th scope="col">Alternative</th></tr>
			</thead>
			<tbody>
				<tr>
					<th scope="row">Timed examinations</th>
					<td>Typing tests measure speed within a fixed time, so the time limit cannot be extended (WCAG 2.2.1, essential exception).</td>
					<td>Word-count tests have no time limit; lessons are not timed.</td>
				</tr>
				<tr>
					<th scope="row">Falling letters game</th>
					<td>Requires typing letters before they reach the bottom of the screen, which depends on reaction time and sight.</td>
					<td>After an unsuccessful attempt, a game can be left out with “Continue without this game”. Skipped games do not affect stars, and every lesson also contains untimed typing drills.</td>
				</tr>
				<tr>
					<th scope="row">Rhythm game</th>
					<td>Keys must be pressed in time with a visual and audio beat.</td>
					<td>The beat is both visible and audible, and the game can be left out in the same way.</td>
				</tr>
				<tr>
					<th scope="row">Hand illustrations</th>
					<td>The finger map and assessment use illustrations whose detail may be hard to perceive with magnification.</td>
					<td>The same information is provided as a list of fingers with their values.</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p>5.1. If any of these limitations affects you, please tell us; we will look for an alternative.</p>

	<h2 id="technology">6. Technical specifications</h2>
	<p>
		6.1. sqwer relies on HTML, CSS, JavaScript, SVG and WAI-ARIA, and works with current versions of Chrome, Edge,
		Firefox and Safari, together with the assistive technologies they support, such as VoiceOver, NVDA and JAWS.
	</p>

	<h2 id="assessment">7. Assessment approach</h2>
	<p>
		7.1. Accessibility is assessed by the operator through self-evaluation: automated audits with axe-core against the
		WCAG 2.0, 2.1 and 2.2 Level A and AA rules on every main page, in both themes, run with each release; and manual
		testing of keyboard operation, focus order, zoom and screen reader output. No independent audit has yet been carried
		out.
	</p>

	<h2 id="feedback">8. Feedback and requests</h2>
	<p>
		8.1. If you encounter a barrier, need information in another format, or have a suggestion, write to
		<a href={feedback}>{CONTACT_EMAIL}</a> with the subject “Accessibility”. Please describe the page, the problem and the
		browser and assistive technology you use. We aim to respond within <strong>five working days</strong> and to propose
		a solution or an alternative within <strong>30 days</strong>.
	</p>
	<p>
		8.2. If you are not satisfied with our response, you may contact the authority responsible for accessibility or
		equality in your country.
	</p>
</Prose>
