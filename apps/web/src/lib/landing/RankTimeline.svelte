<script lang="ts">
	import { LESSON_MINUTES, TYPICAL_STARS, rankJourney, roughTime } from '#lib/courses/journey.ts';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import { growTimeline } from './timeline.ts';

	/* Ten ranks on one trunk, each on a branch with the lessons, time and speed it takes. Above and below on wide
	   screens, all to the right on narrow ones. */

	const stops = rankJourney();
	const minutes = `${Math.floor(LESSON_MINUTES)} to ${Math.ceil(LESSON_MINUTES)}`;
</script>

<div class="timeline" use:growTimeline>
	<div class="track">
		<span class="trunk" aria-hidden="true"></span>
		<ol>
			{#each stops as s, i (s.rank.level)}
				<li class:below={i % 2 === 1}>
					<span class="node" aria-hidden="true"></span>
					<span class="stem" aria-hidden="true"></span>
					<div class="label">
						<p class="name"><RankBadge rank={s.rank} size={30} />{s.rank.name}</p>
						{#if s.wpm === null}
							<p class="meta">Lesson 1</p>
							<p class="meta">Any speed</p>
						{:else}
							<p class="meta">Lesson {s.lessons} · {roughTime(s.minutes)}</p>
							<p class="meta">{s.wpm} WPM at {s.accuracy}%</p>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	</div>
	<p class="note">
		Approximate figures for a steady learner earning {TYPICAL_STARS} stars a lesson, at {minutes} minutes each. Speed and
		accuracy are the chapter check targets at that point. Your own pace will differ.
	</p>
</div>

<style>
	.timeline {
		--stem: 26px;
		--side: 118px;
		margin-top: 48px;
	}
	.track {
		position: relative;
		/* Room past the last stem for the last label. */
		padding-right: 9%;
	}
	.trunk {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 1.5px;
		margin-top: -0.75px;
		background: var(--line-strong);
		transform-origin: left center;
	}
	ol {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		height: calc(2 * (var(--stem) + var(--side)));
	}
	li {
		position: relative;
	}
	.node {
		position: absolute;
		left: -4.5px;
		top: calc(50% - 4.5px);
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--bg);
	}
	.stem {
		position: absolute;
		left: -0.75px;
		bottom: 50%;
		width: 1.5px;
		height: var(--stem);
		background: var(--line-strong);
		transform-origin: center bottom;
	}
	.below .stem {
		top: 50%;
		bottom: auto;
		transform-origin: center top;
	}
	.label {
		position: absolute;
		left: -6px;
		bottom: calc(50% + var(--stem) + 6px);
		width: 190%;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.below .label {
		top: calc(50% + var(--stem) + 6px);
		bottom: auto;
	}
	.name {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 3px;
		font-size: 14px;
		font-weight: 700;
	}
	.name :global(.badge) {
		flex: none;
	}
	.meta {
		padding-left: 6px;
		font-family: var(--font-mono);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		line-height: 1.35;
		color: var(--ink-2);
	}
	.note {
		max-width: 620px;
		margin: 28px auto 0;
		font-size: 12.5px;
		line-height: 1.5;
		text-align: center;
		color: var(--ink-3);
	}

	/* Narrow: the trunk runs down the left and every branch grows to the right. */
	@media (max-width: 900px) {
		.timeline {
			--stem: 22px;
		}
		.track {
			padding: 0;
		}
		.trunk {
			left: 10px;
			right: auto;
			top: 15px;
			bottom: 0;
			width: 1.5px;
			height: auto;
			margin: 0;
			transform-origin: center top;
		}
		ol {
			grid-template-columns: 1fr;
			gap: 22px;
			height: auto;
		}
		li {
			padding-left: calc(10px + var(--stem) + 8px);
		}
		.node {
			left: 5.5px;
			top: 10.5px;
		}
		.stem,
		.below .stem {
			left: 10px;
			top: 14.25px;
			bottom: auto;
			width: var(--stem);
			height: 1.5px;
			transform-origin: left center;
		}
		.label,
		.below .label {
			position: static;
			width: auto;
		}
		.note {
			text-align: left;
		}
	}
</style>
