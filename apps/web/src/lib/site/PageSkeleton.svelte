<script lang="ts">
	import Skeleton from '#lib/ui/Skeleton.svelte';
	import SkeletonRegion from '#lib/ui/SkeletonRegion.svelte';
	import type { SkeletonKind } from './skeleton.ts';

	// Stand-in for the next page while its data loads (routes/+layout.svelte).
	type Props = { kind?: SkeletonKind };

	let { kind = 'page' }: Props = $props();
</script>

<SkeletonRegion label="Loading the page…">
	<div class="page" data-kind={kind}>
		<Skeleton width="140px" height="13px" />
		{#if kind === 'profile'}
			<div class="who">
				<Skeleton circle width="64px" height="64px" />
				<div class="who-text">
					<Skeleton width="min(260px, 60vw)" height="28px" />
					<Skeleton width="160px" height="14px" />
				</div>
			</div>
		{:else}
			<div class="head">
				<Skeleton width="min(420px, 80%)" height="34px" />
				<Skeleton lines={2} width="min(640px, 100%)" />
			</div>
		{/if}

		{#if kind === 'exercise'}
			<div class="text-block"><Skeleton lines={3} /></div>
			<Skeleton height="clamp(160px, 28vw, 260px)" />
		{:else}
			<div class="cards">
				{#each Array.from({ length: 4 }) as _, i (i)}
					<div class="card">
						<Skeleton width="60%" height="12px" />
						<Skeleton width="40%" height="20px" />
					</div>
				{/each}
			</div>
			<div class="rows">
				{#each Array.from({ length: 4 }) as _, i (i)}
					<Skeleton height="44px" />
				{/each}
			</div>
		{/if}
	</div>
</SkeletonRegion>

<style>
	.page {
		display: flex;
		flex-direction: column;
		gap: var(--space-24);
	}
	.head,
	.who-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--space-20);
	}
	.who-text {
		flex: 1;
		gap: var(--space-10);
	}
	.text-block {
		padding: var(--space-20);
		border: 1px solid var(--line);
		border-radius: 3px;
		font-size: var(--fs-20);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--space-10);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-10);
		padding: var(--space-16) var(--space-16);
		border: 1px solid var(--line);
		border-radius: 3px;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}
	@media (max-width: 760px) {
		.cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
