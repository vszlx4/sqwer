<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '#lib/account/Avatar.svelte';
	import RankEmblem from '#lib/competitive/RankEmblem.svelte';
	import { enter } from '#lib/motion/actions.ts';
	import { LEAGUES, MIN_ACCURACY, TIERS, ZENITH_WPM, nextTier, tierFor, tierRange, type League } from '#lib/progress/competitive.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const signedIn = $derived(!!page.data.user);
	const myTier = $derived(tierFor(data.me?.best));
	const upcoming = $derived(nextTier(myTier));
	const fmt = (n: number) => Math.round(n).toLocaleString('en');
	const playHref = $derived(signedIn ? '/test?exam=competitive' : '/signin?redirectTo=%2Ftest%3Fexam%3Dcompetitive');

	/** Progress from the start of the current tier to the next one. */
	const toNext = $derived.by(() => {
		if (!upcoming || data.me?.best == null) return { share: 0, gap: upcoming ? upcoming.from : 0 };
		const from = myTier?.from ?? 0;
		return { share: Math.min(1, Math.max(0, (data.me.best - from) / (upcoming.from - from))), gap: Math.max(0, upcoming.from - Math.floor(data.me.best)) };
	});

	// The rank explorer opens on the player's own rank, or the first rank.
	let chosen = $state<string | null>(null);
	const selected = $derived(LEAGUES.find((l) => l.id === (chosen ?? myTier?.league.id ?? LEAGUES[0].id))!);
	const selectedTiers = $derived(TIERS.filter((t) => t.league.id === selected.id));
	const playersIn = (league: League) => data.bests.filter((b) => tierFor(b)?.league.id === league.id).length;

	const podium = $derived(data.entries.slice(0, 3));
	const rest = $derived(data.entries.slice(3));
</script>

<Seo title="Competitive" description="Ranked typing: a 60-second test, eleven ranks from Silver to Zenith, and leaderboards by speed and by level." />

<div class="competitive">
	<section class="arena band on-band" aria-labelledby="arena-title">
		<div class="arena-grid">
			<div class="intro">
				<p class="kicker"><span class="live-dot" aria-hidden="true"></span> Ranked</p>
				<h1 id="arena-title">One minute.<br />Your best speed.</h1>
				<p class="lede">
					Sixty seconds of the most common, fastest-flowing words. Your best result with at least {MIN_ACCURACY}% accuracy sets
					your rank, from Silver to Zenith at {ZENITH_WPM} WPM.
				</p>
				<div class="cta">
					<a class="btn btn-primary btn-lg play" href={playHref}><Icon name="play" size={18} /> Play ranked</a>
					<a class="btn btn-lg ghost" href="#leaderboard">Leaderboard</a>
				</div>
			</div>

			<div class="me" aria-label="Your rank">
				<div class="me-emblem">
					<RankEmblem league={myTier?.league ?? null} size={176} />
				</div>
				<p class="me-label">{data.me ? 'Your rank' : 'Unranked'}</p>
				<p class="me-name">{myTier?.name ?? 'Unranked'}</p>
				<p class="me-range">
					{#if myTier}{tierRange(myTier)}{:else if data.me}Reach 50 WPM with {MIN_ACCURACY}% accuracy to enter {TIERS[0]!.name}{:else}Sign in to play ranked and earn a rank{/if}
				</p>
				{#if data.me}
					<dl class="me-stats">
						<div><dt>Best</dt><dd>{data.me.best != null ? `${fmt(data.me.best)} WPM` : 'None yet'}</dd></div>
						<div><dt>Place</dt><dd>{data.me.standing ? `#${data.me.standing.position}` : 'None'}<small>{data.me.standing ? ` of ${data.me.standing.players}` : ''}</small></dd></div>
						<div><dt>Level</dt><dd class="violet">{data.me.level?.level ?? 1}</dd></div>
					</dl>
					{#if upcoming}
						<div class="next">
							<div class="next-bar" role="progressbar" aria-label={`Progress to ${upcoming.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(toNext.share * 100)}>
								<span style:transform={`scaleX(${toNext.share})`}></span>
							</div>
							<p class="next-text">
								<RankEmblem league={upcoming.league} size={26} />
								<span><b>{toNext.gap} WPM</b> to {upcoming.name}</span>
							</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</section>

	<section class="ranks band" aria-labelledby="ranks-title">
		<div class="ranks-head">
			<h2 id="ranks-title">Eleven ranks</h2>
		</div>
		<div class="rail" role="tablist" aria-label="Ranks">
			{#each LEAGUES as league (league.id)}
				{@const reached = !!myTier && LEAGUES.indexOf(myTier.league) >= LEAGUES.indexOf(league)}
				<button
					type="button"
					role="tab"
					class="rank-tab"
					class:active={selected.id === league.id}
					class:reached
					aria-selected={selected.id === league.id}
					aria-controls="rank-detail"
					onclick={() => (chosen = league.id)}
					style:--league={league.colour}
				>
					<RankEmblem {league} size={64} />
					<span class="tab-name">{league.name}</span>
					<span class="tab-from">{league.starts[0]}+</span>
				</button>
			{/each}
		</div>

		{#key selected.id}
			<div class="detail" id="rank-detail" role="tabpanel" style:--league={selected.colour} use:enter>
				<div class="detail-emblem">
					<RankEmblem league={selected} size={200} />
				</div>
				<div class="detail-body">
					<p class="detail-kicker">Rank {LEAGUES.indexOf(selected) + 1} of {LEAGUES.length}</p>
					<h3>{selected.name}</h3>
					<p class="detail-range">
						{selectedTiers.at(-1)!.to === null ? `${selectedTiers[0]!.from} WPM and above` : `${selectedTiers[0]!.from} to ${selectedTiers.at(-1)!.to} WPM`}
						· {playersIn(selected)} {playersIn(selected) === 1 ? 'player' : 'players'}
					</p>
					<ol class="divisions">
						{#each [...selectedTiers].reverse() as t (t.index)}
							<li class:mine={myTier?.index === t.index}>
								<RankEmblem league={selected} size={56} />
								<span class="div-name">{t.name}</span>
								<span class="div-range">{tierRange(t)}</span>
								{#if myTier?.index === t.index}<span class="you">You</span>{/if}
							</li>
						{/each}
					</ol>
				</div>
			</div>
		{/key}
	</section>

	<section class="board" id="leaderboard" aria-labelledby="board-title">
		<div class="board-head">
			<h2 id="board-title">Leaderboard</h2>
			<nav class="tabs" aria-label="Rank the leaderboard by">
				<a href="/competitive#leaderboard" aria-current={data.by === 'speed' ? 'page' : undefined} data-sveltekit-noscroll>Speed</a>
				<a href="/competitive?by=level#leaderboard" aria-current={data.by === 'xp' ? 'page' : undefined} data-sveltekit-noscroll>Level</a>
			</nav>
		</div>

		{#if data.entries.length}
			<ol class="podium" aria-label="Top three">
				{#each podium as e (e.username)}
					{@const t = tierFor(e.wpm)}
					<li class={`place p${e.position}`}>
						<span class="medal">{e.position}</span>
						<Avatar name={e.displayName} color={e.avatarColor} size={e.position === 1 ? 72 : 60} src={e.avatar} />
						{#if e.isPublic}<a class="pod-name" href={`/u/${e.username}`}>{e.displayName}</a>{:else}<span class="pod-name">{e.displayName}</span>{/if}
						<span class="pod-score">{data.by === 'speed' ? `${fmt(e.wpm ?? 0)} WPM` : `${fmt(e.xp)} XP`}</span>
						{#if t}<span class="pod-tier"><RankEmblem league={t.league} size={30} /> {t.name}</span>{/if}
						<span class="pod-level">Level {e.level}</span>
					</li>
				{/each}
			</ol>

			{#if rest.length}
				<ol class="rows">
					{#each rest as e (e.username)}
						{@const t = tierFor(e.wpm)}
						<li class="row">
							<span class="pos">{e.position}</span>
							{#if e.isPublic}
								<a class="who" href={`/u/${e.username}`}>
									<Avatar name={e.displayName} color={e.avatarColor} size={38} src={e.avatar} />
									<span><b>{e.displayName}</b><small>@{e.username}</small></span>
								</a>
							{:else}
								<span class="who">
									<Avatar name={e.displayName} color={e.avatarColor} size={38} src={e.avatar} />
									<span><b>{e.displayName}</b><small>Private profile</small></span>
								</span>
							{/if}
							<span class="lvl">Level {e.level}</span>
							<span class="tier">{#if t}<RankEmblem league={t.league} size={30} /><span>{t.name}</span>{/if}</span>
							<span class="score">{data.by === 'speed' ? `${fmt(e.wpm ?? 0)} WPM` : `${fmt(e.xp)} XP`}</span>
						</li>
					{/each}
				</ol>
			{/if}
		{:else}
			<div class="empty">
				<RankEmblem league={null} size={72} />
				<p>No one is on this leaderboard yet. Play ranked to take the first place.</p>
				<a class="btn btn-primary" href={playHref}>Play ranked</a>
			</div>
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
		/* The page opens straight into the arena, under the floating header. */
		margin-top: calc(-1 * (var(--header-h) + var(--main-top)));
	}
	/* Arena: a band, light or dark with the theme. */
	.arena {
		padding: calc(var(--header-h) + clamp(var(--space-40), 6vw, var(--space-64))) 0 clamp(var(--space-40), 6vw, var(--space-64));
		color: var(--band-ink);
	}
	.arena::before {
		background:
			radial-gradient(60% 80% at 80% 20%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
			radial-gradient(50% 70% at 0% 100%, color-mix(in srgb, var(--violet) 18%, transparent), transparent 60%),
			repeating-linear-gradient(115deg, transparent 0 22px, color-mix(in srgb, var(--band-ink) 2%, transparent) 22px 23px),
			var(--band-bg-deep);
	}
	.arena-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
		gap: var(--space-40);
		align-items: center;
	}
	.kicker {
		display: inline-flex;
		align-items: center;
		gap: var(--space-8);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--accent-ink);
	}
	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		animation: live 1.8s ease-out infinite;
	}
	@keyframes live {
		from {
			box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 60%, transparent);
		}
		to {
			box-shadow: 0 0 0 10px color-mix(in srgb, var(--accent) 0%, transparent);
		}
	}
	h1 {
		margin-top: var(--space-12);
		font-size: var(--fs-hero);
		line-height: var(--lh-tight);
		letter-spacing: var(--tr-tight);
	}
	.lede {
		margin-top: var(--space-20);
		max-width: var(--w-narrow);
		font-size: var(--fs-18);
		line-height: var(--lh-body);
		color: var(--band-ink-2);
	}
	.cta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-10);
		margin-top: var(--space-32);
	}
	.play {
		box-shadow: 0 0 32px -6px color-mix(in srgb, var(--accent) 60%, transparent);
	}
	.ghost {
		border-color: var(--band-line-strong);
		background: transparent;
		color: var(--band-ink);
	}
	.ghost:hover {
		border-color: var(--band-ink);
	}
	.me {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-4);
		padding: var(--space-24) var(--space-24) var(--space-24);
		border-radius: var(--radius);
		border: 1px solid var(--band-line);
		background: linear-gradient(to bottom, var(--band-sheen), color-mix(in srgb, var(--band-ink) 1%, transparent));
	}
	.me-emblem {
		margin-top: calc(var(--space-6) * -1);
		animation: float 5s ease-in-out infinite;
	}
	@keyframes float {
		50% {
			transform: translateY(-6px);
		}
	}
	.me-label {
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--band-ink-3);
	}
	.me-name {
		font-family: var(--font-serif);
		font-size: var(--fs-40);
		line-height: var(--lh-snug);
	}
	.me-range {
		font-size: var(--fs-14);
		color: var(--band-ink-2);
	}
	.me-stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-6);
		width: 100%;
		margin-top: var(--space-16);
	}
	.me-stats div {
		padding: var(--space-10);
		border-radius: var(--radius);
		background: var(--band-surface);
		border: 1px solid var(--band-line);
	}
	.me-stats dt {
		font-size: var(--fs-12);
		color: var(--band-ink-3);
	}
	.me-stats dd {
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
		font-variant-numeric: tabular-nums;
	}
	.me-stats small {
		font-size: var(--fs-12);
		font-weight: var(--fw-regular);
		color: var(--band-ink-3);
	}
	.violet {
		color: var(--violet-ink);
	}
	.next {
		width: 100%;
		margin-top: var(--space-12);
	}
	.next-bar {
		height: 8px;
		border-radius: var(--radius);
		background: var(--band-surface-2);
		overflow: hidden;
	}
	.next-bar span {
		display: block;
		height: 100%;
		background: linear-gradient(90deg, var(--violet), var(--accent));
		transform-origin: left;
		transition: transform var(--dur-reveal) var(--ease-out);
	}
	.next-text {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		margin-top: var(--space-8);
		font-size: var(--fs-14);
		color: var(--band-ink-2);
	}
	.next-text b {
		color: var(--band-ink);
	}
	/* Ranks: a rail of emblems and the chosen rank in detail. */
	.ranks {
		padding: var(--space-48) 0 var(--space-48);
		color: var(--band-ink);
	}
	.ranks::before {
		background:
			radial-gradient(60% 60% at 50% 100%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%),
			var(--band-bg);
		border-top: 1px solid var(--band-line);
	}
	.ranks-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-8) var(--space-20);
	}
	.ranks-head h2 {
		font-size: var(--fs-title);
	}
	/* Every rank in view: the rail wraps instead of scrolling sideways. */
	.rail {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
		gap: var(--space-6);
		margin-top: var(--space-20);
		padding: var(--space-6) var(--space-2) var(--space-12);
	}
	.rank-tab {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-10) var(--space-4);
		border-radius: var(--radius);
		border: 1px solid transparent;
		background: none;
		color: var(--band-ink-3);
		font: inherit;
		cursor: pointer;
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out),
			transform var(--dur-base) var(--ease-out);
	}
	.rank-tab:hover {
		transform: translateY(-3px);
		color: var(--band-ink);
	}
	.rank-tab.active {
		border-color: color-mix(in srgb, var(--league) 70%, transparent);
		background: color-mix(in srgb, var(--league) 12%, transparent);
		color: var(--band-ink);
	}
	.rank-tab:not(.reached) :global(.emblem) {
		opacity: 0.6;
	}
	.rank-tab.active :global(.emblem),
	.rank-tab:hover :global(.emblem) {
		opacity: 1;
	}
	.tab-name {
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
	}
	.tab-from {
		font-size: var(--fs-11);
		color: var(--band-ink-3);
		font-variant-numeric: tabular-nums;
	}
	.detail {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: var(--space-32);
		align-items: center;
		margin-top: var(--space-20);
		padding: var(--space-24) var(--space-32);
		border-radius: var(--radius);
		border: 1px solid var(--band-line);
		background:
			radial-gradient(70% 120% at 0% 50%, color-mix(in srgb, var(--league) 18%, transparent), transparent 60%),
			var(--band-surface);
	}
	.detail-kicker {
		font-size: var(--fs-12);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-caps);
		text-transform: uppercase;
		color: var(--band-ink-3);
	}
	.detail h3 {
		font-family: var(--font-serif);
		font-weight: var(--fw-regular);
		font-size: var(--fs-display);
		line-height: var(--lh-snug);
	}
	.detail-range {
		margin-top: var(--space-4);
		font-size: var(--fs-15);
		color: var(--band-ink-2);
	}
	.divisions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
		gap: var(--space-8);
		margin-top: var(--space-20);
	}
	.divisions li {
		position: relative;
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
		column-gap: var(--space-10);
		align-items: center;
		padding: var(--space-10) var(--space-12);
		border-radius: var(--radius);
		border: 1px solid var(--band-line);
		background: var(--band-surface);
		text-align: left;
	}
	.divisions li.mine {
		border-color: var(--league);
		box-shadow: inset 0 0 0 1px var(--league);
	}
	.divisions :global(.emblem) {
		grid-row: span 2;
	}
	.div-name {
		font-weight: var(--fw-bold);
	}
	.div-range {
		font-size: var(--fs-13);
		color: var(--band-ink-2);
		font-variant-numeric: tabular-nums;
	}
	.you {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 1px var(--space-6);
		border-radius: var(--radius);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-11);
		font-weight: var(--fw-bold);
	}

	/* Leaderboard. */
	.board {
		padding-top: var(--space-48);
		scroll-margin-top: 80px;
	}
	.board-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-12);
		margin-bottom: var(--space-20);
	}
	.board-head h2 {
		font-size: var(--fs-title);
	}
	.tabs {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.tabs a {
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		text-decoration: none;
	}
	.tabs a[aria-current='page'] {
		background: var(--bg);
		color: var(--ink);
		box-shadow: var(--shadow);
	}
	.podium {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-10);
		align-items: end;
		margin-bottom: var(--space-12);
	}
	.place {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding: var(--space-24) var(--space-16) var(--space-20);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
		text-align: center;
	}
	.place.p1 {
		order: 2;
		padding-top: var(--space-32);
		border-color: color-mix(in srgb, var(--reward) 60%, var(--line));
		background: linear-gradient(to bottom, var(--reward-soft), var(--surface) 70%);
	}
	.place.p2 {
		order: 1;
	}
	.place.p3 {
		order: 3;
	}
	.medal {
		position: absolute;
		top: 10px;
		left: 12px;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--surface-2);
		font-family: var(--font-serif);
		font-size: var(--fs-18);
	}
	.p1 .medal {
		background: linear-gradient(135deg, var(--medal-gold-hi), var(--medal-gold-lo));
		color: var(--medal-gold-ink);
	}
	.p2 .medal {
		background: linear-gradient(135deg, var(--medal-silver-hi), var(--medal-silver-lo));
		color: var(--medal-silver-ink);
	}
	.p3 .medal {
		background: linear-gradient(135deg, var(--medal-bronze-hi), var(--medal-bronze-lo));
		color: var(--medal-bronze-ink);
	}
	.pod-name {
		font-weight: var(--fw-bold);
		color: var(--ink);
		text-decoration: none;
	}
	a.pod-name:hover {
		color: var(--ink-2);
	}
	.pod-score {
		font-family: var(--font-serif);
		font-size: var(--fs-28);
		font-variant-numeric: tabular-nums;
	}
	.pod-tier {
		display: inline-flex;
		align-items: center;
		gap: var(--space-4);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		color: var(--ink-2);
	}
	.pod-level {
		font-size: var(--fs-12);
		color: var(--rank);
		font-weight: var(--fw-bold);
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.row {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr) auto 170px 110px;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-8) var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.pos {
		font-family: var(--font-serif);
		font-size: var(--fs-20);
		text-align: center;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.who {
		display: flex;
		align-items: center;
		gap: var(--space-12);
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
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.lvl {
		padding: var(--space-4) var(--space-8);
		border-radius: var(--radius);
		background: var(--rank-soft);
		color: var(--rank);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		white-space: nowrap;
	}
	.tier {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-13);
		font-weight: var(--fw-bold);
		color: var(--ink-2);
	}
	.score {
		text-align: right;
		font-weight: var(--fw-bold);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-40) var(--space-20);
		border-radius: var(--radius);
		border: 1px dashed var(--line-strong);
		text-align: center;
		color: var(--ink-2);
	}
	.note {
		margin-top: var(--space-16);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	@media (max-width: 900px) {
		.arena-grid {
			grid-template-columns: 1fr;
		}
		.detail {
			grid-template-columns: 1fr;
			justify-items: center;
			text-align: center;
		}
		.row {
			grid-template-columns: 36px minmax(0, 1fr) auto 90px;
		}
		.tier {
			display: none;
		}
	}
	@media (max-width: 560px) {
		.podium {
			grid-template-columns: 1fr;
		}
		.place.p1,
		.place.p2,
		.place.p3 {
			order: 0;
		}
		.row {
			grid-template-columns: 30px minmax(0, 1fr) 80px;
		}
		.lvl {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.live-dot,
		.me-emblem {
			animation: none;
		}
	}
</style>
