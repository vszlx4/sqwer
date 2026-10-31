<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'value'> {
		label: string;
		name: string;
		hint?: string;
		error?: string | null;
		value?: string | number | null;
		multiline?: boolean;
		rows?: number;
		/** For a new password: show how strong it is while it is typed. */
		strength?: boolean;
		/** For a confirmation field: the value it must match, to confirm a match while typing. */
		matches?: string;
	}

	let { label, name, hint, error = null, value = $bindable(''), multiline = false, rows = 3, strength = false, matches, id, ...rest }: Props = $props();

	const isPassword = $derived(rest.type === 'password');
	let reveal = $state(false);
	const inputType = $derived(isPassword && reveal ? 'text' : rest.type);

	/** Strength hint 0-4: length first, then character variety. The server enforces the rule. */
	const score = $derived.by(() => {
		const v = String(value ?? '');
		if (!v) return 0;
		const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(v)).length;
		let n = v.length >= 10 ? 1 : 0;
		if (v.length >= 14) n++;
		if (v.length >= 18) n++;
		if (kinds >= 3) n++;
		return Math.min(4, Math.max(v.length >= 10 ? 1 : 0, n));
	});
	const STRENGTH = ['Too short', 'Fair', 'Good', 'Strong', 'Very strong'];
	const advice = $derived.by(() => {
		const v = String(value ?? '');
		if (v.length < 10) return `${10 - v.length} more ${10 - v.length === 1 ? 'character' : 'characters'} needed.`;
		if (score < 3) return 'Longer is stronger: a short phrase of unrelated words works well.';
		return 'A good password. Keep it somewhere safe.';
	});
	const matchState = $derived(matches === undefined || !String(value ?? '') ? null : String(value) === matches ? 'match' : 'differ');

	const uid = $props.id();
	const fieldId = $derived(id ?? `${name}-${uid}`);
	// Addresses, usernames and codes are not prose: no spelling marks or automatic capitals.
	const literal = $derived(rest.type === 'email' || ['username', 'code', 'confirm'].includes(name));
	const describedBy = $derived([hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined);
</script>

<div class="field" class:invalid={!!error}>
	<label for={fieldId}>{label}{#if rest.required}<span class="req" aria-hidden="true"></span>{/if}</label>
	{#if multiline}
		<textarea
			id={fieldId}
			{name}
			{rows}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			maxlength={rest.maxlength}
			required={rest.required}
			placeholder={rest.placeholder}
		></textarea>
	{:else}
		<div class="control" class:with-toggle={isPassword}>
			<input
				id={fieldId}
				{name}
				bind:value
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={describedBy}
				spellcheck={literal || isPassword ? false : undefined}
				autocapitalize={literal || isPassword ? 'none' : undefined}
				{...rest}
				type={inputType}
			/>
			{#if isPassword}
				<button type="button" class="reveal" aria-controls={fieldId} aria-pressed={reveal} onclick={() => (reveal = !reveal)}>
					{reveal ? 'Hide' : 'Show'}
				</button>
			{/if}
		</div>
	{/if}
	{#if strength && String(value ?? '')}
		<div class="strength" data-score={score}>
			<span class="bars" aria-hidden="true">{#each [1, 2, 3, 4] as n (n)}<span class:on={score >= n}></span>{/each}</span>
			<span class="strength-text" aria-live="polite"><b>{STRENGTH[score]}</b> · {advice}</span>
		</div>
	{/if}
	{#if matchState}
		<p class="match" class:ok={matchState === 'match'} aria-live="polite">
			{matchState === 'match' ? 'The passwords match.' : 'The passwords do not match yet.'}
		</p>
	{/if}
	{#if hint}<p class="hint" id={`${fieldId}-hint`}>{hint}</p>{/if}
	{#if error}<p class="error" id={`${fieldId}-error`}>{error}</p>{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	label {
		font-size: 14.5px;
		font-weight: 600;
		color: var(--ink);
	}
	input,
	textarea {
		width: 100%;
		min-height: 46px;
		padding: 10px 12px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--bg);
		color: var(--ink);
		font: inherit;
		font-size: 16px;
		transition: border-color 120ms ease;
	}
	textarea {
		resize: vertical;
		line-height: 1.5;
	}
	.control {
		position: relative;
	}
	.with-toggle input {
		padding-right: 74px;
	}
	.reveal {
		position: absolute;
		top: 50%;
		right: 6px;
		transform: translateY(-50%);
		min-width: 58px;
		padding: 6px 10px;
		border-radius: 3px;
		border: 1px solid transparent;
		background: none;
		color: var(--ink-2);
		font: inherit;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 140ms ease,
			color 140ms ease;
	}
	.reveal:hover {
		background: var(--surface-2);
		color: var(--ink);
	}
	.reveal:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
	.strength {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.bars {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}
	.bars span {
		height: 4px;
		border-radius: 3px;
		background: var(--surface-2);
		transition: background-color 200ms ease;
	}
	.strength[data-score='1'] .bars .on,
	.strength[data-score='2'] .bars .on {
		background: var(--strength-fair);
	}
	.strength[data-score='3'] .bars .on,
	.strength[data-score='4'] .bars .on {
		background: var(--strength-strong);
	}
	.strength-text {
		font-size: 13px;
		color: var(--ink-2);
	}
	.strength-text b {
		color: var(--ink);
	}
	.match {
		font-size: 13px;
		color: var(--ink-2);
	}
	.match.ok {
		color: var(--success);
		font-weight: 600;
	}
	input:hover,
	textarea:hover {
		border-color: var(--ink-3);
	}
	input:focus-visible,
	textarea:focus-visible {
		border-color: var(--ink);
	}
	.invalid input,
	.invalid textarea {
		border-color: var(--error);
	}
	.hint {
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.error {
		font-size: 13.5px;
		font-weight: 600;
		color: var(--error);
	}
</style>
