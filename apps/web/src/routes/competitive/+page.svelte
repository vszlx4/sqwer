<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import { LEAGUES, MIN_ACCURACY, TIERS, ZENITH_WPM, nextTier, tierFor, tierRange } from '#lib/progress/competitive.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const signedIn = $derived(!!page.data.user);
	const myTier = $derived(tierFor(data.me?.best));
	const upcoming = $derived(nextTier(myTier));
	const fmt = (n: number) => Math.round(n).toLocaleString('en');
</script>

<Seo title="Competitive" description="Sixty-second speed tiers from 50 to 300 WPM, and the sqwer leaderboards by speed and by level." />

<div class="competitive">
	<header class="head">
		<div class="intro">
			<p class="kicker">Competitive</p>
			<h1>One minute. Your best speed.</h1>
			<p class="lede">
				The competitive test is sixty seconds of common words. Your best result with at least {MIN_ACCURACY}% accuracy sets
				your rank, from Bronze III at 50 WPM through fourteen ranks of three divisions to Zenith at {ZENITH_WPM} WPM and
				above, and your place on the leaderboard.
			</p>
		</div>

		<section class="standing" aria-labelledby="standing-title">
			<h2 id="standing-title" class="sr-only">Your standing</h2>
			{#if data.me}
				<div class="tier-badge" style:--league={myTier?.league.colour ?? 'var(--ink-3)'}>
					<span class="tier-name">{myTier?.name ?? 'Unranked'}</span>
					<span class="tier-range">{myTier ? tierRange(myTier) : 'Reach 50 WPM to enter Bronze III'}</span>
				</div>
				<dl class="facts">
					<div><dt>Best speed</dt><dd>{data.me.best != null ? `${fmt(data.me.best)} WPM` : 'None yet'}</dd></div>
					<div><dt>Level</dt><dd class="violet">{data.me.level?.level ?? 1}</dd></div>
					{#if upcoming}<div><dt>Next tier</dt><dd>{upcoming.name} <small>at {upcoming.from} WPM</small></dd></div>{/if}
				</dl>
			{:else}
				<p class="note">Sign in to record a competitive speed, earn a tier and appear on the leaderboard.</p>
			{/if}
			<div class="actions">
				<a class="btn btn-primary btn-lg" href={signedIn ? '/test?exam=competitive' : '/signin?redirectTo=%2Ftest%3Fexam%3Dcompetitive'}>
					Take the competitive test <Icon name="arrow" size={18} />
				</a>
			</div>
		</section>
	</header>

	<section class="ladder" aria-labelledby="ladder-title">
		<h2 id="ladder-title">Ranks</h2>
		<p class="ladder-note">Each rank has three divisions, from III to I. Zenith has none: it is reached at {ZENITH_WPM} WPM.</p>
		<ol class="leagues">
			{#each LEAGUES as league (league.id)}
				{@const tiers = TIERS.filter((t) => t.league.id === league.id)}
				<li style:--league={league.colour} class:current={myTier?.league.id === league.id}>
					<span class="l-name">{league.name}</span>
					<span class="l-range">{tiers.at(-1)!.to === null ? `${tiers[0]!.from}+ WPM` : `${tiers[0]!.from} to ${tiers.at(-1)!.to} WPM`}</span>
					<span class="pips" aria-hidden="true">
						{#each tiers as t (t.index)}<span class:on={!!myTier && myTier.index >= t.index}></span>{/each}
					</span>
					{#if tiers.length > 1}
						<span class="divs">
							{#each tiers as t (t.index)}<span><b>{t.division}</b> {t.from}–{t.to}</span>{/each}
						</span>
					{/if}
				</li>
			{/each}
		</ol>
	</section>

	<section class="board" aria-labelledby="board-title">
		<div class="board-head">
			<h2 id="board-title">Leaderboard</h2>
			<nav class="tabs" aria-label="Rank the leaderboard by">
				<a href="/competitive" aria-current={data.by === 'speed' ? 'page' : undefined} data-sveltekit-noscroll>Speed</a>
				<a href="/competitive?by=level" aria-current={data.by === 'xp' ? 'page' : undefined} data-sveltekit-noscroll>Level</a>
			</nav>
		</div>
		{#if data.entries.length}
			<ol class="rows">
				{#each data.entries as e (e.username)}
					{@const t = tierFor(e.wpm)}
					<li class="row rise" style:--i={Math.min(e.position, 12)} class:top={e.position <= 3}>
						<span class="pos">{e.position}</span>
						{#if e.isPublic}
							<a class="who" href={`/u/${e.username}`}>
								<Avatar name={e.displayName} color={e.avatarColor} size={40} src={e.avatar} />
								<span><b>{e.displayName}</b><small>@{e.username}</small></span>
							</a>
						{:else}
							<span class="who">
								<Avatar name={e.displayName} color={e.avatarColor} size={40} src={e.avatar} />
								<span><b>{e.displayName}</b><small>Private profile</small></span>
							</span>
						{/if}
						<span class="lvl">Level {e.level}</span>
						<span class="score">
							{#if data.by === 'speed'}
								<b>{fmt(e.wpm ?? 0)} WPM</b>{#if t}<small><span class="dot" style:background={t.league.colour}></span>{t.name}</small>{/if}
							{:else}
								<b>{fmt(e.xp)} XP</b>{#if t}<small><span class="dot" style:background={t.league.colour}></span>{t.name}</small>{/if}
							{/if}
						</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="empty">No one is on this leaderboard yet. Take the competitive test to be the first.</p>
		{/if}
		<p class="note">
			Leaderboards show the display name, picture and level of people who have not switched off “Appear on leaderboards” in
			their profile settings. Names link to profiles that are public.
		</p>
	</section>
</div>

<style>
	.competitive {
		display: flex;
		flex-direction: column;
		gap: 36px;
	}
	.head {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: 28px;
		align-items: stretch;
	}
	.kicker {
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h1 {
		margin-top: 8px;
		font-size: clamp(34px, 4.6vw, 54px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 12px;
		max-width: 560px;
		font-size: 17px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	h2 {
		font-size: clamp(22px, 2.4vw, 28px);
	}
	.standing {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 22px;
		border-radius: 3px;
		background:
			radial-gradient(120% 120% at 100% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%),
			#0b0b0b;
		color: #f2f2ee;
	}
	.tier-badge {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-left: 14px;
		border-left: 4px solid var(--league);
	}
	.tier-name {
		font-family: var(--font-serif);
		font-size: 34px;
		line-height: 1.1;
	}
	.tier-range {
		font-size: 14px;
		color: #b9b9b3;
	}
	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
	}
	.facts div {
		padding: 10px 12px;
		border-radius: 3px;
		background: #151515;
		border: 1px solid #262626;
	}
	.facts dt {
		font-size: 12px;
		color: #a3a39c;
	}
	.facts dd {
		font-size: 18px;
		font-weight: 700;
	}
	.facts dd.violet {
		color: #9a8cf2;
	}
	.facts small {
		font-size: 12px;
		font-weight: 500;
		color: #a3a39c;
	}
	.standing .note {
		color: #b9b9b3;
	}
	.actions {
		margin-top: auto;
	}
	.ladder-note {
		margin-top: 6px;
		font-size: 14px;
		color: var(--ink-2);
	}
	.leagues {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 8px;
		margin-top: 14px;
	}
	.leagues li {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px 12px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: linear-gradient(to bottom, color-mix(in srgb, var(--league) 16%, transparent), transparent 70%), var(--surface);
		box-shadow: inset 0 3px 0 var(--league);
	}
	.leagues li.current {
		border-color: var(--league);
	}
	.l-name {
		font-weight: 700;
	}
	.l-range {
		font-size: 12.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.pips {
		display: flex;
		gap: 4px;
	}
	.divs {
		display: flex;
		justify-content: space-between;
		gap: 4px;
		font-size: 11.5px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.divs b {
		display: inline-block;
		min-width: 1.6em;
		color: var(--ink);
	}
	.pips span {
		flex: 1;
		height: 5px;
		border-radius: 3px;
		background: var(--surface-2);
	}
	.pips span.on {
		background: var(--league);
	}
	.board-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
	}
	.tabs {
		display: flex;
		gap: 4px;
		padding: 4px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.tabs a {
		padding: 7px 14px;
		border-radius: 3px;
		font-size: 14px;
		font-weight: 600;
		color: var(--ink-2);
		text-decoration: none;
	}
	.tabs a[aria-current='page'] {
		background: var(--bg);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.row {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto 150px;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.row.top {
		border-color: var(--line-strong);
		background: linear-gradient(90deg, color-mix(in srgb, var(--amber) 10%, transparent), transparent 40%), var(--surface);
	}
	.pos {
		font-family: var(--font-serif);
		font-size: 24px;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
	.row.top .pos {
		color: var(--amber);
	}
	.who {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
		color: var(--ink);
		text-decoration: none;
	}
	a.who:hover b {
		color: var(--ink-2);
	}
	.who > span {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.who b {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.who small {
		font-size: 12.5px;
		color: var(--ink-2);
	}
	.lvl {
		padding: 3px 8px;
		border-radius: 3px;
		background: var(--violet-soft);
		color: var(--violet);
		font-size: 12.5px;
		font-weight: 700;
		white-space: nowrap;
	}
	.score {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		font-variant-numeric: tabular-nums;
	}
	.score small {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		font-weight: 700;
		color: var(--ink-2);
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.empty,
	.note {
		font-size: 14px;
		color: var(--ink-2);
	}
	.board .note {
		margin-top: 12px;
	}
	@media (max-width: 960px) {
		.head {
			grid-template-columns: 1fr;
		}
		.leagues {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (max-width: 600px) {
		.leagues {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.divs {
			flex-direction: column;
			gap: 2px;
		}
		.row {
			grid-template-columns: 32px minmax(0, 1fr) auto;
		}
		.lvl {
			display: none;
		}
		.facts {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
