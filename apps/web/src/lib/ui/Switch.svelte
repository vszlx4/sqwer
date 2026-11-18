<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	/** On/off switch: a native checkbox with the switch role, so it posts with forms and works with the keyboard. */
	interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'role'> {
		checked?: boolean;
	}
	let { checked = $bindable(false), ...rest }: Props = $props();
</script>

<input class="switch" type="checkbox" role="switch" bind:checked {...rest} />

<style>
	.switch {
		appearance: none;
		position: relative;
		flex: none;
		width: 40px;
		height: 24px;
		margin: 0;
		border-radius: var(--radius-pill);
		border: 1px solid var(--line-strong);
		background: var(--surface-2);
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}
	.switch::before {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: var(--radius-pill);
		background: var(--ink-2);
		transition:
			transform var(--dur-base) var(--ease-out),
			background-color var(--dur-fast) var(--ease-out);
	}
	.switch:hover:not(:disabled) {
		border-color: var(--ink-3);
	}
	.switch:checked {
		border-color: var(--ink);
		background: var(--ink);
	}
	.switch:checked::before {
		transform: translateX(16px);
		background: var(--bg);
	}
	.switch:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
	.switch:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		.switch::before {
			transition: none;
		}
	}
</style>
