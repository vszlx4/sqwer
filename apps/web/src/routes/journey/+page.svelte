<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { buildProfile } from '@sqwer/fingermap';
	import { qwertyAnsi } from '@sqwer/layouts';
	import { fingerMap } from '#lib/fingermap/store.svelte.ts';
	import { buildJourney } from '#lib/journey.ts';
	import { results } from '#lib/results/store.svelte.ts';
	import Breadcrumbs from '#lib/site/Breadcrumbs.svelte';
	import Seo from '#lib/site/Seo.svelte';
	import Icon from '#lib/ui/Icon.svelte';

	onMount(() => {
		fingerMap.load();
		results.load();
	});

	const steps = $derived(buildJourney(results.list, buildProfile(fingerMap.observations, qwertyAnsi('pc'))));
	const done = $derived(steps.filter((s) => s.status === 'complete').length);
	const signedIn = $derived(!!page.data.user);

	const STATUS_LABEL = { complete: 'Completed', current: 'Next step', 'in-progress': 'In progress', locked: 'Not yet available' };

	const PRINCIPLES = [
		{
			title: 'Accuracy before speed',
			body: 'Every error costs the time of the mistake and of its correction. Typists who reach 97% accuracy first gain speed faster and more reliably.'
		},
		{
			title: 'A steady rhythm',
			body: 'Even keystrokes are faster over time than bursts followed by pauses. Your consistency score measures this.'
		},
		{
			title: 'The right finger for each key',
			body: 'Assigning each key to one finger shortens reaches and lets your hands learn positions by memory instead of by sight.'
		}
	];
</script>

<Seo title="Your learning journey" description="A guided path from your first placement test to a detailed analysis of each finger." noindex />

<Breadcrumbs items={[{ href: '/journey', label: 'Your journey' }]} />

<div class="journey">
	<header class="intro">
		<h1>Your learning journey</h1>
		<p class="lede">
			sqwer guides you through four steps: measure where you are, understand how you type, find the weakest fingers, and
			track your improvement. Each step explains what it measures and what you will learn.
		</p>
		<div class="progress" aria-label={`${done} of ${steps.length} steps completed`}>
			<span class="bar"><span style:width={`${(done / steps.length) * 100}%`}></span></span>
			<span class="count">{done} of {steps.length} steps completed</span>
		</div>
		{#if !signedIn}
			<p class="note">
				Your progress is saved in this browser. <a href="/signup">Create an account</a> to keep it on every device.
			</p>
		{/if}
	</header>

	<ol class="steps">
		{#each steps as step, i (step.id)}
			<li class={`step ${step.status}`}>
				<div class="marker" aria-hidden="true">
					{#if step.status === 'complete'}<Icon name="check" size={18} />{:else}{i + 1}{/if}
				</div>
				<div class="body">
					<p class="status">{STATUS_LABEL[step.status]}</p>
					<h2>{step.title}</h2>
					<p class="why">{step.why}</p>
					<p class="learn"><b>You will learn:</b> {step.learn}</p>
					{#if step.detail}<p class="detail">{step.detail}</p>{/if}
					{#if step.status === 'locked'}
						<p class="requirement">{step.requirement}</p>
						{#if step.id === 'finger-map'}<a class="btn" href={step.href}>{step.action}</a>{/if}
					{:else}
						<a class={`btn ${step.status === 'current' || step.status === 'in-progress' ? 'btn-primary' : ''}`} href={step.href}>
							{step.action}
						</a>
					{/if}
				</div>
			</li>
		{/each}
	</ol>

	<section class="principles" aria-labelledby="principles-title">
		<h2 id="principles-title">Three principles behind every step</h2>
		<div class="grid">
			{#each PRINCIPLES as p (p.title)}
				<div class="principle">
					<h3>{p.title}</h3>
					<p>{p.body}</p>
				</div>
			{/each}
		</div>
		<p class="more">Read more in <a href="/about">How it works</a>, or browse all <a href="/exams">examinations</a>.</p>
	</section>
</div>

<style>
	.journey {
		display: flex;
		flex-direction: column;
		gap: 36px;
		max-width: 900px;
	}
	h1 {
		font-size: clamp(36px, 5vw, 56px);
		line-height: 1.05;
	}
	.lede {
		margin-top: 14px;
		font-size: 18px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.progress {
		display: flex;
		align-items: center;
		gap: 14px;
		margin-top: 22px;
	}
	.bar {
		flex: 1;
		max-width: 420px;
		height: 8px;
		border-radius: 3px;
		background: var(--surface-2);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	.count {
		font-size: 14.5px;
		font-weight: 600;
	}
	.note {
		margin-top: 14px;
		font-size: 14.5px;
		color: var(--ink-2);
	}
	a:not(.btn) {
		color: var(--ink);
		font-weight: 600;
		text-decoration: none;
	}
	.steps {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.step {
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr);
		gap: 18px;
		padding: 22px;
		border-radius: 3px;
		border: 1px solid var(--line);
		background: var(--surface);
	}
	.step.current,
	.step.in-progress {
		border-color: var(--ink);
		box-shadow: inset 4px 0 0 var(--accent);
	}
	.step.locked {
		background: var(--bg);
		border-style: dashed;
	}
	.marker {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		border-radius: 3px;
		background: var(--surface-2);
		font-weight: 800;
		font-size: 18px;
	}
	.complete .marker,
	.current .marker,
	.in-progress .marker {
		background: var(--accent);
		color: var(--on-accent);
	}
	.body {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.status {
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-2);
	}
	h2 {
		font-size: 26px;
		line-height: 1.15;
	}
	.why,
	.learn,
	.requirement {
		font-size: 15.5px;
		line-height: 1.6;
		color: var(--ink-2);
	}
	.learn b {
		color: var(--ink);
	}
	.detail {
		font-size: 15px;
		font-weight: 600;
	}
	.requirement {
		font-style: italic;
	}
	.body .btn {
		margin-top: 6px;
	}
	.principles {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
	}
	.principle {
		padding: 18px;
		border-radius: 3px;
		border: 1px solid var(--line);
	}
	.principle h3 {
		font-size: 17px;
		font-weight: 600;
		margin-bottom: 6px;
	}
	.principle p,
	.more {
		font-size: 15px;
		line-height: 1.55;
		color: var(--ink-2);
	}
	@media (max-width: 760px) {
		.grid {
			grid-template-columns: 1fr;
		}
		.step {
			grid-template-columns: 1fr;
		}
	}
</style>
