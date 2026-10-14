<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/account/AuthShell.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Captcha from '#lib/ui/Captcha.svelte';
	import Field from '#lib/ui/Field.svelte';
	import { PASSWORD_RULE } from '#lib/profile.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
</script>

<Seo title="Reset your password" description="Reset your sqwer password with one of your recovery codes." />

<AuthShell
	title="Reset your password"
	lede="Enter your email address, one of the recovery codes you saved when you created your account, and a new password."
>
	<form
		method="POST"
		class="form"
		novalidate
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		{#if errors.form}<p class="form-alert" role="alert">{errors.form}</p>{/if}
		<Field label="Email address" name="email" type="email" autocomplete="email" required value={form?.values?.email ?? ''} />
		<Field label="Recovery code" name="code" autocomplete="one-time-code" required hint="For example: ABCD-EFGH-JKMN" />
		<Field label="New password" name="password" type="password" autocomplete="new-password" required hint={PASSWORD_RULE} error={errors.password} />
		<Field label="Confirm new password" name="confirmPassword" type="password" autocomplete="new-password" required error={errors.confirmPassword} />
		<Captcha error={errors.captcha} resetKey={form} />
		<button class="btn btn-primary btn-block" type="submit" disabled={submitting}>{submitting ? 'Resetting…' : 'Reset password'}</button>
	</form>
	<p class="note">
		Resetting your password signs you out on every other device. If you no longer have any recovery codes, the password
		cannot be reset, because sqwer does not send email.
	</p>

	{#snippet footer()}
		Remembered your password? <a href="/signin">Sign in</a>
	{/snippet}
</AuthShell>

<style>
	.note {
		font-size: 13.5px;
		line-height: 1.55;
		color: var(--ink-2);
	}
</style>
