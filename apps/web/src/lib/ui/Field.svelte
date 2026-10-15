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
	}

	let { label, name, hint, error = null, value = $bindable(''), multiline = false, rows = 3, id, ...rest }: Props = $props();

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
		<input
			id={fieldId}
			{name}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
			spellcheck={literal ? false : undefined}
			autocapitalize={literal ? 'none' : undefined}
			{...rest}
		/>
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
