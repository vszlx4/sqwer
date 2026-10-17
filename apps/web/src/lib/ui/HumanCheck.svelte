<script lang="ts">
	import { onMount } from 'svelte';
	import Captcha from './Captcha.svelte';
	import Turnstile from './Turnstile.svelte';
	import { formSignals } from './formSignals.ts';

	/**
	 * The bot protection of a form, as the page sees it: the signed ticket, a field people never
	 * fill in, a summary of how the form was filled and, when needed, a verification. Every check is
	 * repeated on the server; nothing here can let a request through on its own.
	 *
	 * - With Turnstile configured, its check is shown; if it cannot load or the server reports it
	 *   unreachable, sqwer's own challenge takes its place.
	 * - Without Turnstile, sqwer's own challenge is shown when the server asks for one: always for
	 *   sign-up and password reset, and for sign-in after a failure or when the risk is higher.
	 *   Browsers under automation (navigator.webdriver) are shown it straight away, because the
	 *   server will ask for it anyway.
	 */
	interface Props {
		check: {
			action: 'signin' | 'signup' | 'reset';
			provider: 'turnstile' | 'self';
			siteKey: string | null;
			required: boolean;
			ticket: string;
		};
		/** The latest form result: a fresh ticket, and whether the server asked for a challenge. */
		result?: { ticket?: string; challenge?: boolean; fallback?: boolean } | null;
		error?: string | null;
		resetKey?: unknown;
	}
	let { check, result = null, error = null, resetKey }: Props = $props();

	let root: HTMLDivElement | undefined = $state();
	let turnstileFailed = $state(false);
	let automated = $state(false);

	const ticket = $derived(result?.ticket ?? check.ticket);
	const fallback = $derived(check.provider === 'turnstile' && (turnstileFailed || !!result?.fallback));
	const useTurnstile = $derived(check.provider === 'turnstile' && !fallback && !!check.siteKey);
	const showChallenge = $derived(check.required || !!result?.challenge || automated || fallback);

	onMount(() => {
		automated = !!navigator.webdriver;
		const form = root?.closest('form');
		return form ? formSignals(form) : undefined;
	});
</script>

<div class="human" bind:this={root}>
	<input type="hidden" name="ticket" value={ticket} />
	<div class="trap" aria-hidden="true">
		<label>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label>
	</div>
	{#if useTurnstile}
		<div class="turnstile-wrap">
			<p class="label">Verification</p>
			<Turnstile siteKey={check.siteKey!} action={check.action} {resetKey} onfail={() => (turnstileFailed = true)} />
			{#if error}<p class="error" role="alert">{error}</p>{/if}
		</div>
	{:else if showChallenge}
		<Captcha action={check.action} {error} {resetKey} {fallback} />
	{/if}
</div>

<style>
	.human {
		display: contents;
	}
	/* Kept out of sight and out of the tab order; people never fill it in. */
	.trap {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	.turnstile-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.label {
		font-size: 14.5px;
		font-weight: 600;
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
</style>
