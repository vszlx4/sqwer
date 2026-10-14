<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import AuthShell from '#lib/account/AuthShell.svelte';
	import RecoveryCodes from '#lib/account/RecoveryCodes.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Captcha from '#lib/ui/Captcha.svelte';
	import Field from '#lib/ui/Field.svelte';
	import { PASSWORD_RULE } from '#lib/profile.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
	const errors = $derived((form && 'errors' in form ? form.errors : {}) as Record<string, string | undefined>);
	const values = $derived((form && 'values' in form ? form.values : { email: '' }) as { email: string });
</script>

<Seo title="Create an account" description="Create a free sqwer account to save your finger map and build your typing profile." noindex={!!form?.created} />

{#if form?.created}
	<AuthShell title="Your account has been created" lede="Thank you for registering. Before you continue, please save your recovery codes.">
		<RecoveryCodes codes={form.codes} email={form.email} />
		<a class="btn btn-primary btn-block" href="/account/setup" data-sveltekit-reload>Continue to profile setup</a>
	</AuthShell>
{:else}
	<AuthShell title="Create an account" lede="An account saves your finger map across devices and lets you build a typing profile.">
		<form
			method="POST"
			class="form"
			novalidate
			use:enhance={() => {
				submitting = true;
				return async ({ result, update }) => {
					// On success, show the recovery codes without reloading data (which would leave this page).
					if (result.type === 'success') {
						await applyAction(result);
						await invalidate('app:user');
					}
					else await update({ reset: false });
					submitting = false;
				};
			}}
		>
			{#if errors.form}<p class="form-alert" role="alert">{errors.form}</p>{/if}

			<Field label="Email address" name="email" type="email" autocomplete="email" required value={values.email} error={errors.email} />
			<Field
				label="Password"
				name="password"
				type="password"
				autocomplete="new-password"
				required
				minlength={10}
				maxlength={128}
				hint={PASSWORD_RULE}
				error={errors.password}
			/>
			<Field label="Confirm password" name="confirmPassword" type="password" autocomplete="new-password" required error={errors.confirmPassword} />

			<div class="honeypot" aria-hidden="true">
				<label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
			</div>
			<input type="hidden" name="startedAt" value={data.startedAt} />

			<div class="consents">
				<label class="check">
					<input type="checkbox" name="acceptTerms" required aria-invalid={errors.acceptTerms ? 'true' : undefined} />
					<span>I accept the <a href="/terms" target="_blank">Terms and Conditions</a> and have read the <a href="/privacy" target="_blank">Privacy Policy</a>.</span>
				</label>
				{#if errors.acceptTerms}<p class="field-error">{errors.acceptTerms}</p>{/if}
				<label class="check">
					<input type="checkbox" name="ageConfirm" required aria-invalid={errors.ageConfirm ? 'true' : undefined} />
					<span>I confirm that I am at least 16 years old.</span>
				</label>
				{#if errors.ageConfirm}<p class="field-error">{errors.ageConfirm}</p>{/if}
			</div>

			<Captcha error={errors.captcha} resetKey={form} />

			<button class="btn btn-primary btn-block" type="submit" disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'}
			</button>
		</form>

		{#snippet footer()}
			Already have an account? <a href="/signin">Sign in</a>
		{/snippet}
	</AuthShell>
{/if}

<style>
	.consents {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.field-error {
		margin-left: 28px;
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
</style>
