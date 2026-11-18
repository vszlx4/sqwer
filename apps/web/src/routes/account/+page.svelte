<script lang="ts">
	import { page } from '$app/state';
	import PageHead from '#lib/account/PageHead.svelte';
	import SettingsSection from '#lib/account/SettingsSection.svelte';
	import RankEmblem from '#lib/competitive/RankEmblem.svelte';
	import { lessonById } from '#lib/courses/catalog.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { formatDate, formatNumber } from '#lib/i18n/format.ts';
	import { tierFor } from '#lib/progress/competitive.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';

	/** Account overview: standing, what to do next and what needs attention, each with its action. */
	let { data }: PageProps = $props();
	const p = $derived(data.profile!);
	const user = $derived(page.data.user);
	const level = $derived(user?.level ?? null);
	const tier = $derived(tierFor(user?.best ?? null));
	const pace = $derived(user?.pace ?? null);
	const since = $derived(formatDate(data.account.createdAt, { month: 'long', year: 'numeric' }));
	const fmt = (n: number) => formatNumber(n);

	const next = $derived(courses.loaded && courses.nextLesson ? lessonById(courses.nextLesson) : null);
	const lessonsDone = $derived(Object.values(courses.progress).filter((x) => x.stars > 0).length);
	const stars = $derived(Object.values(courses.progress).reduce((t, x) => t + x.stars, 0));

	interface Action {
		icon: IconName;
		title: string;
		line: string;
		href: string;
		/** Typing tests open with a full page load. */
		reload?: boolean;
	}
	const lead = $derived<Action | null>(
		next
			? { icon: 'route', title: `Lesson ${next.order}: ${next.title}`, line: 'Next on your learning path.', href: `/learn/${next.id}` }
			: courses.loaded
				? { icon: 'route', title: 'Find your starting chapter', line: 'A one-minute placement test picks where to begin.', href: '/learn/start' }
				: null
	);
	const quick = $derived.by<Action[]>(() => {
		const out: Action[] = [
			{ icon: 'gauge', title: 'Timed test', line: pace?.tests ? `Usually ${Math.round(pace.wpm ?? 0)} WPM` : '30 seconds, earns XP', href: '/practice/test/timed', reload: true },
			{ icon: 'trophy', title: 'Ranked test', line: user?.best ? `Best ${Math.round(user.best)} WPM` : 'Sets your speed rank', href: '/competitive/test', reload: true }
		];
		if (!data.fingerMap.count) out.push({ icon: 'hand', title: 'Map your fingers', line: 'Guidance that fits how you type', href: '/practice/finger-map' });
		else out.push({ icon: 'history', title: 'History', line: 'Results and replays', href: '/practice/history' });
		return out;
	});

	interface Check {
		state: 'ok' | 'warn' | 'off';
		title: string;
		line: string;
		href: string;
		action: string;
	}
	const checks = $derived<Check[]>([
		{
			state: data.recoveryCodes > 2 ? 'ok' : 'warn',
			title: 'Recovery codes',
			line: `${data.recoveryCodes} of 8 left`,
			href: '/account/security',
			action: data.recoveryCodes > 2 ? 'Manage' : 'Make new'
		},
		{ state: 'ok', title: 'Devices', line: `${data.sessionCount} signed in`, href: '/account/security', action: 'Review' },
		{
			state: p.isPublic ? 'ok' : 'off',
			title: 'Profile',
			line: p.isPublic ? 'Public' : 'Private',
			href: '/account/privacy',
			action: 'Change'
		},
		{
			state: data.fingerMap.count ? 'ok' : 'off',
			title: 'Finger map',
			line: data.fingerMap.count ? `${fmt(data.fingerMap.count)} keystrokes` : 'Not mapped yet',
			href: '/practice/finger-map',
			action: 'Open'
		}
	]);
	const ICON: Record<Check['state'], IconName> = { ok: 'check', warn: 'info', off: 'info' };
</script>

<Seo title="Account overview" description="Your sqwer account overview." noindex />

<PageHead title={p.displayName} line={`@${p.username} · Member since ${since}`}>
	{#snippet action()}
		<a class="btn" href="/account/profile">Edit profile</a>
	{/snippet}
</PageHead>

{#if data.welcome}
	<p class="form-alert success welcome" role="status">Your profile is complete. Welcome to sqwer.</p>
{/if}

<dl class="standing">
	<div>
		<dt>Level</dt>
		<dd class="level">
			{#if level}
				<span class="big">{level.level}</span>
				<span class="bar" role="progressbar" aria-label={`Progress to level ${level.level + 1}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level.progress * 100)}>
					<span style:transform={`scaleX(${level.progress})`}></span>
				</span>
				<span class="sub">{fmt(level.next - level.xp)} XP to level {level.level + 1}</span>
			{:else}
				<span class="sub">Finish a test to earn XP</span>
			{/if}
		</dd>
	</div>
	<div>
		<dt>Competitive</dt>
		<dd class="rank">
			<RankEmblem league={tier?.league ?? null} size={36} />
			<span><b>{tier?.name ?? 'Unranked'}</b><span class="sub">{user?.best ? `Best ${Math.round(user.best)} WPM` : 'No ranked test yet'}</span></span>
		</dd>
	</div>
	<div>
		<dt>Course</dt>
		<dd>
			<b>{courses.loaded ? courses.rank.rank.name : '…'}</b>
			<span class="sub">{courses.loaded ? `${fmt(courses.rank.points)} points` : 'Loading'}</span>
		</dd>
	</div>
	<div>
		<dt>Streak</dt>
		<dd>
			<b>{courses.loaded ? `${courses.streak} ${courses.streak === 1 ? 'day' : 'days'}` : '…'}</b>
			<span class="sub">{courses.loaded ? `${lessonsDone} lessons · ${stars} stars` : 'Loading'}</span>
		</dd>
	</div>
</dl>

<div class="grid">
	<SettingsSection title="Continue" flush>
		{#if lead}
			<a class="lead" href={lead.href}>
				<span class="lead-icon" aria-hidden="true"><Icon name={lead.icon} size={20} /></span>
				<span class="text"><b>{lead.title}</b><span>{lead.line}</span></span>
				<span class="btn btn-primary">Continue <Icon name="arrow" size={15} /></span>
			</a>
		{/if}
		<ul class="quick">
			{#each quick as q (q.title)}
				<li>
					<a href={q.href} data-sveltekit-reload={q.reload ? '' : undefined}>
						<Icon name={q.icon} size={18} />
						<span class="text"><b>{q.title}</b><span>{q.line}</span></span>
						<Icon name="arrow" size={15} />
					</a>
				</li>
			{/each}
		</ul>
	</SettingsSection>

	<SettingsSection title="Account" flush>
		<ul class="checks">
			{#each checks as c (c.title)}
				<li>
					<span class={`state ${c.state}`} aria-hidden="true"><Icon name={ICON[c.state]} size={15} /></span>
					<span class="text"><b>{c.title}</b><span class:warn-text={c.state === 'warn'}>{c.line}</span></span>
					<a class="row-link" href={c.href}>{c.action}<span class="sr-only"> {c.title.toLowerCase()}</span></a>
				</li>
			{/each}
		</ul>
	</SettingsSection>
</div>

<style>
	.welcome {
		margin-bottom: var(--space-16);
	}
	.standing {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin: 0 0 var(--space-16);
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--bg);
	}
	.standing > div {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding: var(--space-16) var(--space-20);
		min-width: 0;
	}
	.standing > div + div {
		border-left: 1px solid var(--line);
	}
	dt {
		font-size: var(--fs-13);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
	}
	dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
	}
	dd b {
		display: block;
		font-size: var(--fs-18);
	}
	.sub {
		display: block;
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	.level {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: var(--space-4) var(--space-10);
	}
	.big {
		grid-row: 1 / span 2;
		display: grid;
		place-items: center;
		min-width: 40px;
		height: 40px;
		padding: 0 var(--space-6);
		border-radius: var(--radius);
		background: var(--violet);
		color: var(--on-hue);
		font-size: var(--fs-18);
		font-weight: var(--fw-bold);
	}
	.bar {
		height: 6px;
		border-radius: var(--radius);
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--xp-bar);
		transform-origin: left;
	}
	.rank {
		display: flex;
		align-items: center;
		gap: var(--space-10);
	}
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
		gap: var(--space-16);
		align-items: start;
	}
	.text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.text b {
		font-size: var(--fs-15);
	}
	.text span {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.lead {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-20);
		color: var(--ink);
		text-decoration: none;
	}
	.lead-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: var(--radius);
		background: var(--lime);
		color: var(--on-hue);
	}
	.lead:hover .btn-primary {
		filter: brightness(0.94);
	}
	.lead:focus-visible,
	.quick a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	.quick,
	.checks {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.quick {
		border-top: 1px solid var(--line);
	}
	.quick li + li,
	.checks li + li {
		border-top: 1px solid var(--line);
	}
	.quick a {
		display: grid;
		grid-template-columns: 20px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-12) var(--space-20);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.quick a:hover {
		background: var(--surface);
	}
	.quick a > :global(svg:last-child) {
		color: var(--ink-3);
		transition: transform var(--dur-fast) var(--ease-out);
	}
	.quick a:hover > :global(svg:last-child) {
		transform: translateX(3px);
		color: var(--ink);
	}
	.checks li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-12);
		padding: var(--space-12) var(--space-20);
	}
	.state {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink-2);
	}
	.state.ok {
		background: var(--success-soft);
		color: var(--success);
	}
	.state.warn {
		background: var(--error-soft);
		color: var(--error);
	}
	.text .warn-text {
		color: var(--error);
		font-weight: var(--fw-semibold);
	}
	.row-link {
		min-height: 32px;
		display: inline-flex;
		align-items: center;
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink);
	}
	@media (max-width: 1100px) {
		.standing {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.standing > div:nth-child(3) {
			border-left: 0;
		}
		.standing > div:nth-child(n + 3) {
			border-top: 1px solid var(--line);
		}
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	@media (max-width: 560px) {
		.lead {
			grid-template-columns: 44px minmax(0, 1fr);
		}
		.lead .btn-primary {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 420px) {
		.standing {
			grid-template-columns: minmax(0, 1fr);
		}
		.standing > div + div {
			border-left: 0;
			border-top: 1px solid var(--line);
		}
	}
</style>
