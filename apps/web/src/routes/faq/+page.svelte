<script lang="ts">
	import Prose from '#lib/site/Prose.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import { CONTACT_EMAIL } from '#lib/site/links.ts';

	const FAQS = [
		{
			q: 'Is sqwer free to use?',
			a: 'Yes. sqwer is a free, non-commercial project: the Courses, the Examinations, the Finger map and accounts cost nothing, and sqwer never asks for payment details.'
		},
		{
			q: 'Do I need an account?',
			a: 'Not to begin. The Examinations, the Finger map and the first course lesson work without an account. The rest of the Courses needs a free account, which saves your progress, stars and rank on every device.'
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
			q: 'How do I restart a test?',
			a: 'Press Tab at any time during a test to restart it with new words. On the results page, Tab returns to a new test, which starts when you type the first letter. Results are saved before the page changes.'
		},
		{
			q: 'Where can I see my previous results?',
			a: 'The History page lists every test, including attempts that were not completed. Each result opens a full report with a chart, word speeds and a replay.'
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
			a: 'Your account and everything stored with it are deleted immediately: profile, profile picture, examination results, course progress, finger map, usage statistics, recovery codes, signed-in devices and security activity. Copies in backups disappear within 14 days. Data kept only in your browser is not affected; you can clear it in your browser settings.'
		},
		{
			q: 'Does sqwer use cookies or tracking?',
			a: 'sqwer sets one strictly necessary cookie to keep you signed in, and stores your settings and practice data in your browser. It does not use advertising, cross-site tracking or third-party analytics. With your permission only, its own analytics counts which pages are visited; you can change your choice under Analytics preferences at the foot of every page. The Cookie and Storage Policy lists everything.'
		},
		{
			q: 'Where is my data stored?',
			a: 'Without an account, only in your browser. With an account, in a database in the European Union (Ireland). You can download or delete it at any time from Account → Your data. The Privacy Policy explains the details.'
		},
		{
			q: 'Why do account forms ask me to type characters?',
			a: 'It is a verification check that keeps automated sign-ups and password guessing away. sqwer runs it itself: no third party is involved and no cookie is set. If you cannot read the characters, choose “Use a text question” to answer a short question instead.'
		},
		{
			q: 'Which pictures can I use for my profile?',
			a: 'Only pictures you took or created yourself, or that you have permission to use. Do not upload photographs of other people without their consent, or logos, artwork or images found online. The Content and Copyright Policy explains the rules and how rights holders can report a picture.'
		},
		{
			q: 'I cannot complete a game in a lesson. What can I do?',
			a: 'Games depend on quick reactions. After an unsuccessful attempt, choose “Continue without this game” to move on; a skipped game does not count towards your stars. The Accessibility Statement describes other options.'
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
	<p>If your question is not answered here, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
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
