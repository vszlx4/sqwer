<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';

	const FAQS = [
		{
			q: 'Is sqwer free to use?',
			a: 'Yes. The typing test, the finger map and accounts are free of charge.'
		},
		{
			q: 'Do I need an account?',
			a: 'No. The typing test and the finger map work without an account. An account saves your finger map on our server so that it is available on every device, and lets you build a typing profile.'
		},
		{
			q: 'How is words per minute calculated?',
			a: 'One word is counted as five characters, including spaces. WPM counts only correctly typed words; raw speed counts all typed characters, including errors.'
		},
		{
			q: 'Why does accuracy include errors that I corrected?',
			a: 'Accuracy measures how many keystrokes were correct when you made them. A corrected error still cost time, so it is counted.'
		},
		{
			q: 'What is a finger map?',
			a: 'A record of which finger you actually use for each key. You type short prompts and indicate the finger used after each keystroke. sqwer then shows where your technique differs from standard touch typing.'
		},
		{
			q: 'How long does finger mapping take?',
			a: 'Each of the 32 core keys needs three entries to be considered mapped. The time required depends on your pace; you can stop at any point and continue later.'
		},
		{
			q: 'Which keyboards are supported?',
			a: 'The QWERTY layout with ANSI key positions, in Mac and PC variants. You can switch between them below the typing test.'
		},
		{
			q: 'Can I use sqwer on a phone or tablet?',
			a: 'The website works on phones and tablets, but typing practice and finger mapping are intended for a physical keyboard.'
		},
		{
			q: 'How do I reset my password?',
			a: 'Use one of the recovery codes provided when you created your account on the password reset page. sqwer does not send email, so recovery codes are the only way to reset a password.'
		},
		{
			q: 'What happens to my data if I delete my account?',
			a: 'Your account, profile, recovery codes, signed-in devices, security activity and the finger map stored in your account are deleted immediately. Data stored only in your browser is not affected.'
		},
		{
			q: 'Does sqwer use cookies or tracking?',
			a: 'sqwer uses a single strictly necessary cookie to keep you signed in. It does not use advertising, analytics or tracking technologies.'
		}
	];

	const jsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
	};
</script>

<Seo title="Frequently asked questions" description="Answers to common questions about the sqwer typing test, finger mapping and accounts." {jsonLd} />

<Prose
	kicker="Help"
	title="Frequently asked questions"
	lede="Answers to common questions about the typing test, finger mapping and accounts."
	crumbs={[{ href: '/faq', label: 'FAQ' }]}
>
	<div class="faqs">
		{#each FAQS as f, i (i)}
			<details>
				<summary>{f.q}</summary>
				<p>{f.a}</p>
			</details>
		{/each}
	</div>
	<p>
		If your question is not answered here, read <a href="/about">How it works</a> or the
		<a href="/privacy">Privacy Policy</a>.
	</p>
</Prose>

<style>
	.faqs {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	details {
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	summary {
		padding: 16px 18px;
		font-size: 16.5px;
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
		list-style-position: inside;
	}
	details p {
		padding: 0 18px 18px;
	}
	details[open] summary {
		border-bottom: 1px solid var(--line);
		margin-bottom: 14px;
	}
</style>
