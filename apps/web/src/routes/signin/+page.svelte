<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '#lib/account/AuthShell.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Captcha from '#lib/ui/Captcha.svelte';
	import Field from '#lib/ui/Field.svelte';
	import RequiredNote from '#lib/ui/RequiredNote.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
</script>

<Seo title="Sign in" description="Sign in to your sqwer account." />

<AuthShell title="Sign in" lede="Pick up where you left off: your lessons, results and finger map are waiting." mode="signin">
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
		<RequiredNote />
		<Field label="Email address" name="email" type="email" autocomplete="email" required value={form?.values?.email ?? ''} />
		<div class="password">
			<Field label="Password" name="password" type="password" autocomplete="current-password" required />
			<a class="forgot" href="/reset-password">Forgot your password?</a>
		</div>
		<Captcha error={errors.captcha} resetKey={form} />
		<button class="btn btn-primary btn-lg btn-block" type="submit" disabled={submitting} aria-busy={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
	</form>

	{#snippet footer()}
		New to sqwer? <a href="/signup">Create a free account</a>
	{/snippet}
</AuthShell>

<style>
	.password {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.forgot {
		align-self: flex-end;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--ink-2);
		text-decoration: none;
		transition: color 140ms ease;
	}
	.forgot:hover {
		color: var(--ink);
	}
</style>
