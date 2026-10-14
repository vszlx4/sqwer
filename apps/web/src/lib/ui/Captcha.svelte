<script lang="ts">
	import { onMount } from 'svelte';

	/** `resetKey` changes after each submission so a fresh check is required (each proof is single-use). */
	let { error = null, resetKey }: { error?: string | null; resetKey?: unknown } = $props();
	let ready = $state(false);

	onMount(async () => {
		await import('altcha');
		await import('altcha/i18n/en');
		const registry = (globalThis as unknown as { $altcha?: { i18n: Map<string, Record<string, string>> } }).$altcha;
		if (registry) {
			registry.i18n.set('en', {
				...(registry.i18n.get('en') ?? {}),
				label: 'I am not a robot',
				verifying: 'Verifying…',
				verified: 'Verified',
				error: 'Verification failed. Please try again.',
				expired: 'Verification expired. Please try again.',
				verificationRequired: 'Please complete the verification.',
				waitAlert: 'Verification in progress. Please wait.'
			});
		}
		ready = true;
	});
</script>

<div class="captcha" class:invalid={!!error}>
	{#if ready}
		{#key resetKey}
		<altcha-widget
			challenge="/api/captcha"
			auto="onfocus"
			language="en"
			name="altcha"
			configuration={JSON.stringify({ hideLogo: true, hideFooter: true })}
		></altcha-widget>
		{/key}
	{:else}
		<div class="placeholder" aria-hidden="true">Loading verification…</div>
	{/if}
	<noscript><p class="error">Verification requires JavaScript. Please enable it to continue.</p></noscript>
	{#if error}<p class="error" role="alert">{error}</p>{/if}
	<p class="note">This check runs in your browser and does not use tracking cookies.</p>
</div>

<style>
	.captcha {
		display: flex;
		flex-direction: column;
		gap: 6px;
		--altcha-border-radius: 3px;
		--altcha-checkbox-border-radius: 3px;
		--altcha-border-color: var(--line-strong);
		--altcha-color-base: var(--bg);
		--altcha-color-base-content: var(--ink);
		--altcha-color-primary: var(--ink);
		--altcha-color-primary-content: var(--bg);
		--altcha-color-success: var(--ink);
		--altcha-color-error: var(--error);
		--altcha-max-width: 100%;
		--altcha-shadow: none;
	}
	.placeholder {
		display: flex;
		align-items: center;
		min-height: 58px;
		padding: 0 14px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		font-size: 14.5px;
		color: var(--ink-2);
	}
	.note {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
</style>
