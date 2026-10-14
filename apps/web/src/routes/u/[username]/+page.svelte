<script lang="ts">
	import Avatar from '#lib/account/Avatar.svelte';
	import { EXPERIENCE, GOALS, labelOf, PLATFORMS } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const p = $derived(data.publicProfile);
</script>

<Seo title={`${p.displayName} (@${p.username})`} description={`The sqwer typing profile of ${p.displayName}.`} noindex />

<article class="profile">
	<header>
		<Avatar name={p.displayName} color={p.avatarColor} size={88} src={p.avatar} />
		<div>
			<h1>{p.displayName}</h1>
			<p class="meta">
				@{p.username} · Member since {new Date(p.memberSince).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
			</p>
		</div>
	</header>
	{#if p.bio}<p class="bio">{p.bio}</p>{/if}

	<dl class="tiles">
		<div><dt>Experience</dt><dd>{labelOf(EXPERIENCE, p.experience)}</dd></div>
		<div><dt>Main goal</dt><dd>{labelOf(GOALS, p.goal)}</dd></div>
		<div><dt>Target speed</dt><dd>{p.targetWpm} WPM</dd></div>
		<div><dt>Keyboard</dt><dd>{labelOf(PLATFORMS, p.platform)}</dd></div>
	</dl>

	<section aria-labelledby="fm-title">
		<h2 id="fm-title">Finger map</h2>
		{#if data.fingerMap}
			<dl class="tiles three">
				<div><dt>Core keys mapped</dt><dd>{data.fingerMap.coverage}%</dd></div>
				<div><dt>Keys typed with a non-standard finger</dt><dd>{data.fingerMap.keysOwnWay}</dd></div>
				<div><dt>Context habits</dt><dd>{data.fingerMap.habits}</dd></div>
			</dl>
		{:else}
			<p class="empty">This typist has not saved a finger map yet.</p>
		{/if}
	</section>
</article>

<style>
	.profile {
		display: flex;
		flex-direction: column;
		gap: 26px;
		max-width: 860px;
		margin: 0 auto;
	}
	header {
		display: flex;
		align-items: center;
		gap: 20px;
	}
	h1 {
		font-size: clamp(34px, 5vw, 52px);
		line-height: 1.05;
		overflow-wrap: anywhere;
	}
	.meta {
		margin-top: 6px;
		color: var(--ink-2);
	}
	.bio {
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
		max-width: 640px;
		overflow-wrap: anywhere;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 10px;
	}
	.tiles.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: 14px;
	}
	.tiles div {
		padding: 16px 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	dt {
		font-size: 13px;
		color: var(--ink-2);
	}
	dd {
		margin-top: 4px;
		font-size: 22px;
		font-weight: 600;
	}
	h2 {
		font-size: 28px;
	}
	.empty {
		margin-top: 10px;
		color: var(--ink-2);
	}
	@media (max-width: 760px) {
		.tiles,
		.tiles.three {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
