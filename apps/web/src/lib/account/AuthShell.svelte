<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';

	/** Auth page frame: form plus a benefits panel on wide screens; form only on narrow screens. */
	interface Props {
		title: string;
		lede?: string;
		/** Which page this is, for the wording of the side panel. */
		mode?: 'signin' | 'signup' | 'reset' | 'done';
		children: Snippet;
		footer?: Snippet;
	}
	let { title, lede, mode = 'signin', children, footer }: Props = $props();

	const BENEFITS: { icon: IconName; title: string; body: string }[] = [
		{ icon: 'hand', title: 'Your finger map, everywhere', body: 'The fingers you use for every key, kept in sync on each device you sign in on.' },
		{ icon: 'chart', title: 'XP, levels and ranks', body: 'Every test and lesson adds experience. Ranked tests place you on the leaderboard.' },
		{ icon: 'route', title: 'The whole learning path', body: 'All twelve chapters, with your stars, streak and starting point saved.' },
		{ icon: 'history', title: 'Your history, kept', body: 'Results, charts and replays of every test, ready to compare.' }
	];
	const heading = $derived(
		mode === 'signup' ? 'One free account, everything saved.' : mode === 'reset' ? 'Back in with a recovery code.' : mode === 'done' ? 'Keep your codes somewhere safe.' : 'Welcome back.'
	);
	const intro = $derived(
		mode === 'reset'
			? 'sqwer does not send email, so the recovery codes you saved when you signed up are the way back into your account.'
			: mode === 'done'
				? 'Recovery codes are the only way to reset your password. Each works once; store them like a spare key.'
				: 'Free, with no email. Your address is used only to sign in.'
	);
</script>

<section class="auth" aria-labelledby="auth-title">
	<aside class="panel" aria-label="About sqwer accounts">
		<p class="panel-title">{heading}</p>
		<p class="panel-intro">{intro}</p>
		{#if mode === 'signin' || mode === 'signup'}
			<ul class="benefits">
				{#each BENEFITS as b (b.title)}
					<li>
						<span class="icon" aria-hidden="true"><Icon name={b.icon} size={18} /></span>
						<span><b>{b.title}</b>{b.body}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<ol class="steps">
				{#if mode === 'reset'}
					<li><b>Your email address</b>The one you signed up with.</li>
					<li><b>One recovery code</b>For example ABCD-EFGH-JKMN. Each code works once.</li>
					<li><b>A new password</b>Other devices are signed out when it is set.</li>
				{:else}
					<li><b>Copy or download them</b>Use the buttons beside the codes.</li>
					<li><b>Store them apart from your password</b>A password manager or a printed sheet both work.</li>
					<li><b>Generate new ones any time</b>From Security in your account.</li>
				{/if}
			</ol>
		{/if}
		<p class="panel-foot"><Icon name="shield" size={15} /> Passwords are stored only as salted hashes. Verification runs on sqwer itself, with no third party and no cookie.</p>
	</aside>

	<div class="main">
		<div class="head">
			<h1 id="auth-title">{title}</h1>
			{#if lede}<p class="lede">{lede}</p>{/if}
		</div>
		{@render children()}
		{#if footer}<div class="footer">{@render footer()}</div>{/if}
	</div>
</section>

<style>
	.auth {
		display: grid;
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
		gap: clamp(var(--space-32), 5vw, var(--space-64));
		align-items: start;
		max-width: var(--w-page);
		margin: 0 auto;
		padding: clamp(var(--space-8), 3vh, var(--space-32)) 0 clamp(var(--space-16), 4vh, var(--space-40));
	}
	.panel {
		position: sticky;
		top: 96px;
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
		padding: clamp(var(--space-24), 3.4vw, var(--space-40));
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background:
			radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--ink) 7%, transparent) 1px, transparent 0) 0 0 / 22px 22px,
			linear-gradient(to bottom, var(--surface), var(--bg));
	}
	.panel-title {
		font-family: var(--font-serif);
		font-size: var(--fs-title);
		line-height: var(--lh-snug);
		color: var(--ink);
		text-wrap: balance;
	}
	.panel-intro {
		max-width: 44ch;
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.benefits,
	.steps {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
		margin: var(--space-6) 0 0;
		padding: 0;
		list-style: none;
	}
	.benefits li {
		display: grid;
		grid-template-columns: 36px 1fr;
		gap: var(--space-16);
		align-items: start;
	}
	.icon {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
	}
	.benefits b,
	.steps b {
		display: block;
		margin-bottom: var(--space-2);
		font-size: var(--fs-15);
		color: var(--ink);
	}
	.benefits li > span:last-child,
	.steps li {
		font-size: var(--fs-14);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.steps {
		counter-reset: step;
	}
	.steps li {
		position: relative;
		padding-left: var(--space-48);
		counter-increment: step;
	}
	.steps li::before {
		content: counter(step);
		position: absolute;
		left: 0;
		top: 0;
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border-radius: var(--radius);
		background: var(--ink);
		color: var(--bg);
		font-size: var(--fs-14);
		font-weight: var(--fw-bold);
	}
	.panel-foot {
		display: flex;
		align-items: flex-start;
		gap: var(--space-8);
		margin-top: var(--space-6);
		padding-top: var(--space-16);
		border-top: 1px solid var(--line);
		font-size: var(--fs-13);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.panel-foot :global(svg) {
		flex-shrink: 0;
		margin-top: var(--space-2);
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: var(--space-20);
		max-width: var(--w-form);
		width: 100%;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	h1 {
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
		letter-spacing: normal;
		text-wrap: balance;
	}
	.lede {
		font-size: var(--fs-16);
		line-height: var(--lh-body);
		color: var(--ink-2);
		text-wrap: pretty;
	}
	.footer {
		padding-top: var(--space-20);
		border-top: 1px solid var(--line);
		font-size: var(--fs-15);
		color: var(--ink-2);
	}
	.footer :global(a) {
		color: var(--ink);
		font-weight: var(--fw-semibold);
		text-decoration: none;
	}
	.footer :global(a:hover) {
		color: var(--rank);
	}
	@media (max-width: 900px) {
		.auth {
			grid-template-columns: 1fr;
		}
		.panel {
			display: none;
		}
		.main {
			max-width: var(--w-narrow);
			margin: 0 auto;
		}
	}
</style>
