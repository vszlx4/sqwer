<script lang="ts">
	import { onMount } from 'svelte';
	import { autofocus } from '#lib/ui/autofocus.ts';
	import Confetti from '#lib/ui/Confetti.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import { lessonPoints, type rankFor } from './progression.ts';
	import RankBadge from './RankBadge.svelte';
	import Stars from './Stars.svelte';
	import { courses } from './store.svelte.ts';
	import type { Lesson } from './types.ts';

	interface Props {
		lesson: Lesson;
		next: Lesson | null;
		result: {
			stars: number;
			accuracy: number;
			wpm: number;
			before: ReturnType<typeof rankFor>;
			after: ReturnType<typeof rankFor>;
			bestBefore: number;
			saved: boolean;
		};
		onrepeat: () => void;
	}

	let { lesson, next, result, onrepeat }: Props = $props();

	const gained = $derived(courses.signedIn ? Math.max(0, lessonPoints(result.stars) - lessonPoints(result.bestBefore)) : lessonPoints(result.stars));
	const rankedUp = $derived(courses.signedIn && result.after.rank.level > result.before.rank.level);
	const improved = $derived(result.stars > result.bestBefore);

	// The rank bar fills from where it was to where it is now.
	let fill = $state(0);
	onMount(() => {
		fill = rankedUp ? 0 : result.before.progress;
		const t = setTimeout(() => (fill = result.after.progress), 650);
		return () => clearTimeout(t);
	});

</script>

<section class="complete" aria-labelledby="complete-title">
	{#if result.stars > 0}<Confetti pieces={rankedUp ? 240 : result.stars === 3 ? 170 : 110} />{/if}

	<p class="kicker">Lesson {lesson.order} complete</p>
	<h2 id="complete-title">{lesson.title}</h2>
	<Stars stars={result.stars} size={44} pop />
	<p class="stats">
		{`${Math.round(result.accuracy)}% accuracy`}{#if result.wpm}{` · ${Math.round(result.wpm)} WPM`}{/if}
	</p>

	{#if courses.signedIn}
		{#if !result.saved}
			<p class="form-alert" role="alert">{courses.error}</p>
		{/if}
		<div class="rank" class:up={rankedUp}>
			<RankBadge rank={result.after.rank} size={64} />
			<div class="rank-body">
				{#if rankedUp}
					<p class="new-rank">New rank</p>
				{/if}
				<p class="rank-name">{result.after.rank.name}</p>
				<p class="points">
					{#if gained}<b>+{gained} points</b> ·{:else if !improved && result.bestBefore}Your best remains {result.bestBefore} {result.bestBefore === 1 ? 'star' : 'stars'} ·{/if}
					{result.after.points} in total
				</p>
				{#if result.after.next}
					<span class="bar" aria-hidden="true"><span style:width={`${fill * 100}%`}></span></span>
					<p class="to-next">{result.after.next.min - result.after.points} points to {result.after.next.name}</p>
				{/if}
			</div>
			{#if courses.streak > 0}
				<p class="streak"><Icon name="flame" size={18} /> {courses.streak}-day streak</p>
			{/if}
		</div>
	{:else}
		<div class="guest">
			<p><b>Create a free account to keep this lesson</b> and continue the course. Your result for this lesson is saved when you sign up.</p>
		</div>
	{/if}

	<div class="actions">
		{#if !courses.signedIn}
			<a class="btn btn-primary btn-lg" href="/signup" use:autofocus>Create an account <Icon name="arrow" size={18} /></a>
		{:else if next}
			<a class="btn btn-primary btn-lg" href={`/learn/${next.id}`} use:autofocus>Next: {next.title} <Icon name="arrow" size={18} /></a>
		{:else}
			<a class="btn btn-primary btn-lg" href="/learn" use:autofocus>See the whole road <Icon name="arrow" size={18} /></a>
		{/if}
		<button type="button" class="btn btn-lg" onclick={onrepeat}><Icon name="restart" size={18} /> Practice again</button>
	</div>
	<a class="link-arrow back" href="/learn">Back to the roadmap <Icon name="arrow" size={16} /></a>
</section>

<style>
	.complete {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		max-width: 620px;
		margin: 0 auto;
		padding: 40px 28px 32px;
		text-align: center;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		overflow: hidden;
	}
	.kicker {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h2 {
		font-size: clamp(30px, 4vw, 42px);
		line-height: 1.1;
	}
	.stats {
		font-size: 16px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.rank {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 4px 16px;
		width: 100%;
		margin-top: 10px;
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--bg);
		text-align: left;
	}
	.rank.up {
		border-color: var(--ink);
		box-shadow: inset 0 3px 0 var(--accent);
	}
	.rank.up :global(.badge) {
		animation: rank-up 900ms cubic-bezier(0.3, 1.5, 0.5, 1) 400ms both;
	}
	@keyframes rank-up {
		from {
			transform: scale(0.3) rotate(-30deg);
			opacity: 0;
		}
	}
	.new-rank {
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.rank-name {
		font-size: 20px;
		font-weight: 700;
	}
	.points {
		font-size: 14px;
		color: var(--ink-2);
	}
	.points b {
		color: var(--ink);
	}
	.bar {
		display: block;
		height: 8px;
		margin-top: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
		transition: width 1100ms cubic-bezier(0.2, 0.7, 0.2, 1);
	}
	.to-next {
		margin-top: 4px;
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.streak {
		grid-column: 1 / -1;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-size: 14px;
		font-weight: 600;
		color: var(--f-middle);
	}
	.guest {
		margin-top: 8px;
		padding: 16px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--bg);
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.guest b {
		color: var(--ink);
	}
	.actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 12px;
	}
	.back {
		font-size: 14.5px;
		color: var(--ink-2);
	}
</style>
