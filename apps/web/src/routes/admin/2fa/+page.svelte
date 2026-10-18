<script lang="ts">
	import { enhance } from '$app/forms';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<Seo title="Confirm it is you" description="Authenticator check for sqwer administrators." noindex />

<section class="mfa" aria-labelledby="mfa-title">
	<h1 id="mfa-title">Confirm it is you</h1>
	<p>Enter the six-digit code from your authenticator app to open the administration pages. Each code works once.</p>
	{#if form?.error}<p class="form-alert" role="alert">{form.error}</p>{/if}
	<form method="POST" class="form" use:enhance>
		<label class="code">
			<span>Authenticator code <span class="req" aria-hidden="true"></span></span>
			<!-- svelte-ignore a11y_autofocus -->
			<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{'{'}6,7{'}'}" maxlength="7" required autofocus />
		</label>
		<button class="btn btn-primary" type="submit">Confirm</button>
	</form>
	<p class="note">Lost access to your authenticator app? Another administrator can remove it from the server with <code>npm run admin -w web -- reset-2fa &lt;email&gt;</code>.</p>
</section>

<style>
	.mfa {
		display: flex;
		flex-direction: column;
		gap: 14px;
		max-width: 460px;
	}
	h1 {
		font-size: clamp(28px, 3.2vw, 36px);
	}
	p {
		color: var(--ink-2);
	}
	.code {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-weight: 600;
		font-size: 14.5px;
	}
	.code input {
		min-height: 48px;
		max-width: 200px;
		padding: 0 14px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 22px;
		letter-spacing: 0.2em;
	}
	.form .btn {
		align-self: flex-start;
	}
	.note {
		font-size: 13.5px;
	}
	.note code {
		font-family: var(--font-mono);
		color: var(--ink);
	}
</style>
