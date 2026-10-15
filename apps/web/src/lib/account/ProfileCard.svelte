<script lang="ts">
	import type { Snippet } from 'svelte';
	import RankBadge from '#lib/courses/RankBadge.svelte';
	import type { Rank } from '#lib/courses/progression.ts';
	import { bannerOf } from '#lib/profile.ts';
	import Avatar from './Avatar.svelte';

	/**
	 * A profile as others see it: the banner, the picture overlapping it, name and handle, an
	 * optional headline and pronouns, the rank and a few showcase figures. Used by the profile
	 * editor's preview, the account overview and public profiles, so all three always match.
	 */
	interface Props {
		name: string;
		username: string;
		headline?: string;
		pronouns?: string;
		bio?: string;
		avatarColor: string;
		avatar?: string | null;
		banner: string;
		rank?: Rank | null;
		stats?: { label: string; value: string; tone?: 'amber' | 'orange' | 'green' | 'blue' | 'violet' }[];
		/** Headline level for the name; the public page uses 1. */
		level?: 1 | 2 | 3;
		size?: 'compact' | 'full';
		children?: Snippet;
	}

	let { name, username, headline = '', pronouns = '', bio = '', avatarColor, avatar = null, banner, rank = null, stats = [], level = 2, size = 'full', children }: Props = $props();
	const b = $derived(bannerOf(banner));
</script>

<article class="profile-card" class:compact={size === 'compact'}>
	<div class="banner" style:background={b.css} aria-hidden="true">
		<span class="grain"></span>
	</div>
	<div class="body">
		<div class="identity">
			<span class="avatar-ring"><Avatar {name} color={avatarColor} size={size === 'compact' ? 64 : 92} src={avatar} /></span>
			{#if rank}
				<span class="rank" title={`Rank: ${rank.name}`}><RankBadge {rank} size={size === 'compact' ? 34 : 42} /><span>{rank.name}</span></span>
			{/if}
		</div>
		<svelte:element this={`h${level}`} class="name">{name}</svelte:element>
		<p class="handle">@{username}{#if pronouns}<span class="pronouns">{pronouns}</span>{/if}</p>
		{#if headline}<p class="headline">{headline}</p>{/if}
		{#if bio}<p class="bio">{bio}</p>{/if}
		{#if stats.length}
			<dl class="stats">
				{#each stats as s (s.label)}
					<div><dt>{s.label}</dt><dd class={s.tone ?? ''}>{s.value}</dd></div>
				{/each}
			</dl>
		{/if}
		{@render children?.()}
	</div>
</article>

<style>
	.profile-card {
		overflow: hidden;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		background: var(--surface);
		box-shadow: var(--shadow);
	}
	.banner {
		position: relative;
		height: 120px;
	}
	.compact .banner {
		height: 76px;
	}
	/* A faint key grid over every banner, so even plain colours feel made for sqwer. */
	.grain {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(rgb(255 255 255 / 0.14) 1px, transparent 1px) 0 0 / 28px 28px,
			linear-gradient(90deg, rgb(255 255 255 / 0.14) 1px, transparent 1px) 0 0 / 28px 28px;
		mask-image: linear-gradient(to bottom, #000, transparent);
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 0 22px 22px;
	}
	.compact .body {
		padding: 0 16px 16px;
	}
	.identity {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		margin-top: -46px;
		margin-bottom: 6px;
	}
	.compact .identity {
		margin-top: -32px;
	}
	.avatar-ring {
		display: inline-flex;
		padding: 4px;
		border-radius: 3px;
		background: var(--surface);
	}
	.rank {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px 4px 4px;
		border-radius: 3px;
		background: var(--violet-soft);
		color: var(--violet);
		font-size: 13px;
		font-weight: 700;
	}
	.name {
		font-family: var(--font-serif);
		font-weight: 400;
		font-size: 30px;
		line-height: 1.1;
		color: var(--ink);
		overflow-wrap: anywhere;
	}
	.compact .name {
		font-size: 22px;
	}
	.handle {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.pronouns {
		padding: 1px 7px;
		border-radius: 3px;
		background: var(--surface-2);
		font-size: 12.5px;
	}
	.headline {
		margin-top: 4px;
		font-size: 15.5px;
		font-weight: 600;
		color: var(--ink);
	}
	.bio {
		font-size: 14.5px;
		line-height: 1.55;
		color: var(--ink-2);
		white-space: pre-line;
		overflow-wrap: anywhere;
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
		gap: 8px;
		margin-top: 10px;
	}
	.stats div {
		padding: 10px 12px;
		border-radius: 3px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	.stats dt {
		font-size: 12px;
		color: var(--ink-2);
	}
	.stats dd {
		font-size: 20px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--ink);
	}
	.stats dd.amber {
		color: var(--amber);
	}
	.stats dd.orange {
		color: var(--orange);
	}
	.stats dd.green {
		color: var(--green);
	}
	.stats dd.blue {
		color: var(--blue);
	}
	.stats dd.violet {
		color: var(--violet);
	}
</style>
