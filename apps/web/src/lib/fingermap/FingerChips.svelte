<script lang="ts">
	import { FINGERS, fingerShortcut, handOf, kindOf, type Finger } from '@sqwer/layouts';

	interface Props {
		disabled?: boolean;
		suggested?: Finger | null;
		onpick: (f: Finger) => void;
	}

	let { disabled = false, suggested = null, onpick }: Props = $props();

	const hands = [
		{ name: 'Left hand', fingers: FINGERS.filter((f) => handOf(f) === 'left') },
		{ name: 'Right hand', fingers: FINGERS.filter((f) => handOf(f) === 'right') }
	];
</script>

<div class="chips">
	{#each hands as hand (hand.name)}
		<div class="hand" role="group" aria-label={hand.name}>
			<span class="hand-name">{hand.name}</span>
			<div class="row">
				{#each hand.fingers as f (f)}
					<button
						type="button"
						class="chip"
						class:suggested={suggested === f}
						{disabled}
						onclick={() => onpick(f)}
						aria-label={`${hand.name.split(' ')[0]} ${kindOf(f)}, shortcut ${fingerShortcut(f)}${suggested === f ? ', suggested' : ''}`}
					>
						<kbd>{fingerShortcut(f)}</kbd>
						<span class="dot" style:background={`var(--f-${kindOf(f)})`}></span>
						{kindOf(f)}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>

<style>
	.chips {
		display: flex;
		justify-content: center;
		gap: var(--space-32);
		flex-wrap: wrap;
	}
	.hand {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.hand-name {
		font-size: var(--fs-12);
		font-weight: var(--fw-semibold);
		letter-spacing: var(--tr-wide);
		text-transform: uppercase;
		color: var(--ink-3);
	}
	.row {
		display: flex;
		gap: var(--space-6);
		flex-wrap: wrap;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		height: 38px;
		padding: 0 var(--space-12) 0 var(--space-6);
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		color: var(--ink);
		font-size: var(--fs-14);
		font-weight: var(--fw-regular);
		cursor: pointer;
		transition:
			background 100ms ease,
			transform 100ms ease;
	}
	.chip:hover:not(:disabled) {
		background: var(--surface-2);
	}
	.chip:active:not(:disabled) {
		transform: translateY(1px);
	}
	.chip:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.chip.suggested {
		border-color: var(--ink);
		box-shadow: 0 0 0 2px var(--accent);
	}
	kbd {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
		font-family: var(--font-mono);
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 3px;
	}
</style>
