<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { tierOf, type Tier } from './levels.ts';

	/** A level by name and icon in its color: from a difficulty, or a fixed level itself. */
	let { difficulty, tier, size = 16 }: { difficulty?: number; tier?: Tier; size?: number } = $props();
	const t = $derived(tier ?? tierOf(difficulty ?? 1));
</script>

<span class="level-badge" style:--level={`var(--level-${t.id})`}><Icon name={t.icon} {size} /><span>{t.name}</span></span>

<style>
	.level-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	.level-badge :global(svg) {
		flex: none;
		color: var(--level);
	}
</style>
