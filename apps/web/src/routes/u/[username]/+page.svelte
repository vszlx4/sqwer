<script lang="ts">
	import ProfileCard from '#lib/account/ProfileCard.svelte';
	import { EXPERIENCE, GOALS, labelOf, PLATFORMS } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';
	import { formatDate } from '#lib/i18n/format.ts';

	let { data }: PageProps = $props();
	const p = $derived(data.publicProfile);
	const s = $derived(data.showcase);
	const since = $derived(formatDate(p.memberSince, { month: 'long', year: 'numeric' }));

	const stats = $derived([
		...(s.stats
			? [
					{ label: 'Best speed', value: s.stats.wpm != null ? `${Math.round(s.stats.wpm)} WPM` : 'None yet', tone: 'blue' as const },
					{ label: 'Best accuracy', value: s.stats.accuracy != null ? `${Math.round(s.stats.accuracy)}%` : 'None yet', tone: 'green' as const },
					{ label: 'Lessons', value: String(s.stats.lessons), tone: 'violet' as const }
				]
			: []),
		...(s.streak != null ? [{ label: 'Streak', value: `${s.streak} ${s.streak === 1 ? 'day' : 'days'}`, tone: 'orange' as const }] : [])
	]);
</script>

<Seo title={`${p.displayName} (@${p.username})`} description={`The sqwer typing profile of ${p.displayName}.`} noindex />

<div class="profile">
	<div class="rise" style:--i="0">
		<ProfileCard
			name={p.displayName}
			username={p.username}
			headline={p.headline}
			pronouns={p.pronouns}
			bio={p.bio}
			avatarColor={p.avatarColor}
			avatar={p.avatar}
			banner={p.banner}
			rank={s.rank?.status.rank ?? null}
			{stats}
			level={1}
		>
			<p class="since">Member since {since}</p>
		</ProfileCard>
	</div>

	<div class="grid">
		<section class="panel rise" style:--i="1" aria-labelledby="about-title">
			<h2 id="about-title">Typing</h2>
			<dl class="tiles">
				<div><dt>Experience</dt><dd>{labelOf(EXPERIENCE, p.experience)}</dd></div>
				<div><dt>Main goal</dt><dd>{labelOf(GOALS, p.goal)}</dd></div>
				<div><dt>Target speed</dt><dd>{p.targetWpm} WPM</dd></div>
				<div><dt>Keyboard</dt><dd>{labelOf(PLATFORMS, p.platform)}</dd></div>
			</dl>
		</section>

		{#if s.rank}
			{@const r = s.rank.status}
			<section class="panel rise" style:--i="2" aria-labelledby="rank-title">
				<h2 id="rank-title">Course rank</h2>
				<p class="rank-line"><b>{r.rank.name}</b> · {r.points.toLocaleString('en')} points</p>
				<p class="note">{r.rank.note}</p>
				{#if r.next}
					<div class="bar" role="progressbar" aria-label={`Progress to ${r.next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.progress * 100)}>
						<span style:transform={`scaleX(${r.progress})`}></span>
					</div>
					<p class="note">{(r.next.min - r.points).toLocaleString('en')} points to {r.next.name}</p>
				{/if}
			</section>
		{/if}

		<section class="panel rise" style:--i="3" aria-labelledby="fm-title">
			<h2 id="fm-title">Finger map</h2>
			{#if data.fingerMap}
				<dl class="tiles">
					<div><dt>Core keys mapped</dt><dd>{data.fingerMap.coverage}%</dd></div>
					<div><dt>Keys typed their own way</dt><dd>{data.fingerMap.keysOwnWay}</dd></div>
					<div><dt>Context habits</dt><dd>{data.fingerMap.habits}</dd></div>
				</dl>
			{:else}
				<p class="note">This typist has not saved a finger map yet.</p>
			{/if}
		</section>
	</div>
</div>

<style>
	.profile {
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 900px;
		margin: 0 auto;
	}
	.since {
		margin-top: 8px;
		font-size: 13px;
		color: var(--ink-3);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.panel:first-child {
		grid-column: 1 / -1;
	}
	h2 {
		font-size: 24px;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 8px;
	}
	.tiles div {
		padding: 12px 14px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	dt {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	dd {
		margin-top: 2px;
		font-size: 18px;
		font-weight: 600;
	}
	.rank-line {
		font-size: 17px;
	}
	.rank-line b {
		color: var(--violet);
	}
	.note {
		font-size: 14px;
		color: var(--ink-2);
	}
	.bar {
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--violet), var(--accent));
		transform-origin: left;
	}
	@media (max-width: 760px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
