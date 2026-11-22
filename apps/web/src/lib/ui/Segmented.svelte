<script lang="ts" generics="T extends string | number">
	/** One choice from a few: native radios drawn as a segmented control, so they post with forms and arrow keys move between them. */
	interface Props {
		options: readonly { value: T; label: string }[];
		value: T;
		/** Radio group name; posted with the form. */
		name: string;
		/** Accessible name of the group, unless `labelledby` points at a visible one. */
		label?: string;
		labelledby?: string;
		disabled?: boolean;
		onchange?: (value: T) => void;
	}
	let { options, value = $bindable(), name, label, labelledby, disabled = false, onchange }: Props = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={labelledby ? undefined : label} aria-labelledby={labelledby}>
	{#each options as o (o.value)}
		<label class:on={value === o.value}>
			<input
				class="sr-only"
				type="radio"
				{name}
				value={o.value}
				checked={value === o.value}
				{disabled}
				onchange={() => {
					value = o.value;
					onchange?.(o.value);
				}}
			/>
			<span>{o.label}</span>
		</label>
	{/each}
</div>

<style>
	.segmented {
		display: inline-flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding: var(--space-2);
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--surface);
		max-width: 100%;
	}
	label {
		position: relative;
		display: grid;
		place-items: center;
		min-height: 34px;
		padding: 0 var(--space-12);
		border-radius: var(--radius);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			color var(--dur-fast) var(--ease-out);
	}
	label:hover {
		color: var(--ink);
	}
	label.on {
		background: var(--ink);
		color: var(--bg);
	}
	label:has(input:focus-visible) {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	label:has(input:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
