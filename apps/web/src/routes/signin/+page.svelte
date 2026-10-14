<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/account/AuthShell.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Captcha from '#lib/ui/Captcha.svelte';
	import Field from '#lib/ui/Field.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
</script>

<Seo title="Sign in" description="Sign in to your sqwer account." />

<AuthShell title="Sign in" lede="Sign in to sync your finger map and manage your profile.">
	{#if data.notice}<p class="form-alert success" role="status">{data.notice}</p>{/if}
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
		<Field label="Password" name="password" type="password" autocomplete="current-password" required />
		<Captcha error={errors.captcha} resetKey={form} />
		<button class="btn btn-primary btn-block" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
		<a class="forgot" href="/reset-password">Forgot your password?</a>
	</form>

	{#snippet footer()}
		Do not have an account? <a href="/signup">Create an account</a>
	{/snippet}
</AuthShell>

<style>
	.forgot {
		align-self: center;
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink);
		text-decoration: none;
	}
</style>
