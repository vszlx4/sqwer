<script lang="ts">
	import { enhance } from '$app/forms';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	// The secret is shown only in the response to the password, and kept while the code is entered.
	let scan = $state<{ qr: string; secret: string } | null>(null);
	$effect(() => {
		if (form && 'qr' in form && form.qr) scan = { qr: form.qr, secret: form.secret };
	});
	const error = $derived(form && 'error' in form ? form.error : null);
</script>

<Seo title="Set up your authenticator app" description="Two-factor authentication for sqwer administrators." noindex />

<section class="setup" aria-labelledby="setup-title">
	<h1 id="setup-title">Set up your authenticator app</h1>
	<p>
		Administrator access needs a second step: a six-digit code from an authenticator app on your phone, such as one built
		into your password manager. You will be asked for a code at the start of each session.
	</p>
	{#if error}<p class="form-alert" role="alert">{error}</p>{/if}

	{#if !scan}
		<form method="POST" action="?/start" class="form" use:enhance>
			<label class="field">
				<span>Your password <span class="req" aria-hidden="true"></span></span>
				<input name="password" type="password" autocomplete="current-password" required />
			</label>
			<button class="btn btn-primary" type="submit">Continue</button>
		</form>
	{:else}
		<ol class="steps">
			<li>
				<p>Scan this code with your authenticator app.</p>
				<img class="qr" src={scan.qr} width="200" height="200" alt="QR code to add sqwer to an authenticator app" />
				<p class="manual">Or enter this key by hand: <code data-testid="totp-secret">{scan.secret}</code></p>
			</li>
			<li>
				<form method="POST" action="?/confirm" class="form" use:enhance>
					<label class="field">
						<span>The six-digit code it shows <span class="req" aria-hidden="true"></span></span>
						<input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{'{'}6,7{'}'}" maxlength="7" required />
					</label>
					<button class="btn btn-primary" type="submit">Confirm and continue</button>
				</form>
			</li>
		</ol>
	{/if}
</section>

<style>
	.setup {
		display: flex;
		flex-direction: column;
		gap: 14px;
		max-width: 560px;
	}
	h1 {
		font-size: clamp(28px, 3.2vw, 36px);
	}
	p {
		color: var(--ink-2);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-weight: 600;
		font-size: 14.5px;
	}
	.field input {
		min-height: 46px;
		max-width: 320px;
		padding: 0 14px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
	}
	.form .btn {
		align-self: flex-start;
	}
	.steps {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding-left: 20px;
	}
	.qr {
		display: block;
		margin-top: 10px;
		border-radius: 3px;
		background: #fff;
	}
	.manual code {
		font-family: var(--font-mono);
		color: var(--ink);
		word-break: break-all;
	}
</style>
