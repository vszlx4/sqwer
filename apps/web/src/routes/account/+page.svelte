<script lang="ts">
	import { page } from '$app/state';
	import { lessonById } from '#lib/courses/catalog.ts';
	import { courses } from '#lib/courses/store.svelte.ts';
	import { enter } from '#lib/motion/actions.ts';
	import { EXPERIENCE, GOALS, labelOf, PLATFORMS } from '#lib/profile.ts';
	import Seo from '#lib/site/Seo.svelte';
	import Icon, { type IconName } from '#lib/ui/Icon.svelte';
	import type { PageProps } from './$types';
	import { formatNumber } from '#lib/i18n/format.ts';

	/** Account overview: next steps, setup status, items needing attention. */
	let { data }: PageProps = $props();
	const p = $derived(data.profile!);
	const pace = $derived(page.data.user?.pace ?? null);

	const next = $derived(courses.loaded && courses.nextLesson ? lessonById(courses.nextLesson) : null);
	const lessonsDone = $derived(Object.values(courses.progress).filter((x) => x.stars > 0).length);
	const stars = $derived(Object.values(courses.progress).reduce((t, x) => t + x.stars, 0));

	interface Step {
		icon: IconName;
		title: string;
		body: string;
		href: string;
		action: string;
	}
	const steps = $derived.by<Step[]>(() => {
		const out: Step[] = [];
		if (next) out.push({ icon: 'route', title: `Lesson ${next.order}: ${next.title}`, body: 'Your next lesson on the learning path.', href: `/learn/${next.id}`, action: 'Continue' });
		else if (courses.loaded) out.push({ icon: 'route', title: 'Find your starting chapter', body: 'A one-minute placement test recommends where to begin.', href: '/learn/start', action: 'Start' });
		out.push({ icon: 'gauge', title: 'Take a timed test', body: pace?.tests ? `Your usual pace is ${Math.round(pace.wpm ?? 0)} WPM. Every test earns XP.` : 'Thirty seconds of everyday words. Every test earns XP.', href: '/test?exam=timed', action: 'Start test' });
		out.push({ icon: 'trophy', title: 'Play ranked', body: 'One minute at 92% accuracy or more sets your speed rank.', href: '/test?exam=competitive', action: 'Play' });
		if (!data.fingerMap.count) out.push({ icon: 'hand', title: 'Map your fingers', body: 'Record which finger you use for each key, for guidance that fits how you type.', href: '/map', action: 'Open' });
		return out;
	});
</script>

<Seo title="Account overview" description="Your sqwer account overview." noindex />

<div class="overview">
	{#if data.welcome}
		<p class="form-alert success" role="status">Your profile is complete. Thank you for setting up your account.</p>
	{/if}

	<section aria-labelledby="next-title">
		<div class="section-head">
			<h2 id="next-title">Next steps</h2>
		</div>
		<ul class="steps">
			{#each steps as s, i (s.title)}
				<li use:enter={{ i }}>
					<a href={s.href} data-sveltekit-reload={s.href.startsWith('/test') ? '' : undefined}>
						<span class="step-icon" aria-hidden="true"><Icon name={s.icon} size={18} /></span>
						<span class="step-text"><b>{s.title}</b><span>{s.body}</span></span>
						<span class="step-go">{s.action} <Icon name="arrow" size={15} /></span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="progress-title">
		<div class="section-head">
			<h2 id="progress-title">Learning path</h2>
			<a class="more" href="/learn">Open the path <Icon name="arrow" size={15} /></a>
		</div>
		<dl class="figures">
			<div><dt>Lessons completed</dt><dd>{courses.loaded ? lessonsDone : '–'}</dd></div>
			<div><dt>Stars</dt><dd>{courses.loaded ? stars : '–'}</dd></div>
			<div><dt>Course points</dt><dd>{courses.loaded ? formatNumber(courses.rank.points) : '–'}</dd></div>
			<div><dt>Streak</dt><dd>{courses.loaded ? `${courses.streak} ${courses.streak === 1 ? 'day' : 'days'}` : '–'}</dd></div>
		</dl>
	</section>

	<section aria-labelledby="profile-title">
		<div class="section-head">
			<h2 id="profile-title">Your profile</h2>
			<div class="links">
				<a class="btn" href="/account/profile">Customize profile</a>
				{#if p.isPublic}<a class="btn" href={`/u/${p.username}`}>View public profile</a>{/if}
			</div>
		</div>
		<dl class="facts">
			<div><dt>Experience</dt><dd>{labelOf(EXPERIENCE, p.experience)}</dd></div>
			<div><dt>Main goal</dt><dd>{labelOf(GOALS, p.goal)}</dd></div>
			<div><dt>Target speed</dt><dd>{p.targetWpm} WPM</dd></div>
			<div><dt>Keyboard</dt><dd>{labelOf(PLATFORMS, p.platform)}</dd></div>
		</dl>
		{#if p.headline || p.bio}
			<p class="about">{p.headline}{p.headline && p.bio ? ' · ' : ''}{p.bio}</p>
		{/if}
	</section>

	<section aria-labelledby="health-title">
		<div class="section-head">
			<h2 id="health-title">Account</h2>
		</div>
		<ul class="health">
			<li>
				<span class="state" class:ok={data.fingerMap.count > 0} aria-hidden="true"><Icon name={data.fingerMap.count ? 'check' : 'info'} size={15} /></span>
				<span class="health-text">
					<b>Finger map</b>
					<span>{data.fingerMap.count ? `${data.fingerMap.count} tagged keystrokes, saved and kept in sync.` : 'Nothing saved yet. Keystrokes you tag while signed in are saved automatically.'}</span>
				</span>
				<a class="row-link" href="/map">Open</a>
			</li>
			<li>
				<span class="state" class:ok={data.recoveryCodes > 2} class:warn={data.recoveryCodes <= 2} aria-hidden="true"><Icon name={data.recoveryCodes > 2 ? 'check' : 'info'} size={15} /></span>
				<span class="health-text">
					<b>Recovery codes</b>
					<span>
						{data.recoveryCodes} of 8 remaining.{#if data.recoveryCodes <= 2}<strong class="warn-text"> Few remain: generate a new set to keep access to your account.</strong>{/if}
					</span>
				</span>
				<a class="row-link" href="/account/security">Manage</a>
			</li>
			<li>
				<span class="state ok" aria-hidden="true"><Icon name="check" size={15} /></span>
				<span class="health-text">
					<b>Signed-in devices</b>
					<span>{data.sessionCount} {data.sessionCount === 1 ? 'device is' : 'devices are'} signed in to this account.</span>
				</span>
				<a class="row-link" href="/account/security">Review</a>
			</li>
		</ul>
	</section>
</div>

<style>
	.overview {
		display: flex;
		flex-direction: column;
		gap: var(--space-40);
	}
	.section-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: var(--space-10) var(--space-16);
		margin-bottom: var(--space-16);
	}
	h2 {
		font-size: var(--fs-24);
	}
	.more {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink-2);
		text-decoration: none;
	}
	.more:hover {
		color: var(--ink);
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-8);
	}
	.steps,
	.health {
		margin: 0;
		padding: 0;
		list-style: none;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.steps li + li,
	.health li + li {
		border-top: 1px solid var(--line);
	}
	.steps a {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-16) var(--space-20);
		color: var(--ink);
		text-decoration: none;
		transition: background-color var(--dur-fast) var(--ease-out);
	}
	.steps a:hover {
		background: var(--surface-2);
	}
	.steps a:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	.step-icon {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: var(--radius);
		border: 1px solid var(--line-strong);
		background: var(--bg);
		transition:
			background-color var(--dur-fast) var(--ease-out),
			border-color var(--dur-fast) var(--ease-out);
	}
	.steps a:hover .step-icon {
		border-color: var(--ink);
		background: var(--accent);
		color: var(--on-accent);
	}
	.step-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		min-width: 0;
	}
	.step-text span {
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.step-go {
		display: inline-flex;
		align-items: center;
		gap: var(--space-6);
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		white-space: nowrap;
	}
	.figures,
	.facts {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		margin: 0;
		border-radius: var(--radius);
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.figures div,
	.facts div {
		padding: var(--space-16) var(--space-20);
	}
	.figures div + div,
	.facts div + div {
		border-left: 1px solid var(--line);
	}
	dt {
		font-size: var(--fs-13);
		color: var(--ink-2);
	}
	dd {
		margin: var(--space-4) 0 0;
		font-weight: var(--fw-semibold);
		font-variant-numeric: tabular-nums;
	}
	.figures dd {
		font-size: var(--fs-28);
		font-weight: var(--fw-bold);
		letter-spacing: var(--tr-tight);
	}
	.facts dd {
		font-size: var(--fs-18);
	}
	.about {
		margin-top: var(--space-12);
		max-width: 70ch;
		font-size: var(--fs-15);
		line-height: var(--lh-body);
		color: var(--ink-2);
	}
	.health li {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--space-16);
		padding: var(--space-16) var(--space-20);
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
	.health-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		font-size: var(--fs-14);
		color: var(--ink-2);
	}
	.health-text b {
		font-size: var(--fs-15);
		color: var(--ink);
	}
	.warn-text {
		color: var(--error);
	}
	.row-link {
		font-size: var(--fs-14);
		font-weight: var(--fw-semibold);
		color: var(--ink);
		text-decoration: none;
	}
	.row-link:hover {
		color: var(--rank);
	}
	@media (max-width: 760px) {
		.figures,
		.facts {
			grid-template-columns: 1fr 1fr;
		}
		.figures div:nth-child(3),
		.facts div:nth-child(3) {
			border-left: 0;
		}
		.figures div:nth-child(n + 3),
		.facts div:nth-child(n + 3) {
			border-top: 1px solid var(--line);
		}
		.steps a {
			grid-template-columns: 40px minmax(0, 1fr);
		}
		.step-go {
			grid-column: 2;
		}
	}
</style>
