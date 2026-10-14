<script lang="ts">
	import { onMount } from 'svelte';
	import { buildProfile } from '@sqwer/fingermap';
	import { fingerLabel, qwertyAnsi } from '@sqwer/layouts';
	import { standouts } from '#lib/assessment.ts';
	import { ASSESSMENT_COVERAGE, CATEGORIES, EXAMS, type Exam } from '#lib/exams.ts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import type { ExamId } from '#lib/results/types.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';

	let mounted = $state(false);
	onMount(() => {
		fingerMap.load();
		results.load();
		mounted = true;
	});

	const profile = $derived(buildProfile(fingerMap.observations, qwertyAnsi('pc')));
	const coverage = $derived(profile.core.mapped / profile.core.total);

	function stats(exam: Exam): { label: string; value: string }[] {
		if (!mounted) return [];
		if (exam.id === 'finger-map') {
			return profile.samples
				? [
						{ label: 'Core keys mapped', value: `${Math.round(coverage * 100)}%` },
						{ label: 'Entries', value: String(profile.samples) }
					]
				: [];
		}
		const list = results.forExam(exam.id as ExamId);
		if (!list.length) return [];
		const last = list[list.length - 1]!;
		if (exam.id === 'finger-speed') {
			const s = last.fingers ? standouts(last.fingers) : null;
			return [
				{ label: 'Average', value: `${Math.round(last.wpm)} WPM` },
				...(s ? [{ label: 'Slowest finger', value: fingerLabel(s.slowest[0]).replace('pinky', 'little') }] : [])
			];
		}
		const best = Math.max(...list.map((r) => r.wpm));
		return [
			{ label: 'Best', value: `${Math.round(best)} WPM` },
			{ label: 'Last', value: `${Math.round(last.wpm)} WPM · ${Math.round(last.accuracy)}%` },
			{ label: 'Attempts', value: String(list.length) }
		];
	}

	const locked = (exam: Exam) => mounted && exam.id === 'finger-speed' && coverage < ASSESSMENT_COVERAGE;
</script>

<Seo
	title="Examinations"
	description="Placement, speed, accuracy, endurance and technique examinations, each with a clear purpose and your own statistics."
/>

<Breadcrumbs items={[{ href: '/exams', label: 'Examinations' }]} />

<div class="exams">
	<header>
		<h1>Examinations</h1>
		<p class="lede">
			Each examination measures something specific. Choose one by its purpose, or follow <a href="/journey">your
			journey</a> for a recommended order.
		</p>
	</header>

	{#each CATEGORIES as category (category.name)}
		<section aria-labelledby={`cat-${category.name}`}>
			<div class="cat-head">
				<h2 id={`cat-${category.name}`}>{category.name}</h2>
				<p>{category.description}</p>
			</div>
			<div class="cards">
				{#each EXAMS.filter((e) => e.category === category.name) as exam (exam.id)}
					{@const s = stats(exam)}
					<article class="card" class:locked={locked(exam)}>
						<h3>{exam.title}</h3>
						<p class="purpose">{exam.purpose}</p>
						<ul class="measures" aria-label="Measures">
							{#each exam.measures as m (m)}<li>{m}</li>{/each}
						</ul>
						<p class="duration"><Icon name="clock" size={15} /> {exam.duration}</p>
						{#if s.length}
							<dl class="stats">
								{#each s as item (item.label)}
									<div><dt>{item.label}</dt><dd>{item.value}</dd></div>
								{/each}
							</dl>
						{:else}
							<p class="empty">{locked(exam) ? '' : 'You have not taken this examination yet.'}</p>
						{/if}
						{#if locked(exam)}
							<p class="requirement">
								Available once {Math.round(ASSESSMENT_COVERAGE * 100)}% of core keys are mapped. Currently
								{Math.round(coverage * 100)}%.
							</p>
							<a class="btn" href="/map">Continue mapping</a>
						{:else}
							<a class="btn btn-primary" href={exam.href}>
								{exam.id === 'finger-map' ? (s.length ? 'Continue mapping' : 'Start mapping') : s.length ? 'Take again' : 'Start'}
								<span class="sr-only">{exam.title}</span>
							</a>
						{/if}
					</article>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.exams {
		display: flex;
		flex-direction: column;
		gap: 40px;
	}
	h1 {
		font-size: clamp(36px, 5vw, 56px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 12px;
		max-width: 680px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.lede a {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
	.cat-head {
		display: flex;
		align-items: baseline;
		gap: 14px;
		flex-wrap: wrap;
		margin-bottom: 14px;
		padding-bottom: 10px;
		border-bottom: 1px solid var(--line);
	}
	h2 {
		font-size: 28px;
	}
	.cat-head p {
		font-size: 15px;
		color: var(--ink-2);
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 12px;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		padding: 20px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.card.locked {
		background: var(--bg);
		border-style: dashed;
	}
	h3 {
		font-size: 19px;
		font-weight: 600;
	}
	.purpose {
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	.measures {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.measures li {
		padding: 3px 8px;
		border-radius: 3px;
		border: 1px solid var(--line-strong);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--ink-2);
	}
	.duration {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13.5px;
		color: var(--ink-2);
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		width: 100%;
		padding-top: 10px;
		border-top: 1px solid var(--line);
	}
	dt {
		font-size: 12px;
		color: var(--ink-2);
	}
	dd {
		font-size: 15px;
		font-weight: 700;
	}
	.empty,
	.requirement {
		font-size: 13.5px;
		color: var(--ink-2);
		flex: 1;
	}
	.card .btn {
		margin-top: auto;
	}
</style>
