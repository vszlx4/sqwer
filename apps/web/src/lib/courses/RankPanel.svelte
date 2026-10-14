<script lang="ts">
	import Icon from '#lib/ui/Icon.svelte';
	import { LESSONS } from './catalog.ts';
	import RankBadge from './RankBadge.svelte';
	import { courses } from './store.svelte.ts';

	const status = $derived(courses.rank);
	const stars = $derived(Object.values(courses.progress).reduce((s, p) => s + p.stars, 0));
	const completed = $derived(Object.values(courses.progress).filter((p) => p.stars > 0).length);
</script>

<section class="panel" aria-labelledby="rank-title">
	<RankBadge rank={status.rank} size={76} />
	<div class="who">
		<p class="label">Your rank</p>
		<h2 id="rank-title">{status.rank.name}</h2>
		<p class="note">{status.rank.note}</p>
		{#if status.next}
			<div class="bar" role="progressbar" aria-label={`Progress to ${status.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(status.progress * 100)}>
				<span style:width={`${status.progress * 100}%`}></span>
			</div>
			<p class="to-next"><b>{status.next.min - status.points}</b> points to {status.next.name}</p>
		{/if}
	</div>
	<dl class="facts">
		<div><dt>Points</dt><dd>{status.points}</dd></div>
		<div><dt><Icon name="star" size={14} /> Stars</dt><dd>{stars}</dd></div>
		<div><dt>Lessons</dt><dd>{completed}<small>/{LESSONS.length}</small></dd></div>
		<div><dt><Icon name="flame" size={14} /> Streak</dt><dd>{courses.streak}<small> {courses.streak === 1 ? 'day' : 'days'}</small></dd></div>
	</dl>
</section>

<style>
	.panel {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 22px;
		padding: 22px 24px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.label {
		font-size: 12.5px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h2 {
		font-family: var(--font-sans);
		font-size: 24px;
		font-weight: 700;
	}
	.note {
		font-size: 14px;
		color: var(--ink-2);
	}
	.bar {
		height: 8px;
		margin-top: 10px;
		max-width: 360px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 800ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.to-next {
		margin-top: 6px;
		font-size: 13px;
		color: var(--ink-2);
	}
	.to-next b {
		color: var(--ink);
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(4, auto);
		gap: 6px 24px;
	}
	dt {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	dd {
		font-size: 22px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	dd small {
		font-size: 13px;
		font-weight: 500;
		color: var(--ink-2);
	}
	@media (max-width: 860px) {
		.panel {
			grid-template-columns: auto minmax(0, 1fr);
		}
		.facts {
			grid-column: 1 / -1;
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	@media (max-width: 480px) {
		.facts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
